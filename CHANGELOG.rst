==============
Change history
==============

2.0.0 (2026-02-02)
==================

⚠️ This release contains **breaking changes**. See below the actions needed for the upgrade procedure:

* [#871] Upgraded ``mozilla-django-oidc-db`` to version ``1.1.1``. The structure of the ``yaml`` used to configure ``mozilla-django-oidc-db`` with setup configuration has a different structure:

    .. code:: yaml

      providers:
        - identifier: example-provider
          # other provider settings

      clients:
        - identifier: admin-oidc
          oidc_provider_identifier: example-provider
          # other client settings

* [#884] The configuration page of the destruction report has been reworked. Existing installations need to reconfigure the destruction report settings after upgrading.
* [#978] The structure of how the data is tracked internally during the destruction of a list has been reworked. Ensure that there are no destruction lists currently being processed or waiting for retry.

**New features**

* Plugins are now available to support destruction in external registries:

  * [#940] Object API plugin, enabling destruction of resources stored in the Object API.
  * [#905] OpenKlant plugin, enabling destruction of resource stored in OpenKlant.

* [#958] The landing page now only shows recently deleted destruction lists.

  * Older lists are available on the completed destruction lists page.
  * The number of days (default: 7) a deleted list remains visible in the kanban view can be configured using the ``POST_DESTRUCTION_VISIBILITY_PERIOD`` environment variable.

* Added a new management command to generate demo data for developers.

**Maintenance**

* [#871] Upgraded ``django-setup-configuration`` to version ``0.11.0``. It is now possible to specify environment variables in the ``yaml`` of ``django-setup-configuration`` to pass sensitive values. For more details, see the `django-setup-configuration changelog <https://github.com/maykinmedia/django-setup-configuration/blob/main/CHANGELOG.rst#090-2025-09-03>`__.
* Improved the performance of multiple endpoints.
* Refactored the application configuration checks.
* Improved test isolation and introduced ``pytest`` for tests that interact with Open Zaak and use VCR.
* Replaced black, isort and flake8 with ruff.
* Improved destruction list filtering behaviour.
* Rework caching of resources coming from Open Zaak and Selectielijst API.


1.1.1 (2025-10-03)
==================

Patch release:

* [#857] Logging for the ``mozilla_django_oidc`` package is added with a configurable logging level. This should make it easier to debug OIDC login problems.
* Upgrade Django dependency and js dependencies.

1.1.0 (2025-08-22)
==================

New features:

* [#841] The record manager can now reassign both the main reviewer and the archivaris, instead of only the reviewer.

Documentation improvements:

* [#848] Explain the role of health checks and clarify that they do not indicate a failure occurred during deployment.
* [#808] Improved developer docs with information about how to setup a local environment.
* [#834] Document button to refresh Catalogi API resources from Open Zaak.

Bug fixes:

* [#842] All the comments added at any step of the process are now visible.
* [#843] Fix that some users could no longer be selected as reviewers/archivist after a process had been interrupted.


1.0.1 (2025-05-09)
==================

* [#827] Fix validation of the field Bronorganisatie in the settings for the destruction report.
* [#821] Fix the form for configuring the destruction report so that dependent fields are not shown until the previous fields are filled.
* [#824] Make it possible to clear the cache of the resource-types endpoints so that after changes in Open Zaak the user does not need to wait 15 min before being able to see their changes.
* [#830] Change the permissions so that configuration actions can only be performed by administrators. Update the documentation.
* [#816] Fix columns with long values that break off.
* [#817] Fix default ordering in logging endpoint. Now it is by default ordered chronologically.


1.0.0 (2025-03-28)
==================

De eerste versie van Open Archiefbeheer is gelanceerd!
Het systeem stelt organisaties in staat om vernietigingslijsten op te stellen en het vernietigingsproces te beheren in lijn met de Archiefwet en de GEMMA-standaarden.

Belangrijke functies:
* Opstellen en beheren van vernietigingslijsten.
* Toewijzen van beoordelaars aan vernietigingslijsten.
* Ondersteuning voor het vernietigingsproces volgens de Archiefwet en GEMMA.

Deze release biedt een basis voor veilig en wettelijk conform archiefbeheer. 
