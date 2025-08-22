==============
Change history
==============

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
