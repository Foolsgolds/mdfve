import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({

  resolve: {
    alias: {
      // モノレポ中は dist ではなくソースを直接見る。ライブラリ側を直せば
      // そのまま HMR が効き、tsc の再ビルドを挟まずに済む。
      // @yanqirenshi/markdown.sitter を別リポジトリへ切り出したらこの別名は削除する。
      "@yanqirenshi/markdown.sitter": fileURLToPath(
        new URL("./packages/markdown.sitter/src/index.ts", import.meta.url)
      ),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
