#!/bin/bash
exec celery flower --app openarchiefbeheer --workdir src
