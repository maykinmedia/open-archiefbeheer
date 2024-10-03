import { createContext } from "react";

export type OidcInfo = {
  enabled: boolean;
  loginUrl: string;
};

export type ExtraConfigContextType = {
  oidc?: OidcInfo;
};

const ExtraConfigContext: React.Context<ExtraConfigContextType> = createContext(
  {},
);

export default ExtraConfigContext;
