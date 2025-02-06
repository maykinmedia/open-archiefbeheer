.. _manual_index:

=====================
Gebruikershandleiding
=====================

Deze handleiding is bedoeld voor de gebruikers van het systeem, en beschrijft het overkoepelende proces voor het
beoordelen, goedkeuren, en vernietigen van vernietigingslijsten binnen de applicatie. Het proces omvat verschillende
rollen en hun bijbehorende verantwoordelijkheden.

.. toctree::
    :maxdepth: 2
    :caption: Inhoudsopgave

    1-record-manager/index
    2-reviewer-archivaris/index
    3-administrator/index

Overkoepelend proces vernietiging
---------------------------------

Deze handleiding beschrijft het overkoepelende proces voor het beoordelen, goedkeuren, en vernietigen van
vernietigingslijsten binnen de applicatie. Het proces omvat verschillende rollen en hun bijbehorende
verantwoordelijkheden.

Rollen en verantwoordelijkheden
-------------------------------

Het proces wordt uitgevoerd door verschillende rollen, waarbij elke rol specifieke verantwoordelijkheden heeft:

- **Record manager**:
    - De **record manager** is verantwoordelijk voor het aanmaken, beheren en voorbereiden van de vernietigingslijst.
    - De **record manager** is ook verantwoordelijk voor het doorsturen van de lijst naar de archivaris na goedkeuring
      door de beoordelaar.
    - De **record manager** kan niet de **beoordelaar** van dezelfde vernietigingslijst zijn, maar kan zowel de rol van
      record manager als beoordelaar in het systeem vervullen, mits deze rollen betrekking hebben op verschillende
      lijsten.

- **Beoordelaar**:
    - De **beoordelaar** beoordeelt de vernietigingslijst op basis van vooraf gedefinieerde criteria.
    - De **beoordelaar** kan de lijst goedkeuren of afwijzen.
    - Indien er meerdere beoordelaars zijn, kunnen zij gezamenlijk de lijst beoordelen, maar de **hoofdbeoordelaar**
      heeft de uiteindelijke verantwoordelijkheid voor goedkeuring of afwijzing van de lijst.
    - De **beoordelaar** is verantwoordelijk voor het markeren van zaken als **geaccordeerd** of **uitgezonderd**.

- **Mede-beoordelaar**:
    - De **mede-beoordelaar** is een extra beoordelaar die kan worden toegevoegd om samen met de hoofdbeoordelaar de
      lijst te beoordelen.
    - De **mede-beoordelaar** heeft dezelfde beoordelingsverantwoordelijkheden als de hoofdbeoordelaar, zoals het
      goedkeuren of afwijzen van zaken in de lijst.
    - De beoordelingen van alle **mede-beoordelaars** worden zichtbaar voor alle beoordelaars.
    - De **mede-beoordelaar** kan zaken als **geaccordeerd** of **uitgezonderd** markeren, maar heeft geen bevoegdheid
      om de lijst als geheel goed te keuren of af te wijzen. Dit kan alleen de **hoofdbeoordelaar** doen.

- **Archivaris**:
    - De **archivaris** heeft de laatste beoordeling van de vernietigingslijst en geeft de goedkeuring voor de
      vernietiging.
    - Als de lijst door de beoordelaar is goedgekeurd, stuurt de **record manager** deze door naar de **archivaris**
      voor de laatste goedkeuring.

Processtappen
-------------

1. **Voorbereiden van de lijst (door de record manager)**:
    - De **record manager** creëert de vernietigingslijst en past deze eventueel later nog aan.
    - Zodra de lijst klaar is, kan de **record manager** de lijst naar de beoordelaar sturen.

2. **Beoordelen van de lijst (door de beoordelaar en mede-beoordelaars)**:
    - De **beoordelaar** opent de lijst en beoordeelt de zaken.
    - De **mede-beoordelaar** heeft dezelfde beoordelingsverantwoordelijkheden als de **beoordelaar** en kan zaken
      goedkeuren, afwijzen of uitzonderen.
    - Alle beoordelaars (hoofdbeoordelaar en mede-beoordelaars) kunnen hun opmerkingen en beoordelingen zien, maar
      alleen de **hoofdbeoordelaar** kan de lijst goedkeuren of afwijzen.

3. **Doorsturen naar de archivaris (door de record manager)**:
    - Nadat de lijst is goedgekeurd door de beoordelaar, stuurt de **record manager** de lijst door naar de
      **archivaris**.
    - De **archivaris** heeft de laatste goedkeuring om de vernietiging in gang te zetten.

4. **Vernietigen van de lijst (door de archivaris)**:
    - Na goedkeuring door de archivaris, worden de geselecteerde zaken definitief vernietigd.
    - Een vernietigingsrapport wordt gegenereerd door het systeem na afloop van de vernietiging, welke kan worden
      gedownload door de record manager.
