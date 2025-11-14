import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@chromatic-com/storybook",
    "storybook-addon-mock",
    {
      name: "@storybook/addon-coverage",
      options: {
        istanbul: {
          exclude: ["**/*.stories.*", "**/.storybook/**", "**/fixtures/**"],
        },
      },
    },
    "@storybook/addon-docs",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true, // 👈 Disables telemetry
  },
  docs: {},
};

export default config;
