import { defineConfig } from "vite";

const legacyBackend =
  process.env.AL25D_LOCAL_LEGACY_BACKEND ?? "http://localhost:8090";

const backendProxy = {
  target: legacyBackend,
  changeOrigin: false,
  secure: false
};

export default defineConfig({
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    proxy: {
      "/legacy": {
        ...backendProxy,
        rewrite: (path) => path.replace(/^\/legacy/, "") || "/"
      },
      "/api": backendProxy,
      "/admin": backendProxy,
      "/data.js": backendProxy,
      "/code.js": backendProxy,
      "/js": backendProxy,
      "/css": backendProxy,
      "/images": backendProxy,
      "/sounds": backendProxy,
      "/phrases": backendProxy,
      "/runner": backendProxy,
      "/comm": backendProxy
    }
  }
});
