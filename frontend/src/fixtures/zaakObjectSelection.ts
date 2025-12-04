import {
  ZaakObjectSelectionItem,
  ZaakObjectSelectionItemMutation,
} from "../lib/api/zaakObjectSelection";
import { ZaakObject } from "../types";
import { createArrayFactory, createObjectFactory } from "./factory";

const FIXTURE_ZAAKOBJECT_SELECTION_ITEM: ZaakObjectSelectionItem = {
  url: "https://openzaak.test.maykin.opengem.nl/zaken/api/v1/zaakobjecten/095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
  selected: true,
  supported: true,
  result: {
    url: "https://openzaak.test.maykin.opengem.nl/zaken/api/v1/zaakobjecten/095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
    objectType: "adres",
    objectTypeOverige: "a",
    objectTypeOverigeDefinitie: {
      url: "http://example.com",
      schema: "string",
      objectData: "string",
    },
    relatieomschrijving: "string",
    objectIdentificatie: {
      identificatie: "string",
      wplWoonplaatsNaam: "string",
      gorOpenbareRuimteNaam: "string",
      huisnummer: 99999,
      huisletter: "s",
      huisnummertoevoeging: "stri",
      postcode: "string",
    },
  } as ZaakObject, // FIXME: ZaakObject type seems to be broken.
};

export const zaakObjectSelectionItemFactory =
  createObjectFactory<ZaakObjectSelectionItem>(
    FIXTURE_ZAAKOBJECT_SELECTION_ITEM,
  );

export const zaakObjectSelectionItemsFactory =
  createArrayFactory<ZaakObjectSelectionItem>([
    FIXTURE_ZAAKOBJECT_SELECTION_ITEM,
  ]);

const FIXTURE_ZAAKOBJECT_SELECTION_ITEM_MUTATION = {
  url: FIXTURE_ZAAKOBJECT_SELECTION_ITEM.url,
  selected: true,
};

export const zaakObjectSelectionItemMutationFactory =
  createObjectFactory<ZaakObjectSelectionItemMutation>(
    FIXTURE_ZAAKOBJECT_SELECTION_ITEM_MUTATION,
  );

export const zaakObjectSelectionItemMutationsFactory =
  createArrayFactory<ZaakObjectSelectionItemMutation>([
    FIXTURE_ZAAKOBJECT_SELECTION_ITEM_MUTATION,
  ]);
