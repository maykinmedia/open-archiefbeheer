/* eslint-disable */
/* tslint:disable */

/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum AardRelatieEnum {
  Vervolg = "vervolg",
  Onderwerp = "onderwerp",
  Bijdrage = "bijdrage",
}

export enum AardRelatieWeergaveEnum {
  HoortBijOmgekeerdKent = "Hoort bij, omgekeerd: kent",
  LegtVastOmgekeerdKanVastgelegdZijnAls = "Legt vast, omgekeerd: kan vastgelegd zijn als",
}

export enum ArchiefnominatieEnum {
  BlijvendBewaren = "blijvend_bewaren",
  Vernietigen = "vernietigen",
}

export enum ArchiefstatusEnum {
  NogTeArchiveren = "nog_te_archiveren",
  Gearchiveerd = "gearchiveerd",
  GearchiveerdProcestermijnOnbekend = "gearchiveerd_procestermijn_onbekend",
  Overgedragen = "overgedragen",
}

export interface AuditTrail {
  /**
   * Unieke identificatie van de audit regel.
   * @format uuid
   */
  uuid?: string;
  /**
   * De naam van het component waar de wijziging in is gedaan.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `ac` - Autorisaties API
   * * `nrc` - Notificaties API
   * * `zrc` - Zaken API
   * * `ztc` - Catalogi API
   * * `drc` - Documenten API
   * * `brc` - Besluiten API
   * * `cmc` - Contactmomenten API
   * * `kc` - Klanten API
   * * `vrc` - Verzoeken API
   */
  bron: BronEnum;
  /**
   * Unieke identificatie van de applicatie, binnen de organisatie.
   * @maxLength 100
   */
  applicatieId?: string;
  /**
   * Vriendelijke naam van de applicatie.
   * @maxLength 200
   */
  applicatieWeergave?: string;
  /**
   * Unieke identificatie van de gebruiker die binnen de organisatie herleid kan worden naar een persoon.
   * @maxLength 255
   */
  gebruikersId?: string;
  /**
   * Vriendelijke naam van de gebruiker.
   * @maxLength 255
   */
  gebruikersWeergave?: string;
  /**
   * De uitgevoerde handeling.
   *
   * De bekende waardes voor dit veld zijn hieronder aangegeven,                         maar andere waardes zijn ook toegestaan
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `create` - Object aangemaakt
   * * `list` - Lijst van objecten opgehaald
   * * `retrieve` - Object opgehaald
   * * `destroy` - Object verwijderd
   * * `update` - Object bijgewerkt
   * * `partial_update` - Object deels bijgewerkt
   * @maxLength 50
   */
  actie: string;
  /**
   * Vriendelijke naam van de actie.
   * @maxLength 200
   */
  actieWeergave?: string;
  /**
   * HTTP status code van de API response van de uitgevoerde handeling.
   * @min 100
   * @max 599
   */
  resultaat: number;
  /**
   * De URL naar het hoofdobject van een component.
   * @format uri
   * @maxLength 1000
   */
  hoofdObject: string;
  /**
   * Het type resource waarop de actie gebeurde.
   * @maxLength 50
   */
  resource: string;
  /**
   * De URL naar het object.
   * @format uri
   * @maxLength 1000
   */
  resourceUrl: string;
  /** Toelichting waarom de handeling is uitgevoerd. */
  toelichting?: string;
  /**
   * Vriendelijke identificatie van het object.
   * @maxLength 200
   */
  resourceWeergave: string;
  /**
   * De datum waarop de handeling is gedaan.
   * @format date-time
   */
  aanmaakdatum?: string;
  wijzigingen: Wijzigingen;
}

export interface BaseRolSerializer {
  /**
   * URL-referentie naar dit object. Dit is de unieke identificatie en locatie van dit object.
   * @format uri
   */
  url?: string;
  /**
   * Unieke resource identifier (UUID4)
   * @format uuid
   */
  uuid?: string;
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * URL-referentie naar een betrokkene gerelateerd aan de ZAAK.
   * @format uri
   * @maxLength 1000
   */
  betrokkene?: string;
  /**
   * Type van de `betrokkene`.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `natuurlijk_persoon` - Natuurlijk persoon
   * * `niet_natuurlijk_persoon` - Niet-natuurlijk persoon
   * * `vestiging` - Vestiging
   * * `organisatorische_eenheid` - Organisatorische eenheid
   * * `medewerker` - Medewerker
   */
  betrokkeneType: BetrokkeneTypeEnum;
  /**
   * De naam van de betrokkene waaronder deze in relatie tot de zaak aangesproken wil worden.
   * @maxLength 625
   */
  afwijkendeNaamBetrokkene?: string;
  /**
   * URL-referentie naar een roltype binnen het ZAAKTYPE van de ZAAK.
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  roltype: string;
  /** Omschrijving van de aard van de ROL, afgeleid uit het ROLTYPE. */
  omschrijving?: string;
  /**
   * Algemeen gehanteerde benaming van de aard van de ROL, afgeleid uit het ROLTYPE.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `adviseur` - (Adviseur) Kennis in dienst stellen van de behandeling van (een deel van) een zaak.
   * * `behandelaar` - (Behandelaar) De vakinhoudelijke behandeling doen van (een deel van) een zaak.
   * * `belanghebbende` - (Belanghebbende) Vanuit eigen en objectief belang rechtstreeks betrokken zijn bij de behandeling en/of de uitkomst van een zaak.
   * * `beslisser` - (Beslisser) Nemen van besluiten die voor de uitkomst van een zaak noodzakelijk zijn.
   * * `initiator` - (Initiator) Aanleiding geven tot de start van een zaak ..
   * * `klantcontacter` - (Klantcontacter) Het eerste aanspreekpunt zijn voor vragen van burgers en bedrijven ..
   * * `zaakcoordinator` - (Zaakcoördinator) Er voor zorg dragen dat de behandeling van de zaak in samenhang uitgevoerd wordt conform de daarover gemaakte afspraken.
   * * `mede_initiator` - (Mede-initiator)
   */
  omschrijvingGeneriek?: string;
  /** @maxLength 1000 */
  roltoelichting: string;
  /**
   * De datum waarop dit object is geregistreerd.
   * @format date-time
   */
  registratiedatum?: string;
  /**
   * Indicatie machtiging
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `gemachtigde` - De betrokkene in de rol bij de zaak is door een andere betrokkene bij dezelfde zaak gemachtigd om namens hem of haar te handelen
   * * `machtiginggever` - De betrokkene in de rol bij de zaak heeft een andere betrokkene bij dezelfde zaak gemachtigd om namens hem of haar te handelen
   */
  indicatieMachtiging?: IndicatieMachtigingEnum | BlankEnum;
  /** De gegevens van de persoon die anderen desgevraagd in contact brengt met medewerkers van de BETROKKENE, een NIET-NATUURLIJK PERSOON of VESTIGING zijnde, of met BETROKKENE zelf, een NATUURLIJK PERSOON zijnde , vanuit het belang van BETROKKENE in haar ROL bij een ZAAK. */
  contactpersoonRol?: ContactPersoonRol | null;
  /** De BETROKKENE die in zijn/haar ROL in een ZAAK heeft geregistreerd dat STATUSsen in die ZAAK bereikt zijn. */
  statussen?: string[];
}

export interface BaseZaakObjectSerializer {
  /**
   * URL-referentie naar dit object. Dit is de unieke identificatie en locatie van dit object.
   * @format uri
   */
  url?: string;
  /**
   * Unieke resource identifier (UUID4)
   * @format uuid
   */
  uuid?: string;
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * URL-referentie naar de resource die het OBJECT beschrijft.
   * @format uri
   * @maxLength 1000
   */
  object?: string;
  /**
   * URL-referentie naar het ZAAKOBJECTTYPE (in de Catalogi API).
   * @format uri
   * @minLength null
   * @maxLength 1000
   */
  zaakobjecttype?: string;
  /**
   * Beschrijft het type OBJECT gerelateerd aan de ZAAK. Als er geen passend type is, dan moet het type worden opgegeven onder `objectTypeOverige`.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `adres` - Adres
   * * `besluit` - Besluit
   * * `buurt` - Buurt
   * * `enkelvoudig_document` - Enkelvoudig document
   * * `gemeente` - Gemeente
   * * `gemeentelijke_openbare_ruimte` - Gemeentelijke openbare ruimte
   * * `huishouden` - Huishouden
   * * `inrichtingselement` - Inrichtingselement
   * * `kadastrale_onroerende_zaak` - Kadastrale onroerende zaak
   * * `kunstwerkdeel` - Kunstwerkdeel
   * * `maatschappelijke_activiteit` - Maatschappelijke activiteit
   * * `medewerker` - Medewerker
   * * `natuurlijk_persoon` - Natuurlijk persoon
   * * `niet_natuurlijk_persoon` - Niet-natuurlijk persoon
   * * `openbare_ruimte` - Openbare ruimte
   * * `organisatorische_eenheid` - Organisatorische eenheid
   * * `pand` - Pand
   * * `spoorbaandeel` - Spoorbaandeel
   * * `status` - Status
   * * `terreindeel` - Terreindeel
   * * `terrein_gebouwd_object` - Terrein gebouwd object
   * * `vestiging` - Vestiging
   * * `waterdeel` - Waterdeel
   * * `wegdeel` - Wegdeel
   * * `wijk` - Wijk
   * * `woonplaats` - Woonplaats
   * * `woz_deelobject` - Woz deel object
   * * `woz_object` - Woz object
   * * `woz_waarde` - Woz waarde
   * * `zakelijk_recht` - Zakelijk recht
   * * `overige` - Overige
   */
  objectType: ObjectTypeEnum;
  /**
   * Beschrijft het type OBJECT als `objectType` de waarde "overige" heeft.
   * @maxLength 100
   * @pattern [a-z_]+
   */
  objectTypeOverige?: string;
  /**
   * definitie object type overige
   * Verwijzing naar het schema van het type OBJECT als `objectType` de waarde "overige" heeft.
   *
   * * De URL referentie moet naar een JSON endpoint   wijzen waarin het objecttype gedefinieerd is, inclusief het   [JSON-schema](https://json-schema.org/).
   * * Gebruik het `schema` attribuut om te verwijzen naar het schema binnen   de objecttype resource (deze gebruikt het   [jq](http://stedolan.github.io/jq/) formaat.
   * * Gebruik het `objectData` attribuut om te verwijzen naar de gegevens   binnen het OBJECT. Deze gebruikt ook het   [jq](http://stedolan.github.io/jq/) formaat.
   *
   * Indien je hier gebruikt van maakt, dan moet je een OBJECT url opgeven en is het gebruik van objectIdentificatie niet mogelijk. De opgegeven OBJECT url wordt gevalideerd tegen het schema van het opgegeven objecttype.
   */
  objectTypeOverigeDefinitie?: ObjectTypeOverigeDefinitie | null;
  /**
   * Omschrijving van de betrekking tussen de ZAAK en het OBJECT.
   * @maxLength 80
   */
  relatieomschrijving?: string;
}

export enum BetalingsindicatieEnum {
  Nvt = "nvt",
  NogNiet = "nog_niet",
  Gedeeltelijk = "gedeeltelijk",
  Geheel = "geheel",
}

export enum BetrokkeneTypeEnum {
  NatuurlijkPersoon = "natuurlijk_persoon",
  NietNatuurlijkPersoon = "niet_natuurlijk_persoon",
  Vestiging = "vestiging",
  OrganisatorischeEenheid = "organisatorische_eenheid",
  Medewerker = "medewerker",
}

export enum BlankEnum {
  Value = "",
}

export enum BronEnum {
  Ac = "ac",
  Nrc = "nrc",
  Zrc = "zrc",
  Ztc = "ztc",
  Drc = "drc",
  Brc = "brc",
  Cmc = "cmc",
  Kc = "kc",
  Vrc = "vrc",
}

export interface ContactPersoonRol {
  /**
   * Email
   * Elektronich postadres waaronder de contactpersoon in de regel bereikbaar is.
   * @format email
   * @maxLength 254
   */
  emailadres?: string;
  /**
   * De aanduiding van de taken, rechten en plichten die de contactpersoon heeft binnen de organisatie van BETROKKENE.
   * @maxLength 50
   */
  functie?: string;
  /**
   * Telefoonnummer waaronder de contactpersoon in de regel bereikbaar is.
   * @maxLength 20
   */
  telefoonnummer?: string;
  /**
   * De opgemaakte naam van de contactpersoon namens de BETROKKENE.
   * @maxLength 200
   */
  naam: string;
}

export interface ContactPersoonRolRequest {
  /**
   * Email
   * Elektronich postadres waaronder de contactpersoon in de regel bereikbaar is.
   * @format email
   * @maxLength 254
   */
  emailadres?: string;
  /**
   * De aanduiding van de taken, rechten en plichten die de contactpersoon heeft binnen de organisatie van BETROKKENE.
   * @maxLength 50
   */
  functie?: string;
  /**
   * Telefoonnummer waaronder de contactpersoon in de regel bereikbaar is.
   * @maxLength 20
   */
  telefoonnummer?: string;
  /**
   * De opgemaakte naam van de contactpersoon namens de BETROKKENE.
   * @minLength 1
   * @maxLength 200
   */
  naam: string;
}

export type ExpandZaak = Zaak & {
  /** Display details of the linked resources requested in the `expand` parameter */
  _expand?: {
    /** URL-referentie naar het ZAAKTYPE (in de Catalogi API). */
    zaaktype?: any;
    /**
     * Is deelzaak van
     * URL-referentie naar de ZAAK, waarom verzocht is door de initiator daarvan, die behandeld wordt in twee of meer separate ZAAKen waarvan de onderhavige ZAAK er één is.
     */
    hoofdzaak?: Zaak | null;
    /** URL-referenties naar deel ZAAKen. */
    deelzaken?: Zaak[];
    /** URL-referenties naar ZAAK-EIGENSCHAPPen. */
    eigenschappen?: ZaakEigenschap[];
    /** Indien geen status bekend is, dan is de waarde 'null' */
    status?: Status | null;
    /** URL-referentie naar het RESULTAAT. Indien geen resultaat bekend is, dan is de waarde 'null' */
    resultaat?: Resultaat | null;
    /** URL-referenties naar ROLLen. */
    rollen?: Rol[];
    /** URL-referenties naar ZAAKINFORMATIEOBJECTen. */
    zaakinformatieobjecten?: ZaakInformatieObject[];
    /** URL-referenties naar ZAAKOBJECTen. */
    zaakobjecten?: ZaakObject[];
  };
};

/** Formaat van validatiefouten. */
export interface FieldValidationError {
  /** Naam van het veld met ongeldige gegevens */
  name: string;
  /** Systeemcode die het type fout aangeeft */
  code: string;
  /** Uitleg wat er precies fout is met de gegevens */
  reason: string;
}

/** Formaat van HTTP 4xx en 5xx fouten. */
export interface Fout {
  /** URI referentie naar het type fout, bedoeld voor developers */
  type?: string;
  /** Systeemcode die het type fout aangeeft */
  code: string;
  /** Generieke titel voor het type fout */
  title: string;
  /** De HTTP status code */
  status: number;
  /** Extra informatie bij de fout, indien beschikbaar */
  detail: string;
  /** URI met referentie naar dit specifiek voorkomen van de fout. Deze kan gebruikt worden in combinatie met server logs, bijvoorbeeld. */
  instance: string;
}

/** GeoJSONGeometry */
export type GeoJSONGeometry =
  | Point
  | MultiPoint
  | LineString
  | MultiLineString
  | Polygon
  | MultiPolygon
  | GeometryCollection;

export interface GeoWithinRequest {
  within?: GeoJSONGeometry;
}

/**
 * Geometry
 * GeoJSON geometry
 */
export interface Geometry {
  /** The geometry type */
  type: GeometryTypeEnum;
}

/** GeoJSON geometry collection */
export type GeometryCollection = Geometry & {
  geometries: Geometry[];
};

export enum GeometryTypeEnum {
  Point = "Point",
  MultiPoint = "MultiPoint",
  LineString = "LineString",
  MultiLineString = "MultiLineString",
  Polygon = "Polygon",
  MultiPolygon = "MultiPolygon",
  Feature = "Feature",
  FeatureCollection = "FeatureCollection",
  GeometryCollection = "GeometryCollection",
}

export enum GeslachtsaanduidingEnum {
  M = "m",
  V = "v",
  O = "o",
}

export enum IndicatieMachtigingEnum {
  Gemachtigde = "gemachtigde",
  Machtiginggever = "machtiginggever",
}

export enum InnRechtsvormEnum {
  BeslotenVennootschap = "besloten_vennootschap",
  CooperatieEuropeesEconomischeSamenwerking = "cooperatie_europees_economische_samenwerking",
  EuropeseCooperatieveVenootschap = "europese_cooperatieve_venootschap",
  EuropeseNaamlozeVennootschap = "europese_naamloze_vennootschap",
  KerkelijkeOrganisatie = "kerkelijke_organisatie",
  NaamlozeVennootschap = "naamloze_vennootschap",
  OnderlingeWaarborgMaatschappij = "onderlinge_waarborg_maatschappij",
  OverigPrivaatrechtelijkeRechtspersoon = "overig_privaatrechtelijke_rechtspersoon",
  Stichting = "stichting",
  Vereniging = "vereniging",
  VerenigingVanEigenaars = "vereniging_van_eigenaars",
  PubliekrechtelijkeRechtspersoon = "publiekrechtelijke_rechtspersoon",
  VennootschapOnderFirma = "vennootschap_onder_firma",
  Maatschap = "maatschap",
  Rederij = "rederij",
  CommanditaireVennootschap = "commanditaire_vennootschap",
  KapitaalvennootschapBinnenEer = "kapitaalvennootschap_binnen_eer",
  OverigeBuitenlandseRechtspersoonVennootschap = "overige_buitenlandse_rechtspersoon_vennootschap",
  KapitaalvennootschapBuitenEer = "kapitaalvennootschap_buiten_eer",
}

export interface KlantContact {
  /**
   * URL-referentie naar dit object. Dit is de unieke identificatie en locatie van dit object.
   * @format uri
   */
  url?: string;
  /**
   * Unieke resource identifier (UUID4)
   * @format uuid
   */
  uuid?: string;
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * De unieke aanduiding van een KLANTCONTACT
   * @maxLength 14
   */
  identificatie?: string;
  /**
   * De datum en het tijdstip waarop het KLANTCONTACT begint
   * @format date-time
   */
  datumtijd: string;
  /**
   * Het communicatiekanaal waarlangs het KLANTCONTACT gevoerd wordt
   * @maxLength 20
   */
  kanaal?: string;
  /**
   * Het onderwerp waarover contact is geweest met de klant.
   * @maxLength 200
   */
  onderwerp?: string;
  /**
   * Een toelichting die inhoudelijk het contact met de klant beschrijft.
   * @maxLength 1000
   */
  toelichting?: string;
}

export interface KlantContactRequest {
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * De unieke aanduiding van een KLANTCONTACT
   * @minLength 1
   * @maxLength 14
   */
  identificatie?: string;
  /**
   * De datum en het tijdstip waarop het KLANTCONTACT begint
   * @format date-time
   */
  datumtijd: string;
  /**
   * Het communicatiekanaal waarlangs het KLANTCONTACT gevoerd wordt
   * @maxLength 20
   */
  kanaal?: string;
  /**
   * Het onderwerp waarover contact is geweest met de klant.
   * @maxLength 200
   */
  onderwerp?: string;
  /**
   * Een toelichting die inhoudelijk het contact met de klant beschrijft.
   * @maxLength 1000
   */
  toelichting?: string;
}

/** GeoJSON line-string geometry */
export type LineString = Geometry & {
  /** @minItems 2 */
  coordinates: Point2D[];
};

/** GeoJSON multi-line-string geometry */
export type MultiLineString = Geometry & {
  coordinates: Point2D[][];
};

/** GeoJSON multi-point geometry */
export type MultiPoint = Geometry & {
  coordinates: Point2D[];
};

/** GeoJSON multi-polygon geometry */
export type MultiPolygon = Geometry & {
  coordinates: Point2D[][][];
};

export interface Notificatie {
  /**
   * De naam van het kanaal (`KANAAL.naam`) waar het bericht op moet worden gepubliceerd.
   * @maxLength 50
   */
  kanaal: string;
  /**
   * hoofdobject
   * URL-referentie naar het hoofd object van de publicerende API die betrekking heeft op de `resource`.
   * @format uri
   */
  hoofdObject: string;
  /**
   * De resourcenaam waar de notificatie over gaat.
   * @maxLength 100
   */
  resource: string;
  /**
   * URL-referentie naar de `resource` van de publicerende API.
   * @format uri
   */
  resourceUrl: string;
  /**
   * De actie die door de publicerende API is gedaan. De publicerende API specificeert de toegestane acties.
   * @maxLength 100
   */
  actie: string;
  /**
   * Datum en tijd waarop de actie heeft plaatsgevonden.
   * @format date-time
   */
  aanmaakdatum: string;
  /** Mapping van kenmerken (sleutel/waarde) van de notificatie. De publicerende API specificeert de toegestane kenmerken. */
  kenmerken?: Record<string, string>;
}

export interface NotificatieRequest {
  /**
   * De naam van het kanaal (`KANAAL.naam`) waar het bericht op moet worden gepubliceerd.
   * @minLength 1
   * @maxLength 50
   */
  kanaal: string;
  /**
   * hoofdobject
   * URL-referentie naar het hoofd object van de publicerende API die betrekking heeft op de `resource`.
   * @format uri
   * @minLength 1
   */
  hoofdObject: string;
  /**
   * De resourcenaam waar de notificatie over gaat.
   * @minLength 1
   * @maxLength 100
   */
  resource: string;
  /**
   * URL-referentie naar de `resource` van de publicerende API.
   * @format uri
   * @minLength 1
   */
  resourceUrl: string;
  /**
   * De actie die door de publicerende API is gedaan. De publicerende API specificeert de toegestane acties.
   * @minLength 1
   * @maxLength 100
   */
  actie: string;
  /**
   * Datum en tijd waarop de actie heeft plaatsgevonden.
   * @format date-time
   */
  aanmaakdatum: string;
  /** Mapping van kenmerken (sleutel/waarde) van de notificatie. De publicerende API specificeert de toegestane kenmerken. */
  kenmerken?: Record<string, string>;
}

export type NullEnum = null;

export interface ObjectAdres {
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  /** @maxLength 80 */
  wplWoonplaatsNaam: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @maxLength 80
   */
  gorOpenbareRuimteNaam: string;
  /**
   * @min 0
   * @max 99999
   */
  huisnummer: number;
  /** @maxLength 1 */
  huisletter?: string;
  /** @maxLength 4 */
  huisnummertoevoeging?: string;
  /** @maxLength 7 */
  postcode?: string;
}

export interface ObjectAdresRequest {
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  /**
   * @minLength 1
   * @maxLength 80
   */
  wplWoonplaatsNaam: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @minLength 1
   * @maxLength 80
   */
  gorOpenbareRuimteNaam: string;
  /**
   * @min 0
   * @max 99999
   */
  huisnummer: number;
  /** @maxLength 1 */
  huisletter?: string;
  /** @maxLength 4 */
  huisnummertoevoeging?: string;
  /** @maxLength 7 */
  postcode?: string;
}

