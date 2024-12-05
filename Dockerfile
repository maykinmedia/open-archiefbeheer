# Stage 1 - Backend build environment
# includes compilers and build tooling to create the environment
FROM python:3.12-slim-bullseye AS backend-build

RUN apt-get update && apt-get install -y --no-install-recommends \
        pkg-config \
        build-essential \
        git \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN mkdir /app/src

RUN pip install uv -U
COPY ./backend/requirements /app/requirements
RUN uv pip install --system -r requirements/production.txt

# Stage 2 - Build JS of the backend (needed for admin styles)
FROM node:20-bullseye-slim AS backend-js-build

WORKDIR /app

COPY ./backend/build /app/build/
COPY ./backend/*.json ./backend/*.js /app/

RUN npm ci

COPY ./backend/src /app/src

RUN npm run build

# Stage 3 - Build the Front end
FROM node:20-bullseye-slim AS frontend-build

RUN mkdir /frontend
WORKDIR /frontend

RUN apt-get update && apt-get install -y --no-install-recommends \
  git \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY ./frontend/package-lock.json ./frontend/package.json ./

RUN npm ci

COPY ./frontend .
COPY ./frontend/.env.production.template ./.env.production

RUN npm run build

# Stage 4 - Build docker image suitable for production
FROM python:3.12-slim-bullseye

# Stage 4.1 - Set up the needed production dependencies
# install all the dependencies for GeoDjango
RUN apt-get update && apt-get install -y --no-install-recommends \
        procps \
        vim \
        mime-support \
        postgresql-client \
        gettext \
        gdal-bin \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./backend/bin/docker_start.sh /start.sh
COPY ./backend/bin/celery_worker.sh /celery_worker.sh
COPY ./backend/bin/celery_beat.sh /celery_beat.sh
COPY ./backend/bin/celery_flower.sh /celery_flower.sh
COPY ./backend/bin/check_celery_worker_liveness.py /check_celery_worker_liveness.py
COPY ./backend/bin/setup_configuration.sh /setup_configuration.sh
COPY ./frontend/scripts/replace-envvars.sh /replace-envvars.sh

RUN mkdir -p /app/log /app/media /app/src/openarchiefbeheer/static/

# copy backend build deps
COPY --from=backend-build /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=backend-build /usr/local/bin/uwsgi /usr/local/bin/uwsgi
COPY --from=backend-build /usr/local/bin/celery /usr/local/bin/celery

COPY ./backend/src /app/src

COPY --from=backend-js-build /app/src/openarchiefbeheer/static/bundles /app/src/openarchiefbeheer/static/bundles
COPY --from=frontend-build /frontend/build /app/src/openarchiefbeheer/static/frontend
COPY --from=frontend-build /frontend/build/static/css /app/src/openarchiefbeheer/static/css
COPY --from=frontend-build /frontend/build/static/js /app/src/openarchiefbeheer/static/js

RUN useradd -M -u 1000 maykin && chown -R maykin:maykin /app

VOLUME ["/app/log", "/app/media"]

# drop privileges
USER maykin

ARG COMMIT_HASH
ARG RELEASE=latest

ENV RELEASE=${RELEASE} \
    GIT_SHA=${COMMIT_HASH} \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=openarchiefbeheer.conf.docker

ARG SECRET_KEY=dummy

LABEL org.label-schema.vcs-ref=$COMMIT_HASH \
      org.label-schema.vcs-url="https://github.com/maykinmedia/open-archiefbeheer" \
      org.label-schema.version=$RELEASE \
      org.label-schema.name="openarchiefbeheer"

RUN python src/manage.py collectstatic --noinput \
    && python src/manage.py compilemessages

EXPOSE 8000
CMD ["/start.sh"]