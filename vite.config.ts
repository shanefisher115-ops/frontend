import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // Relative base so the built bundle resolves its assets correctly when
  // served from a sub-path (S3 preview, /computer/a proxy, subdirectories).
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
