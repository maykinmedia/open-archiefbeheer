.. _developers_observability_logging:

=======
Logging
=======

Open Archiefbeheer uses `structlog`_ for structured logging. Every log record is an
event (a short, machine-friendly name) with a set of key-value pairs as context,
instead of a free-form text message.

Much of the setup comes from our shared library, which contains more `documentation`_
on logging as well.

Writing logs
============

Application logger
------------------

Get a logger at module level and log an event name with the relevant context as keyword
arguments:

.. code-block:: python

    import structlog

    logger = structlog.stdlib.get_logger(__name__)

    logger.info(
        "zaakinformatieobject_deleted",
        url=zaakinformatieobject["url"],
    )


Guidelines:

* Use a ``snake_case`` event name that describes what happened, and put the variable
  data (JSON format!) in keyword arguments.
* Never log sensitive data (passwords, tokens, personal data).
* Pick the level carefully: ``debug`` for developer details, ``info`` for normal
  operations, ``warning`` for unexpected but handled situations and ``error`` for
  failures.

Audit logger
------------

Events that are relevant for the audit trail of a destruction list (created, reviewed,
destroyed...) are logged with the audit logger:

.. code-block:: python

    from maykin_common.logging.audit import audit_logger

    audit_logger.info(
        "destruction_list_reviewed",
        destruction_list_uuid=str(validated_data["destruction_list"].uuid),
        user=review.author.username,
        comment=validated_data.get("list_feedback", ""),
        approved=review.decision == ReviewDecisionChoices.accepted,
    )

The audit logger (``openarchiefbeheer_audit`` by default) emits records to the normal output,
but also to the ``timeline_logger`` handler which persists them to the database as a
``TimelineLog`` object, so they can be displayed in the application.

The conversion from a structlog event to a ``TimelineLog`` happens in
``openarchiefbeheer.logging.adapter.from_structlog``. When you add a new audit event,
you must:

1. add a ``case`` for the event to ``from_structlog``, matching the context you pass to
   the logger;
2. add a template for the event to ``openarchiefbeheer.logging.templates.logging``.

Request context
---------------

The `django-structlog`_ middleware binds request information (such as a ``request_id``
and the user) to all log records emitted while handling a request, and logs the start
and end of each request. This can be disabled with ``LOG_REQUESTS=false``.

Configuration
=============

The logging configuration lives in ``openarchiefbeheer.conf.base`` and is controlled by
these environment variables:

======================  ==================================================  ==================================================
Variable                Description                                         Valid values
======================  ==================================================  ==================================================
``LOG_STDOUT``          Whether to log to stdout instead of to              Boolean (or truthy/falsy values).
                        ``log/application.jsonl``.
``LOG_FORMAT_CONSOLE``  Format of the console output.                       ``json`` or ``plain_console`` (human readable).

``LOG_LEVEL``           Log level of the ``openarchiefbeheer`` loggers.     ``DEBUG``, ``INFO``, ``WARNING``, or ``ERROR``.

``LOG_REQUESTS``        Whether to log every request via django-structlog.  Boolean (or truthy/falsy values).
======================  ==================================================  ==================================================

.. note::
    At this time, logs are not exported via OTLP - they are only written to
    the console or a file.

.. _structlog: https://www.structlog.org/
.. _documentation: https://maykin-django-common.readthedocs.io/en/latest/logging.html
.. _django-structlog: https://django-structlog.readthedocs.io/
