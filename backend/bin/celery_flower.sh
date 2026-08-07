#!/bin/bash

# Set defaults for OTEL
export OTEL_SERVICE_NAME="${OTEL_SERVICE_NAME:-openarchiefbeheer-flower}"

exec celery \
    --broker "${CELERY_BROKER_URL:-redis://localhost:6379/0}" \
    flower