export interface ObjectBuurt {
  /**
   * De code behorende bij de naam van de buurt
   * @maxLength 2
   */
  buurtCode: string;
  /**
   * De naam van de buurt, zoals die door het CBS wordt gebruikt.
   * @maxLength 40
   */
  buurtNaam: string;
  /**
   * Een numerieke aanduiding waarmee een Nederlandse gemeente uniek wordt aangeduid
   * @maxLength 4
   */
  gemGemeenteCode: string;
  /**
   * De code behorende bij de naam van de wijk
   * @maxLength 2
   */
  wykWijkCode: string;
}

export interface ObjectBuurtRequest {
  /**
   * De code behorende bij de naam van de buurt
   * @minLength 1
   * @maxLength 2
   */
  buurtCode: string;
  /**
   * De naam van de buurt, zoals die door het CBS wordt gebruikt.
   * @minLength 1
   * @maxLength 40
   */
  buurtNaam: string;
  /**
   * Een numerieke aanduiding waarmee een Nederlandse gemeente uniek wordt aangeduid
   * @minLength 1
   * @maxLength 4
   */
  gemGemeenteCode: string;
  /**
   * De code behorende bij de naam van de wijk
   * @minLength 1
   * @maxLength 2
   */
  wykWijkCode: string;
}

export interface ObjectGemeente {
  /**
   * De officiële door de gemeente vastgestelde gemeentenaam.
   * @maxLength 80
   */
  gemeenteNaam: string;
  /**
   * Een numerieke aanduiding waarmee een Nederlandse gemeente uniek wordt aangeduid
   * @maxLength 4
   */
  gemeenteCode: string;
}

export interface ObjectGemeenteRequest {
  /**
   * De officiële door de gemeente vastgestelde gemeentenaam.
   * @minLength 1
   * @maxLength 80
   */
  gemeenteNaam: string;
  /**
   * Een numerieke aanduiding waarmee een Nederlandse gemeente uniek wordt aangeduid
   * @minLength 1
   * @maxLength 4
   */
  gemeenteCode: string;
}

export interface ObjectGemeentelijkeOpenbareRuimte {
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @maxLength 80
   */
  openbareRuimteNaam: string;
}

export interface ObjectGemeentelijkeOpenbareRuimteRequest {
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @minLength 1
   * @maxLength 80
   */
  openbareRuimteNaam: string;
}

export interface ObjectHuishouden {
  /**
   * Uniek identificerend administratienummer van een huishouden zoals toegekend door de gemeente waarin het huishouden woonachtig is.
   * @maxLength 12
   */
  nummer: string;
  isGehuisvestIn?: ObjectTerreinGebouwdObject | null;
}

export interface ObjectHuishoudenRequest {
  /**
   * Uniek identificerend administratienummer van een huishouden zoals toegekend door de gemeente waarin het huishouden woonachtig is.
   * @minLength 1
   * @maxLength 12
   */
  nummer: string;
  isGehuisvestIn?: ObjectTerreinGebouwdObjectRequest | null;
}

export interface ObjectInrichtingselement {
  /**
   * Specificatie van de aard van het inrichtingselement.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `bak` - Bak
   * * `bord` - Bord
   * * `installatie` - Installatie
   * * `kast` - Kast
   * * `mast` - Mast
   * * `paal` - Paal
   * * `sensor` - Sensor
   * * `straatmeubilair` - Straatmeubilair
   * * `waterinrichtingselement` - Waterinrichtingselement
   * * `weginrichtingselement` - Weginrichtingselement
   */
  type: ObjectInrichtingselementTypeEnum;
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De benaming van het OBJECT
   * @maxLength 500
   */
  naam?: string;
}

export interface ObjectInrichtingselementRequest {
  /**
   * Specificatie van de aard van het inrichtingselement.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `bak` - Bak
   * * `bord` - Bord
   * * `installatie` - Installatie
   * * `kast` - Kast
   * * `mast` - Mast
   * * `paal` - Paal
   * * `sensor` - Sensor
   * * `straatmeubilair` - Straatmeubilair
   * * `waterinrichtingselement` - Waterinrichtingselement
   * * `weginrichtingselement` - Weginrichtingselement
   */
  type: ObjectInrichtingselementTypeEnum;
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De benaming van het OBJECT
   * @maxLength 500
   */
  naam?: string;
}

export enum ObjectInrichtingselementTypeEnum {
  Bak = "bak",
  Bord = "bord",
  Installatie = "installatie",
  Kast = "kast",
  Mast = "mast",
  Paal = "paal",
  Sensor = "sensor",
  Straatmeubilair = "straatmeubilair",
  Waterinrichtingselement = "waterinrichtingselement",
  Weginrichtingselement = "weginrichtingselement",
}

export interface ObjectKadastraleOnroerendeZaak {
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  kadastraleIdentificatie: string;
  /**
   * De typering van de kadastrale aanduiding van een onroerende zaak conform Kadaster
   * @maxLength 1000
   */
  kadastraleAanduiding: string;
}

export interface ObjectKadastraleOnroerendeZaakRequest {
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  kadastraleIdentificatie: string;
  /**
   * De typering van de kadastrale aanduiding van een onroerende zaak conform Kadaster
   * @minLength 1
   * @maxLength 1000
   */
  kadastraleAanduiding: string;
}

export interface ObjectKunstwerkdeel {
  /**
   * Specificatie van het soort Kunstwerk waartoe het kunstwerkdeel behoort.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `keermuur` - Keermuur
   * * `overkluizing` - Overkluizing
   * * `duiker` - Duiker
   * * `faunavoorziening` - Faunavoorziening
   * * `vispassage` - Vispassage
   * * `bodemval` - Bodemval
   * * `coupure` - Coupure
   * * `ponton` - Ponton
   * * `voorde` - Voorde
   * * `hoogspanningsmast` - Hoogspanningsmast
   * * `gemaal` - Gemaal
   * * `perron` - Perron
   * * `sluis` - Sluis
   * * `strekdam` - Strekdam
   * * `steiger` - Steiger
   * * `stuw` - Stuw
   */
  type: ObjectKunstwerkdeelTypeEnum;
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  /** @maxLength 80 */
  naam: string;
}

export interface ObjectKunstwerkdeelRequest {
  /**
   * Specificatie van het soort Kunstwerk waartoe het kunstwerkdeel behoort.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `keermuur` - Keermuur
   * * `overkluizing` - Overkluizing
   * * `duiker` - Duiker
   * * `faunavoorziening` - Faunavoorziening
   * * `vispassage` - Vispassage
   * * `bodemval` - Bodemval
   * * `coupure` - Coupure
   * * `ponton` - Ponton
   * * `voorde` - Voorde
   * * `hoogspanningsmast` - Hoogspanningsmast
   * * `gemaal` - Gemaal
   * * `perron` - Perron
   * * `sluis` - Sluis
   * * `strekdam` - Strekdam
   * * `steiger` - Steiger
   * * `stuw` - Stuw
   */
  type: ObjectKunstwerkdeelTypeEnum;
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  /**
   * @minLength 1
   * @maxLength 80
   */
  naam: string;
}

export enum ObjectKunstwerkdeelTypeEnum {
  Keermuur = "keermuur",
  Overkluizing = "overkluizing",
  Duiker = "duiker",
  Faunavoorziening = "faunavoorziening",
  Vispassage = "vispassage",
  Bodemval = "bodemval",
  Coupure = "coupure",
  Ponton = "ponton",
  Voorde = "voorde",
  Hoogspanningsmast = "hoogspanningsmast",
  Gemaal = "gemaal",
  Perron = "perron",
  Sluis = "sluis",
  Strekdam = "strekdam",
  Steiger = "steiger",
  Stuw = "stuw",
}

export interface ObjectMaatschappelijkeActiviteit {
  /**
   * Landelijk uniek identificerend administratienummer van een MAATSCHAPPELIJKE ACTIVITEIT zoals toegewezen door de Kamer van Koophandel (KvK).
   * @maxLength 8
   */
  kvkNummer: string;
  /**
   * De naam waaronder de onderneming handelt.
   * @maxLength 200
   */
  handelsnaam: string;
}

export interface ObjectMaatschappelijkeActiviteitRequest {
  /**
   * Landelijk uniek identificerend administratienummer van een MAATSCHAPPELIJKE ACTIVITEIT zoals toegewezen door de Kamer van Koophandel (KvK).
   * @minLength 1
   * @maxLength 8
   */
  kvkNummer: string;
  /**
   * De naam waaronder de onderneming handelt.
   * @minLength 1
   * @maxLength 200
   */
  handelsnaam: string;
}

export interface ObjectOpenbareRuimte {
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  /** @maxLength 80 */
  wplWoonplaatsNaam: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @maxLength 80
   */
  gorOpenbareRuimteNaam: string;
}

export interface ObjectOpenbareRuimteRequest {
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  /**
   * @minLength 1
   * @maxLength 80
   */
  wplWoonplaatsNaam: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @minLength 1
   * @maxLength 80
   */
  gorOpenbareRuimteNaam: string;
}

export interface ObjectOverige {
  overigeData: Record<string, any>;
}

export interface ObjectOverigeRequest {
  overigeData: Record<string, any>;
}

export interface ObjectPand {
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
}

export interface ObjectPandRequest {
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
}

export interface ObjectSpoorbaandeel {
  /**
   * Specificatie van het soort Spoorbaan
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `breedspoor` - Breedspoor
   * * `normaalspoor` - Normaalspoor
   * * `smalspoor` - Smalspoor
   * * `spoorbaan` - Spoorbaan
   */
  type: ObjectSpoorbaandeelTypeEnum;
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De benaming van het OBJECT
   * @maxLength 500
   */
  naam?: string;
}

export interface ObjectSpoorbaandeelRequest {
  /**
   * Specificatie van het soort Spoorbaan
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `breedspoor` - Breedspoor
   * * `normaalspoor` - Normaalspoor
   * * `smalspoor` - Smalspoor
   * * `spoorbaan` - Spoorbaan
   */
  type: ObjectSpoorbaandeelTypeEnum;
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De benaming van het OBJECT
   * @maxLength 500
   */
  naam?: string;
}

export enum ObjectSpoorbaandeelTypeEnum {
  Breedspoor = "breedspoor",
  Normaalspoor = "normaalspoor",
  Smalspoor = "smalspoor",
  Spoorbaan = "spoorbaan",
}

export interface ObjectTerreinGebouwdObject {
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  adresAanduidingGrp?: TerreinGebouwdObjectAdres | null;
}

export interface ObjectTerreinGebouwdObjectRequest {
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  adresAanduidingGrp?: TerreinGebouwdObjectAdresRequest | null;
}

export interface ObjectTerreindeel {
  /** @maxLength 40 */
  type: string;
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De benaming van het OBJECT
   * @maxLength 500
   */
  naam?: string;
}

export interface ObjectTerreindeelRequest {
  /**
   * @minLength 1
   * @maxLength 40
   */
  type: string;
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De benaming van het OBJECT
   * @maxLength 500
   */
  naam?: string;
}

export enum ObjectTypeEnum {
  Adres = "adres",
  Besluit = "besluit",
  Buurt = "buurt",
  EnkelvoudigDocument = "enkelvoudig_document",
  Gemeente = "gemeente",
  GemeentelijkeOpenbareRuimte = "gemeentelijke_openbare_ruimte",
  Huishouden = "huishouden",
  Inrichtingselement = "inrichtingselement",
  KadastraleOnroerendeZaak = "kadastrale_onroerende_zaak",
  Kunstwerkdeel = "kunstwerkdeel",
  MaatschappelijkeActiviteit = "maatschappelijke_activiteit",
  Medewerker = "medewerker",
  NatuurlijkPersoon = "natuurlijk_persoon",
  NietNatuurlijkPersoon = "niet_natuurlijk_persoon",
  OpenbareRuimte = "openbare_ruimte",
  OrganisatorischeEenheid = "organisatorische_eenheid",
  Pand = "pand",
  Spoorbaandeel = "spoorbaandeel",
  Status = "status",
  Terreindeel = "terreindeel",
  TerreinGebouwdObject = "terrein_gebouwd_object",
  Vestiging = "vestiging",
  Waterdeel = "waterdeel",
  Wegdeel = "wegdeel",
  Wijk = "wijk",
  Woonplaats = "woonplaats",
  WozDeelobject = "woz_deelobject",
  WozObject = "woz_object",
  WozWaarde = "woz_waarde",
  ZakelijkRecht = "zakelijk_recht",
  Overige = "overige",
}

export interface ObjectTypeOverigeDefinitie {
  /**
   * Objecttype-URL
   * URL-referentie naar de objecttype resource in een API. Deze resource moet de [JSON-schema](https://json-schema.org/)-definitie van het objecttype bevatten.
   * @format uri
   * @maxLength 1000
   */
  url: string;
  /**
   * schema-pad
   * Een geldige [jq](http://stedolan.github.io/jq/) expressie. Dit wordt gecombineerd met de resource uit het `url`-attribuut om het schema van het objecttype uit te lezen. Bijvoorbeeld: `.jsonSchema`.
   * @maxLength 100
   */
  schema: string;
  /**
   * objectgegevens-pad
   * Een geldige [jq](http://stedolan.github.io/jq/) expressie. Dit wordt gecombineerd met de JSON data uit de OBJECT url om de objectgegevens uit te lezen en de vorm van de gegevens tegen het schema te valideren. Bijvoorbeeld: `.record.data`.
   * @maxLength 100
   */
  objectData: string;
}

export interface ObjectTypeOverigeDefinitieRequest {
  /**
   * Objecttype-URL
   * URL-referentie naar de objecttype resource in een API. Deze resource moet de [JSON-schema](https://json-schema.org/)-definitie van het objecttype bevatten.
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  url: string;
  /**
   * schema-pad
   * Een geldige [jq](http://stedolan.github.io/jq/) expressie. Dit wordt gecombineerd met de resource uit het `url`-attribuut om het schema van het objecttype uit te lezen. Bijvoorbeeld: `.jsonSchema`.
   * @minLength 1
   * @maxLength 100
   */
  schema: string;
  /**
   * objectgegevens-pad
   * Een geldige [jq](http://stedolan.github.io/jq/) expressie. Dit wordt gecombineerd met de JSON data uit de OBJECT url om de objectgegevens uit te lezen en de vorm van de gegevens tegen het schema te valideren. Bijvoorbeeld: `.record.data`.
   * @minLength 1
   * @maxLength 100
   */
  objectData: string;
}

export interface ObjectWaterdeel {
  /**
   * Specificatie van het soort water
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `zee` - Zee
   * * `waterloop` - Waterloop
   * * `watervlakte` - Watervlakte
   * * `greppel_droge_sloot` - Greppel, droge sloot
   */
  typeWaterdeel: TypeWaterdeelEnum;
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De benaming van het OBJECT
   * @maxLength 500
   */
  naam?: string;
}

export interface ObjectWaterdeelRequest {
  /**
   * Specificatie van het soort water
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `zee` - Zee
   * * `waterloop` - Waterloop
   * * `watervlakte` - Watervlakte
   * * `greppel_droge_sloot` - Greppel, droge sloot
   */
  typeWaterdeel: TypeWaterdeelEnum;
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De benaming van het OBJECT
   * @maxLength 500
   */
  naam?: string;
}

export interface ObjectWegdeel {
  /** @maxLength 100 */
  type: string;
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De benaming van het OBJECT
   * @maxLength 500
   */
  naam?: string;
}

export interface ObjectWegdeelRequest {
  /**
   * @minLength 1
   * @maxLength 100
   */
  type: string;
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De benaming van het OBJECT
   * @maxLength 500
   */
  naam?: string;
}

export interface ObjectWijk {
  /**
   * De code behorende bij de naam van de wijk.
   * @maxLength 2
   */
  wijkCode: string;
  /**
   * De naam van de wijk, zoals die door het CBS wordt gebruikt.
   * @maxLength 40
   */
  wijkNaam: string;
  /**
   * Een numerieke aanduiding waarmee een Nederlandse gemeente uniek wordt aangeduid
   * @maxLength 4
   */
  gemGemeenteCode: string;
}

export interface ObjectWijkRequest {
  /**
   * De code behorende bij de naam van de wijk.
   * @minLength 1
   * @maxLength 2
   */
  wijkCode: string;
  /**
   * De naam van de wijk, zoals die door het CBS wordt gebruikt.
   * @minLength 1
   * @maxLength 40
   */
  wijkNaam: string;
  /**
   * Een numerieke aanduiding waarmee een Nederlandse gemeente uniek wordt aangeduid
   * @minLength 1
   * @maxLength 4
   */
  gemGemeenteCode: string;
}

export interface ObjectWoonplaats {
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De door het bevoegde gemeentelijke orgaan aan een WOONPLAATS toegekende benaming.
   * @maxLength 80
   */
  woonplaatsNaam: string;
}

export interface ObjectWoonplaatsRequest {
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  /**
   * De door het bevoegde gemeentelijke orgaan aan een WOONPLAATS toegekende benaming.
   * @minLength 1
   * @maxLength 80
   */
  woonplaatsNaam: string;
}

export interface ObjectWozDeelobject {
  /**
   * Uniek identificatienummer voor het deelobject binnen een WOZ-object.
   * @maxLength 6
   */
  nummerWozDeelObject: string;
  isOnderdeelVan?: ObjectWozObject;
}

export interface ObjectWozDeelobjectRequest {
  /**
   * Uniek identificatienummer voor het deelobject binnen een WOZ-object.
   * @minLength 1
   * @maxLength 6
   */
  nummerWozDeelObject: string;
  isOnderdeelVan?: ObjectWozObjectRequest;
}

export interface ObjectWozObject {
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  wozObjectNummer: string;
  aanduidingWozObject?: WozObjectAdres | null;
}

export interface ObjectWozObjectRequest {
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  wozObjectNummer: string;
  aanduidingWozObject?: WozObjectAdresRequest | null;
}

export interface ObjectWozWaarde {
  /**
   * De datum waarnaar de waarde van het WOZ-object wordt bepaald.
   * @maxLength 9
   */
  waardepeildatum: string;
  isVoor?: ObjectWozObject;
}

export interface ObjectWozWaardeRequest {
  /**
   * De datum waarnaar de waarde van het WOZ-object wordt bepaald.
   * @minLength 1
   * @maxLength 9
   */
  waardepeildatum: string;
  isVoor?: ObjectWozObjectRequest;
}

export interface ObjectZakelijkRecht {
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  identificatie: string;
  /**
   * aanduiding voor de aard van het recht
   * @maxLength 1000
   */
  avgAard: string;
  heeftBetrekkingOp?: ObjectKadastraleOnroerendeZaak;
  heeftAlsGerechtigde?: ZakelijkRechtHeeftAlsGerechtigde;
}

export interface ObjectZakelijkRechtRequest {
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  identificatie: string;
  /**
   * aanduiding voor de aard van het recht
   * @minLength 1
   * @maxLength 1000
   */
  avgAard: string;
  heeftBetrekkingOp?: ObjectKadastraleOnroerendeZaakRequest;
  heeftAlsGerechtigde?: ZakelijkRechtHeeftAlsGerechtigdeRequest;
}

export interface Opschorting {
  /** Aanduiding of de behandeling van de ZAAK tijdelijk is opgeschort. */
  indicatie: boolean;
  /**
   * Omschrijving van de reden voor het opschorten van de behandeling van de zaak.
   * @maxLength 200
   */
  reden: string;
}

export interface OpschortingRequest {
  /** Aanduiding of de behandeling van de ZAAK tijdelijk is opgeschort. */
  indicatie: boolean;
  /**
   * Omschrijving van de reden voor het opschorten van de behandeling van de zaak.
   * @maxLength 200
   */
  reden: string;
}

export interface PaginatedExpandZaakList {
  /** @example 123 */
  count?: number;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=4"
   */
  next?: string | null;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=2"
   */
  previous?: string | null;
  results?: ExpandZaak[];
}

export interface PaginatedKlantContactList {
  /** @example 123 */
  count?: number;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=4"
   */
  next?: string | null;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=2"
   */
  previous?: string | null;
  results?: KlantContact[];
}

export interface PaginatedResultaatList {
  /** @example 123 */
  count?: number;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=4"
   */
  next?: string | null;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=2"
   */
  previous?: string | null;
  results?: Resultaat[];
}

export interface PaginatedRolList {
  /** @example 123 */
  count?: number;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=4"
   */
  next?: string | null;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=2"
   */
  previous?: string | null;
  results?: Rol[];
}

export interface PaginatedStatusList {
  /** @example 123 */
  count?: number;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=4"
   */
  next?: string | null;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=2"
   */
  previous?: string | null;
  results?: Status[];
}

export interface PaginatedZaakList {
  /** @example 123 */
  count?: number;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=4"
   */
  next?: string | null;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=2"
   */
  previous?: string | null;
  results?: Zaak[];
}

export interface PaginatedZaakObjectList {
  /** @example 123 */
  count?: number;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=4"
   */
  next?: string | null;
  /**
   * @format uri
   * @example "http://api.example.org/accounts/?page=2"
   */
  previous?: string | null;
  results?: ZaakObject[];
}

export interface PatchedResultaatRequest {
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak?: string;
  /**
   * URL-referentie naar het RESULTAATTYPE (in de Catalogi API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  resultaattype?: string;
  /**
   * Een toelichting op wat het resultaat van de zaak inhoudt.
   * @maxLength 1000
   */
  toelichting?: string;
}

/**
 * A type of `ModelSerializer` that uses hyperlinked relationships with compound keys instead
 * of primary key relationships.  Specifically:
 *
 * * A 'url' field is included instead of the 'id' field.
 * * Relationships to other instances are hyperlinks, instead of primary keys.
 *
 * NOTE: this only works with DRF 3.1.0 and above.
 */
export interface PatchedZaakEigenschapRequest {
  /** @format uri */
  zaak?: string;
  /**
   * URL-referentie naar de EIGENSCHAP (in de Catalogi API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  eigenschap?: string;
  /** @minLength 1 */
  waarde?: string;
}

export interface PatchedZaakInformatieObjectRequest {
  /**
   * URL-referentie naar het INFORMATIEOBJECT (in de Documenten API), waar ook de relatieinformatie opgevraagd kan worden.
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  informatieobject?: string;
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak?: string;
  /**
   * De naam waaronder het INFORMATIEOBJECT binnen het OBJECT bekend is.
   * @maxLength 200
   */
  titel?: string;
  /** Een op het object gerichte beschrijving van de inhoud vanhet INFORMATIEOBJECT. */
  beschrijving?: string;
  /**
   * De datum waarop het informatieobject uit het zaakdossier verwijderd moet worden.
   * @format date-time
   */
  vernietigingsdatum?: string | null;
  /**
   * De bij de desbetreffende ZAAK behorende STATUS waarvoor het ZAAK-INFORMATIEOBJECT relevant is (geweest) met het oog op het bereiken van die STATUS en/of de communicatie daarover.
   * @format uri
   */
  status?: string | null;
}

