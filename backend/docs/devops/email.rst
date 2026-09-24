.. _devops_email:

====================
E-mail configuration
====================

Open Archiefbeheer supports sending e-mails through an SMTP server. Besides the necessary admin configuration (see the
:ref:`documentation<manual_3-administrator_3.1-email-templates>`), the service needs to be configured as well.
This can be done by supplying the following environment variables:

* ``DEFAULT_FROM_EMAIL``: The e-mail address to use a default sender. Defaults to ``openarchiefbeheer@example.com``.
* ``EMAIL_HOST``: E-mail server host. Defaults to ``localhost``.
* ``EMAIL_PORT``: E-mail server port. Defaults to ``25``.
* ``EMAIL_HOST_USER``: E-mail server username. Defaults to ``""``.
* ``EMAIL_HOST_PASSWORD``: E-mail server password. Defaults to ``""``.
* ``EMAIL_USE_TLS``: Indicates whether the e-mail server uses TLS. Defaults to ``False``.
* ``EMAIL_TIMEOUT``: Indicates how long to wait for blocking operations, like the connection attempt,
  in seconds. Defaults to ``10``.

.. note::

    When deploying using Kubernetes, (most of) these settings can be specified directly in the values of the chart as well:
    ``values.settings.email``. See also the example in our
    `charts repository <https://github.com/maykinmedia/charts/blob/main/charts/openarchiefbeheer/values.yaml>`_.