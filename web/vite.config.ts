// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * Em `npm run dev`, o browser fala só com o Vite (mesma origem).
 * `/health` e `/api/*` são encaminhados para a API em C em 127.0.0.1:8080
 * (evita CORS e o caso em que `localhost` resolve para ::1 e outro serviço responde 404).
 */
export default defineConfig({
  vite: {
    server: {
      proxy: {
        "/health": { target: "http://127.0.0.1:8080", changeOrigin: true },
        "/api": { target: "http://127.0.0.1:8080", changeOrigin: true },
      },
    },
  },
});
