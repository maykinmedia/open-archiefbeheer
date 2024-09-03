.. _developers_vcr-tests:

=========
VCR tests
=========

When re-recording the cassettes, it is good to reload the fixtures in Open Zaak between each test.
To do this, we use the docker API to reload the fixtures.

We use the docker python client to interact with the API.

The client can be configured through environment variables (see 
https://docker-py.readthedocs.io/en/stable/client.html#docker.client.from_env for more details).
However, if your user does not have root permissions, you will not be able to interact with the API. To get around this,
you can make the docker deamon listen on a tcp socket in addition to the default unix socket. 

To do this, stop the Docker deamon and restart it as follows (more info https://docs.docker.com/reference/cli/dockerd/#daemon-socket-option):

.. code:: bash

    sudo systemctl stop docker.service
    sudo dockerd -H unix:///var/run/docker.sock -H tcp://127.0.0.1:2375


Then the client will be configured using `client = docker.DockerClient(base_url='tcp://127.0.0.1:2375')` instead of
`client = docker.from_env()`.