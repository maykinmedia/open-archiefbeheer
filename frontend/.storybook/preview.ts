import "@maykin-ui/admin-ui/style";
import type { Preview } from "@storybook/react";

import { MOCK_BASE } from "./mockData";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    mockAddonConfigs: {
      globalMockData: [],
      ignoreQueryParams: true,
    },
    mockData: MOCK_BASE,
  },
};

export default preview;
