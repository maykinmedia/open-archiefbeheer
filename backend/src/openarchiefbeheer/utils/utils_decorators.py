from typing import Iterable

from django.conf import settings

import docker
from docker.errors import DockerException


class FixtureLoadingError(Exception):
    pass


def reload_openzaak_fixtures(fixtures: Iterable[str] = []):
    def decorator(func):
        """Use the docker API to reload a fixture

        This configures the client from environment variables
        (see https://docker-py.readthedocs.io/en/stable/client.html#docker.client.from_env for more details).

        If locally you have not added your user to the docker group, then you will not have permission to run this.
        You can make the docker deamon listen on a tcp socket in addition to the default unix socket by stopping the
        deamon and then running it as follows (more info https://docs.docker.com/reference/cli/dockerd/#daemon-socket-option):

        ```bash
        sudo systemctl stop docker.service
        sudo dockerd -H unix:///var/run/docker.sock -H tcp://127.0.0.1:2375
        ```
        """
        if not settings.RECORDING_CASSETTES_VCR:
            return func

        try:
            client = docker.from_env()
        except DockerException:
            client = docker.DockerClient(base_url="tcp://127.0.0.1:2375")

        # Clean the database. This reloads a db where we have the tokens already set up
        # but no catalogi/zaken.
        db_container = client.containers.get(container_id="open-zaak-openzaak-db-1")
        db_container.exec_run(
            "pg_restore -U postgres --dbname=openzaak /clean_db/clean_db.sql -Fc --clean --exit-on-error"
        )

        web_container = client.containers.get(
            container_id="open-zaak-openzaak-web.local-1"
        )
        for fixture in fixtures:
            result = web_container.exec_run(
                f"/app/src/manage.py loaddata /app/test_fixtures/{fixture}"
            )
            if not result.exit_code == 0:
                raise FixtureLoadingError(result.output)

        return func

    return decorator
