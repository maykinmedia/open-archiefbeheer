import { createContext } from "react";

export type OidcConfigContextType = {
  enabled: boolean;
  loginUrl: string;
};

const OidcConfigContext: React.Context<OidcConfigContextType> = createContext({
  enabled: false,
  loginUrl: "",
} as OidcConfigContextType);

export default OidcConfigContext;
