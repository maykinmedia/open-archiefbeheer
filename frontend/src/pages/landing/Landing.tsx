import { Kanban } from "@maykin-ui/admin-ui";
import { FieldSet } from "@maykin-ui/admin-ui/src/lib/data/attributedata";
import { useLoaderData } from "react-router-dom";

import {
  DestructionList,
  listDestructionLists,
} from "../../lib/api/destructionLists";
import { deslugify } from "../../lib/string";
import "./Landing.css";

interface LandingLoaderReturn {
  in_progress: DestructionList[];
  processing: DestructionList[];
  completed: DestructionList[];

  [key: string]: DestructionList[];
}

export const landingLoader = async (): Promise<LandingLoaderReturn> => {
  const lists = await listDestructionLists();
  const in_progress = lists.filter((list) => list.status === "in_progress");
  const processing = lists.filter((list) => list.status === "processing");
  const completed = lists.filter((list) => list.status === "completed");
  return { in_progress, processing, completed };
};

// export const landingAction = async () => {
//   await createDestructionList();
//   return null;
// };

export const Landing = () => {
  const lists = useLoaderData() as LandingLoaderReturn;
  const fieldsets = Object.keys(lists).map((status) => [
    deslugify(status),
    {
      fields: ["title"],
      title: "title",
    },
  ]);
  const objectLists = Object.values(lists).map((listStatus) =>
    listStatus.map((list) => ({
      title: list.name,
    })),
  );
  // const submit = useSubmit();

  return (
    <>
      <Kanban
        title="Landing Page"
        fieldsets={fieldsets as FieldSet[]}
        objectLists={objectLists}
      />
      {/*<form*/}
      {/*  method="POST"*/}
      {/*  onSubmit={(e) => {*/}
      {/*    e.preventDefault();*/}
      {/*    submit({ title: e.target.title.value }, { method: "POST" });*/}
      {/*  }}*/}
      {/*>*/}
      {/*  <input type="text" name="title" />*/}
      {/*  <button type="submit">Create</button>*/}
      {/*</form>*/}
    </>
  );
};
