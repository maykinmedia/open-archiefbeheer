.. _developers_health-checks:

=============
Health checks
=============

Open Archiefbeheer performs a number of health checks to verify that the application
has all required external services and configuration settings. The checks are
based on the ``maykin-config-checks`` library. All configuration can be done in the Admin.

The config checks validate:

1. All required services are configured and can be accessed (``zgw_consumers.Service``):

   * Zaken API (zrc)
   * Documenten API (drc)
   * Catalogi API (ztc)
   * Besluiten API (brc)
   * Selectielijst API

   Can be configured on the **External APIs** -> **Services**
   admin page.

2. The API configuration contains a Selectielijst API service (``APIConfig.selectielijst_api_service``
   is not empty).

   Can be configured on the **External APIs** -> **API-configuratie** admin page.

3. The archive configuration should have settings (``ArchiveConfig`` fields are not empty).

   Can be configured on **Overige** -> **Archiefconfiguratie** admin page.

4. Configuration of external-register plugins is added (``ExternalRegisterConfig`` has configured
   services for each plugin).

   Can be confifgured on **Overige** -> **Externe register plugin configuraties** admin page.
