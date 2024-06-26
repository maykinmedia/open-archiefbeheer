import {
  AttributeData,
  Body,
  Form,
  FormField,
  H2,
  Modal,
  Outline,
  P,
} from "@maykin-ui/admin-ui";
import { FormEvent, useState } from "react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useSubmit,
} from "react-router-dom";
import { useAsync } from "react-use";

import { DestructionList as DestructionListComponent } from "../../../components";
import { User } from "../../../lib/api/auth";
import {
  CreateDestructionListReviewData,
  createDestructionListReview,
} from "../../../lib/api/destruction-list-reviews";
import {
  DestructionList,
  getDestructionList,
} from "../../../lib/api/destructionLists";
import { listReviewers } from "../../../lib/api/reviewers";
import { PaginatedZaken, listZaken } from "../../../lib/api/zaken";
import {
  canReviewDestructionListRequired,
  loginRequired,
} from "../../../lib/auth/loaders";
import {
  ZaakSelection,
  addToZaakSelection,
  getZaakSelection,
  isZaakSelected,
  removeFromZaakSelection,
} from "../../../lib/zaakSelection/zaakSelection";
import { Zaak } from "../../../types";
import { DestructionListDetailContext } from "../detail/types";
import "./DestructionListReview.css";

const getDestructionListReviewKey = (id: string) =>
  `destruction-list-review-${id}`;

/**
 * The interface for the zaken modal state
 */
interface ZaakModalDataState {
  open: boolean;
  title?: string;
  uuid?: string;
}

/**
 * The interface for the list modal state
 */
interface ListModalDataState {
  listFeedback?: string;
  open: boolean;
}

/**
 * The interface for the form data of the zaken
 */
interface FormDataState {
  motivation: string;
  uuid: string;
  url: string;
}

/**
 * Review-destruction-list page
 */
export function DestructionListReviewPage() {
  const { zaken, selectedZaken, uuid, destructionList } =
    useLoaderData() as DestructionListReviewLoaderContext;
  const submit = useSubmit();
  const destructionListReviewKey = getDestructionListReviewKey(uuid);

  /* Tooltip Motivation */
  const [tooltipMotivation, setTooltipMotivation] = useState<string>("");

  /* State to manage the count of selected zaken */
  const [zaakSelection, setZaakSelection] = useState<FormDataState[]>([]);

  /* State to manage the state of the zaak modal (when clicking a checkbox) */
  const [zaakModalDataState, setZaakModalDataState] =
    useState<ZaakModalDataState>({
      open: false,
    });

  /* State to handle the modal for the entire list (when clicking on the page action) */
  const [listModalDataState, setListModalDataState] =
    useState<ListModalDataState>({
      open: false,
    });

  /* On render of the page we will update the selection count */
  useAsync(async () => {
    await updateZaakSelectionCountState();
  }, []);

  /* Triggered once you select (click a checkbox) a specific row in the list */
  const onSelect = async (row: AttributeData[], selected: boolean) => {
    const firstZaak = row[0] as unknown as Zaak;
    /* If we deselect, we remove it from the selection list and update the count */
    if (!selected) {
      await removeFromZaakSelection(destructionListReviewKey, [firstZaak]);
      void updateZaakSelectionCountState();
      return;
    }
    /* Otherwise, we open up a modal */
    setZaakModalDataState({
      // TODO: Control the check/uncheck of the checkbox? Is this even necessary if we move away from checkboxes later on? It's quite some work.
      open: true,
      uuid: firstZaak.uuid,
      title: `${firstZaak.identificatie} uitzonderen`,
    });
  };

  /* The fields for the zaken modal (when you click a checkbox) */
  const zaakModalFormFields: FormField[] = [
    {
      autoComplete: "off",
      autoFocus: zaakModalDataState?.open,
      label: "Reden van uitzondering",
      placeholder: "Vul hier een reden voor uitzondering in",
      name: "motivation",
      type: "text",
      required: true,
    },
  ];

  /* The fields for the entire list (when you click the page action) */
  const listModalFormFields: FormField[] = [
    {
      autoComplete: "off",
      autoFocus: zaakModalDataState?.open,
      label: "Opmerking",
      name: "list_feedback",
      placeholder: "Vul hier een opmerking(en) in",
      type: "text",
      required: true,
    },
  ];

  /**
   * Gets called whenever you submit the zaken form that's triggered by clicking a checkbox
   * @param _
   * @param data
   */
  const onSubmitZaakForm = async (_: FormEvent, data: AttributeData) => {
    const zaak = zaken.results.find((z) => z.uuid === zaakModalDataState.uuid)!;
    await addToZaakSelection<FormDataState>(destructionListReviewKey, [zaak], {
      ...(data as {
        motivation: string;
      }),
      uuid: zaakModalDataState.uuid!,
      url: zaak.url as string,
    });
    setZaakModalDataState({ open: false });
    await updateZaakSelectionCountState();
  };

  /**
   * Gets called whenever you submit the list form that's triggered by clicking the page action
   * @param _
   * @param data
   */
  const onSubmitDestructionListForm = async (
    _: FormEvent,
    data: AttributeData,
  ) => {
    submit(
      {
        details: {
          listFeedback: data.list_feedback as string,
        },
      },
      { method: "POST", encType: "application/json" },
    );
  };

  /**
   * Updates the count of the selected zaken to the state
   */
  const updateZaakSelectionCountState = async () => {
    const zaakSelection = await getZaakSelection<FormDataState>(
      destructionListReviewKey,
    );
    const zaakSelectionSelected = Object.values(zaakSelection).filter(
      (f) => f.selected,
    );
    setZaakSelection(zaakSelectionSelected.map((f) => f.detail!));
  };

  return (
    <>
      <Modal
        allowClose={false}
        open={zaakModalDataState.open}
        size="m"
        title={zaakModalDataState.title}
      >
        <Body>
          <Form
            fields={zaakModalFormFields}
            onSubmit={onSubmitZaakForm}
            validateOnChange={true}
            labelSubmit={"Uitzonderen"}
          />
        </Body>
      </Modal>
      <Modal
        title={zaakSelection.length > 0 ? "Beoordelen" : "Accoderen"}
        open={listModalDataState.open}
        size="m"
        onClose={() => setListModalDataState({ open: false })}
      >
        <Body>
          <Form
            fields={listModalFormFields}
            onSubmit={onSubmitDestructionListForm}
            validateOnChange
            labelSubmit={zaakSelection.length > 0 ? "Beoordelen" : "Accoderen"}
          />
        </Body>
      </Modal>

      <DestructionListComponent
        storageKey={destructionListReviewKey}
        zaken={zaken}
        selectedZaken={selectedZaken}
        labelAction={zaakSelection.length > 0 ? "Beoordelen" : "Accoderen"}
        title={`${destructionList.name} beoordelen`}
        onSubmitSelection={() => setListModalDataState({ open: true })}
        onSelect={onSelect}
        allowSelectAll={false}
        actions={[
          {
            children: <Outline.ChatBubbleBottomCenterIcon />,
            tooltip: tooltipMotivation && (
              <>
                <H2>Opmerking</H2>
                <P>{tooltipMotivation}</P>
              </>
            ),
            onMouseEnter: (_, detail) => {
              const _detail = detail as FormDataState | undefined;
              if (_detail) {
                setTooltipMotivation(_detail.motivation);
              } else {
                setTooltipMotivation("");
              }
            },
            onClick: (zaak: Zaak) => {
              setZaakModalDataState({
                open: true,
                uuid: zaak.uuid,
                title: `${zaak.identificatie} uitzonderen`,
              });
            },
          },
        ]}
      />
    </>
  );
}

