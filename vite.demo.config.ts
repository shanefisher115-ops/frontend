import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Build config for the standalone DEMO bundle (dist-demo). It aliases
 * @supabase/supabase-js to a stub so the demo never touches the Supabase
 * client or its browser-storage usage — the deployed demo is pure mock data.
 * The production build (npm run build) does NOT use this config.
 */
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@supabase/supabase-js": path.resolve(__dirname, "demo/supabase-stub.ts"),
    },
  },
  build: {
    outDir: "dist-demo",
    sourcemap: true,
  },
});
