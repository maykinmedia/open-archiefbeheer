.. _developers_vcr-tests:

=========
VCR tests
=========

We use VCR to record the interactions of Open Archiefbeheer with external systems, such as Open Zaak, Objecten API, Open Klant and the Selectielijst API. 

Usually, we want to have specific data in these external systems when running a test, so we need a way of adding data before the test and cleaning up the results after the test.
This would be possible with API calls before and after the test, but this is really cumbersome especially with Open Zaak.

So now we have two ways of adding data in Open Zaak:

* JSON fixtures: These are stored in the folder ``backend/docker-services/openzaak/fixtures``. They are single fixture 
  files that contain the data that should be loaded in Open Zaak before a test. They are mounted into the Open Zaak Docker container.
* API calls: These can be made thanks to the :class:`openarchiefbeheer.utils.tests.resources_client.OpenZaakDataCreationHelper`.
  This helper class has methods that can be used to create data in Open Zaak.

The advantage of the JSON fixtures is that they are quick to load. The disadvantage is that they are more annoying to keep in sync with
any database schema changes in Open Zaak. 

.. note::

  We unfortunately can't yet transition completely to JSON fixtures, because we cannot create
  ``ZaakObject`` with links to other test external registers running with Docker compose. 
  Open Zaak makes a request to check that the ``object`` field of the ``ZaakObject`` references a real resource. 
  When we have the systems running as containers with docker compose, the address that Open Zaak should use to reach 
  these resources is not the same as the address used by OAB running on the host (e.g. ``http://objecten:8000`` vs ``http://localhost:8005``).
  So this check fails in Open Zaak and prevents creating the ``ZaakObject``. 
  Therefore, we still have to use JSON fixtures in this case. 

Since it is quite difficult to clean up just using the Open Zaak API, we have introduced an approach that makes use of the Docker API.

This involves 2 pytest fixtures:

* :func:`openarchiefbeheer.conftest.vcr` which can start the VCR context.
* :func:`openarchiefbeheer.conftest.openzaak_reload` which uses the Docker API to load a clean Open Zaak 
  database stored in the folder ``backend/docker-services/openzaak/clean_db``. This database already contains configured 
  tokens/admin user to avoid more boilerplate.
  After reloading the database, if any JSON fixture was specified, it will attempt to reload the fixtures. 
  
  Since the step of reloading the database and any fixture should only be performed when recording VCR cassettes, it can
  be enabled/disabled with the environment variable ``RECORDING_CASSETTES_VCR``.

We introduced these as pytest fixtures in order to be able to control the order on which they are executed. If the VCR context is entered
first, this causes problems when trying to make API calls to the Docker API. So they should be used as follows:

.. code:: python

    # Note: openzaak_reload first, then vcr!
    @pytest.mark.django_db
    def test_something_with_openzaak(openzaak_reload: None, vcr: Cassette) -> None:
        ...

    # Or with fixtures
    @pytest.mark.django_db
    @pytest.mark.openzaak(fixtures=["fixture.json"])
    def test_something_else_with_openzaak(openzaak_reload: None, vcr: Cassette) -> None:
        ...

Pytests will be picked up only if they are in a folder ``pytest_vcr``, as configured in the ``backend/pyproject.toml`` file.

**Note**

We use the Docker python client to interact with the Docker API and the client can be configured through environment variables (see 
https://docker-py.readthedocs.io/en/stable/client.html#docker.client.from_env for more details).
However, if your user does not have root permissions, you will not be able to interact with the API. To get around this,
you can make the docker deamon listen on a tcp socket in addition to the default unix socket. 

To do this, stop the Docker deamon and restart it as follows (more info https://docs.docker.com/reference/cli/dockerd/#daemon-socket-option), 
if you run on Linux: 

.. code:: bash

    sudo systemctl stop docker.service
    sudo dockerd -H unix:///var/run/docker.sock -H tcp://127.0.0.1:2375


Then the client will be configured using `client = docker.DockerClient(base_url='tcp://127.0.0.1:2375')` instead of
`client = docker.from_env()`.

Note that starting the docker compose services with the script `backend/docker-services/start_services.sh` will try to do this
for you.

Next steps
==========

We still have other VCR tests that don't require fixtures that still use Django tests with the ``VCRMixin``. It would be great to 
make them all consistent.

The next steps are tracked in this issue: https://github.com/maykinmedia/open-archiefbeheer/issues/966

Environment variables
=====================

- ``RECORDING_CASSETTES_VCR``: Defaults to ``False``. Set this to ``True`` if you are re-recording the cassettes. 
