import type { D1Migration } from "@cloudflare/vitest-pool-workers";

// test/worker/tsconfig.json は独立した project reference なので、
// この拡張は src/server 側の型チェックには影響しない
declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