/**
 * The context of the loader
 */
export type DestructionListReviewLoaderContext = {
  reviewers: User[];
  zaken: PaginatedZaken;
  selectedZaken: Zaak[];
  uuid: string;
  destructionList: DestructionList;
};

/**
 * React Router loader.
 * @param request
 * @param params
 */
export const destructionListReviewLoader = loginRequired(
  canReviewDestructionListRequired<DestructionListReviewLoaderContext>(
    async ({
      request,
      params,
    }: ActionFunctionArgs): Promise<DestructionListReviewLoaderContext> => {
      const searchParams = new URL(request.url).searchParams;
      const uuid = params.uuid as string;
      searchParams.set("destruction_list", uuid);
      const objParams = Object.fromEntries(searchParams);

      const zakenPromise = listZaken({
        ...objParams,
        in_destruction_list: uuid,
      });
      const listsPromise = getDestructionList(uuid);
      const reviewersPromise = listReviewers();

      const [zaken, list, reviewers] = await Promise.all([
        zakenPromise,
        listsPromise,
        reviewersPromise,
      ]);

      const isZaakSelectedPromises = zaken.results.map((zaak) =>
        isZaakSelected(getDestructionListReviewKey(uuid), zaak),
      );
      const isZaakSelectedResults = await Promise.all(isZaakSelectedPromises);
      const selectedZaken = zaken.results.filter(
        (_, index) => isZaakSelectedResults[index],
      );

      return {
        reviewers,
        zaken,
        selectedZaken,
        uuid,
        destructionList: list,
      } satisfies DestructionListReviewLoaderContext;
    },
  ),
);

type DestructionListReviewActionContext = {
  details: {
    listFeedback: string;
  };
};

/**
 * React Router action.
 * @param request
 * @param params
 */
export const destructionListReviewAction = async ({
  request,
  params,
}: ActionFunctionArgs<DestructionListReviewActionContext>) => {
  const details =
    (await request.json()) as DestructionListReviewActionContext["details"];
  const destructionListUuid = params.uuid;

  if (!destructionListUuid) {
    throw new Error("No uuid provided");
  }

  const storageKey = getDestructionListReviewKey(destructionListUuid as string);
  const searchParams = new URLSearchParams();
  searchParams.set("destruction_list", destructionListUuid);

  // Get data
  const promises = [getZaakSelection(storageKey)];

  const [zaakSelection] = (await Promise.all(promises)) as [ZaakSelection];

  const zaakSelectionValid = Object.values(zaakSelection).filter(
    (f) => f.selected,
  );

  const data: CreateDestructionListReviewData = {
    destructionList: destructionListUuid,
    decision: zaakSelectionValid.length > 0 ? "rejected" : "accepted",
    listFeedback: details.listFeedback,
    zakenReviews: zaakSelectionValid.map((zaak) => {
      if (!zaak.detail) {
        throw new Error("Details are missing for one or more zaken");
      }
      const detail = zaak.detail as FormDataState;

      return {
        zaak_url: detail.url,
        feedback: detail.motivation,
      };
    }),
  };
  await createDestructionListReview(data);
  return redirect("/");
};
