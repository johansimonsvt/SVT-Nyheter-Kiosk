import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  server: {
    port: 3100,
    proxy: {
      // I dev går /api till API-servern på 3200; i prod servar Express allt
      "/api": "http://localhost:3200",
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        kiosk: resolve(__dirname, "kiosk.html"),
      },
    },
  },
});
