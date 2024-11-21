import { createObjectFactory } from "./factory";

const FIXTURE_RESPONSE: Response = {
  headers: new Headers(),
  ok: true,
  redirected: false,
  status: 200,
  statusText: "OK",
  type: "basic",
  url: "",
  clone: function (): Response {
    throw new Error("Function not implemented.");
  },
  body: null,
  bodyUsed: false,
  arrayBuffer: function (): Promise<ArrayBuffer> {
    throw new Error("Function not implemented.");
  },
  blob: function (): Promise<Blob> {
    throw new Error("Function not implemented.");
  },
  formData: function (): Promise<FormData> {
    throw new Error("Function not implemented.");
  },
  json: function (): Promise<unknown> {
    throw new Error("Function not implemented.");
  },
  text: function (): Promise<string> {
    throw new Error("Function not implemented.");
  },
};

const responseFactory = createObjectFactory<Response>(FIXTURE_RESPONSE);

export { responseFactory };
