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