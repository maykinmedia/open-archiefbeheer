.. _developers_observability_index:

=============
Observability
=============

Observability is the ability to understand what the application is doing (and why) by
looking at the data it emits. Open Archiefbeheer emits the following kinds of telemetry
data, also called `signals`_:

**Logs**
    Discrete events that describe something that happened, e.g. a destruction list was
    created. See :ref:`developers_observability_logging`.

**Metrics**
    TBD. See :ref:`developers_observability_metrics`.

**Traces**
    TBD. See :ref:`developers_observability_traces`.

Architecture
============

Open Archiefbeheer is vendor-agnostic: it does not ship telemetry to a specific product,
but rather relies on the open standard `OpenTelemetry`_ (OTel).

We use our shared library as a base integration layer, please refer to the `architecture documentation`_
for more information.

Configuration
=============

The OTel SDK is configured with the standard OTel environment variables. The ones you will commonly need
are documented in :ref:`devops_otel`.

Local observability stack
=========================

For development, a reference observability stack is available in
``backend/docker-services/observability``. In short, it consists of:

================  =====================================================  ==========================
Service           Purpose                                                URL
================  =====================================================  ==========================
OTel Collector    Receives metrics, traces (and logs) over OTLP          ``localhost:4317`` (gRPC)
Prometheus        Scrapes and stores the metrics from the collector      http://localhost:9090
Alloy             Scrapes the container logs via the docker socket       http://localhost:12345
Loki              Stores the logs                                        http://localhost:3100
Grafana           Visualizes logs (Loki) and metrics (Prometheus)        http://localhost:3000
================  =====================================================  ==========================

Please refer to the corresponding ``README.md`` file for more information.

.. warning:: This stack is meant for local development only, and the chosen vendors only
   serve as an example. The configuration contains hardcoded credentials and mounts the
   docker socket, which is not suitable for production.

Topics
======

.. toctree::
    :maxdepth: 2

    logging
    metrics
    traces

.. _signals: https://opentelemetry.io/docs/concepts/signals/
.. _OpenTelemetry: https://opentelemetry.io/
.. _architecture documentation: https://maykin-django-common.readthedocs.io/en/latest/otel.html#architecture
