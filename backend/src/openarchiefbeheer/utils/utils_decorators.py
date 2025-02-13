from django.conf import settings

import docker
from docker.errors import DockerException


def reload_openzaak_fixtures():
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

        containers = client.containers.list(filters={"name": "openzaak-web.local"})

        if not len(containers):
            return func

        web_container = containers[0]
        web_container.exec_run(
            "/app/src/manage.py loaddata /app/fixtures/complex_relations.json"
        )
        web_container.exec_run("/app/src/manage.py loaddata /app/fixtures/zaken.json")
        return func

    return decorator
