import { getJestConfig } from "@storybook/test-runner";

module.exports = {
  ...getJestConfig(),
  testTimeout: 20000,
};