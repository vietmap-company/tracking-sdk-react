import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";

// Alias the SDK package directly to its source so edits hot-reload
// without needing to rebuild the SDK bundle.
const SDK_ROOT = resolve(__dirname, "../..");
const VIETMAP_GL_ROOT = resolve(
  __dirname,
  "../../node_modules/@vietmap/vietmap-gl-js",
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@vietmap/vietmap-gl-js/dist/vietmap-gl.css": resolve(
        VIETMAP_GL_ROOT,
        "dist/vietmap-gl.css",
      ),
      "@vietmap/vietmap-gl-js": resolve(VIETMAP_GL_ROOT, "dist/vietmap-gl.js"),
      "@vietmap/fleetwork-tracking-sdk-react/styles.css": resolve(
        SDK_ROOT,
        "src/styles.css",
      ),
      "@vietmap/fleetwork-tracking-sdk-react": resolve(
        SDK_ROOT,
        "src/index.ts",
      ),
      "@": resolve(SDK_ROOT, "src"),
    },
  },
  optimizeDeps: {
    include: ["@vietmap/vietmap-gl-js"],
  },
  server: {
    port: 5174,
    open: true,
  },
});
