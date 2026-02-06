#!/bin/bash

set -e

LOGLEVEL=${CELERY_LOGLEVEL:-INFO}
CONCURRENCY=${CELERY_WORKER_CONCURRENCY:-1}

QUEUE=${CELERY_WORKER_QUEUE:=celery}
WORKER_NAME=${CELERY_WORKER_NAME:="${QUEUE}"@%n}

# Set defaults for OTEL
export OTEL_SERVICE_NAME="${OTEL_SERVICE_NAME:-openarchiefbeheer-worker-"${QUEUE}"}"

export _OTEL_DEFER_SETUP="true"

echo "Starting celery worker $WORKER_NAME with queue $QUEUE"
exec celery --workdir src --app openarchiefbeheer.celery worker \
    -Q $QUEUE \
    -n $WORKER_NAME \
    -l $LOGLEVEL \
    -O fair \
    -c $CONCURRENCY