export type PatchedZaakObjectRequest =
  | ({
      objectType: "adres";
    } & AdresZaakObjectSerializer)
  | ({
      objectType: "besluit";
    } & BesluitZaakObjectSerializer)
  | ({
      objectType: "buurt";
    } & BuurtZaakObjectSerializer)
  | ({
      objectType: "enkelvoudig_document";
    } & EnkelvoudigDocumentZaakObjectSerializer)
  | ({
      objectType: "gemeente";
    } & GemeenteZaakObjectSerializer)
  | ({
      objectType: "gemeentelijke_openbare_ruimte";
    } & GemeentelijkeOpenbareRuimteZaakObjectSerializer)
  | ({
      objectType: "huishouden";
    } & HuishoudenZaakObjectSerializer)
  | ({
      objectType: "inrichtingselement";
    } & InrichtingselementZaakObjectSerializer)
  | ({
      objectType: "kadastrale_onroerende_zaak";
    } & KadastraleOnroerendeZaakZaakObjectSerializer)
  | ({
      objectType: "kunstwerkdeel";
    } & KunstwerkdeelZaakObjectSerializer)
  | ({
      objectType: "maatschappelijke_activiteit";
    } & MaatschappelijkeActiviteitZaakObjectSerializer)
  | ({
      objectType: "medewerker";
    } & MedewerkerZaakObjectSerializer)
  | ({
      objectType: "natuurlijk_persoon";
    } & NatuurlijkPersoonZaakObjectSerializer)
  | ({
      objectType: "niet_natuurlijk_persoon";
    } & NietNatuurlijkPersoonZaakObjectSerializer)
  | ({
      objectType: "openbare_ruimte";
    } & OpenbareRuimteZaakObjectSerializer)
  | ({
      objectType: "organisatorische_eenheid";
    } & OrganisatorischeEenheidZaakObjectSerializer)
  | ({
      objectType: "pand";
    } & PandZaakObjectSerializer)
  | ({
      objectType: "spoorbaandeel";
    } & SpoorbaandeelZaakObjectSerializer)
  | ({
      objectType: "status";
    } & StatusZaakObjectSerializer)
  | ({
      objectType: "terreindeel";
    } & TerreindeelZaakObjectSerializer)
  | ({
      objectType: "terrein_gebouwd_object";
    } & TerreinGebouwdObjectZaakObjectSerializer)
  | ({
      objectType: "vestiging";
    } & VestigingZaakObjectSerializer)
  | ({
      objectType: "waterdeel";
    } & WaterdeelZaakObjectSerializer)
  | ({
      objectType: "wegdeel";
    } & WegdeelZaakObjectSerializer)
  | ({
      objectType: "wijk";
    } & WijkZaakObjectSerializer)
  | ({
      objectType: "woonplaats";
    } & WoonplaatsZaakObjectSerializer)
  | ({
      objectType: "woz_deelobject";
    } & WozDeelobjectZaakObjectSerializer)
  | ({
      objectType: "woz_object";
    } & WozObjectZaakObjectSerializer)
  | ({
      objectType: "woz_waarde";
    } & WozWaardeZaakObjectSerializer)
  | ({
      objectType: "zakelijk_recht";
    } & ZakelijkRechtZaakObjectSerializer)
  | ({
      objectType: "overige";
    } & OverigeZaakObjectSerializer);

/**
 * Set gegevensgroepdata from validated nested data.
 *
 * Usage: include the mixin on the ModelSerializer that has gegevensgroepen.
 */
export interface PatchedZaakRequest {
  /**
   * De unieke identificatie van de ZAAK binnen de organisatie die verantwoordelijk is voor de behandeling van de ZAAK.
   * @maxLength 40
   */
  identificatie?: string;
  /**
   * Het RSIN van de Niet-natuurlijk persoon zijnde de organisatie die de zaak heeft gecreeerd. Dit moet een geldig RSIN zijn van 9 nummers en voldoen aan https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef
   * @minLength 1
   * @maxLength 9
   */
  bronorganisatie?: string;
  /**
   * Een korte omschrijving van de zaak.
   * @maxLength 80
   */
  omschrijving?: string;
  /**
   * Een toelichting op de zaak.
   * @maxLength 1000
   */
  toelichting?: string;
  /**
   * URL-referentie naar het ZAAKTYPE (in de Catalogi API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  zaaktype?: string;
  /**
   * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
   * @format date
   */
  registratiedatum?: string;
  /**
   * Het RSIN van de Niet-natuurlijk persoon zijnde de organisatie die eindverantwoordelijk is voor de behandeling van de zaak. Dit moet een geldig RSIN zijn van 9 nummers en voldoen aan https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef
   * @minLength 1
   * @maxLength 9
   */
  verantwoordelijkeOrganisatie?: string;
  /**
   * De datum waarop met de uitvoering van de zaak is gestart
   * @format date
   */
  startdatum?: string;
  /**
   * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
   * @format date
   */
  einddatumGepland?: string | null;
  /**
   * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
   * @format date
   */
  uiterlijkeEinddatumAfdoening?: string | null;
  /**
   * Datum waarop (het starten van) de zaak gepubliceerd is of wordt.
   * @format date
   */
  publicatiedatum?: string | null;
  /**
   * Het medium waarlangs de aanleiding om een zaak te starten is ontvangen. URL naar een communicatiekanaal in de VNG-Referentielijst van communicatiekanalen.
   * @format uri
   * @maxLength 1000
   */
  communicatiekanaal?: string;
  /** De producten en/of diensten die door de zaak worden voortgebracht. Dit zijn URLs naar de resources zoals die door de producten- en dienstencatalogus-API wordt ontsloten. De producten/diensten moeten bij het zaaktype vermeld zijn. */
  productenOfDiensten?: string[];
  /**
   * Vertrouwlijkheidaanduiding
   * Aanduiding van de mate waarin het zaakdossier van de ZAAK voor de openbaarheid bestemd is. Optioneel - indien geen waarde gekozen wordt, dan wordt de waarde van het ZAAKTYPE overgenomen. Dit betekent dat de API _altijd_ een waarde teruggeeft.
   */
  vertrouwelijkheidaanduiding?: VertrouwelijkheidaanduidingEnum;
  /**
   * Indicatie of de, met behandeling van de zaak gemoeide, kosten betaald zijn door de desbetreffende betrokkene.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `nvt` - Er is geen sprake van te betalen, met de zaak gemoeide, kosten.
   * * `nog_niet` - De met de zaak gemoeide kosten zijn (nog) niet betaald.
   * * `gedeeltelijk` - De met de zaak gemoeide kosten zijn gedeeltelijk betaald.
   * * `geheel` - De met de zaak gemoeide kosten zijn geheel betaald.
   */
  betalingsindicatie?: BetalingsindicatieEnum | BlankEnum;
  /**
   * De datum waarop de meest recente betaling is verwerkt van kosten die gemoeid zijn met behandeling van de zaak.
   * @format date-time
   */
  laatsteBetaaldatum?: string | null;
  /** Punt, lijn of (multi-)vlak geometrie-informatie, in GeoJSON. */
  zaakgeometrie?: GeoJSONGeometry | null;
  /** Gegevens omtrent het verlengen van de doorlooptijd van de behandeling van de ZAAK */
  verlenging?: VerlengingRequest | null;
  /** Gegevens omtrent het tijdelijk opschorten van de behandeling van de ZAAK */
  opschorting?: OpschortingRequest | null;
  /**
   * URL-referentie naar de categorie in de gehanteerde 'Selectielijst Archiefbescheiden' die, gezien het zaaktype en het resultaattype van de zaak, bepalend is voor het archiefregime van de zaak.
   * @format uri
   * @maxLength 1000
   */
  selectielijstklasse?: string;
  /**
   * Is deelzaak van
   * URL-referentie naar de ZAAK, waarom verzocht is door de initiator daarvan, die behandeld wordt in twee of meer separate ZAAKen waarvan de onderhavige ZAAK er één is.
   * @format uri
   */
  hoofdzaak?: string | null;
  /** Een lijst van relevante andere zaken. */
  relevanteAndereZaken?: RelevanteZaakRequest[];
  /** Lijst van kenmerken. Merk op dat refereren naar gerelateerde objecten beter kan via `ZaakObject`. */
  kenmerken?: ZaakKenmerkRequest[];
  /**
   * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `blijvend_bewaren` - Het zaakdossier moet bewaard blijven en op de Archiefactiedatum overgedragen worden naar een archiefbewaarplaats.
   * * `vernietigen` - Het zaakdossier moet op of na de Archiefactiedatum vernietigd worden.
   */
  archiefnominatie?: ArchiefnominatieEnum | BlankEnum | NullEnum | null;
  /**
   * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `nog_te_archiveren` - De zaak cq. het zaakdossier is nog niet als geheel gearchiveerd.
   * * `gearchiveerd` - De zaak cq. het zaakdossier is als geheel niet-wijzigbaar bewaarbaar gemaakt.
   * * `gearchiveerd_procestermijn_onbekend` - De zaak cq. het zaakdossier is als geheel niet-wijzigbaar bewaarbaar gemaakt maar de vernietigingsdatum kan nog niet bepaald worden.
   * * `overgedragen` - De zaak cq. het zaakdossier is overgebracht naar een archiefbewaarplaats.
   */
  archiefstatus?: ArchiefstatusEnum;
  /**
   * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
   * @format date
   */
  archiefactiedatum?: string | null;
  /**
   * De krachtens publiekrecht ingestelde rechtspersoon dan wel ander niet-natuurlijk persoon waarbinnen het (bestuurs)orgaan zetelt dat opdracht heeft gegeven om taken uit te voeren waaraan de zaak invulling geeft.
   * @maxLength 9
   */
  opdrachtgevendeOrganisatie?: string;
  /**
   * Procesobjectaard
   * Omschrijving van het object, subject of gebeurtenis waarop, vanuit archiveringsoptiek, de zaak betrekking heeft.
   * @maxLength 200
   */
  processobjectaard?: string;
  /**
   * De datum die de start markeert van de termijn waarop het zaakdossier vernietigd moet worden.
   * @format date
   */
  startdatumBewaartermijn?: string | null;
  /** Specificatie van de attribuutsoort van het object, subject of gebeurtenis  waarop, vanuit archiveringsoptiek, de zaak betrekking heeft en dat bepalend is voor de start van de archiefactietermijn. */
  processobject?: ProcessobjectRequest | null;
}

/** GeoJSON point geometry */
export type Point = Geometry & {
  /** A 2D point */
  coordinates: Point2D;
};

/**
 * Point2D
 * A 2D point
 * @maxItems 2
 * @minItems 2
 */
export type Point2D = number[];

/** GeoJSON polygon geometry */
export type Polygon = Geometry & {
  coordinates: Point2D[][];
};

export interface Processobject {
  /**
   * De naam van de attribuutsoort van het procesobject dat bepalend is voor het einde van de procestermijn.
   * @maxLength 250
   */
  datumkenmerk: string;
  /**
   * De unieke aanduiding van het procesobject.
   * @maxLength 250
   */
  identificatie: string;
  /**
   * Het soort object dat het procesobject representeert.
   * @maxLength 250
   */
  objecttype: string;
  /**
   * De naam van de registratie waarvan het procesobject deel uit maakt.
   * @maxLength 250
   */
  registratie: string;
}

export interface ProcessobjectRequest {
  /**
   * De naam van de attribuutsoort van het procesobject dat bepalend is voor het einde van de procestermijn.
   * @minLength 1
   * @maxLength 250
   */
  datumkenmerk: string;
  /**
   * De unieke aanduiding van het procesobject.
   * @minLength 1
   * @maxLength 250
   */
  identificatie: string;
  /**
   * Het soort object dat het procesobject representeert.
   * @minLength 1
   * @maxLength 250
   */
  objecttype: string;
  /**
   * De naam van de registratie waarvan het procesobject deel uit maakt.
   * @minLength 1
   * @maxLength 250
   */
  registratie: string;
}

export interface RelevanteZaak {
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  url: string;
  /**
   * Benamingen van de aard van de relaties van andere zaken tot (onderhanden) zaken.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `vervolg` - De andere zaak gaf aanleiding tot het starten van de onderhanden zaak.
   * * `onderwerp` - De andere zaak is relevant voor cq. is onderwerp van de onderhanden zaak.
   * * `bijdrage` - Aan het bereiken van de uitkomst van de andere zaak levert de onderhanden zaak een bijdrage.
   */
  aardRelatie: AardRelatieEnum;
}

export interface RelevanteZaakRequest {
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  url: string;
  /**
   * Benamingen van de aard van de relaties van andere zaken tot (onderhanden) zaken.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `vervolg` - De andere zaak gaf aanleiding tot het starten van de onderhanden zaak.
   * * `onderwerp` - De andere zaak is relevant voor cq. is onderwerp van de onderhanden zaak.
   * * `bijdrage` - Aan het bereiken van de uitkomst van de andere zaak levert de onderhanden zaak een bijdrage.
   */
  aardRelatie: AardRelatieEnum;
}

