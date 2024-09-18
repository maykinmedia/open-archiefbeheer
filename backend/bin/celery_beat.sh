#!/bin/bash

set -e

LOGLEVEL=${CELERY_LOGLEVEL:-INFO}

mkdir -p celerybeat

echo "Starting celery beat"
exec celery --app openarchiefbeheer --workdir src beat \
    -l $LOGLEVEL \
    -s ../celerybeat/beat
