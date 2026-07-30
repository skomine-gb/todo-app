// このディレクトリのテストは @cloudflare/vitest-pool-workers の Workers ランタイム上で
// 実行されるため、vite-plus/test ではなく vitest を直接 import する
import { describe, expect, it } from "vitest";
import { SELF } from "cloudflare:test";

describe("GET /api/health", () => {
  it("200 と { status: 'ok' } を返す", async () => {
    const response = await SELF.fetch("https://example.com/api/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