export interface Resultaat {
  /**
   * URL-referentie naar dit object. Dit is de unieke identificatie en locatie van dit object.
   * @format uri
   */
  url?: string;
  /**
   * Unieke resource identifier (UUID4)
   * @format uuid
   */
  uuid?: string;
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * URL-referentie naar het RESULTAATTYPE (in de Catalogi API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  resultaattype: string;
  /**
   * Een toelichting op wat het resultaat van de zaak inhoudt.
   * @maxLength 1000
   */
  toelichting?: string;
}

export interface ResultaatRequest {
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * URL-referentie naar het RESULTAATTYPE (in de Catalogi API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  resultaattype: string;
  /**
   * Een toelichting op wat het resultaat van de zaak inhoudt.
   * @maxLength 1000
   */
  toelichting?: string;
}

export type Rol =
  | ({
      betrokkeneType: "natuurlijk_persoon";
    } & NatuurlijkPersoonRolSerializer)
  | ({
      betrokkeneType: "niet_natuurlijk_persoon";
    } & NietNatuurlijkPersoonRolSerializer)
  | ({
      betrokkeneType: "vestiging";
    } & VestigingRolSerializer)
  | ({
      betrokkeneType: "organisatorische_eenheid";
    } & OrganisatorischeEenheidRolSerializer)
  | ({
      betrokkeneType: "medewerker";
    } & MedewerkerRolSerializer);

export interface RolMedewerker {
  /**
   * Een korte unieke aanduiding van de MEDEWERKER.
   * @maxLength 24
   */
  identificatie?: string;
  /**
   * De achternaam zoals de MEDEWERKER die in het dagelijkse verkeer gebruikt.
   * @maxLength 200
   */
  achternaam?: string;
  /**
   * De verzameling letters die gevormd wordt door de eerste letter van alle in volgorde voorkomende voornamen.
   * @maxLength 20
   */
  voorletters?: string;
  /**
   * Dat deel van de geslachtsnaam dat voorkomt in Tabel 36 (GBA), voorvoegseltabel, en door een spatie van de geslachtsnaam is
   * @maxLength 10
   */
  voorvoegselAchternaam?: string;
}

export interface RolMedewerkerRequest {
  /**
   * Een korte unieke aanduiding van de MEDEWERKER.
   * @maxLength 24
   */
  identificatie?: string;
  /**
   * De achternaam zoals de MEDEWERKER die in het dagelijkse verkeer gebruikt.
   * @maxLength 200
   */
  achternaam?: string;
  /**
   * De verzameling letters die gevormd wordt door de eerste letter van alle in volgorde voorkomende voornamen.
   * @maxLength 20
   */
  voorletters?: string;
  /**
   * Dat deel van de geslachtsnaam dat voorkomt in Tabel 36 (GBA), voorvoegseltabel, en door een spatie van de geslachtsnaam is
   * @maxLength 10
   */
  voorvoegselAchternaam?: string;
}

export interface RolNatuurlijkPersoon {
  /**
   * Het burgerservicenummer, bedoeld in artikel 1.1 van de Wet algemene bepalingen burgerservicenummer.
   * @maxLength 9
   */
  inpBsn?: string;
  /**
   * Het door de gemeente uitgegeven unieke nummer voor een ANDER NATUURLIJK PERSOON
   * @maxLength 17
   */
  anpIdentificatie?: string;
  /**
   * Het administratienummer van de persoon, bedoeld in de Wet BRP
   * @maxLength 10
   * @pattern ^[1-9][0-9]{9}$
   */
  inpA_nummer?: string;
  /**
   * De stam van de geslachtsnaam.
   * @maxLength 200
   */
  geslachtsnaam?: string;
  /** @maxLength 80 */
  voorvoegselGeslachtsnaam?: string;
  /**
   * De verzameling letters die gevormd wordt door de eerste letter van alle in volgorde voorkomende voornamen.
   * @maxLength 20
   */
  voorletters?: string;
  /**
   * Voornamen bij de naam die de persoon wenst te voeren.
   * @maxLength 200
   */
  voornamen?: string;
  /**
   * Een aanduiding die aangeeft of de persoon een man of een vrouw is, of dat het geslacht nog onbekend is.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `m` - Man
   * * `v` - Vrouw
   * * `o` - Onbekend
   */
  geslachtsaanduiding?: GeslachtsaanduidingEnum | BlankEnum;
  /** @maxLength 18 */
  geboortedatum?: string;
  verblijfsadres?: VerblijfsAdres | null;
  subVerblijfBuitenland?: SubVerblijfBuitenland | null;
}

export interface RolNatuurlijkPersoonRequest {
  /**
   * Het burgerservicenummer, bedoeld in artikel 1.1 van de Wet algemene bepalingen burgerservicenummer.
   * @maxLength 9
   */
  inpBsn?: string;
  /**
   * Het door de gemeente uitgegeven unieke nummer voor een ANDER NATUURLIJK PERSOON
   * @maxLength 17
   */
  anpIdentificatie?: string;
  /**
   * Het administratienummer van de persoon, bedoeld in de Wet BRP
   * @maxLength 10
   * @pattern ^[1-9][0-9]{9}$
   */
  inpA_nummer?: string;
  /**
   * De stam van de geslachtsnaam.
   * @maxLength 200
   */
  geslachtsnaam?: string;
  /** @maxLength 80 */
  voorvoegselGeslachtsnaam?: string;
  /**
   * De verzameling letters die gevormd wordt door de eerste letter van alle in volgorde voorkomende voornamen.
   * @maxLength 20
   */
  voorletters?: string;
  /**
   * Voornamen bij de naam die de persoon wenst te voeren.
   * @maxLength 200
   */
  voornamen?: string;
  /**
   * Een aanduiding die aangeeft of de persoon een man of een vrouw is, of dat het geslacht nog onbekend is.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `m` - Man
   * * `v` - Vrouw
   * * `o` - Onbekend
   */
  geslachtsaanduiding?: GeslachtsaanduidingEnum | BlankEnum;
  /** @maxLength 18 */
  geboortedatum?: string;
  verblijfsadres?: VerblijfsAdresRequest | null;
  subVerblijfBuitenland?: SubVerblijfBuitenlandRequest | null;
}

export interface RolNietNatuurlijkPersoon {
  /**
   * Het door een kamer toegekend uniek nummer voor de INGESCHREVEN NIET-NATUURLIJK PERSOON
   * @maxLength 9
   */
  innNnpId?: string;
  /**
   * Het door de gemeente uitgegeven unieke nummer voor een ANDER NIET-NATUURLIJK PERSOON
   * @maxLength 17
   */
  annIdentificatie?: string;
  /**
   * Naam van de niet-natuurlijke persoon zoals deze is vastgelegd in de statuten (rechtspersoon) of in de vennootschapsovereenkomst is overeengekomen (Vennootschap onder firma of Commanditaire vennootschap).
   * @maxLength 500
   */
  statutaireNaam?: string;
  /** De juridische vorm van de NIET-NATUURLIJK PERSOON. */
  innRechtsvorm?: InnRechtsvormEnum | BlankEnum;
  /**
   * De gegevens over het adres van de NIET-NATUURLIJK PERSOON
   * @maxLength 1000
   */
  bezoekadres?: string;
  subVerblijfBuitenland?: SubVerblijfBuitenland | null;
}

export interface RolNietNatuurlijkPersoonRequest {
  /**
   * Het door een kamer toegekend uniek nummer voor de INGESCHREVEN NIET-NATUURLIJK PERSOON
   * @maxLength 9
   */
  innNnpId?: string;
  /**
   * Het door de gemeente uitgegeven unieke nummer voor een ANDER NIET-NATUURLIJK PERSOON
   * @maxLength 17
   */
  annIdentificatie?: string;
  /**
   * Naam van de niet-natuurlijke persoon zoals deze is vastgelegd in de statuten (rechtspersoon) of in de vennootschapsovereenkomst is overeengekomen (Vennootschap onder firma of Commanditaire vennootschap).
   * @maxLength 500
   */
  statutaireNaam?: string;
  /** De juridische vorm van de NIET-NATUURLIJK PERSOON. */
  innRechtsvorm?: InnRechtsvormEnum | BlankEnum;
  /**
   * De gegevens over het adres van de NIET-NATUURLIJK PERSOON
   * @maxLength 1000
   */
  bezoekadres?: string;
  subVerblijfBuitenland?: SubVerblijfBuitenlandRequest | null;
}

export interface RolOrganisatorischeEenheid {
  /**
   * Een korte identificatie van de organisatorische eenheid.
   * @maxLength 24
   */
  identificatie?: string;
  /**
   * De feitelijke naam van de organisatorische eenheid.
   * @maxLength 50
   */
  naam?: string;
  /** @maxLength 24 */
  isGehuisvestIn?: string;
}

export interface RolOrganisatorischeEenheidRequest {
  /**
   * Een korte identificatie van de organisatorische eenheid.
   * @maxLength 24
   */
  identificatie?: string;
  /**
   * De feitelijke naam van de organisatorische eenheid.
   * @maxLength 50
   */
  naam?: string;
  /** @maxLength 24 */
  isGehuisvestIn?: string;
}

export type RolRequest =
  | ({
      betrokkeneType: "natuurlijk_persoon";
    } & NatuurlijkPersoonRolSerializer)
  | ({
      betrokkeneType: "niet_natuurlijk_persoon";
    } & NietNatuurlijkPersoonRolSerializer)
  | ({
      betrokkeneType: "vestiging";
    } & VestigingRolSerializer)
  | ({
      betrokkeneType: "organisatorische_eenheid";
    } & OrganisatorischeEenheidRolSerializer)
  | ({
      betrokkeneType: "medewerker";
    } & MedewerkerRolSerializer);

export interface RolVestiging {
  /**
   * Een korte unieke aanduiding van de Vestiging.
   * @maxLength 24
   */
  vestigingsNummer?: string;
  /** De naam van de vestiging waaronder gehandeld wordt. */
  handelsnaam?: string[];
  verblijfsadres?: VerblijfsAdres | null;
  subVerblijfBuitenland?: SubVerblijfBuitenland | null;
  /**
   * Een uniek nummer gekoppeld aan de onderneming.
   * @maxLength 8
   */
  kvkNummer?: string;
}

export interface RolVestigingRequest {
  /**
   * Een korte unieke aanduiding van de Vestiging.
   * @maxLength 24
   */
  vestigingsNummer?: string;
  /** De naam van de vestiging waaronder gehandeld wordt. */
  handelsnaam?: string[];
  verblijfsadres?: VerblijfsAdresRequest | null;
  subVerblijfBuitenland?: SubVerblijfBuitenlandRequest | null;
  /**
   * Een uniek nummer gekoppeld aan de onderneming.
   * @maxLength 8
   */
  kvkNummer?: string;
}

export interface Status {
  /**
   * URL-referentie naar dit object. Dit is de unieke identificatie en locatie van dit object.
   * @format uri
   */
  url?: string;
  /**
   * Unieke resource identifier (UUID4)
   * @format uuid
   */
  uuid?: string;
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * URL-referentie naar het STATUSTYPE (in de Catalogi API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  statustype: string;
  /**
   * De datum waarop de ZAAK de status heeft verkregen.
   * @format date-time
   */
  datumStatusGezet: string;
  /**
   * Een, voor de initiator van de zaak relevante, toelichting op de status van een zaak.
   * @maxLength 1000
   */
  statustoelichting?: string;
  /** Het gegeven is afleidbaar uit de historie van de attribuutsoort Datum status gezet van van alle statussen bij de desbetreffende zaak. */
  indicatieLaatstGezetteStatus?: boolean;
  /**
   * Gezet door
   * De BETROKKENE die in zijn/haar ROL in een ZAAK heeft geregistreerd dat STATUSsen in die ZAAK bereikt zijn.
   * @format uri
   */
  gezetdoor?: string | null;
  /** URL-referenties naar ZAAKINFORMATIEOBJECTen. */
  zaakinformatieobjecten?: string[];
}

export interface StatusRequest {
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * URL-referentie naar het STATUSTYPE (in de Catalogi API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  statustype: string;
  /**
   * De datum waarop de ZAAK de status heeft verkregen.
   * @format date-time
   */
  datumStatusGezet: string;
  /**
   * Een, voor de initiator van de zaak relevante, toelichting op de status van een zaak.
   * @maxLength 1000
   */
  statustoelichting?: string;
  /**
   * Gezet door
   * De BETROKKENE die in zijn/haar ROL in een ZAAK heeft geregistreerd dat STATUSsen in die ZAAK bereikt zijn.
   * @format uri
   */
  gezetdoor?: string | null;
}

export interface SubVerblijfBuitenland {
  /**
   * De code, behorende bij de landnaam, zoals opgenomen in de Land/Gebied-tabel van de BRP.
   * @maxLength 4
   */
  lndLandcode: string;
  /**
   * De naam van het land, zoals opgenomen in de Land/Gebied-tabel van de BRP.
   * @maxLength 40
   */
  lndLandnaam: string;
  /** @maxLength 35 */
  subAdresBuitenland_1?: string;
  /** @maxLength 35 */
  subAdresBuitenland_2?: string;
  /** @maxLength 35 */
  subAdresBuitenland_3?: string;
}

export interface SubVerblijfBuitenlandRequest {
  /**
   * De code, behorende bij de landnaam, zoals opgenomen in de Land/Gebied-tabel van de BRP.
   * @minLength 1
   * @maxLength 4
   */
  lndLandcode: string;
  /**
   * De naam van het land, zoals opgenomen in de Land/Gebied-tabel van de BRP.
   * @minLength 1
   * @maxLength 40
   */
  lndLandnaam: string;
  /** @maxLength 35 */
  subAdresBuitenland_1?: string;
  /** @maxLength 35 */
  subAdresBuitenland_2?: string;
  /** @maxLength 35 */
  subAdresBuitenland_3?: string;
}

export interface TerreinGebouwdObjectAdres {
  /** @maxLength 100 */
  numIdentificatie?: string;
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  oaoIdentificatie: string;
  /** @maxLength 80 */
  wplWoonplaatsNaam: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @maxLength 80
   */
  gorOpenbareRuimteNaam: string;
  /** @maxLength 7 */
  aoaPostcode?: string;
  /**
   * @min 0
   * @max 99999
   */
  aoaHuisnummer: number;
  /** @maxLength 1 */
  aoaHuisletter?: string;
  /** @maxLength 4 */
  aoaHuisnummertoevoeging?: string;
  /** @maxLength 100 */
  ogoLocatieAanduiding?: string;
}

export interface TerreinGebouwdObjectAdresRequest {
  /** @maxLength 100 */
  numIdentificatie?: string;
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  oaoIdentificatie: string;
  /**
   * @minLength 1
   * @maxLength 80
   */
  wplWoonplaatsNaam: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @minLength 1
   * @maxLength 80
   */
  gorOpenbareRuimteNaam: string;
  /** @maxLength 7 */
  aoaPostcode?: string;
  /**
   * @min 0
   * @max 99999
   */
  aoaHuisnummer: number;
  /** @maxLength 1 */
  aoaHuisletter?: string;
  /** @maxLength 4 */
  aoaHuisnummertoevoeging?: string;
  /** @maxLength 100 */
  ogoLocatieAanduiding?: string;
}

export enum TypeWaterdeelEnum {
  Zee = "zee",
  Waterloop = "waterloop",
  Watervlakte = "watervlakte",
  GreppelDrogeSloot = "greppel_droge_sloot",
}

/** Formaat van HTTP 4xx en 5xx fouten. */
export interface ValidatieFout {
  /** URI referentie naar het type fout, bedoeld voor developers */
  type?: string;
  /** Systeemcode die het type fout aangeeft */
  code: string;
  /** Generieke titel voor het type fout */
  title: string;
  /** De HTTP status code */
  status: number;
  /** Extra informatie bij de fout, indien beschikbaar */
  detail: string;
  /** URI met referentie naar dit specifiek voorkomen van de fout. Deze kan gebruikt worden in combinatie met server logs, bijvoorbeeld. */
  instance: string;
  invalidParams: FieldValidationError[];
}

export interface VerblijfsAdres {
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  aoaIdentificatie: string;
  /** @maxLength 80 */
  wplWoonplaatsNaam: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @maxLength 80
   */
  gorOpenbareRuimteNaam: string;
  /** @maxLength 7 */
  aoaPostcode?: string;
  /**
   * @min 0
   * @max 99999
   */
  aoaHuisnummer: number;
  /** @maxLength 1 */
  aoaHuisletter?: string;
  /** @maxLength 4 */
  aoaHuisnummertoevoeging?: string;
  /** @maxLength 1000 */
  inpLocatiebeschrijving?: string;
}

export interface VerblijfsAdresRequest {
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  aoaIdentificatie: string;
  /**
   * @minLength 1
   * @maxLength 80
   */
  wplWoonplaatsNaam: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @minLength 1
   * @maxLength 80
   */
  gorOpenbareRuimteNaam: string;
  /** @maxLength 7 */
  aoaPostcode?: string;
  /**
   * @min 0
   * @max 99999
   */
  aoaHuisnummer: number;
  /** @maxLength 1 */
  aoaHuisletter?: string;
  /** @maxLength 4 */
  aoaHuisnummertoevoeging?: string;
  /** @maxLength 1000 */
  inpLocatiebeschrijving?: string;
}

export interface Verlenging {
  /**
   * Omschrijving van de reden voor het verlengen van de behandeling van de zaak.
   * @maxLength 200
   */
  reden: string;
  /** Het aantal werkbare dagen waarmee de doorlooptijd van de behandeling van de ZAAK is verlengd (of verkort) ten opzichte van de eerder gecommuniceerde doorlooptijd. */
  duur: string;
}

export interface VerlengingRequest {
  /**
   * Omschrijving van de reden voor het verlengen van de behandeling van de zaak.
   * @minLength 1
   * @maxLength 200
   */
  reden: string;
  /** Het aantal werkbare dagen waarmee de doorlooptijd van de behandeling van de ZAAK is verlengd (of verkort) ten opzichte van de eerder gecommuniceerde doorlooptijd. */
  duur: string;
}

export enum VertrouwelijkheidaanduidingEnum {
  Openbaar = "openbaar",
  BeperktOpenbaar = "beperkt_openbaar",
  Intern = "intern",
  Zaakvertrouwelijk = "zaakvertrouwelijk",
  Vertrouwelijk = "vertrouwelijk",
  Confidentieel = "confidentieel",
  Geheim = "geheim",
  ZeerGeheim = "zeer_geheim",
}

export interface Wijzigingen {
  /** Volledige JSON body van het object zoals dat bestond voordat de actie heeft plaatsgevonden. */
  oud?: Record<string, any>;
  /** Volledige JSON body van het object na de actie. */
  nieuw?: Record<string, any>;
}

export interface WozObjectAdres {
  /**
   * De unieke identificatie van het OBJECT
   * @maxLength 100
   */
  aoaIdentificatie: string;
  /** @maxLength 80 */
  wplWoonplaatsNaam: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @maxLength 80
   */
  gorOpenbareRuimteNaam: string;
  /** @maxLength 7 */
  aoaPostcode?: string;
  /**
   * @min 0
   * @max 99999
   */
  aoaHuisnummer: number;
  /** @maxLength 1 */
  aoaHuisletter?: string;
  /** @maxLength 4 */
  aoaHuisnummertoevoeging?: string;
  /** @maxLength 1000 */
  locatieOmschrijving?: string;
}

export interface WozObjectAdresRequest {
  /**
   * De unieke identificatie van het OBJECT
   * @minLength 1
   * @maxLength 100
   */
  aoaIdentificatie: string;
  /**
   * @minLength 1
   * @maxLength 80
   */
  wplWoonplaatsNaam: string;
  /**
   * Een door het bevoegde gemeentelijke orgaan aan een OPENBARE RUIMTE toegekende benaming
   * @minLength 1
   * @maxLength 80
   */
  gorOpenbareRuimteNaam: string;
  /** @maxLength 7 */
  aoaPostcode?: string;
  /**
   * @min 0
   * @max 99999
   */
  aoaHuisnummer: number;
  /** @maxLength 1 */
  aoaHuisletter?: string;
  /** @maxLength 4 */
  aoaHuisnummertoevoeging?: string;
  /** @maxLength 1000 */
  locatieOmschrijving?: string;
}

/**
 * Set gegevensgroepdata from validated nested data.
 *
 * Usage: include the mixin on the ModelSerializer that has gegevensgroepen.
 */
export interface Zaak {
  /**
   * URL-referentie naar dit object. Dit is de unieke identificatie en locatie van dit object.
   * @format uri
   */
  url?: string;
  /**
   * Unieke resource identifier (UUID4)
   * @format uuid
   */
  uuid?: string;
  /**
   * De unieke identificatie van de ZAAK binnen de organisatie die verantwoordelijk is voor de behandeling van de ZAAK.
   * @maxLength 40
   */
  identificatie?: string;
  /**
   * Het RSIN van de Niet-natuurlijk persoon zijnde de organisatie die de zaak heeft gecreeerd. Dit moet een geldig RSIN zijn van 9 nummers en voldoen aan https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef
   * @maxLength 9
   */
  bronorganisatie: string;
  /**
   * Een korte omschrijving van de zaak.
   * @maxLength 80
   */
  omschrijving?: string;
  /**
   * Een toelichting op de zaak.
   * @maxLength 1000
   */
  toelichting?: string;
  /**
   * URL-referentie naar het ZAAKTYPE (in de Catalogi API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  zaaktype: string;
  /**
   * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
   * @format date
   */
  registratiedatum?: string;
  /**
   * Het RSIN van de Niet-natuurlijk persoon zijnde de organisatie die eindverantwoordelijk is voor de behandeling van de zaak. Dit moet een geldig RSIN zijn van 9 nummers en voldoen aan https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef
   * @maxLength 9
   */
  verantwoordelijkeOrganisatie: string;
  /**
   * De datum waarop met de uitvoering van de zaak is gestart
   * @format date
   */
  startdatum: string;
  /**
   * De datum waarop de uitvoering van de zaak afgerond is.
   * @format date
   */
  einddatum?: string | null;
  /**
   * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
   * @format date
   */
  einddatumGepland?: string | null;
  /**
   * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
   * @format date
   */
  uiterlijkeEinddatumAfdoening?: string | null;
  /**
   * Datum waarop (het starten van) de zaak gepubliceerd is of wordt.
   * @format date
   */
  publicatiedatum?: string | null;
  /**
   * Het medium waarlangs de aanleiding om een zaak te starten is ontvangen. URL naar een communicatiekanaal in de VNG-Referentielijst van communicatiekanalen.
   * @format uri
   * @maxLength 1000
   */
  communicatiekanaal?: string;
  /** De producten en/of diensten die door de zaak worden voortgebracht. Dit zijn URLs naar de resources zoals die door de producten- en dienstencatalogus-API wordt ontsloten. De producten/diensten moeten bij het zaaktype vermeld zijn. */
  productenOfDiensten?: string[];
  /**
   * Vertrouwlijkheidaanduiding
   * Aanduiding van de mate waarin het zaakdossier van de ZAAK voor de openbaarheid bestemd is. Optioneel - indien geen waarde gekozen wordt, dan wordt de waarde van het ZAAKTYPE overgenomen. Dit betekent dat de API _altijd_ een waarde teruggeeft.
   */
  vertrouwelijkheidaanduiding?: VertrouwelijkheidaanduidingEnum;
  /**
   * Indicatie of de, met behandeling van de zaak gemoeide, kosten betaald zijn door de desbetreffende betrokkene.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `nvt` - Er is geen sprake van te betalen, met de zaak gemoeide, kosten.
   * * `nog_niet` - De met de zaak gemoeide kosten zijn (nog) niet betaald.
   * * `gedeeltelijk` - De met de zaak gemoeide kosten zijn gedeeltelijk betaald.
   * * `geheel` - De met de zaak gemoeide kosten zijn geheel betaald.
   */
  betalingsindicatie?: BetalingsindicatieEnum | BlankEnum;
  /** Uitleg bij `betalingsindicatie`. */
  betalingsindicatieWeergave?: string;
  /**
   * De datum waarop de meest recente betaling is verwerkt van kosten die gemoeid zijn met behandeling van de zaak.
   * @format date-time
   */
  laatsteBetaaldatum?: string | null;
  /** Punt, lijn of (multi-)vlak geometrie-informatie, in GeoJSON. */
  zaakgeometrie?: GeoJSONGeometry | null;
  /** Gegevens omtrent het verlengen van de doorlooptijd van de behandeling van de ZAAK */
  verlenging?: Verlenging | null;
  /** Gegevens omtrent het tijdelijk opschorten van de behandeling van de ZAAK */
  opschorting?: Opschorting | null;
  /**
   * URL-referentie naar de categorie in de gehanteerde 'Selectielijst Archiefbescheiden' die, gezien het zaaktype en het resultaattype van de zaak, bepalend is voor het archiefregime van de zaak.
   * @format uri
   * @maxLength 1000
   */
  selectielijstklasse?: string;
  /**
   * Is deelzaak van
   * URL-referentie naar de ZAAK, waarom verzocht is door de initiator daarvan, die behandeld wordt in twee of meer separate ZAAKen waarvan de onderhavige ZAAK er één is.
   * @format uri
   */
  hoofdzaak?: string | null;
  /** URL-referenties naar deel ZAAKen. */
  deelzaken?: string[];
  /** Een lijst van relevante andere zaken. */
  relevanteAndereZaken?: RelevanteZaak[];
  /** URL-referenties naar ZAAK-EIGENSCHAPPen. */
  eigenschappen?: string[];
  /** URL-referenties naar ROLLen. */
  rollen?: string[];
  /**
   * Indien geen status bekend is, dan is de waarde 'null'
   * @format uri
   */
  status?: string | null;
  /** URL-referenties naar ZAAKINFORMATIEOBJECTen. */
  zaakinformatieobjecten?: string[];
  /** URL-referenties naar ZAAKOBJECTen. */
  zaakobjecten?: string[];
  /** Lijst van kenmerken. Merk op dat refereren naar gerelateerde objecten beter kan via `ZaakObject`. */
  kenmerken?: ZaakKenmerk[];
  /**
   * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `blijvend_bewaren` - Het zaakdossier moet bewaard blijven en op de Archiefactiedatum overgedragen worden naar een archiefbewaarplaats.
   * * `vernietigen` - Het zaakdossier moet op of na de Archiefactiedatum vernietigd worden.
   */
  archiefnominatie?: ArchiefnominatieEnum | BlankEnum | NullEnum | null;
  /**
   * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `nog_te_archiveren` - De zaak cq. het zaakdossier is nog niet als geheel gearchiveerd.
   * * `gearchiveerd` - De zaak cq. het zaakdossier is als geheel niet-wijzigbaar bewaarbaar gemaakt.
   * * `gearchiveerd_procestermijn_onbekend` - De zaak cq. het zaakdossier is als geheel niet-wijzigbaar bewaarbaar gemaakt maar de vernietigingsdatum kan nog niet bepaald worden.
   * * `overgedragen` - De zaak cq. het zaakdossier is overgebracht naar een archiefbewaarplaats.
   */
  archiefstatus?: ArchiefstatusEnum;
  /**
   * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
   * @format date
   */
  archiefactiedatum?: string | null;
  /**
   * URL-referentie naar het RESULTAAT. Indien geen resultaat bekend is, dan is de waarde 'null'
   * @format uri
   */
  resultaat?: string | null;
  /**
   * De krachtens publiekrecht ingestelde rechtspersoon dan wel ander niet-natuurlijk persoon waarbinnen het (bestuurs)orgaan zetelt dat opdracht heeft gegeven om taken uit te voeren waaraan de zaak invulling geeft.
   * @maxLength 9
   */
  opdrachtgevendeOrganisatie?: string;
  /**
   * Procesobjectaard
   * Omschrijving van het object, subject of gebeurtenis waarop, vanuit archiveringsoptiek, de zaak betrekking heeft.
   * @maxLength 200
   */
  processobjectaard?: string;
  /**
   * De datum die de start markeert van de termijn waarop het zaakdossier vernietigd moet worden.
   * @format date
   */
  startdatumBewaartermijn?: string | null;
  /** Specificatie van de attribuutsoort van het object, subject of gebeurtenis  waarop, vanuit archiveringsoptiek, de zaak betrekking heeft en dat bepalend is voor de start van de archiefactietermijn. */
  processobject?: Processobject | null;

