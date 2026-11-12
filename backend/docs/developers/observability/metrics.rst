.. _developers_observability_metrics:

=======
Metrics
=======

Open Archiefbeheer (OAB) produces application metrics using OpenTelemetry.

.. note:: The exact metric names that show up may be transformed, e.g. Prometheus replaces
   periods with underscores, and processing pipelines may add prefixes or suffixes.

.. important:: Some metrics are defined as "global scope".

   These metrics are typically derived from application state introspection, e.g. by
   performing database (read) queries to aggregate some information. Usually those
   correspond to an `Asynchronous Gauge <https://opentelemetry.io/docs/specs/otel/metrics/api/#asynchronous-gauge>`_.

   Multiple replicas and/or instances of the same service will produce the same values
   of the metrics. You need to apply some kind of aggregation to de-duplicate these
   values. The attribute ``scope="global"``  acts as a marker for these type of metrics.

   With PromQL for example, you can use ``avg`` on the assumption that all values will
   be equal, so the average will also be identical:

   .. code-block:: promql

       avg by (status) (otel_openarchiefbeheer_destruction_lists{scope="global"})

Generic
=======

``http.server.duration``
    Captures how long each HTTP request took, in ms. The metric produces histogram data.

Application-specific metrics
============================

Accounts
--------

``openarchiefbeheer.auth.user_count_by_group``
    Reports the number of users in each auth group. This is a global metric, you must take
    care in de-duplicating results. Additional attributes are:

    * ``group``: the name of the auth group.
    * ``scope``: fixed value ``global`` to enable de-duplication.

    Sample PromQL query:

    .. code-block:: promql

        max by (group) (
          otel_openarchiefbeheer_auth_user_count_by_group{scope="global"}
        )

``openarchiefbeheer.auth.login_failures``
    A counter incremented every time a user login fails (typically because of invalid
    credentials). Does not include the second factor, if enabled. Additional attributes:

    - ``http_target`` - the request path where the login failure occurred, if this
      happened in a request context.

``openarchiefbeheer.auth.user_lockouts``
    A counter incremented every time a user is locked out because they reached the
    maximum number of failed attempts. Additional attributes:

    - ``http_target`` - the request path where the login failure occurred, if this
      happened in a request context.
    - ``username`` - username of the user trying to log in.

``openarchiefbeheer.auth.logins``
    Counter incrementing on every successful login by a user. Additional attributes:

    - ``http_target`` - the request path where the login failure occurred, if this
      happened in a request context.
    - ``username`` - username of the user trying to log in.

``openarchiefbeheer.auth.logouts``
    Counter incrementing every time a user logs out. Additional attributes:

    - ``username`` - username of the user who logged out.


Destruction
-----------

``openarchiefbeheer.destruction.list_count``
    Counts the number of destruction lists defined in the database. Additional attributes:

    - ``status``- the workflow status one of ``new``,
      ``ready_to_review``, ``changes_requested``, ``internally_reviewed``,
      ``ready_for_archivist``, ``ready_to_delete`` or ``deleted``.
    - ``scope`` - fixed, set to ``global`` to enable de-duplication.

``openarchiefbeheer.destruction.item_count``

    Counts the current number of items belonging to each destruction list. Additional attributes:

    - ``destruction_list.name`` - the name of the destruction list.
    - ``scope``- fixed, set to ``global`` to enable de-duplication.

``openarchiefbeheer.destruction.lists.completed``
    Counts the number of successfully processed destruction lists.

``openarchiefbeheer.destruction.lists.failed``
    Counts the number of destruction lists failed during the process.

``openarchiefbeheer.destruction.items.completed``
    Counts the number of sucessfully processes destruction list items.

``openarchiefbeheer.destruction.items.failed``
    Counts the number of destruction list items failed during the process.

``openarchiefbeheer.destruction.resources``
    Counts the number of resources processed during destruction. Additional attributes:

    - ``resource_type``- the resource category, one of ``zaken``,
      ``besluiten``, ``besluitinformatieobjecten``,
      ``zaakinformatieobjecten``, ``enkelvoudiginformatieobjecten``,
      ``objecten``, ``producten`` or ``onderwerpobjecten``.
    - ``result`` - the processing outcome, currently ``deleted`` or ``unlinked``.

