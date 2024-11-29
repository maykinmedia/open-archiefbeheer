#!/bin/sh

until pg_isready; do
  >&2 echo "Waiting for database connection..."
  sleep 1
done

until python src/manage.py migrate --check; do
  >&2 echo "Waiting for migrations to be done..."
  sleep 1
done

# Run setup configuration
python src/manage.py setup_configuration --yaml-file setup_configuration/data.yaml