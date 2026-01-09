import inspect
import pathlib
from typing import Generator

import docker
import pytest
from docker.errors import DockerException
from pytest_django.fixtures import SettingsWrapper
from vcr.cassette import Cassette
from vcr.config import VCR


class FixtureLoadingError(Exception):
    pass


class CleanDatabaseError(Exception):
    pass


def _get_cassettes_dir(request: pytest.FixtureRequest):
    testdir = (
        pathlib.Path(inspect.getfile(request.function)).parent
        / "files"
        / "vcr_cassettes"
    )
    testdir.mkdir(exist_ok=True, parents=True)
    return str(testdir)


@pytest.fixture
def vcr(request: pytest.FixtureRequest) -> Generator[Cassette, None, None]:
    marker = request.node.get_closest_marker("vcr")
    kwargs = marker.kwargs if marker else {}
    kwargs.setdefault("cassette_library_dir", _get_cassettes_dir(request))
    cassette_name = f"{request.function.__qualname__}.yaml"

    myvcr = VCR(**kwargs)
    with myvcr.use_cassette(cassette_name) as cassette:
        yield cassette


@pytest.fixture
def openzaak_reload(request, settings: SettingsWrapper) -> None:
    """Reload a clean database and reload any specified Django fixtures through the Docker API.

    Note: This should be used BEFORE the vcr fixture, because it makes API calls to the
    Docker API.

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
        return

    if "vcr" in request.fixturenames and (
        request.fixturenames.index("vcr")
        < request.fixturenames.index("openzaak_reload")
    ):
        raise Exception(
            "The pytest fixture openzaak_reload should be used BEFORE the vcr fixture."
        )

    try:
        client = docker.from_env()
    except DockerException:
        client = docker.DockerClient(base_url="tcp://127.0.0.1:2375")

    # Clean the database. This reloads a db where we have the tokens already set up
    # but no catalogi/zaken.
    db_container = client.containers.get(container_id="open-zaak-openzaak-db-1")
    result = db_container.exec_run(
        "pg_restore -U postgres --dbname=openzaak /clean_db/clean_db.sql -Fc --clean --exit-on-error"
    )
    if not result.exit_code == 0:
        raise CleanDatabaseError(result.output)

    marker = request.node.get_closest_marker("openzaak")
    if not marker:
        return

    web_container = client.containers.get(container_id="open-zaak-openzaak-web.local-1")
    for fixture in marker.kwargs.get("fixtures", []):
        result = web_container.exec_run(
            f"/app/src/manage.py loaddata /app/test_fixtures/{fixture}"
        )
        if not result.exit_code == 0:
            raise FixtureLoadingError(result.output)
