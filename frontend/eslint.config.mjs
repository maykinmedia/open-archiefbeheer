import { ignoreBuildArtifacts } from "@maykinmedia/eslint-config";
import recommended from "@maykinmedia/eslint-config/recommended";

const config = [
  ignoreBuildArtifacts(["build", "storybook-static"]),
  ...recommended,
  {
    name: "project/react-hooks/disable-exhaustive-deps",
    rules: {
      "react-hooks/exhaustive-deps": "off",
    },
  },
];

export default config;
