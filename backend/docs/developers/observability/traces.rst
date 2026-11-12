.. _developers_observability_traces:

======
Traces
======

A trace follows a single unit of work, such as an HTTP request or a Celery task, through
the system. It consists of `spans`_: timed operations with a name and attributes, which
are nested in a parent-child relationship. Traces show where the time of a slow request
is spent, and how a request leads to queries or calls to external services and tasks.

Much of the setup comes from our shared library, which contains more `documentation`_
on tracing as well.

Automatic spans
===============

The instrumentation set up by our shared library includes traces for:

* incoming HTTP requests (Django);
* Redis and PostgreSQL queries;
* Celery tasks;
* outgoing HTTP requests (`requests` library).

The Trace IDs make it possible to correlate to the relevant log entries.

Application spans
=================

.. todo:: Custom spans for application logic (for example around the destruction of a
   destruction list) are not implemented yet.

.. _spans: https://opentelemetry.io/docs/concepts/signals/traces/#spans
.. _documentation: https://maykin-django-common.readthedocs.io/en/latest/otel.html#tracing