import { defineConfig, lazyPlugins } from "vite-plus";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  // vitest (jsdom) と @cloudflare/vite-plugin の Worker environment は共存できないため、
  // テスト実行時 (process.env.VITEST) は cloudflare() を無効化する。
  // バックエンドのテストは vitest.workers.config.ts を使う（package.json の test:worker）
  plugins: lazyPlugins(() => [react(), !process.env.VITEST && cloudflare()]),
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    overrides: [
      {
        // Workers テストは vitest-pool-workers のランナー上で動くため、
        // vite-plus/test の再エクスポートではなく実体の vitest を直接 import する必要がある
        files: ["test/worker/**", "vitest.workers.config.ts"],
        rules: { "vite-plus/prefer-vite-plus-imports": "off" },
      },
    ],
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    // コンポーネント（DOM）を扱うテストのため、ブラウザ相当の DOM 環境を使う
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**", "test/worker/**"],
  },
});
