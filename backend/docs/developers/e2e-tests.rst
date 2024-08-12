.. _developers_e2e-tests:

================
Playwright tests
================

We run Playwright tests from the backend, using Django ``StaticLiveServerTestCase``. As stated in the `documentation`_, 
this is a ``TransactionTestCase`` which also launches a live Django server in the background. In addition, it serves
static files provided by the ``staticfiles`` finders (so you don't need to run ``collectstatic`` as a part of the setup).

.. _documentation: https://docs.djangoproject.com/en/5.0/topics/testing/tools/#django.test.LiveServerTestCase

Running locally
===============

After installing the development dependencies (``requirements/dev.txt``), you need to install the required 
browsers (see the `Playwright docs`_). 

Then, you need to build the frontend. You can do this in the folder ``frontend/`` and run:

.. code:: bash

   npm ci
   npm run build

Note that the value of the ``REACT_APP_API_URL`` environment variable is important. The live Django server started 
by the  ``StaticLiveServerTestCase`` needs to have the same url. The class ``PlaywrightTestCase`` in the file 
``backend/src/openarchiefbeheer/utils/tests/e2e.py`` is a wrapper for ``StaticLiveServerTestCase`` and specifies 
on which port the live server will run during the tests.

Once the backend is built, you should have the following files/folders: ``frontend/build/index.html``, 
``frontend/build/static/css`` and ``frontend/build/static/js``. You need to create symlinks in the backend folder,
so that these files can be served by the live server. 

.. code:: bash

   ln -s full/path/to/frontend/build/index.html backend/src/openarchiefbeheer/templates/index.html
   ln -s full/path/to/frontend/build/static/css backend/src/openarchiefbeheer/static/css
   ln -s full/path/to/frontend/build/static/js backend/src/openarchiefbeheer/static/js

Make sure that the environment variable ``E2E_SERVE_FRONTEND`` is truthy. This will serve the ``index.html`` file
on the ``/`` path.

Once this is done, you can run the Playwright tests with:

.. code:: bash

   src/manage.py test openarchiefbeheer --tag=e2e


.. _Playwright docs: https://playwright.dev/python/docs/intro#installing-playwright-pytest

Environment variables
=====================

- ``E2E_PORT``: specifies the port the ``StaticLiveServerTestCase`` listens to.
- ``E2E_SERVE_FRONTEND``:  can be ``yes`` or ``no``. Specifies that the ``index.html`` file should be served on the ``/`` path.
- ``PLAYWRIGHT_BROWSER``: can be ``chromium``, ``firefox`` or ``webkit``. It specifies which browser will be used to run the tests.
- ``PLAYWRIGHT_HEADLESS``: can be ``yes`` or ``no``. If it is ``no``, you will see the browser being opened.
- ``PLAYWRIGHT_TRACE_PATH``: if you are recording a trace with the trace viewer, you can specify the path/filename where it should be written.

Trace viewer
============

If there are tests that succeed locally but fail in CI, you can use the trace viewer to record what
happens in the browser during the test and replay it locally.

To do this, replace the context manager ``browser_page`` in the test that is failing with 
``browser_page_with_tracing``. 

In the ``.github/workflows/ci.yaml``, go to the e2e-tests and uncomment the last step. This will upload the recorded 
trace so that you can download it and look at it.

