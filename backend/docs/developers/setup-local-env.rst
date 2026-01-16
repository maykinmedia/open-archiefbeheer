.. _developers_setup-local-env:

=======================
Development environment
=======================

Prerequisites
-------------

You need the following libraries and/or programs:

* `Python`_ – check the ``Dockerfile`` for the required version.
* A Python virtual environment (created with `Virtualenv`_ or `pyenv`_)
* `UV`_
* `PostgreSQL`_ (with `PostGIS`_) and `GDAL`_ – check the ``Dockerfile`` for the required version.
* `Node.js`_
* `npm`_

.. _Python: https://www.python.org/
.. _pyenv: https://github.com/pyenv/pyenv
.. _UV: https://docs.astral.sh/uv/
.. _Virtualenv: https://virtualenv.pypa.io/en/stable/
.. _Pip: https://packaging.python.org/tutorials/installing-packages/#ensure-pip-setuptools-and-wheel-are-up-to-date
.. _PostgreSQL: https://www.postgresql.org
.. _PostGIS: https://postgis.net/
.. _GDAL: https://pypi.org/project/GDAL/
.. _Node.js: http://nodejs.org/
.. _npm: https://www.npmjs.com/


#. Navigate to the location where you want to place your project and clone it from github.
#. Create the database. The default database/postgres user/password that will be used is ``openarchiefbeheer`` (see ``src/openarchiefbeheer/conf/dev.py`` for the settings). 
#. Activate your virtual environment.
#. Install the requirements ``uv pip install -r requirements/dev.txt``.
#. Build the frontend (needed for the styling of the admin):

    .. code:: bash
        
       npm install
       npm run build

#. Run the migrations with ``src/manage.py migrate``

   .. note::

      If you get an error about the ``django.contrib.gis`` module,
      you need to install the GDAL extension. 
      To do this, you can either log into Postgres as superuser, connect to the database and run 
      ``CREATE EXTENSION POSTGIS`` **or** you can give superuser rights to the ``openarchiefbeheer`` user. 
      We recommend the former way.

#. Create a superuser to access the management interface:

   .. code:: bash

      src/manage.py createsuperuser

#. To set environment variables settings, create a ``.env`` file. You can use and modify the provided example:

   .. code:: bash

      cp dotenv.example .env

#. Generate the translation files:

   .. code:: bash

      ./bin/make_translations.sh
      src/manage.py compilemessages --locale nl

#. Run the development server with ``src/manage.py runserver``
#. Optionally, you can load fixtures for the email templates and for the admin index configuration:

   .. code:: bash

      src/manage.py loaddata default_emails.json
      src/manage.py loaddata default_admin_index.json

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

Tests running with PyTest can be run with:

.. code:: bash

   pytest src/

To check test coverage:

.. code:: bash

   coverage run --data-file=coverage_pytest -m pytest src/
   coverage run --data-file=coverage_django src/manage.py test openarchiefbeheer --exclude-tag=e2e --exclude-tag=performance
   coverage combine --data-file=coverage_combined coverage_django coverage_pytest
   coverage xml --data-file=coverage_combined -o coverage.xml

The ``coverage.xml`` file can then, for example, be used in IDEs 
like VSCode with extension ``Coverage Gutters`` with ``ctrl+shift+7``.

Docker
======

It is possible to start up a development docker environment with the file ``docker-compose.dev.yaml`` file.
This does not support autoreload yet.

To start the environment:

.. code:: bash

   docker compose -f docker-compose.dev.yaml up

.. _open-zaak-section:

External Registers
==================

To start Open Zaak, Open Klant and the Objects API with docker compose run the following command from
the ``backend/docker-services`` folder:

.. code:: bash

   sudo ./start_services.sh

It is possible to create demo data in these external services with this management command:

.. code:: bash

   src/manage.py demo_data 

To index the newly created zaken in OAB, make sure that you have celery running 
(from the ``backend`` folder run `./bin/celery_worker.sh`) and then run:

.. code:: bash

   src/manage.py resync_zaken


