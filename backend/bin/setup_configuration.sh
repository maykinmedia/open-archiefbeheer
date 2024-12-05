#!/bin/sh

# Waiting for database to be up
until pg_isready; do
  >&2 echo "Waiting for database connection..."
  sleep 1
done

# Waiting for migrations to be done
attempt_counter=0
max_attempts=${CHECK_MIGRATIONS_MAX_ATTEMPT:-10}

while ! python src/manage.py migrate --check; do
  attempt_counter=$((attempt_counter + 1))

  if [ $attempt_counter -ge $max_attempts ]; then
    >&2 echo "Timed out while waiting for django migrations."
    exit 1
  fi

  >&2 echo "Attempt $attempt_counter/$max_attempts: Waiting for migrations to be done..."
  sleep 10
done

# Run setup configuration
python src/manage.py setup_configuration --yaml-file setup_configuration/data.yaml