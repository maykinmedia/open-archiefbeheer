.. _developers_setup-local-env:

=======================
Development environment
=======================

Prerequisites
-------------

You need the following libraries and/or programs:

* `Python`_ - check the ``Dockerfile`` for the required version.
* Python `Virtualenv`_ and `Pip`_
* `PostgreSQL`_
* `Node.js`_
* `npm`_

.. _Python: https://www.python.org/
.. _Virtualenv: https://virtualenv.pypa.io/en/stable/
.. _Pip: https://packaging.python.org/tutorials/installing-packages/#ensure-pip-setuptools-and-wheel-are-up-to-date
.. _PostgreSQL: https://www.postgresql.org
.. _Node.js: http://nodejs.org/
.. _npm: https://www.npmjs.com/


#. Navigate to the location where you want to place your project.
#. Get the code:

    .. code:: bash

       git clone git@bitbucket.org:maykinmedia/openarchiefbeheer.git
       cd openarchiefbeheer

#. Create the database. The default database/postgres user/password that will be used is ``openarchiefbeheer`` (see ``src/openarchiefbeheer/conf/dev.py`` for the settings). 

#. Activate your virtual environment 
#. Install the requirements ``uv pip install -r requirements/dev.txt``.
#. Build the frontend (needed for the styling of the admin):

    .. code:: bash
        
       npm install
       npm run build

#. Run the migrations with ``src/manage.py migrate``
#. Create a superuser to access the management interface: ``src/manage.py createsuperuser``
#. To set environment variables settings, vreate a ``.env`` file. You can use and modify the provided example:

  .. code:: bash

    cp dotenv.example .env

#. Run the development server with ``src/manage.py runserver``


Optionally, you can load fixtures for the templates of the admin and for the admin index configuration:

.. code:: bash

    src/manage.py loaddata fixture_name.json


Running tests
=============

This is how you can run the tests locally:

.. code:: bash

   # Exclude E2E 
   src/manage.py tests openarchiefbeheer --no-input --exclude-tag=e2e

   # Only E2E (see other section for the configuration needed for E2E tests)
   src/manage.py tests openarchiefbeheer --no-input --tag=e2e

   # Only VCR tests
   src/manage.py tests openarchiefbeheer --no-input --tag=vcr

To check test coverage:

.. code:: bash

   coverage run src/manage.py test openarchiefbeheer --exclude-tag=e2e
   coverage xml -o coverage.xml


The ``coverage.xml`` file can then, for example, be used in IDEs 
like VSCode with extension ``Coverage Gutters`` with ``ctrl+shift+7``.

Docker
======

It is possible to start up a development docker environment with the file ``docker-compose.dev.yaml`` file.
This does not support autoreload yet.

To start the environment:

.. code:: bash

   docker compose -f docker-compose.dev.yaml up

Open Zaak
=========

It is also possible to start a local Open Zaak instance. 

In the folder ``backend/docker-services/openzaak`` run:

.. code:: bash

   docker compose up

This loads fixtures (located in ``backend/docker-services/openzaak/fixtures``).
To get your local openarchiefbeheer environment to talk to this Open Zaak instance, 
use this fixture (you may need to update the primary key field ``pk``):

.. code:: json

   [
      {
         "model": "zgw_consumers.service",
         "pk": 1,
         "fields": {
            "label": "Open Zaak - Zaken API",
            "oas": "http://localhost:8003/zaken/api/v1/schema/openapi.yaml",
            "oas_file": "",
            "uuid": "73d10dfb-d17b-45ad-b8ac-9a1041b08f1e",
            "slug": "open-zaak-zaken-api",
            "api_type": "zrc",
            "api_root": "http://localhost:8003/zaken/api/v1/",
            "api_connection_check_path": "",
            "client_id": "test-vcr",
            "secret": "test-vcr",
            "auth_type": "zgw",
            "header_key": "",
            "header_value": "",
            "nlx": "",
            "user_id": "",
            "user_representation": "",
            "client_certificate": null,
            "server_certificate": null,
            "timeout": 10
         }
      }
      {
         "model": "zgw_consumers.service",
         "pk": 2,
         "fields": {
            "label": "Open Zaak - Catalogi API",
            "oas": "http://localhost:8003/catalogi/api/v1/schema/openapi.json",
            "oas_file": "",
            "uuid": "24ef5de1-5fcc-4716-a295-6ebdd5e9425c",
            "slug": "open-zaak-catalogi-api",
            "api_type": "ztc",
            "api_root": "http://localhost:8003/catalogi/api/v1/",
            "api_connection_check_path": "",
            "client_id": "test-vcr",
            "secret": "test-vcr",
            "auth_type": "zgw",
            "header_key": "",
            "header_value": "",
            "nlx": "",
            "user_id": "",
            "user_representation": "",
            "client_certificate": null,
            "server_certificate": null,
            "timeout": 10
         }
      },
      {
         "model": "zgw_consumers.service",
         "pk": 3,
         "fields": {
            "label": "Open Zaak - Besluiten API",
            "oas": "http://localhost:8003/besluiten/api/v1/schema/openapi.yaml",
            "oas_file": "",
            "uuid": "b0eebf57-7f1b-49ef-8e2e-de53a28f1056",
            "slug": "open-zaak-besluiten-api",
            "api_type": "brc",
            "api_root": "http://localhost:8003/besluiten/api/v1/",
            "api_connection_check_path": "",
            "client_id": "test-vcr",
            "secret": "test-vcr",
            "auth_type": "zgw",
            "header_key": "",
            "header_value": "",
            "nlx": "",
            "user_id": "",
            "user_representation": "",
            "client_certificate": null,
            "server_certificate": null,
            "timeout": 10
         }
      },
      {
         "model": "zgw_consumers.service",
         "pk": 4,
         "fields": {
            "label": "Open Zaak - Documenten API",
            "oas": "http://localhost:8003/documenten/api/v1/schema/openapi.yaml",
            "oas_file": "",
            "uuid": "037c1de8-4749-483b-916d-dfa0aa95fa00",
            "slug": "open-zaak-documenten-api",
            "api_type": "drc",
            "api_root": "http://localhost:8003/documenten/api/v1/",
            "api_connection_check_path": "",
            "client_id": "test-vcr",
            "secret": "test-vcr",
            "auth_type": "zgw",
            "header_key": "",
            "header_value": "",
            "nlx": "",
            "user_id": "",
            "user_representation": "",
            "client_certificate": null,
            "server_certificate": null,
            "timeout": 10
         }
      }
   ]

.. note::

   This Open Zaak instance and these fixtures have been used to record the VCR cassettes!