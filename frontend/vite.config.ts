import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  envPrefix: "OAB",
  plugins: [react()],
  build: {
    assetsDir: "static/assets",
  },
  // Uncomment this in local `maykin-ui/admin-ui` development when having
  // issues like: "Cannot read properties of null (reading 'useId')"
  // resolve: {
  //   dedupe: ["react", "react-dom"],
  // },
});