  _expand: {
    zaaktype: Expand;
    resultaat: Expand;
  };
}

export type Expand = {
  [index: string]: Record<string, unknown | Expand[string]>;
};

/** Serializer the reverse relation between Besluit-Zaak. */
export interface ZaakBesluit {
  /** @format uri */
  url?: string;
  /**
   * Unieke resource identifier (UUID4)
   * @format uuid
   */
  uuid?: string;
  /**
   * URL-referentie naar het BESLUIT (in de Besluiten API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  besluit: string;
}

/** Serializer the reverse relation between Besluit-Zaak. */
export interface ZaakBesluitRequest {
  /**
   * URL-referentie naar het BESLUIT (in de Besluiten API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  besluit: string;
}

export interface ZaakContactMoment {
  /**
   * URL-referentie naar dit object. Dit is de unieke identificatie en locatie van dit object.
   * @format uri
   */
  url?: string;
  /**
   * Unieke resource identifier (UUID4)
   * @format uuid
   */
  uuid?: string;
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * URL-referentie naar het CONTACTMOMENT (in de CMC API)
   * @format uri
   * @maxLength 1000
   */
  contactmoment: string;
}

export interface ZaakContactMomentRequest {
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * URL-referentie naar het CONTACTMOMENT (in de CMC API)
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  contactmoment: string;
}

/**
 * A type of `ModelSerializer` that uses hyperlinked relationships with compound keys instead
 * of primary key relationships.  Specifically:
 *
 * * A 'url' field is included instead of the 'id' field.
 * * Relationships to other instances are hyperlinks, instead of primary keys.
 *
 * NOTE: this only works with DRF 3.1.0 and above.
 */
export interface ZaakEigenschap {
  /** @format uri */
  url?: string;
  /**
   * Unieke resource identifier (UUID4)
   * @format uuid
   */
  uuid?: string;
  /** @format uri */
  zaak: string;
  /**
   * URL-referentie naar de EIGENSCHAP (in de Catalogi API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  eigenschap: string;
  /** De naam van de EIGENSCHAP (overgenomen uit de Catalogi API). */
  naam?: string;
  waarde: string;
}

/**
 * A type of `ModelSerializer` that uses hyperlinked relationships with compound keys instead
 * of primary key relationships.  Specifically:
 *
 * * A 'url' field is included instead of the 'id' field.
 * * Relationships to other instances are hyperlinks, instead of primary keys.
 *
 * NOTE: this only works with DRF 3.1.0 and above.
 */
export interface ZaakEigenschapRequest {
  /** @format uri */
  zaak: string;
  /**
   * URL-referentie naar de EIGENSCHAP (in de Catalogi API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  eigenschap: string;
  /** @minLength 1 */
  waarde: string;
}

export interface ZaakInformatieObject {
  /**
   * URL-referentie naar dit object. Dit is de unieke identificatie en locatie van dit object.
   * @format uri
   */
  url?: string;
  /**
   * Unieke resource identifier (UUID4)
   * @format uuid
   */
  uuid?: string;
  /**
   * URL-referentie naar het INFORMATIEOBJECT (in de Documenten API), waar ook de relatieinformatie opgevraagd kan worden.
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  informatieobject: string;
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  aardRelatieWeergave?: AardRelatieWeergaveEnum;
  /**
   * De naam waaronder het INFORMATIEOBJECT binnen het OBJECT bekend is.
   * @maxLength 200
   */
  titel?: string;
  /** Een op het object gerichte beschrijving van de inhoud vanhet INFORMATIEOBJECT. */
  beschrijving?: string;
  /**
   * De datum waarop de behandelende organisatie het INFORMATIEOBJECT heeft geregistreerd bij het OBJECT. Geldige waardes zijn datumtijden gelegen op of voor de huidige datum en tijd.
   * @format date-time
   */
  registratiedatum?: string;
  /**
   * De datum waarop het informatieobject uit het zaakdossier verwijderd moet worden.
   * @format date-time
   */
  vernietigingsdatum?: string | null;
  /**
   * De bij de desbetreffende ZAAK behorende STATUS waarvoor het ZAAK-INFORMATIEOBJECT relevant is (geweest) met het oog op het bereiken van die STATUS en/of de communicatie daarover.
   * @format uri
   */
  status?: string | null;
}

export interface ZaakInformatieObjectRequest {
  /**
   * URL-referentie naar het INFORMATIEOBJECT (in de Documenten API), waar ook de relatieinformatie opgevraagd kan worden.
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  informatieobject: string;
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * De naam waaronder het INFORMATIEOBJECT binnen het OBJECT bekend is.
   * @maxLength 200
   */
  titel?: string;
  /** Een op het object gerichte beschrijving van de inhoud vanhet INFORMATIEOBJECT. */
  beschrijving?: string;
  /**
   * De datum waarop het informatieobject uit het zaakdossier verwijderd moet worden.
   * @format date-time
   */
  vernietigingsdatum?: string | null;
  /**
   * De bij de desbetreffende ZAAK behorende STATUS waarvoor het ZAAK-INFORMATIEOBJECT relevant is (geweest) met het oog op het bereiken van die STATUS en/of de communicatie daarover.
   * @format uri
   */
  status?: string | null;
}

export interface ZaakKenmerk {
  /**
   * Identificeert uniek de zaak in een andere administratie.
   * @maxLength 40
   */
  kenmerk: string;
  /**
   * De aanduiding van de administratie waar het kenmerk op slaat.
   * @maxLength 40
   */
  bron: string;
}

export interface ZaakKenmerkRequest {
  /**
   * Identificeert uniek de zaak in een andere administratie.
   * @minLength 1
   * @maxLength 40
   */
  kenmerk: string;
  /**
   * De aanduiding van de administratie waar het kenmerk op slaat.
   * @minLength 1
   * @maxLength 40
   */
  bron: string;
}

export type ZaakObject =
  | ({
      objectType: "adres";
    } & AdresZaakObjectSerializer)
  | ({
      objectType: "besluit";
    } & BesluitZaakObjectSerializer)
  | ({
      objectType: "buurt";
    } & BuurtZaakObjectSerializer)
  | ({
      objectType: "enkelvoudig_document";
    } & EnkelvoudigDocumentZaakObjectSerializer)
  | ({
      objectType: "gemeente";
    } & GemeenteZaakObjectSerializer)
  | ({
      objectType: "gemeentelijke_openbare_ruimte";
    } & GemeentelijkeOpenbareRuimteZaakObjectSerializer)
  | ({
      objectType: "huishouden";
    } & HuishoudenZaakObjectSerializer)
  | ({
      objectType: "inrichtingselement";
    } & InrichtingselementZaakObjectSerializer)
  | ({
      objectType: "kadastrale_onroerende_zaak";
    } & KadastraleOnroerendeZaakZaakObjectSerializer)
  | ({
      objectType: "kunstwerkdeel";
    } & KunstwerkdeelZaakObjectSerializer)
  | ({
      objectType: "maatschappelijke_activiteit";
    } & MaatschappelijkeActiviteitZaakObjectSerializer)
  | ({
      objectType: "medewerker";
    } & MedewerkerZaakObjectSerializer)
  | ({
      objectType: "natuurlijk_persoon";
    } & NatuurlijkPersoonZaakObjectSerializer)
  | ({
      objectType: "niet_natuurlijk_persoon";
    } & NietNatuurlijkPersoonZaakObjectSerializer)
  | ({
      objectType: "openbare_ruimte";
    } & OpenbareRuimteZaakObjectSerializer)
  | ({
      objectType: "organisatorische_eenheid";
    } & OrganisatorischeEenheidZaakObjectSerializer)
  | ({
      objectType: "pand";
    } & PandZaakObjectSerializer)
  | ({
      objectType: "spoorbaandeel";
    } & SpoorbaandeelZaakObjectSerializer)
  | ({
      objectType: "status";
    } & StatusZaakObjectSerializer)
  | ({
      objectType: "terreindeel";
    } & TerreindeelZaakObjectSerializer)
  | ({
      objectType: "terrein_gebouwd_object";
    } & TerreinGebouwdObjectZaakObjectSerializer)
  | ({
      objectType: "vestiging";
    } & VestigingZaakObjectSerializer)
  | ({
      objectType: "waterdeel";
    } & WaterdeelZaakObjectSerializer)
  | ({
      objectType: "wegdeel";
    } & WegdeelZaakObjectSerializer)
  | ({
      objectType: "wijk";
    } & WijkZaakObjectSerializer)
  | ({
      objectType: "woonplaats";
    } & WoonplaatsZaakObjectSerializer)
  | ({
      objectType: "woz_deelobject";
    } & WozDeelobjectZaakObjectSerializer)
  | ({
      objectType: "woz_object";
    } & WozObjectZaakObjectSerializer)
  | ({
      objectType: "woz_waarde";
    } & WozWaardeZaakObjectSerializer)
  | ({
      objectType: "zakelijk_recht";
    } & ZakelijkRechtZaakObjectSerializer)
  | ({
      objectType: "overige";
    } & OverigeZaakObjectSerializer);

export type ZaakObjectRequest =
  | ({
      objectType: "adres";
    } & AdresZaakObjectSerializer)
  | ({
      objectType: "besluit";
    } & BesluitZaakObjectSerializer)
  | ({
      objectType: "buurt";
    } & BuurtZaakObjectSerializer)
  | ({
      objectType: "enkelvoudig_document";
    } & EnkelvoudigDocumentZaakObjectSerializer)
  | ({
      objectType: "gemeente";
    } & GemeenteZaakObjectSerializer)
  | ({
      objectType: "gemeentelijke_openbare_ruimte";
    } & GemeentelijkeOpenbareRuimteZaakObjectSerializer)
  | ({
      objectType: "huishouden";
    } & HuishoudenZaakObjectSerializer)
  | ({
      objectType: "inrichtingselement";
    } & InrichtingselementZaakObjectSerializer)
  | ({
      objectType: "kadastrale_onroerende_zaak";
    } & KadastraleOnroerendeZaakZaakObjectSerializer)
  | ({
      objectType: "kunstwerkdeel";
    } & KunstwerkdeelZaakObjectSerializer)
  | ({
      objectType: "maatschappelijke_activiteit";
    } & MaatschappelijkeActiviteitZaakObjectSerializer)
  | ({
      objectType: "medewerker";
    } & MedewerkerZaakObjectSerializer)
  | ({
      objectType: "natuurlijk_persoon";
    } & NatuurlijkPersoonZaakObjectSerializer)
  | ({
      objectType: "niet_natuurlijk_persoon";
    } & NietNatuurlijkPersoonZaakObjectSerializer)
  | ({
      objectType: "openbare_ruimte";
    } & OpenbareRuimteZaakObjectSerializer)
  | ({
      objectType: "organisatorische_eenheid";
    } & OrganisatorischeEenheidZaakObjectSerializer)
  | ({
      objectType: "pand";
    } & PandZaakObjectSerializer)
  | ({
      objectType: "spoorbaandeel";
    } & SpoorbaandeelZaakObjectSerializer)
  | ({
      objectType: "status";
    } & StatusZaakObjectSerializer)
  | ({
      objectType: "terreindeel";
    } & TerreindeelZaakObjectSerializer)
  | ({
      objectType: "terrein_gebouwd_object";
    } & TerreinGebouwdObjectZaakObjectSerializer)
  | ({
      objectType: "vestiging";
    } & VestigingZaakObjectSerializer)
  | ({
      objectType: "waterdeel";
    } & WaterdeelZaakObjectSerializer)
  | ({
      objectType: "wegdeel";
    } & WegdeelZaakObjectSerializer)
  | ({
      objectType: "wijk";
    } & WijkZaakObjectSerializer)
  | ({
      objectType: "woonplaats";
    } & WoonplaatsZaakObjectSerializer)
  | ({
      objectType: "woz_deelobject";
    } & WozDeelobjectZaakObjectSerializer)
  | ({
      objectType: "woz_object";
    } & WozObjectZaakObjectSerializer)
  | ({
      objectType: "woz_waarde";
    } & WozWaardeZaakObjectSerializer)
  | ({
      objectType: "zakelijk_recht";
    } & ZakelijkRechtZaakObjectSerializer)
  | ({
      objectType: "overige";
    } & OverigeZaakObjectSerializer);

/**
 * Set gegevensgroepdata from validated nested data.
 *
 * Usage: include the mixin on the ModelSerializer that has gegevensgroepen.
 */
export interface ZaakRequest {
  /**
   * De unieke identificatie van de ZAAK binnen de organisatie die verantwoordelijk is voor de behandeling van de ZAAK.
   * @maxLength 40
   */
  identificatie?: string;
  /**
   * Het RSIN van de Niet-natuurlijk persoon zijnde de organisatie die de zaak heeft gecreeerd. Dit moet een geldig RSIN zijn van 9 nummers en voldoen aan https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef
   * @minLength 1
   * @maxLength 9
   */
  bronorganisatie: string;
  /**
   * Een korte omschrijving van de zaak.
   * @maxLength 80
   */
  omschrijving?: string;
  /**
   * Een toelichting op de zaak.
   * @maxLength 1000
   */
  toelichting?: string;
  /**
   * URL-referentie naar het ZAAKTYPE (in de Catalogi API).
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  zaaktype: string;
  /**
   * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
   * @format date
   */
  registratiedatum?: string;
  /**
   * Het RSIN van de Niet-natuurlijk persoon zijnde de organisatie die eindverantwoordelijk is voor de behandeling van de zaak. Dit moet een geldig RSIN zijn van 9 nummers en voldoen aan https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef
   * @minLength 1
   * @maxLength 9
   */
  verantwoordelijkeOrganisatie: string;
  /**
   * De datum waarop met de uitvoering van de zaak is gestart
   * @format date
   */
  startdatum: string;
  /**
   * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
   * @format date
   */
  einddatumGepland?: string | null;
  /**
   * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
   * @format date
   */
  uiterlijkeEinddatumAfdoening?: string | null;
  /**
   * Datum waarop (het starten van) de zaak gepubliceerd is of wordt.
   * @format date
   */
  publicatiedatum?: string | null;
  /**
   * Het medium waarlangs de aanleiding om een zaak te starten is ontvangen. URL naar een communicatiekanaal in de VNG-Referentielijst van communicatiekanalen.
   * @format uri
   * @maxLength 1000
   */
  communicatiekanaal?: string;
  /** De producten en/of diensten die door de zaak worden voortgebracht. Dit zijn URLs naar de resources zoals die door de producten- en dienstencatalogus-API wordt ontsloten. De producten/diensten moeten bij het zaaktype vermeld zijn. */
  productenOfDiensten?: string[];
  /**
   * Vertrouwlijkheidaanduiding
   * Aanduiding van de mate waarin het zaakdossier van de ZAAK voor de openbaarheid bestemd is. Optioneel - indien geen waarde gekozen wordt, dan wordt de waarde van het ZAAKTYPE overgenomen. Dit betekent dat de API _altijd_ een waarde teruggeeft.
   */
  vertrouwelijkheidaanduiding?: VertrouwelijkheidaanduidingEnum;
  /**
   * Indicatie of de, met behandeling van de zaak gemoeide, kosten betaald zijn door de desbetreffende betrokkene.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `nvt` - Er is geen sprake van te betalen, met de zaak gemoeide, kosten.
   * * `nog_niet` - De met de zaak gemoeide kosten zijn (nog) niet betaald.
   * * `gedeeltelijk` - De met de zaak gemoeide kosten zijn gedeeltelijk betaald.
   * * `geheel` - De met de zaak gemoeide kosten zijn geheel betaald.
   */
  betalingsindicatie?: BetalingsindicatieEnum | BlankEnum;
  /**
   * De datum waarop de meest recente betaling is verwerkt van kosten die gemoeid zijn met behandeling van de zaak.
   * @format date-time
   */
  laatsteBetaaldatum?: string | null;
  /** Punt, lijn of (multi-)vlak geometrie-informatie, in GeoJSON. */
  zaakgeometrie?: GeoJSONGeometry | null;
  /** Gegevens omtrent het verlengen van de doorlooptijd van de behandeling van de ZAAK */
  verlenging?: VerlengingRequest | null;
  /** Gegevens omtrent het tijdelijk opschorten van de behandeling van de ZAAK */
  opschorting?: OpschortingRequest | null;
  /**
   * URL-referentie naar de categorie in de gehanteerde 'Selectielijst Archiefbescheiden' die, gezien het zaaktype en het resultaattype van de zaak, bepalend is voor het archiefregime van de zaak.
   * @format uri
   * @maxLength 1000
   */
  selectielijstklasse?: string;
  /**
   * Is deelzaak van
   * URL-referentie naar de ZAAK, waarom verzocht is door de initiator daarvan, die behandeld wordt in twee of meer separate ZAAKen waarvan de onderhavige ZAAK er één is.
   * @format uri
   */
  hoofdzaak?: string | null;
  /** Een lijst van relevante andere zaken. */
  relevanteAndereZaken?: RelevanteZaakRequest[];
  /** Lijst van kenmerken. Merk op dat refereren naar gerelateerde objecten beter kan via `ZaakObject`. */
  kenmerken?: ZaakKenmerkRequest[];
  /**
   * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `blijvend_bewaren` - Het zaakdossier moet bewaard blijven en op de Archiefactiedatum overgedragen worden naar een archiefbewaarplaats.
   * * `vernietigen` - Het zaakdossier moet op of na de Archiefactiedatum vernietigd worden.
   */
  archiefnominatie?: ArchiefnominatieEnum | BlankEnum | NullEnum | null;
  /**
   * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
   *
   * Uitleg bij mogelijke waarden:
   *
   * * `nog_te_archiveren` - De zaak cq. het zaakdossier is nog niet als geheel gearchiveerd.
   * * `gearchiveerd` - De zaak cq. het zaakdossier is als geheel niet-wijzigbaar bewaarbaar gemaakt.
   * * `gearchiveerd_procestermijn_onbekend` - De zaak cq. het zaakdossier is als geheel niet-wijzigbaar bewaarbaar gemaakt maar de vernietigingsdatum kan nog niet bepaald worden.
   * * `overgedragen` - De zaak cq. het zaakdossier is overgebracht naar een archiefbewaarplaats.
   */
  archiefstatus?: ArchiefstatusEnum;
  /**
   * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
   * @format date
   */
  archiefactiedatum?: string | null;
  /**
   * De krachtens publiekrecht ingestelde rechtspersoon dan wel ander niet-natuurlijk persoon waarbinnen het (bestuurs)orgaan zetelt dat opdracht heeft gegeven om taken uit te voeren waaraan de zaak invulling geeft.
   * @maxLength 9
   */
  opdrachtgevendeOrganisatie?: string;
  /**
   * Procesobjectaard
   * Omschrijving van het object, subject of gebeurtenis waarop, vanuit archiveringsoptiek, de zaak betrekking heeft.
   * @maxLength 200
   */
  processobjectaard?: string;
  /**
   * De datum die de start markeert van de termijn waarop het zaakdossier vernietigd moet worden.
   * @format date
   */
  startdatumBewaartermijn?: string | null;
  /** Specificatie van de attribuutsoort van het object, subject of gebeurtenis  waarop, vanuit archiveringsoptiek, de zaak betrekking heeft en dat bepalend is voor de start van de archiefactietermijn. */
  processobject?: ProcessobjectRequest | null;
}

export interface ZaakVerzoek {
  /**
   * URL-referentie naar dit object. Dit is de unieke identificatie en locatie van dit object.
   * @format uri
   */
  url?: string;
  /**
   * Unieke resource identifier (UUID4)
   * @format uuid
   */
  uuid?: string;
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * URL-referentie naar het VERZOEK (in de Klantinteractie API)
   * @format uri
   * @maxLength 1000
   */
  verzoek: string;
}

export interface ZaakVerzoekRequest {
  /**
   * URL-referentie naar de ZAAK.
   * @format uri
   */
  zaak: string;
  /**
   * URL-referentie naar het VERZOEK (in de Klantinteractie API)
   * @format uri
   * @minLength 1
   * @maxLength 1000
   */
  verzoek: string;
}

export interface ZakelijkRechtHeeftAlsGerechtigde {
  natuurlijkPersoon?: RolNatuurlijkPersoon;
  nietNatuurlijkPersoon?: RolNietNatuurlijkPersoon;
}

export interface ZakelijkRechtHeeftAlsGerechtigdeRequest {
  natuurlijkPersoon?: RolNatuurlijkPersoonRequest;
  nietNatuurlijkPersoon?: RolNietNatuurlijkPersoonRequest;
}

export type AdresZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectAdres;

export type BesluitZaakObjectSerializer = BaseZaakObjectSerializer;

export interface BetrokkeneIdentificatieRolMedewerker {
  betrokkeneIdentificatie?: RolMedewerker;
}

export interface BetrokkeneIdentificatieRolMedewerkerRequest {
  betrokkeneIdentificatie?: RolMedewerkerRequest;
}

export interface BetrokkeneIdentificatieRolNatuurlijkPersoon {
  betrokkeneIdentificatie?: RolNatuurlijkPersoon;
}

export interface BetrokkeneIdentificatieRolNatuurlijkPersoonRequest {
  betrokkeneIdentificatie?: RolNatuurlijkPersoonRequest;
}

export interface BetrokkeneIdentificatieRolNietNatuurlijkPersoon {
  betrokkeneIdentificatie?: RolNietNatuurlijkPersoon;
}

export interface BetrokkeneIdentificatieRolNietNatuurlijkPersoonRequest {
  betrokkeneIdentificatie?: RolNietNatuurlijkPersoonRequest;
}

export interface BetrokkeneIdentificatieRolOrganisatorischeEenheid {
  betrokkeneIdentificatie?: RolOrganisatorischeEenheid;
}

export interface BetrokkeneIdentificatieRolOrganisatorischeEenheidRequest {
  betrokkeneIdentificatie?: RolOrganisatorischeEenheidRequest;
}

export interface BetrokkeneIdentificatieRolVestiging {
  betrokkeneIdentificatie?: RolVestiging;
}

export interface BetrokkeneIdentificatieRolVestigingRequest {
  betrokkeneIdentificatie?: RolVestigingRequest;
}

export type BuurtZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectBuurt;

export type EnkelvoudigDocumentZaakObjectSerializer = BaseZaakObjectSerializer;

export type GemeenteZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectGemeente;

export type GemeentelijkeOpenbareRuimteZaakObjectSerializer =
  BaseZaakObjectSerializer &
    ObjectIdentificatieObjectGemeentelijkeOpenbareRuimte;

export type HuishoudenZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectHuishouden;

export type InrichtingselementZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectInrichtingselement;

export type KadastraleOnroerendeZaakZaakObjectSerializer =
  BaseZaakObjectSerializer & ObjectIdentificatieObjectKadastraleOnroerendeZaak;

export type KunstwerkdeelZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectKunstwerkdeel;

export type MaatschappelijkeActiviteitZaakObjectSerializer =
  BaseZaakObjectSerializer &
    ObjectIdentificatieObjectMaatschappelijkeActiviteit;

export type MedewerkerRolSerializer = BaseRolSerializer &
  BetrokkeneIdentificatieRolMedewerker;

export type MedewerkerZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieRolMedewerker;

export type NatuurlijkPersoonRolSerializer = BaseRolSerializer &
  BetrokkeneIdentificatieRolNatuurlijkPersoon;

export type NatuurlijkPersoonZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieRolNatuurlijkPersoon;

export type NietNatuurlijkPersoonRolSerializer = BaseRolSerializer &
  BetrokkeneIdentificatieRolNietNatuurlijkPersoon;

export type NietNatuurlijkPersoonZaakObjectSerializer =
  BaseZaakObjectSerializer & ObjectIdentificatieRolNietNatuurlijkPersoon;

export interface ObjectIdentificatieObjectAdres {
  objectIdentificatie?: ObjectAdres;
}

export interface ObjectIdentificatieObjectAdresRequest {
  objectIdentificatie?: ObjectAdresRequest;
}

export interface ObjectIdentificatieObjectBuurt {
  objectIdentificatie?: ObjectBuurt;
}

export interface ObjectIdentificatieObjectBuurtRequest {
  objectIdentificatie?: ObjectBuurtRequest;
}

export interface ObjectIdentificatieObjectGemeente {
  objectIdentificatie?: ObjectGemeente;
}

export interface ObjectIdentificatieObjectGemeenteRequest {
  objectIdentificatie?: ObjectGemeenteRequest;
}

export interface ObjectIdentificatieObjectGemeentelijkeOpenbareRuimte {
  objectIdentificatie?: ObjectGemeentelijkeOpenbareRuimte;
}

export interface ObjectIdentificatieObjectGemeentelijkeOpenbareRuimteRequest {
  objectIdentificatie?: ObjectGemeentelijkeOpenbareRuimteRequest;
}

export interface ObjectIdentificatieObjectHuishouden {
  objectIdentificatie?: ObjectHuishouden;
}

export interface ObjectIdentificatieObjectHuishoudenRequest {
  objectIdentificatie?: ObjectHuishoudenRequest;
}

export interface ObjectIdentificatieObjectInrichtingselement {
  objectIdentificatie?: ObjectInrichtingselement;
}

export interface ObjectIdentificatieObjectInrichtingselementRequest {
  objectIdentificatie?: ObjectInrichtingselementRequest;
}

export interface ObjectIdentificatieObjectKadastraleOnroerendeZaak {
  objectIdentificatie?: ObjectKadastraleOnroerendeZaak;
}

export interface ObjectIdentificatieObjectKadastraleOnroerendeZaakRequest {
  objectIdentificatie?: ObjectKadastraleOnroerendeZaakRequest;
}

export interface ObjectIdentificatieObjectKunstwerkdeel {
  objectIdentificatie?: ObjectKunstwerkdeel;
}

export interface ObjectIdentificatieObjectKunstwerkdeelRequest {
  objectIdentificatie?: ObjectKunstwerkdeelRequest;
}

export interface ObjectIdentificatieObjectMaatschappelijkeActiviteit {
  objectIdentificatie?: ObjectMaatschappelijkeActiviteit;
}

export interface ObjectIdentificatieObjectMaatschappelijkeActiviteitRequest {
  objectIdentificatie?: ObjectMaatschappelijkeActiviteitRequest;
}

export interface ObjectIdentificatieObjectOpenbareRuimte {
  objectIdentificatie?: ObjectOpenbareRuimte;
}

export interface ObjectIdentificatieObjectOpenbareRuimteRequest {
  objectIdentificatie?: ObjectOpenbareRuimteRequest;
}

export interface ObjectIdentificatieObjectOverige {
  objectIdentificatie?: ObjectOverige;
}

export interface ObjectIdentificatieObjectOverigeRequest {
  objectIdentificatie?: ObjectOverigeRequest;
}

export interface ObjectIdentificatieObjectPand {
  objectIdentificatie?: ObjectPand;
}

export interface ObjectIdentificatieObjectPandRequest {
  objectIdentificatie?: ObjectPandRequest;
}

export interface ObjectIdentificatieObjectSpoorbaandeel {
  objectIdentificatie?: ObjectSpoorbaandeel;
}

export interface ObjectIdentificatieObjectSpoorbaandeelRequest {
  objectIdentificatie?: ObjectSpoorbaandeelRequest;
}

export interface ObjectIdentificatieObjectTerreinGebouwdObject {
  objectIdentificatie?: ObjectTerreinGebouwdObject;
}

export interface ObjectIdentificatieObjectTerreinGebouwdObjectRequest {
  objectIdentificatie?: ObjectTerreinGebouwdObjectRequest;
}

export interface ObjectIdentificatieObjectTerreindeel {
  objectIdentificatie?: ObjectTerreindeel;
}

export interface ObjectIdentificatieObjectTerreindeelRequest {
  objectIdentificatie?: ObjectTerreindeelRequest;
}

export interface ObjectIdentificatieObjectWaterdeel {
  objectIdentificatie?: ObjectWaterdeel;
}

export interface ObjectIdentificatieObjectWaterdeelRequest {
  objectIdentificatie?: ObjectWaterdeelRequest;
}

export interface ObjectIdentificatieObjectWegdeel {
  objectIdentificatie?: ObjectWegdeel;
}

export interface ObjectIdentificatieObjectWegdeelRequest {
  objectIdentificatie?: ObjectWegdeelRequest;
}

export interface ObjectIdentificatieObjectWijk {
  objectIdentificatie?: ObjectWijk;
}

export interface ObjectIdentificatieObjectWijkRequest {
  objectIdentificatie?: ObjectWijkRequest;
}

export interface ObjectIdentificatieObjectWoonplaats {
  objectIdentificatie?: ObjectWoonplaats;
}

export interface ObjectIdentificatieObjectWoonplaatsRequest {
  objectIdentificatie?: ObjectWoonplaatsRequest;
}

export interface ObjectIdentificatieObjectWozDeelobject {
  objectIdentificatie?: ObjectWozDeelobject;
}

export interface ObjectIdentificatieObjectWozDeelobjectRequest {
  objectIdentificatie?: ObjectWozDeelobjectRequest;
}

export interface ObjectIdentificatieObjectWozObject {
  objectIdentificatie?: ObjectWozObject;
}

export interface ObjectIdentificatieObjectWozObjectRequest {
  objectIdentificatie?: ObjectWozObjectRequest;
}

export interface ObjectIdentificatieObjectWozWaarde {
  objectIdentificatie?: ObjectWozWaarde;
}

export interface ObjectIdentificatieObjectWozWaardeRequest {
  objectIdentificatie?: ObjectWozWaardeRequest;
}

export interface ObjectIdentificatieObjectZakelijkRecht {
  objectIdentificatie?: ObjectZakelijkRecht;
}

export interface ObjectIdentificatieObjectZakelijkRechtRequest {
  objectIdentificatie?: ObjectZakelijkRechtRequest;
}

export interface ObjectIdentificatieRolMedewerker {
  objectIdentificatie?: RolMedewerker;
}

export interface ObjectIdentificatieRolMedewerkerRequest {
  objectIdentificatie?: RolMedewerkerRequest;
}

export interface ObjectIdentificatieRolNatuurlijkPersoon {
  objectIdentificatie?: RolNatuurlijkPersoon;
}

export interface ObjectIdentificatieRolNatuurlijkPersoonRequest {
  objectIdentificatie?: RolNatuurlijkPersoonRequest;
}

export interface ObjectIdentificatieRolNietNatuurlijkPersoon {
  objectIdentificatie?: RolNietNatuurlijkPersoon;
}

export interface ObjectIdentificatieRolNietNatuurlijkPersoonRequest {
  objectIdentificatie?: RolNietNatuurlijkPersoonRequest;
}

export interface ObjectIdentificatieRolOrganisatorischeEenheid {
  objectIdentificatie?: RolOrganisatorischeEenheid;
}

export interface ObjectIdentificatieRolOrganisatorischeEenheidRequest {
  objectIdentificatie?: RolOrganisatorischeEenheidRequest;
}

export interface ObjectIdentificatieRolVestiging {
  objectIdentificatie?: RolVestiging;
}

export interface ObjectIdentificatieRolVestigingRequest {
  objectIdentificatie?: RolVestigingRequest;
}

export type OpenbareRuimteZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectOpenbareRuimte;

export type OrganisatorischeEenheidRolSerializer = BaseRolSerializer &
  BetrokkeneIdentificatieRolOrganisatorischeEenheid;

export type OrganisatorischeEenheidZaakObjectSerializer =
  BaseZaakObjectSerializer & ObjectIdentificatieRolOrganisatorischeEenheid;

export type OverigeZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectOverige;

export type PandZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectPand;

export type SpoorbaandeelZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectSpoorbaandeel;

export type StatusZaakObjectSerializer = BaseZaakObjectSerializer;

export type TerreinGebouwdObjectZaakObjectSerializer =
  BaseZaakObjectSerializer & ObjectIdentificatieObjectTerreinGebouwdObject;

export type TerreindeelZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectTerreindeel;

export type VestigingRolSerializer = BaseRolSerializer &
  BetrokkeneIdentificatieRolVestiging;

export type VestigingZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieRolVestiging;

export type WaterdeelZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectWaterdeel;

export type WegdeelZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectWegdeel;

export type WijkZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectWijk;

export type WoonplaatsZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectWoonplaats;

export type WozDeelobjectZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectWozDeelobject;

export type WozObjectZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectWozObject;

export type WozWaardeZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectWozWaarde;

export type ZakelijkRechtZaakObjectSerializer = BaseZaakObjectSerializer &
  ObjectIdentificatieObjectZakelijkRecht;

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "/zaken/api/v1";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Zaken API
 * @version 1.5.1 (1)
 * @license EUPL 1.2 (https://opensource.org/licenses/EUPL-1.2)
 * @baseUrl /zaken/api/v1
 * @contact <support@maykinmedia.nl> (https://www.maykinmedia.nl)
 *
 * Een API om een zaakregistratiecomponent (ZRC) te benaderen.
 *
 * De ZAAK is het kernobject in deze API, waaraan verschillende andere
 * resources gerelateerd zijn. De Zaken API werkt samen met andere API's voor
 * Zaakgericht werken om tot volledige functionaliteit te komen.
 *
 * **Afhankelijkheden**
 *
 * Deze API is afhankelijk van:
 *
 * * Catalogi API
 * * Notificaties API
 * * Documenten API *(optioneel)*
 * * Besluiten API *(optioneel)*
 * * Autorisaties API *(optioneel)*
 *
 *
 * ### Autorisatie
 *
 * Deze API vereist autorisatie.
 *
 * _Zelf een token genereren_
 *
 * De tokens die gebruikt worden voor autorisatie zijn [JWT's](https://jwt.io) (JSON web
 * token). In de API calls moeten deze gebruikt worden in de `Authorization`
 * header:
 *
 * ```
 * Authorization: Bearer <token>
 * ```
 *
 * Om een JWT te genereren heb je een `client ID` en een `secret` nodig. Het JWT
 * moet gebouwd worden volgens het `HS256` algoritme. De vereiste payload is:
 *
 * ```json
 * {
 *     "iss": "<client ID>",
 *     "iat": 1572863906,
 *     "client_id": "<client ID>",
 *     "user_id": "<user identifier>",
 *     "user_representation": "<user representation>"
 * }
 * ```
 *
 * Als `issuer` gebruik je dus je eigen client ID. De `iat` timestamp is een
 * UNIX-timestamp die aangeeft op welk moment het token gegenereerd is.
 *
 * `user_id` en `user_representation` zijn nodig voor de audit trails. Het zijn
 * vrije velden met als enige beperking dat de lengte maximaal de lengte van
 * de overeenkomstige velden in de audit trail resources is (zie rest API spec).
 *
 *
 * ### Notificaties
 *
 * Deze API publiceert notificaties op het kanaal `zaken`.
 *
 * **Main resource**
 *
 * `zaak`
 *
 *
 *
 * **Kenmerken**
 *
 * * `bronorganisatie`: Het RSIN van de Niet-natuurlijk persoon zijnde de organisatie die de zaak heeft gecreeerd. Dit moet een geldig RSIN zijn van 9 nummers en voldoen aan https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef
 * * `zaaktype`: URL-referentie naar het ZAAKTYPE (in de Catalogi API).
 * * `vertrouwelijkheidaanduiding`: Aanduiding van de mate waarin het zaakdossier van de ZAAK voor de openbaarheid bestemd is.
 *
 * **Resources en acties**
 * - `zaak`: create, update, destroy
 * - `status`: create
 * - `zaakobject`: create, update, destroy
 * - `zaakinformatieobject`: create
 * - `zaakeigenschap`: create, update, destroy
 * - `klantcontact`: create
 * - `rol`: create, destroy
 * - `resultaat`: create, update, destroy
 * - `zaakbesluit`: create
 * - `zaakcontactmoment`: create
 * - `zaakverzoek`: create
 *
 *
 * **Handige links**
 *
 * * [API-documentatie](https://vng-realisatie.github.io/gemma-zaken/standaard/)
 * * [Open Zaak documentatie](https://open-zaak.readthedocs.io/en/latest/)
 * * [Zaakgericht werken](https://www.vngrealisatie.nl/producten/api-standaarden-zaakgericht-werken)
 * * [Open Zaak GitHub](https://github.com/open-zaak/open-zaak)
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  callbacks = {
    /**
     * @description Abstract view to receive webhooks
     *
     * @tags callbacks
     * @name CallbacksCreate
     * @request POST:/callbacks
     */
    callbacksCreate: (data: NotificatieRequest, params: RequestParams = {}) =>
      this.request<Notificatie, ValidatieFout | Fout>({
        path: `/callbacks`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  klantcontacten = {
    /**
     * @description Alle KLANTCONTACTen opvragen. **DEPRECATED**: gebruik de contactmomenten API in plaats van deze endpoint.
     *
     * @tags klantcontacten
     * @name KlantcontactList
     * @summary Alle KLANTCONTACTen opvragen.
     * @request GET:/klantcontacten
     * @deprecated
     * @secure
     */
    klantcontactList: (
      query?: {
        /** Een pagina binnen de gepagineerde set resultaten. */
        page?: number;
        /** URL-referentie naar de ZAAK. */
        zaak?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<PaginatedKlantContactList, ValidatieFout | Fout>({
        path: `/klantcontacten`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Indien geen identificatie gegeven is, dan wordt deze automatisch gegenereerd. **DEPRECATED**: gebruik de contactmomenten API in plaats van deze endpoint.
     *
     * @tags klantcontacten
     * @name KlantcontactCreate
     * @summary Maak een KLANTCONTACT bij een ZAAK aan.
     * @request POST:/klantcontacten
     * @deprecated
     * @secure
     */
    klantcontactCreate: (
      data: KlantContactRequest,
      params: RequestParams = {},
    ) =>
      this.request<KlantContact, ValidatieFout | Fout>({
        path: `/klantcontacten`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifiek KLANTCONTACT bij een ZAAK opvragen. **DEPRECATED**: gebruik de contactmomenten API in plaats van deze endpoint.
     *
     * @tags klantcontacten
     * @name KlantcontactRead
     * @summary Een specifiek KLANTCONTACT bij een ZAAK opvragen.
     * @request GET:/klantcontacten/{uuid}
     * @deprecated
     * @secure
     */
    klantcontactRead: (uuid: string, params: RequestParams = {}) =>
      this.request<KlantContact, Fout>({
        path: `/klantcontacten/${uuid}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  resultaten = {
    /**
     * @description Deze lijst kan gefilterd wordt met query-string parameters.
     *
     * @tags resultaten
     * @name ResultaatList
     * @summary Alle RESULTAATen van ZAAKen opvragen.
     * @request GET:/resultaten
     * @secure
     */
    resultaatList: (
      query?: {
        /** Een pagina binnen de gepagineerde set resultaten. */
        page?: number;
        /** URL-referentie naar het RESULTAATTYPE (in de Catalogi API). */
        resultaattype?: string;
        /** URL-referentie naar de ZAAK. */
        zaak?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<PaginatedResultaatList, ValidatieFout | Fout>({
        path: `/resultaten`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - geldigheid URL naar de ZAAK - geldigheid URL naar het RESULTAATTYPE
     *
     * @tags resultaten
     * @name ResultaatCreate
     * @summary Maak een RESULTAAT bij een ZAAK aan.
     * @request POST:/resultaten
     * @secure
     */
    resultaatCreate: (data: ResultaatRequest, params: RequestParams = {}) =>
      this.request<Resultaat, ValidatieFout | Fout>({
        path: `/resultaten`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifiek RESULTAAT opvragen.
     *
     * @tags resultaten
     * @name ResultaatRead
     * @summary Een specifiek RESULTAAT opvragen.
     * @request GET:/resultaten/{uuid}
     * @secure
     */
    resultaatRead: (uuid: string, params: RequestParams = {}) =>
      this.request<Resultaat, Fout>({
        path: `/resultaten/${uuid}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - geldigheid URL naar de ZAAK - het RESULTAATTYPE mag niet gewijzigd worden
     *
     * @tags resultaten
     * @name ResultaatUpdate
     * @summary Werk een RESULTAAT in zijn geheel bij.
     * @request PUT:/resultaten/{uuid}
     * @secure
     */
    resultaatUpdate: (
      uuid: string,
      data: ResultaatRequest,
      params: RequestParams = {},
    ) =>
      this.request<Resultaat, ValidatieFout | Fout>({
        path: `/resultaten/${uuid}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - geldigheid URL naar de ZAAK - het RESULTAATTYPE mag niet gewijzigd worden
     *
     * @tags resultaten
     * @name ResultaatPartialUpdate
     * @summary Werk een RESULTAAT deels bij.
     * @request PATCH:/resultaten/{uuid}
     * @secure
     */
    resultaatPartialUpdate: (
      uuid: string,
      data: PatchedResultaatRequest,
      params: RequestParams = {},
    ) =>
      this.request<Resultaat, ValidatieFout | Fout>({
        path: `/resultaten/${uuid}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Verwijder een RESULTAAT van een ZAAK.
     *
     * @tags resultaten
     * @name ResultaatDelete
     * @summary Verwijder een RESULTAAT van een ZAAK.
     * @request DELETE:/resultaten/{uuid}
     * @secure
     */
    resultaatDelete: (uuid: string, params: RequestParams = {}) =>
      this.request<void, Fout>({
        path: `/resultaten/${uuid}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Vraag de headers op die je bij een GET request zou krijgen.
     *
     * @tags resultaten
     * @name ResultaatHead
     * @summary De headers voor een specifiek(e) RESULTAAT opvragen
     * @request HEAD:/resultaten/{uuid}
     * @secure
     */
    resultaatHead: (uuid: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/resultaten/${uuid}`,
        method: "HEAD",
        secure: true,
        ...params,
      }),
  };
  rollen = {
    /**
     * @description Deze lijst kan gefilterd wordt met query-string parameters.
     *
     * @tags rollen
     * @name RolList
     * @summary Alle ROLlen bij ZAAKen opvragen.
     * @request GET:/rollen
     * @secure
     */
    rolList: (
      query?: {
        /** URL-referentie naar een betrokkene gerelateerd aan de ZAAK. */
        betrokkene?: string;
        /** Een korte unieke aanduiding van de MEDEWERKER. */
        betrokkeneIdentificatie__medewerker__identificatie?: string;
        /** Het door de gemeente uitgegeven unieke nummer voor een ANDER NATUURLIJK PERSOON */
        betrokkeneIdentificatie__natuurlijkPersoon__anpIdentificatie?: string;
        /** Het administratienummer van de persoon, bedoeld in de Wet BRP */
        betrokkeneIdentificatie__natuurlijkPersoon__inpA_nummer?: string;
        /** Het burgerservicenummer, bedoeld in artikel 1.1 van de Wet algemene bepalingen burgerservicenummer. */
        betrokkeneIdentificatie__natuurlijkPersoon__inpBsn?: string;
        /** Het door de gemeente uitgegeven unieke nummer voor een ANDER NIET-NATUURLIJK PERSOON */
        betrokkeneIdentificatie__nietNatuurlijkPersoon__annIdentificatie?: string;
        /** Het door een kamer toegekend uniek nummer voor de INGESCHREVEN NIET-NATUURLIJK PERSOON */
        betrokkeneIdentificatie__nietNatuurlijkPersoon__innNnpId?: string;
        /** Een korte identificatie van de organisatorische eenheid. */
        betrokkeneIdentificatie__organisatorischeEenheid__identificatie?: string;
        /** Een korte unieke aanduiding van de Vestiging. */
        betrokkeneIdentificatie__vestiging__vestigingsNummer?: string;
        /**
         * Type van de `betrokkene`.
         *
         */
        betrokkeneType?:
          | "medewerker"
          | "natuurlijk_persoon"
          | "niet_natuurlijk_persoon"
          | "organisatorische_eenheid"
          | "vestiging";
        /** Omschrijving van de aard van de ROL, afgeleid uit het ROLTYPE. */
        omschrijving?: string;
        /**
         * Algemeen gehanteerde benaming van de aard van de ROL, afgeleid uit het ROLTYPE.
         *
         */
        omschrijvingGeneriek?:
          | "adviseur"
          | "behandelaar"
          | "belanghebbende"
          | "beslisser"
          | "initiator"
          | "klantcontacter"
          | "mede_initiator"
          | "zaakcoordinator";
        /** Een pagina binnen de gepagineerde set resultaten. */
        page?: number;
        /** URL-referentie naar een roltype binnen het ZAAKTYPE van de ZAAK. */
        roltype?: string;
        /** URL-referentie naar de ZAAK. */
        zaak?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<PaginatedRolList, ValidatieFout | Fout>({
        path: `/rollen`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Maak een ROL aan bij een ZAAK.
     *
     * @tags rollen
     * @name RolCreate
     * @summary Maak een ROL aan bij een ZAAK.
     * @request POST:/rollen
     * @secure
     */
    rolCreate: (data: RolRequest, params: RequestParams = {}) =>
      this.request<Rol, ValidatieFout | Fout>({
        path: `/rollen`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifieke ROL bij een ZAAK opvragen.
     *
     * @tags rollen
     * @name RolRead
     * @summary Een specifieke ROL bij een ZAAK opvragen.
     * @request GET:/rollen/{uuid}
     * @secure
     */
    rolRead: (uuid: string, params: RequestParams = {}) =>
      this.request<Rol, Fout>({
        path: `/rollen/${uuid}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Verwijder een ROL van een ZAAK.
     *
     * @tags rollen
     * @name RolDelete
     * @summary Verwijder een ROL van een ZAAK.
     * @request DELETE:/rollen/{uuid}
     * @secure
     */
    rolDelete: (uuid: string, params: RequestParams = {}) =>
      this.request<void, Fout>({
        path: `/rollen/${uuid}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Vraag de headers op die je bij een GET request zou krijgen.
     *
     * @tags rollen
     * @name RolHead
     * @summary De headers voor een specifiek(e) ROL opvragen
     * @request HEAD:/rollen/{uuid}
     * @secure
     */
    rolHead: (uuid: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/rollen/${uuid}`,
        method: "HEAD",
        secure: true,
        ...params,
      }),
  };
  statussen = {
    /**
     * @description Deze lijst kan gefilterd wordt met query-string parameters.
     *
     * @tags statussen
     * @name StatusList
     * @summary Alle STATUSsen van ZAAKen opvragen.
     * @request GET:/statussen
     * @secure
     */
    statusList: (
      query?: {
        /** Het gegeven is afleidbaar uit de historie van de attribuutsoort Datum status gezet van van alle statussen bij de desbetreffende zaak. */
        indicatieLaatstGezetteStatus?: boolean;
        /** Een pagina binnen de gepagineerde set resultaten. */
        page?: number;
        /** URL-referentie naar het STATUSTYPE (in de Catalogi API). */
        statustype?: string;
        /** URL-referentie naar de ZAAK. */
        zaak?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<PaginatedStatusList, ValidatieFout | Fout>({
        path: `/statussen`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - geldigheid URL naar de ZAAK - geldigheid URL naar het STATUSTYPE - indien het de eindstatus betreft, dan moet het attribuut `indicatieGebruiksrecht` gezet zijn op alle informatieobjecten die aan de zaak gerelateerd zijn **Opmerkingen** - Indien het statustype de eindstatus is (volgens het ZTC), dan wordt de zaak afgesloten door de einddatum te zetten.
     *
     * @tags statussen
     * @name StatusCreate
     * @summary Maak een STATUS aan voor een ZAAK.
     * @request POST:/statussen
     * @secure
     */
    statusCreate: (data: StatusRequest, params: RequestParams = {}) =>
      this.request<Status, ValidatieFout | Fout>({
        path: `/statussen`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifieke STATUS van een ZAAK opvragen.
     *
     * @tags statussen
     * @name StatusRead
     * @summary Een specifieke STATUS van een ZAAK opvragen.
     * @request GET:/statussen/{uuid}
     * @secure
     */
    statusRead: (uuid: string, params: RequestParams = {}) =>
      this.request<Status, Fout>({
        path: `/statussen/${uuid}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Vraag de headers op die je bij een GET request zou krijgen.
     *
     * @tags statussen
     * @name StatusHead
     * @summary De headers voor een specifiek(e) STATUS opvragen
     * @request HEAD:/statussen/{uuid}
     * @secure
     */
    statusHead: (uuid: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/statussen/${uuid}`,
        method: "HEAD",
        secure: true,
        ...params,
      }),
  };
  zaakcontactmomenten = {
    /**
     * @description Alle ZAAKCONTACTMOMENTen opvragen.
     *
     * @tags zaakcontactmomenten
     * @name ZaakcontactmomentList
     * @summary Alle ZAAKCONTACTMOMENTen opvragen.
     * @request GET:/zaakcontactmomenten
     * @secure
     */
    zaakcontactmomentList: (
      query?: {
        /** URL-referentie naar het CONTACTMOMENT (in de CMC API) */
        contactmoment?: string;
        /** URL-referentie naar de ZAAK. */
        zaak?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ZaakContactMoment[], ValidatieFout | Fout>({
        path: `/zaakcontactmomenten`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - geldigheid URL naar de CONTACTMOMENT
     *
     * @tags zaakcontactmomenten
     * @name ZaakcontactmomentCreate
     * @summary Maak een ZAAKCONTACTMOMENT aan.
     * @request POST:/zaakcontactmomenten
     * @secure
     */
    zaakcontactmomentCreate: (
      data: ZaakContactMomentRequest,
      params: RequestParams = {},
    ) =>
      this.request<ZaakContactMoment, ValidatieFout | Fout>({
        path: `/zaakcontactmomenten`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifiek ZAAKCONTACTMOMENT opvragen.
     *
     * @tags zaakcontactmomenten
     * @name ZaakcontactmomentRead
     * @summary Een specifiek ZAAKCONTACTMOMENT opvragen.
     * @request GET:/zaakcontactmomenten/{uuid}
     * @secure
     */
    zaakcontactmomentRead: (uuid: string, params: RequestParams = {}) =>
      this.request<ZaakContactMoment, Fout>({
        path: `/zaakcontactmomenten/${uuid}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Verwijder een ZAAKCONTACTMOMENT.
     *
     * @tags zaakcontactmomenten
     * @name ZaakcontactmomentDelete
     * @summary Verwijder een ZAAKCONTACTMOMENT.
     * @request DELETE:/zaakcontactmomenten/{uuid}
     * @secure
     */
    zaakcontactmomentDelete: (uuid: string, params: RequestParams = {}) =>
      this.request<void, Fout>({
        path: `/zaakcontactmomenten/${uuid}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  zaakinformatieobjecten = {
    /**
     * @description Deze lijst kan gefilterd wordt met querystringparameters.
     *
     * @tags zaakinformatieobjecten
     * @name ZaakinformatieobjectList
     * @summary Alle ZAAK-INFORMATIEOBJECT relaties opvragen.
     * @request GET:/zaakinformatieobjecten
     * @secure
     */
    zaakinformatieobjectList: (
      query?: {
        /** URL-referentie naar het INFORMATIEOBJECT (in de Documenten API), waar ook de relatieinformatie opgevraagd kan worden. */
        informatieobject?: string;
        /** URL-referentie naar de ZAAK. */
        zaak?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ZaakInformatieObject[], ValidatieFout | Fout>({
        path: `/zaakinformatieobjecten`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Er worden twee types van relaties met andere objecten gerealiseerd: **Er wordt gevalideerd op** - geldigheid zaak URL - geldigheid informatieobject URL - de combinatie informatieobject en zaak moet uniek zijn **Opmerkingen** - De registratiedatum wordt door het systeem op 'NU' gezet. De `aardRelatie` wordt ook door het systeem gezet. - Bij het aanmaken wordt ook in de Documenten API de gespiegelde relatie aangemaakt, echter zonder de relatie-informatie. Registreer welk(e) INFORMATIEOBJECT(en) een ZAAK kent. **Er wordt gevalideerd op** - geldigheid informatieobject URL - uniek zijn van relatie ZAAK-INFORMATIEOBJECT
     *
     * @tags zaakinformatieobjecten
     * @name ZaakinformatieobjectCreate
     * @summary Maak een ZAAK-INFORMATIEOBJECT relatie aan.
     * @request POST:/zaakinformatieobjecten
     * @secure
     */
    zaakinformatieobjectCreate: (
      data: ZaakInformatieObjectRequest,
      params: RequestParams = {},
    ) =>
      this.request<ZaakInformatieObject, ValidatieFout | Fout>({
        path: `/zaakinformatieobjecten`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifieke ZAAK-INFORMATIEOBJECT relatie opvragen.
     *
     * @tags zaakinformatieobjecten
     * @name ZaakinformatieobjectRead
     * @summary Een specifieke ZAAK-INFORMATIEOBJECT relatie opvragen.
     * @request GET:/zaakinformatieobjecten/{uuid}
     * @secure
     */
    zaakinformatieobjectRead: (uuid: string, params: RequestParams = {}) =>
      this.request<ZaakInformatieObject, Fout>({
        path: `/zaakinformatieobjecten/${uuid}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Je mag enkel de gegevens van de relatie bewerken, en niet de relatie zelf aanpassen. **Er wordt gevalideerd op** - informatieobject URL en zaak URL mogen niet veranderen
     *
     * @tags zaakinformatieobjecten
     * @name ZaakinformatieobjectUpdate
     * @summary Werk een ZAAK-INFORMATIEOBJECT relatie in zijn geheel bij.
     * @request PUT:/zaakinformatieobjecten/{uuid}
     * @secure
     */
    zaakinformatieobjectUpdate: (
      uuid: string,
      data: ZaakInformatieObjectRequest,
      params: RequestParams = {},
    ) =>
      this.request<ZaakInformatieObject, ValidatieFout | Fout>({
        path: `/zaakinformatieobjecten/${uuid}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Je mag enkel de gegevens van de relatie bewerken, en niet de relatie zelf aanpassen. **Er wordt gevalideerd op** - informatieobject URL en zaak URL mogen niet veranderen
     *
     * @tags zaakinformatieobjecten
     * @name ZaakinformatieobjectPartialUpdate
     * @summary Werk een ZAAK-INFORMATIEOBJECT relatie in deels bij.
     * @request PATCH:/zaakinformatieobjecten/{uuid}
     * @secure
     */
    zaakinformatieobjectPartialUpdate: (
      uuid: string,
      data: PatchedZaakInformatieObjectRequest,
      params: RequestParams = {},
    ) =>
      this.request<ZaakInformatieObject, ValidatieFout | Fout>({
        path: `/zaakinformatieobjecten/${uuid}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description De gespiegelde relatie in de Documenten API wordt door de Zaken API verwijderd. Consumers kunnen dit niet handmatig doen.
     *
     * @tags zaakinformatieobjecten
     * @name ZaakinformatieobjectDelete
     * @summary Verwijder een ZAAK-INFORMATIEOBJECT relatie.
     * @request DELETE:/zaakinformatieobjecten/{uuid}
     * @secure
     */
    zaakinformatieobjectDelete: (uuid: string, params: RequestParams = {}) =>
      this.request<void, Fout>({
        path: `/zaakinformatieobjecten/${uuid}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Vraag de headers op die je bij een GET request zou krijgen.
     *
     * @tags zaakinformatieobjecten
     * @name ZaakinformatieobjectHead
     * @summary De headers voor een specifiek(e) ZAAKINFORMATIEOBJECT opvragen
     * @request HEAD:/zaakinformatieobjecten/{uuid}
     * @secure
     */
    zaakinformatieobjectHead: (uuid: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/zaakinformatieobjecten/${uuid}`,
        method: "HEAD",
        secure: true,
        ...params,
      }),
  };
  zaakobjecten = {
    /**
     * @description Deze lijst kan gefilterd wordt met query-string parameters.
     *
     * @tags zaakobjecten
     * @name ZaakobjectList
     * @summary Alle ZAAKOBJECTen opvragen.
     * @request GET:/zaakobjecten
     * @secure
     */
    zaakobjectList: (
      query?: {
        /** URL-referentie naar de resource die het OBJECT beschrijft. */
        object?: string;
        /**
         * Beschrijft het type OBJECT gerelateerd aan de ZAAK. Als er geen passend type is, dan moet het type worden opgegeven onder `objectTypeOverige`.
         *
         */
        objectType?:
          | "adres"
          | "besluit"
          | "buurt"
          | "enkelvoudig_document"
          | "gemeente"
          | "gemeentelijke_openbare_ruimte"
          | "huishouden"
          | "inrichtingselement"
          | "kadastrale_onroerende_zaak"
          | "kunstwerkdeel"
          | "maatschappelijke_activiteit"
          | "medewerker"
          | "natuurlijk_persoon"
          | "niet_natuurlijk_persoon"
          | "openbare_ruimte"
          | "organisatorische_eenheid"
          | "overige"
          | "pand"
          | "spoorbaandeel"
          | "status"
          | "terrein_gebouwd_object"
          | "terreindeel"
          | "vestiging"
          | "waterdeel"
          | "wegdeel"
          | "wijk"
          | "woonplaats"
          | "woz_deelobject"
          | "woz_object"
          | "woz_waarde"
          | "zakelijk_recht";
        /** Een pagina binnen de gepagineerde set resultaten. */
        page?: number;
        /** URL-referentie naar de ZAAK. */
        zaak?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<PaginatedZaakObjectList, ValidatieFout | Fout>({
        path: `/zaakobjecten`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Maak een ZAAKOBJECT aan. **Er wordt gevalideerd op** - Indien de `object` URL opgegeven is, dan moet deze een geldige response (HTTP 200) geven. - Indien opgegeven, dan wordt `objectIdentificatie` gevalideerd tegen de `objectType` discriminator.
     *
     * @tags zaakobjecten
     * @name ZaakobjectCreate
     * @summary Maak een ZAAKOBJECT aan.
     * @request POST:/zaakobjecten
     * @secure
     */
    zaakobjectCreate: (data: ZaakObjectRequest, params: RequestParams = {}) =>
      this.request<ZaakObject, ValidatieFout | Fout>({
        path: `/zaakobjecten`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifiek ZAAKOBJECT opvragen.
     *
     * @tags zaakobjecten
     * @name ZaakobjectRead
     * @summary Een specifiek ZAAKOBJECT opvragen.
     * @request GET:/zaakobjecten/{uuid}
     * @secure
     */
    zaakobjectRead: (uuid: string, params: RequestParams = {}) =>
      this.request<ZaakObject, Fout>({
        path: `/zaakobjecten/${uuid}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - De attributen `zaak`, `object` en `objectType` mogen niet gewijzigd worden. - Indien opgegeven, dan wordt `objectIdentificatie` gevalideerd tegen de `objectType` discriminator.
     *
     * @tags zaakobjecten
     * @name ZaakobjectUpdate
     * @summary Werk een ZAAKOBJECT in zijn geheel bij.
     * @request PUT:/zaakobjecten/{uuid}
     * @secure
     */
    zaakobjectUpdate: (
      uuid: string,
      data: ZaakObjectRequest,
      params: RequestParams = {},
    ) =>
      this.request<ZaakObject, ValidatieFout | Fout>({
        path: `/zaakobjecten/${uuid}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - De attributen `zaak`, `object` en `objectType` mogen niet gewijzigd worden. - Indien opgegeven, dan wordt `objectIdentificatie` gevalideerd tegen de `objectType` discriminator.
     *
     * @tags zaakobjecten
     * @name ZaakobjectPartialUpdate
     * @summary Werk een ZAAKOBJECT deels bij.
     * @request PATCH:/zaakobjecten/{uuid}
     * @secure
     */
    zaakobjectPartialUpdate: (
      uuid: string,
      data: PatchedZaakObjectRequest,
      params: RequestParams = {},
    ) =>
      this.request<ZaakObject, ValidatieFout | Fout>({
        path: `/zaakobjecten/${uuid}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Verbreek de relatie tussen een ZAAK en een OBJECT door de ZAAKOBJECT resource te verwijderen.
     *
     * @tags zaakobjecten
     * @name ZaakobjectDelete
     * @summary Verwijder een ZAAKOBJECT.
     * @request DELETE:/zaakobjecten/{uuid}
     * @secure
     */
    zaakobjectDelete: (uuid: string, params: RequestParams = {}) =>
      this.request<void, Fout>({
        path: `/zaakobjecten/${uuid}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  zaakverzoeken = {
    /**
     * @description Alle ZAAK-VERZOEK opvragen.
     *
     * @tags zaakverzoeken
     * @name ZaakverzoekList
     * @summary Alle ZAAK-VERZOEK opvragen.
     * @request GET:/zaakverzoeken
     * @secure
     */
    zaakverzoekList: (
      query?: {
        /** URL-referentie naar het VERZOEK (in de Klantinteractie API) */
        verzoek?: string;
        /** URL-referentie naar de ZAAK. */
        zaak?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ZaakVerzoek[], ValidatieFout | Fout>({
        path: `/zaakverzoeken`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - geldigheid URL naar de VERZOEK
     *
     * @tags zaakverzoeken
     * @name ZaakverzoekCreate
     * @summary Maak een ZAAK-VERZOEK aan.
     * @request POST:/zaakverzoeken
     * @secure
     */
    zaakverzoekCreate: (data: ZaakVerzoekRequest, params: RequestParams = {}) =>
      this.request<ZaakVerzoek, ValidatieFout | Fout>({
        path: `/zaakverzoeken`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifiek ZAAK-VERZOEK opvragen.
     *
     * @tags zaakverzoeken
     * @name ZaakverzoekRead
     * @summary Een specifiek ZAAK-VERZOEK opvragen.
     * @request GET:/zaakverzoeken/{uuid}
     * @secure
     */
    zaakverzoekRead: (uuid: string, params: RequestParams = {}) =>
      this.request<ZaakVerzoek, Fout>({
        path: `/zaakverzoeken/${uuid}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Verwijder een ZAAK-VERZOEK.
     *
     * @tags zaakverzoeken
     * @name ZaakverzoekDelete
     * @summary Verwijder een ZAAK-VERZOEK.
     * @request DELETE:/zaakverzoeken/{uuid}
     * @secure
     */
    zaakverzoekDelete: (uuid: string, params: RequestParams = {}) =>
      this.request<void, Fout>({
        path: `/zaakverzoeken/${uuid}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  zaken = {
    /**
     * @description Deze lijst kan gefilterd wordt met query-string parameters. **Opmerking** - er worden enkel zaken getoond van de zaaktypes waar u toe geautoriseerd bent.
     *
     * @tags zaken
     * @name ZaakList
     * @summary Alle ZAAKen opvragen.
     * @request GET:/zaken
     * @secure
     */
    zaakList: (
      query?: {
        /**
         * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
         * @format date
         */
        archiefactiedatum?: string;
        /**
         * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
         * @format date
         */
        archiefactiedatum__gt?: string;
        /** De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg. */
        archiefactiedatum__isnull?: boolean;
        /**
         * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
         * @format date
         */
        archiefactiedatum__lt?: string;
        /**
         * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
         *
         */
        archiefnominatie?: "blijvend_bewaren" | "vernietigen" | null;
        /** Multiple values may be separated by commas. */
        archiefnominatie__in?: string[];
        /**
         * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
         *
         */
        archiefstatus?:
          | "gearchiveerd"
          | "gearchiveerd_procestermijn_onbekend"
          | "nog_te_archiveren"
          | "overgedragen";
        /** Multiple values may be separated by commas. */
        archiefstatus__in?: string[];
        /** Het RSIN van de Niet-natuurlijk persoon zijnde de organisatie die de zaak heeft gecreeerd. Dit moet een geldig RSIN zijn van 9 nummers en voldoen aan https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef */
        bronorganisatie?: string;
        /** Multiple values may be separated by commas. */
        bronorganisatie__in?: string[];
        /**
         * De datum waarop de uitvoering van de zaak afgerond is.
         * @format date
         */
        einddatum?: string;
        /**
         * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
         * @format date
         */
        einddatumGepland?: string;
        /**
         * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
         * @format date
         */
        einddatumGepland__gt?: string;
        /**
         * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
         * @format date
         */
        einddatumGepland__lt?: string;
        /**
         * De datum waarop de uitvoering van de zaak afgerond is.
         * @format date
         */
        einddatum__gt?: string;
        /** De datum waarop de uitvoering van de zaak afgerond is. */
        einddatum__isnull?: boolean;
        /**
         * De datum waarop de uitvoering van de zaak afgerond is.
         * @format date
         */
        einddatum__lt?: string;
        /**
         * Sluit de gespecifieerde gerelateerde resources in in het antwoord.
         *
         */
        expand?: (
          | "deelzaken"
          | "deelzaken.resultaat"
          | "deelzaken.resultaat.resultaattype"
          | "deelzaken.rollen"
          | "deelzaken.rollen.roltype"
          | "deelzaken.status"
          | "deelzaken.status.statustype"
          | "deelzaken.zaakinformatieobjecten"
          | "deelzaken.zaakobjecten"
          | "deelzaken.zaaktype"
          | "eigenschappen"
          | "eigenschappen.eigenschap"
          | "hoofdzaak"
          | "hoofdzaak.resultaat"
          | "hoofdzaak.resultaat.resultaattype"
          | "hoofdzaak.rollen"
          | "hoofdzaak.rollen.roltype"
          | "hoofdzaak.status"
          | "hoofdzaak.status.statustype"
          | "hoofdzaak.zaakinformatieobjecten"
          | "hoofdzaak.zaakobjecten"
          | "hoofdzaak.zaaktype"
          | "resultaat"
          | "resultaat.resultaattype"
          | "rollen"
          | "rollen.roltype"
          | "status"
          | "status.statustype"
          | "zaakinformatieobjecten"
          | "zaakobjecten"
          | "zaaktype"
        )[];
        /** De unieke identificatie van de ZAAK binnen de organisatie die verantwoordelijk is voor de behandeling van de ZAAK. */
        identificatie?: string;
        /**
         * Zaken met een vertrouwelijkheidaanduiding die beperkter is dan de aangegeven aanduiding worden uit de resultaten gefiltered.
         *
         */
        maximaleVertrouwelijkheidaanduiding?:
          | "beperkt_openbaar"
          | "confidentieel"
          | "geheim"
          | "intern"
          | "openbaar"
          | "vertrouwelijk"
          | "zaakvertrouwelijk"
          | "zeer_geheim";
        /**
         * Het veld waarop de resultaten geordend worden.
         *
         */
        ordering?: (
          | "-archiefactiedatum"
          | "-einddatum"
          | "-identificatie"
          | "-publicatiedatum"
          | "-registratiedatum"
          | "-startdatum"
          | "archiefactiedatum"
          | "einddatum"
          | "identificatie"
          | "publicatiedatum"
          | "registratiedatum"
          | "startdatum"
        )[];
        /** Een pagina binnen de gepagineerde set resultaten. */
        page?: number;
        /**
         * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
         * @format date
         */
        registratiedatum?: string;
        /**
         * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
         * @format date
         */
        registratiedatum__gt?: string;
        /**
         * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
         * @format date
         */
        registratiedatum__lt?: string;
        /** URL-referentie naar een betrokkene gerelateerd aan de ZAAK. */
        rol__betrokkene?: string;
        /** Een korte unieke aanduiding van de MEDEWERKER. */
        rol__betrokkeneIdentificatie__medewerker__identificatie?: string;
        /** Het door de gemeente uitgegeven unieke nummer voor een ANDER NATUURLIJK PERSOON */
        rol__betrokkeneIdentificatie__natuurlijkPersoon__anpIdentificatie?: string;
        /** Het administratienummer van de persoon, bedoeld in de Wet BRP */
        rol__betrokkeneIdentificatie__natuurlijkPersoon__inpA_nummer?: string;
        /** Het burgerservicenummer, bedoeld in artikel 1.1 van de Wet algemene bepalingen burgerservicenummer. */
        rol__betrokkeneIdentificatie__natuurlijkPersoon__inpBsn?: string;
        /** Het door de gemeente uitgegeven unieke nummer voor een ANDER NIET-NATUURLIJK PERSOON */
        rol__betrokkeneIdentificatie__nietNatuurlijkPersoon__annIdentificatie?: string;
        /** Het door een kamer toegekend uniek nummer voor de INGESCHREVEN NIET-NATUURLIJK PERSOON */
        rol__betrokkeneIdentificatie__nietNatuurlijkPersoon__innNnpId?: string;
        /** Een korte identificatie van de organisatorische eenheid. */
        rol__betrokkeneIdentificatie__organisatorischeEenheid__identificatie?: string;
        /** Een korte unieke aanduiding van de Vestiging. */
        rol__betrokkeneIdentificatie__vestiging__vestigingsNummer?: string;
        /**
         * Type van de `betrokkene`.
         *
         */
        rol__betrokkeneType?:
          | "medewerker"
          | "natuurlijk_persoon"
          | "niet_natuurlijk_persoon"
          | "organisatorische_eenheid"
          | "vestiging";
        /**
         * Algemeen gehanteerde benaming van de aard van de ROL, afgeleid uit het ROLTYPE.
         *
         */
        rol__omschrijvingGeneriek?:
          | "adviseur"
          | "behandelaar"
          | "belanghebbende"
          | "beslisser"
          | "initiator"
          | "klantcontacter"
          | "mede_initiator"
          | "zaakcoordinator";
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__gt?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__gte?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__lt?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__lte?: string;
        /**
         * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
         * @format date
         */
        uiterlijkeEinddatumAfdoening?: string;
        /**
         * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
         * @format date
         */
        uiterlijkeEinddatumAfdoening__gt?: string;
        /**
         * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
         * @format date
         */
        uiterlijkeEinddatumAfdoening__lt?: string;
        /** URL-referentie naar het ZAAKTYPE (in de Catalogi API). */
        zaaktype?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<PaginatedExpandZaakList, ValidatieFout | Fout>({
        path: `/zaken`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Indien geen identificatie gegeven is, dan wordt deze automatisch gegenereerd. De identificatie moet uniek zijn binnen de bronorganisatie. **Er wordt gevalideerd op**: - geldigheid `zaaktype` URL - de resource moet opgevraagd kunnen worden uit de Catalogi API en de vorm van een ZAAKTYPE hebben. - `zaaktype` is geen concept (`zaaktype.concept` = False) - `laatsteBetaaldatum` mag niet in de toekomst liggen. - `laatsteBetaaldatum` mag niet gezet worden als de betalingsindicatie "nvt" is. - `archiefnominatie` moet een waarde hebben indien `archiefstatus` niet de waarde "nog_te_archiveren" heeft. - `archiefactiedatum` moet een waarde hebben indien `archiefstatus` niet de waarde "nog_te_archiveren" heeft. - `archiefstatus` kan alleen een waarde anders dan "nog_te_archiveren" hebben indien van alle gerelateeerde INFORMATIEOBJECTen het attribuut `status` de waarde "gearchiveerd" heeft.
     *
     * @tags zaken
     * @name ZaakCreate
     * @summary Maak een ZAAK aan.
     * @request POST:/zaken
     * @secure
     */
    zaakCreate: (data: ZaakRequest, params: RequestParams = {}) =>
      this.request<Zaak, ValidatieFout | Fout>({
        path: `/zaken`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifieke ZAAK opvragen.
     *
     * @tags zaken
     * @name ZaakRead
     * @summary Een specifieke ZAAK opvragen.
     * @request GET:/zaken/{uuid}
     * @secure
     */
    zaakRead: (
      uuid: string,
      query?: {
        /**
         * Sluit de gespecifieerde gerelateerde resources in in het antwoord.
         *
         */
        expand?: (
          | "deelzaken"
          | "deelzaken.resultaat"
          | "deelzaken.resultaat.resultaattype"
          | "deelzaken.rollen"
          | "deelzaken.rollen.roltype"
          | "deelzaken.status"
          | "deelzaken.status.statustype"
          | "deelzaken.zaakinformatieobjecten"
          | "deelzaken.zaakobjecten"
          | "deelzaken.zaaktype"
          | "eigenschappen"
          | "eigenschappen.eigenschap"
          | "hoofdzaak"
          | "hoofdzaak.resultaat"
          | "hoofdzaak.resultaat.resultaattype"
          | "hoofdzaak.rollen"
          | "hoofdzaak.rollen.roltype"
          | "hoofdzaak.status"
          | "hoofdzaak.status.statustype"
          | "hoofdzaak.zaakinformatieobjecten"
          | "hoofdzaak.zaakobjecten"
          | "hoofdzaak.zaaktype"
          | "resultaat"
          | "resultaat.resultaattype"
          | "rollen"
          | "rollen.roltype"
          | "status"
          | "status.statustype"
          | "zaakinformatieobjecten"
          | "zaakobjecten"
          | "zaaktype"
        )[];
      },
      params: RequestParams = {},
    ) =>
      this.request<ExpandZaak, Fout>({
        path: `/zaken/${uuid}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - `zaaktype` mag niet gewijzigd worden. - `identificatie` mag niet gewijzigd worden. - `laatsteBetaaldatum` mag niet in de toekomst liggen. - `laatsteBetaaldatum` mag niet gezet worden als de betalingsindicatie "nvt" is. - `archiefnominatie` moet een waarde hebben indien `archiefstatus` niet de waarde "nog_te_archiveren" heeft. - `archiefactiedatum` moet een waarde hebben indien `archiefstatus` niet de waarde "nog_te_archiveren" heeft. - `archiefstatus` kan alleen een waarde anders dan "nog_te_archiveren" hebben indien van alle gerelateeerde INFORMATIEOBJECTen het attribuut `status` de waarde "gearchiveerd" heeft. **Opmerkingen** - er worden enkel zaken getoond van de zaaktypes waar u toe geautoriseerd bent. - zaaktype zal in de toekomst niet-wijzigbaar gemaakt worden. - indien een zaak heropend moet worden, doe dit dan door een nieuwe status toe te voegen die NIET de eindstatus is. Zie de `Status` resource.
     *
     * @tags zaken
     * @name ZaakUpdate
     * @summary Werk een ZAAK in zijn geheel bij.
     * @request PUT:/zaken/{uuid}
     * @secure
     */
    zaakUpdate: (uuid: string, data: ZaakRequest, params: RequestParams = {}) =>
      this.request<Zaak, ValidatieFout | Fout>({
        path: `/zaken/${uuid}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - `zaaktype` mag niet gewijzigd worden. - `identificatie` mag niet gewijzigd worden. - `laatsteBetaaldatum` mag niet in de toekomst liggen. - `laatsteBetaaldatum` mag niet gezet worden als de betalingsindicatie "nvt" is. - `archiefnominatie` moet een waarde hebben indien `archiefstatus` niet de waarde "nog_te_archiveren" heeft. - `archiefactiedatum` moet een waarde hebben indien `archiefstatus` niet de waarde "nog_te_archiveren" heeft. - `archiefstatus` kan alleen een waarde anders dan "nog_te_archiveren" hebben indien van alle gerelateeerde INFORMATIEOBJECTen het attribuut `status` de waarde "gearchiveerd" heeft. **Opmerkingen** - er worden enkel zaken getoond van de zaaktypes waar u toe geautoriseerd bent. - zaaktype zal in de toekomst niet-wijzigbaar gemaakt worden. - indien een zaak heropend moet worden, doe dit dan door een nieuwe status toe te voegen die NIET de eindstatus is. Zie de `Status` resource.
     *
     * @tags zaken
     * @name ZaakPartialUpdate
     * @summary Werk een ZAAK deels bij.
     * @request PATCH:/zaken/{uuid}
     * @secure
     */
    zaakPartialUpdate: (
      uuid: string,
      data: PatchedZaakRequest,
      params: RequestParams = {},
    ) =>
      this.request<Zaak, ValidatieFout | Fout>({
        path: `/zaken/${uuid}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description **De gerelateerde resources zijn hierbij** - `zaak` - de deelzaken van de verwijderde hoofzaak - `status` - alle statussen van de verwijderde zaak - `resultaat` - het resultaat van de verwijderde zaak - `rol` - alle rollen bij de zaak - `zaakobject` - alle zaakobjecten bij de zaak - `zaakeigenschap` - alle eigenschappen van de zaak - `zaakkenmerk` - alle kenmerken van de zaak - `zaakinformatieobject` - alle informatieobject van de zaak - `klantcontact` - alle klantcontacten bij een zaak
     *
     * @tags zaken
     * @name ZaakDelete
     * @summary Verwijder een ZAAK.
     * @request DELETE:/zaken/{uuid}
     * @secure
     */
    zaakDelete: (uuid: string, params: RequestParams = {}) =>
      this.request<void, Fout>({
        path: `/zaken/${uuid}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Vraag de headers op die je bij een GET request zou krijgen.
     *
     * @tags zaken
     * @name ZaakHead
     * @summary De headers voor een specifiek(e) ZAAK opvragen
     * @request HEAD:/zaken/{uuid}
     * @secure
     */
    zaakHead: (uuid: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/zaken/${uuid}`,
        method: "HEAD",
        secure: true,
        ...params,
      }),

    /**
     * @description Alle audit trail regels behorend bij de ZAAK.
     *
     * @tags zaken
     * @name AudittrailList
     * @summary Alle audit trail regels behorend bij de ZAAK.
     * @request GET:/zaken/{zaak_uuid}/audittrail
     * @secure
     */
    audittrailList: (zaakUuid: string, params: RequestParams = {}) =>
      this.request<AuditTrail[], ValidatieFout | Fout>({
        path: `/zaken/${zaakUuid}/audittrail`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifieke audit trail regel opvragen.
     *
     * @tags zaken
     * @name AudittrailRead
     * @summary Een specifieke audit trail regel opvragen.
     * @request GET:/zaken/{zaak_uuid}/audittrail/{uuid}
     * @secure
     */
    audittrailRead: (
      uuid: string,
      zaakUuid: string,
      params: RequestParams = {},
    ) =>
      this.request<AuditTrail, Fout>({
        path: `/zaken/${zaakUuid}/audittrail/${uuid}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Alle ZAAKBESLUITen opvragen.
     *
     * @tags zaken
     * @name ZaakbesluitList
     * @summary Alle ZAAKBESLUITen opvragen.
     * @request GET:/zaken/{zaak_uuid}/besluiten
     * @secure
     */
    zaakbesluitList: (zaakUuid: string, params: RequestParams = {}) =>
      this.request<ZaakBesluit[], ValidatieFout | Fout>({
        path: `/zaken/${zaakUuid}/besluiten`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description **LET OP: Dit endpoint hoor je als consumer niet zelf aan te spreken.** De Besluiten API gebruikt dit endpoint om relaties te synchroniseren, daarom is dit endpoint in de Zaken API geimplementeerd. **Er wordt gevalideerd op** - geldigheid URL naar de ZAAK
     *
     * @tags zaken
     * @name ZaakbesluitCreate
     * @summary Maak een ZAAKBESLUIT aan.
     * @request POST:/zaken/{zaak_uuid}/besluiten
     * @secure
     */
    zaakbesluitCreate: (
      zaakUuid: string,
      data: ZaakBesluitRequest,
      params: RequestParams = {},
    ) =>
      this.request<ZaakBesluit, ValidatieFout | Fout>({
        path: `/zaken/${zaakUuid}/besluiten`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifiek ZAAKBESLUIT opvragen.
     *
     * @tags zaken
     * @name ZaakbesluitRead
     * @summary Een specifiek ZAAKBESLUIT opvragen.
     * @request GET:/zaken/{zaak_uuid}/besluiten/{uuid}
     * @secure
     */
    zaakbesluitRead: (
      uuid: string,
      zaakUuid: string,
      params: RequestParams = {},
    ) =>
      this.request<ZaakBesluit, Fout>({
        path: `/zaken/${zaakUuid}/besluiten/${uuid}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description **LET OP: Dit endpoint hoor je als consumer niet zelf aan te spreken.** De Besluiten API gebruikt dit endpoint om relaties te synchroniseren, daarom is dit endpoint in de Zaken API geimplementeerd.
     *
     * @tags zaken
     * @name ZaakbesluitDelete
     * @summary Verwijder een ZAAKBESLUIT.
     * @request DELETE:/zaken/{zaak_uuid}/besluiten/{uuid}
     * @secure
     */
    zaakbesluitDelete: (
      uuid: string,
      zaakUuid: string,
      params: RequestParams = {},
    ) =>
      this.request<void, Fout>({
        path: `/zaken/${zaakUuid}/besluiten/${uuid}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Alle ZAAKEIGENSCHAPpen opvragen.
     *
     * @tags zaken
     * @name ZaakeigenschapList
     * @summary Alle ZAAKEIGENSCHAPpen opvragen.
     * @request GET:/zaken/{zaak_uuid}/zaakeigenschappen
     * @secure
     */
    zaakeigenschapList: (zaakUuid: string, params: RequestParams = {}) =>
      this.request<ZaakEigenschap[], ValidatieFout | Fout>({
        path: `/zaken/${zaakUuid}/zaakeigenschappen`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Maak een ZAAKEIGENSCHAP aan.
     *
     * @tags zaken
     * @name ZaakeigenschapCreate
     * @summary Maak een ZAAKEIGENSCHAP aan.
     * @request POST:/zaken/{zaak_uuid}/zaakeigenschappen
     * @secure
     */
    zaakeigenschapCreate: (
      zaakUuid: string,
      data: ZaakEigenschapRequest,
      params: RequestParams = {},
    ) =>
      this.request<ZaakEigenschap, ValidatieFout | Fout>({
        path: `/zaken/${zaakUuid}/zaakeigenschappen`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Een specifieke ZAAKEIGENSCHAP opvragen.
     *
     * @tags zaken
     * @name ZaakeigenschapRead
     * @summary Een specifieke ZAAKEIGENSCHAP opvragen.
     * @request GET:/zaken/{zaak_uuid}/zaakeigenschappen/{uuid}
     * @secure
     */
    zaakeigenschapRead: (
      uuid: string,
      zaakUuid: string,
      params: RequestParams = {},
    ) =>
      this.request<ZaakEigenschap, Fout>({
        path: `/zaken/${zaakUuid}/zaakeigenschappen/${uuid}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - Alleen de WAARDE mag gewijzigd worden
     *
     * @tags zaken
     * @name ZaakeigenschapUpdate
     * @summary Werk een ZAAKEIGENSCHAP in zijn geheel bij.
     * @request PUT:/zaken/{zaak_uuid}/zaakeigenschappen/{uuid}
     * @secure
     */
    zaakeigenschapUpdate: (
      uuid: string,
      zaakUuid: string,
      data: ZaakEigenschapRequest,
      params: RequestParams = {},
    ) =>
      this.request<ZaakEigenschap, ValidatieFout | Fout>({
        path: `/zaken/${zaakUuid}/zaakeigenschappen/${uuid}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description **Er wordt gevalideerd op** - Alleen de WAARDE mag gewijzigd worden
     *
     * @tags zaken
     * @name ZaakeigenschapPartialUpdate
     * @summary Werk een ZAAKEIGENSCHAP deels bij.
     * @request PATCH:/zaken/{zaak_uuid}/zaakeigenschappen/{uuid}
     * @secure
     */
    zaakeigenschapPartialUpdate: (
      uuid: string,
      zaakUuid: string,
      data: PatchedZaakEigenschapRequest,
      params: RequestParams = {},
    ) =>
      this.request<ZaakEigenschap, ValidatieFout | Fout>({
        path: `/zaken/${zaakUuid}/zaakeigenschappen/${uuid}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Verwijder een ZAAKEIGENSCHAP.
     *
     * @tags zaken
     * @name ZaakeigenschapDelete
     * @summary Verwijder een ZAAKEIGENSCHAP.
     * @request DELETE:/zaken/{zaak_uuid}/zaakeigenschappen/{uuid}
     * @secure
     */
    zaakeigenschapDelete: (
      uuid: string,
      zaakUuid: string,
      params: RequestParams = {},
    ) =>
      this.request<void, Fout>({
        path: `/zaken/${zaakUuid}/zaakeigenschappen/${uuid}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Vraag de headers op die je bij een GET request zou krijgen.
     *
     * @tags zaken
     * @name ZaakeigenschapHead
     * @summary De headers voor een specifiek(e) ZAAKEIGENSCHAP opvragen
     * @request HEAD:/zaken/{zaak_uuid}/zaakeigenschappen/{uuid}
     * @secure
     */
    zaakeigenschapHead: (
      uuid: string,
      zaakUuid: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/zaken/${zaakUuid}/zaakeigenschappen/${uuid}`,
        method: "HEAD",
        secure: true,
        ...params,
      }),

    /**
     * @description Zoeken/filteren gaat normaal via de `list` operatie, deze is echter niet geschikt voor geo-zoekopdrachten.
     *
     * @tags zaken
     * @name ZaakZoek
     * @summary Voer een (geo)-zoekopdracht uit op ZAAKen.
     * @request POST:/zaken/_zoek
     * @secure
     */
    zaakZoek: (
      data: {
        zaakgeometrie?: GeoWithinRequest;
        /** Lijst van unieke resource identifiers (UUID4) */
        uuid__in?: string[];
        /** Array van zaaktypen. */
        zaaktype__in?: string[];
        /** De unieke identificatie van de ZAAK binnen de organisatie die verantwoordelijk is voor de behandeling van de ZAAK. */
        identificatie?: string;
        /** Het RSIN van de Niet-natuurlijk persoon zijnde de organisatie die de zaak heeft gecreeerd. Dit moet een geldig RSIN zijn van 9 nummers en voldoen aan https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef */
        bronorganisatie?: string;
        /** Multiple values may be separated by commas. */
        bronorganisatie__in?: string[];
        /** URL-referentie naar het ZAAKTYPE (in de Catalogi API). */
        zaaktype?: string;
        /**
         * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
         *
         */
        archiefnominatie?: "blijvend_bewaren" | "vernietigen" | null;
        /** Multiple values may be separated by commas. */
        archiefnominatie__in?: string[];
        /**
         * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
         * @format date
         */
        archiefactiedatum?: string;
        /**
         * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
         * @format date
         */
        archiefactiedatum__lt?: string;
        /**
         * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
         * @format date
         */
        archiefactiedatum__gt?: string;
        /** De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg. */
        archiefactiedatum__isnull?: boolean;
        /**
         * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
         *
         */
        archiefstatus?:
          | "gearchiveerd"
          | "gearchiveerd_procestermijn_onbekend"
          | "nog_te_archiveren"
          | "overgedragen";
        /** Multiple values may be separated by commas. */
        archiefstatus__in?: string[];
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__gt?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__gte?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__lt?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__lte?: string;
        /**
         * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
         * @format date
         */
        registratiedatum?: string;
        /**
         * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
         * @format date
         */
        registratiedatum__gt?: string;
        /**
         * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
         * @format date
         */
        registratiedatum__lt?: string;
        /**
         * De datum waarop de uitvoering van de zaak afgerond is.
         * @format date
         */
        einddatum?: string;
        /**
         * De datum waarop de uitvoering van de zaak afgerond is.
         * @format date
         */
        einddatum__gt?: string;
        /**
         * De datum waarop de uitvoering van de zaak afgerond is.
         * @format date
         */
        einddatum__lt?: string;
        /** De datum waarop de uitvoering van de zaak afgerond is. */
        einddatum__isnull?: boolean;
        /**
         * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
         * @format date
         */
        einddatumGepland?: string;
        /**
         * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
         * @format date
         */
        einddatumGepland__gt?: string;
        /**
         * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
         * @format date
         */
        einddatumGepland__lt?: string;
        /**
         * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
         * @format date
         */
        uiterlijkeEinddatumAfdoening?: string;
        /**
         * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
         * @format date
         */
        uiterlijkeEinddatumAfdoening__gt?: string;
        /**
         * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
         * @format date
         */
        uiterlijkeEinddatumAfdoening__lt?: string;
        /**
         * Type van de `betrokkene`.
         *
         */
        rol__betrokkeneType?:
          | "medewerker"
          | "natuurlijk_persoon"
          | "niet_natuurlijk_persoon"
          | "organisatorische_eenheid"
          | "vestiging";
        /** URL-referentie naar een betrokkene gerelateerd aan de ZAAK. */
        rol__betrokkene?: string;
        /**
         * Algemeen gehanteerde benaming van de aard van de ROL, afgeleid uit het ROLTYPE.
         *
         */
        rol__omschrijvingGeneriek?:
          | "adviseur"
          | "behandelaar"
          | "belanghebbende"
          | "beslisser"
          | "initiator"
          | "klantcontacter"
          | "mede_initiator"
          | "zaakcoordinator";
        /**
         * Zaken met een vertrouwelijkheidaanduiding die beperkter is dan de aangegeven aanduiding worden uit de resultaten gefiltered.
         *
         */
        maximaleVertrouwelijkheidaanduiding?:
          | "beperkt_openbaar"
          | "confidentieel"
          | "geheim"
          | "intern"
          | "openbaar"
          | "vertrouwelijk"
          | "zaakvertrouwelijk"
          | "zeer_geheim";
        /** Het burgerservicenummer, bedoeld in artikel 1.1 van de Wet algemene bepalingen burgerservicenummer. */
        rol__betrokkeneIdentificatie__natuurlijkPersoon__inpBsn?: string;
        /** Het door de gemeente uitgegeven unieke nummer voor een ANDER NATUURLIJK PERSOON */
        rol__betrokkeneIdentificatie__natuurlijkPersoon__anpIdentificatie?: string;
        /** Het administratienummer van de persoon, bedoeld in de Wet BRP */
        rol__betrokkeneIdentificatie__natuurlijkPersoon__inpA_nummer?: string;
        /** Het door een kamer toegekend uniek nummer voor de INGESCHREVEN NIET-NATUURLIJK PERSOON */
        rol__betrokkeneIdentificatie__nietNatuurlijkPersoon__innNnpId?: string;
        /** Het door de gemeente uitgegeven unieke nummer voor een ANDER NIET-NATUURLIJK PERSOON */
        rol__betrokkeneIdentificatie__nietNatuurlijkPersoon__annIdentificatie?: string;
        /** Een korte unieke aanduiding van de Vestiging. */
        rol__betrokkeneIdentificatie__vestiging__vestigingsNummer?: string;
        /** Een korte unieke aanduiding van de MEDEWERKER. */
        rol__betrokkeneIdentificatie__medewerker__identificatie?: string;
        /** Een korte identificatie van de organisatorische eenheid. */
        rol__betrokkeneIdentificatie__organisatorischeEenheid__identificatie?: string;
        /**
         * Het veld waarop de resultaten geordend worden.
         *
         */
        ordering?: (
          | "-archiefactiedatum"
          | "-einddatum"
          | "-identificatie"
          | "-publicatiedatum"
          | "-registratiedatum"
          | "-startdatum"
          | "archiefactiedatum"
          | "einddatum"
          | "identificatie"
          | "publicatiedatum"
          | "registratiedatum"
          | "startdatum"
        )[];
        /**
         * Sluit de gespecifieerde gerelateerde resources in in het antwoord.
         *
         */
        expand?: (
          | "deelzaken"
          | "deelzaken.resultaat"
          | "deelzaken.resultaat.resultaattype"
          | "deelzaken.rollen"
          | "deelzaken.rollen.roltype"
          | "deelzaken.status"
          | "deelzaken.status.statustype"
          | "deelzaken.zaakinformatieobjecten"
          | "deelzaken.zaakobjecten"
          | "deelzaken.zaaktype"
          | "eigenschappen"
          | "eigenschappen.eigenschap"
          | "hoofdzaak"
          | "hoofdzaak.resultaat"
          | "hoofdzaak.resultaat.resultaattype"
          | "hoofdzaak.rollen"
          | "hoofdzaak.rollen.roltype"
          | "hoofdzaak.status"
          | "hoofdzaak.status.statustype"
          | "hoofdzaak.zaakinformatieobjecten"
          | "hoofdzaak.zaakobjecten"
          | "hoofdzaak.zaaktype"
          | "resultaat"
          | "resultaat.resultaattype"
          | "rollen"
          | "rollen.roltype"
          | "status"
          | "status.statustype"
          | "zaakinformatieobjecten"
          | "zaakobjecten"
          | "zaaktype"
        )[];
      },
      query?: {
        /**
         * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
         * @format date
         */
        archiefactiedatum?: string;
        /**
         * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
         * @format date
         */
        archiefactiedatum__gt?: string;
        /** De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg. */
        archiefactiedatum__isnull?: boolean;
        /**
         * De datum waarop het gearchiveerde zaakdossier vernietigd moet worden dan wel overgebracht moet worden naar een archiefbewaarplaats. Wordt automatisch berekend bij het aanmaken of wijzigen van een RESULTAAT aan deze ZAAK indien nog leeg.
         * @format date
         */
        archiefactiedatum__lt?: string;
        /**
         * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
         *
         */
        archiefnominatie?: "blijvend_bewaren" | "vernietigen" | null;
        /** Multiple values may be separated by commas. */
        archiefnominatie__in?: string[];
        /**
         * Aanduiding of het zaakdossier blijvend bewaard of na een bepaalde termijn vernietigd moet worden.
         *
         */
        archiefstatus?:
          | "gearchiveerd"
          | "gearchiveerd_procestermijn_onbekend"
          | "nog_te_archiveren"
          | "overgedragen";
        /** Multiple values may be separated by commas. */
        archiefstatus__in?: string[];
        /** Het RSIN van de Niet-natuurlijk persoon zijnde de organisatie die de zaak heeft gecreeerd. Dit moet een geldig RSIN zijn van 9 nummers en voldoen aan https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef */
        bronorganisatie?: string;
        /** Multiple values may be separated by commas. */
        bronorganisatie__in?: string[];
        /**
         * De datum waarop de uitvoering van de zaak afgerond is.
         * @format date
         */
        einddatum?: string;
        /**
         * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
         * @format date
         */
        einddatumGepland?: string;
        /**
         * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
         * @format date
         */
        einddatumGepland__gt?: string;
        /**
         * De datum waarop volgens de planning verwacht wordt dat de zaak afgerond wordt.
         * @format date
         */
        einddatumGepland__lt?: string;
        /**
         * De datum waarop de uitvoering van de zaak afgerond is.
         * @format date
         */
        einddatum__gt?: string;
        /** De datum waarop de uitvoering van de zaak afgerond is. */
        einddatum__isnull?: boolean;
        /**
         * De datum waarop de uitvoering van de zaak afgerond is.
         * @format date
         */
        einddatum__lt?: string;
        /**
         * Sluit de gespecifieerde gerelateerde resources in in het antwoord.
         *
         */
        expand?: (
          | "deelzaken"
          | "deelzaken.resultaat"
          | "deelzaken.resultaat.resultaattype"
          | "deelzaken.rollen"
          | "deelzaken.rollen.roltype"
          | "deelzaken.status"
          | "deelzaken.status.statustype"
          | "deelzaken.zaakinformatieobjecten"
          | "deelzaken.zaakobjecten"
          | "deelzaken.zaaktype"
          | "eigenschappen"
          | "eigenschappen.eigenschap"
          | "hoofdzaak"
          | "hoofdzaak.resultaat"
          | "hoofdzaak.resultaat.resultaattype"
          | "hoofdzaak.rollen"
          | "hoofdzaak.rollen.roltype"
          | "hoofdzaak.status"
          | "hoofdzaak.status.statustype"
          | "hoofdzaak.zaakinformatieobjecten"
          | "hoofdzaak.zaakobjecten"
          | "hoofdzaak.zaaktype"
          | "resultaat"
          | "resultaat.resultaattype"
          | "rollen"
          | "rollen.roltype"
          | "status"
          | "status.statustype"
          | "zaakinformatieobjecten"
          | "zaakobjecten"
          | "zaaktype"
        )[];
        /** De unieke identificatie van de ZAAK binnen de organisatie die verantwoordelijk is voor de behandeling van de ZAAK. */
        identificatie?: string;
        /**
         * Zaken met een vertrouwelijkheidaanduiding die beperkter is dan de aangegeven aanduiding worden uit de resultaten gefiltered.
         *
         */
        maximaleVertrouwelijkheidaanduiding?:
          | "beperkt_openbaar"
          | "confidentieel"
          | "geheim"
          | "intern"
          | "openbaar"
          | "vertrouwelijk"
          | "zaakvertrouwelijk"
          | "zeer_geheim";
        /**
         * Het veld waarop de resultaten geordend worden.
         *
         */
        ordering?: (
          | "-archiefactiedatum"
          | "-einddatum"
          | "-identificatie"
          | "-publicatiedatum"
          | "-registratiedatum"
          | "-startdatum"
          | "archiefactiedatum"
          | "einddatum"
          | "identificatie"
          | "publicatiedatum"
          | "registratiedatum"
          | "startdatum"
        )[];
        /** Een pagina binnen de gepagineerde set resultaten. */
        page?: number;
        /**
         * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
         * @format date
         */
        registratiedatum?: string;
        /**
         * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
         * @format date
         */
        registratiedatum__gt?: string;
        /**
         * De datum waarop de zaakbehandelende organisatie de ZAAK heeft geregistreerd. Indien deze niet opgegeven wordt, wordt de datum van vandaag gebruikt.
         * @format date
         */
        registratiedatum__lt?: string;
        /** URL-referentie naar een betrokkene gerelateerd aan de ZAAK. */
        rol__betrokkene?: string;
        /** Een korte unieke aanduiding van de MEDEWERKER. */
        rol__betrokkeneIdentificatie__medewerker__identificatie?: string;
        /** Het door de gemeente uitgegeven unieke nummer voor een ANDER NATUURLIJK PERSOON */
        rol__betrokkeneIdentificatie__natuurlijkPersoon__anpIdentificatie?: string;
        /** Het administratienummer van de persoon, bedoeld in de Wet BRP */
        rol__betrokkeneIdentificatie__natuurlijkPersoon__inpA_nummer?: string;
        /** Het burgerservicenummer, bedoeld in artikel 1.1 van de Wet algemene bepalingen burgerservicenummer. */
        rol__betrokkeneIdentificatie__natuurlijkPersoon__inpBsn?: string;
        /** Het door de gemeente uitgegeven unieke nummer voor een ANDER NIET-NATUURLIJK PERSOON */
        rol__betrokkeneIdentificatie__nietNatuurlijkPersoon__annIdentificatie?: string;
        /** Het door een kamer toegekend uniek nummer voor de INGESCHREVEN NIET-NATUURLIJK PERSOON */
        rol__betrokkeneIdentificatie__nietNatuurlijkPersoon__innNnpId?: string;
        /** Een korte identificatie van de organisatorische eenheid. */
        rol__betrokkeneIdentificatie__organisatorischeEenheid__identificatie?: string;
        /** Een korte unieke aanduiding van de Vestiging. */
        rol__betrokkeneIdentificatie__vestiging__vestigingsNummer?: string;
        /**
         * Type van de `betrokkene`.
         *
         */
        rol__betrokkeneType?:
          | "medewerker"
          | "natuurlijk_persoon"
          | "niet_natuurlijk_persoon"
          | "organisatorische_eenheid"
          | "vestiging";
        /**
         * Algemeen gehanteerde benaming van de aard van de ROL, afgeleid uit het ROLTYPE.
         *
         */
        rol__omschrijvingGeneriek?:
          | "adviseur"
          | "behandelaar"
          | "belanghebbende"
          | "beslisser"
          | "initiator"
          | "klantcontacter"
          | "mede_initiator"
          | "zaakcoordinator";
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__gt?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__gte?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__lt?: string;
        /**
         * De datum waarop met de uitvoering van de zaak is gestart
         * @format date
         */
        startdatum__lte?: string;
        /**
         * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
         * @format date
         */
        uiterlijkeEinddatumAfdoening?: string;
        /**
         * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
         * @format date
         */
        uiterlijkeEinddatumAfdoening__gt?: string;
        /**
         * De laatste datum waarop volgens wet- en regelgeving de zaak afgerond dient te zijn.
         * @format date
         */
        uiterlijkeEinddatumAfdoening__lt?: string;
        /** URL-referentie naar het ZAAKTYPE (in de Catalogi API). */
        zaaktype?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<PaginatedExpandZaakList, ValidatieFout | Fout>({
        path: `/zaken/_zoek`,
        method: "POST",
        query: query,
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
