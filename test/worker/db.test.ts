import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:test";

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM todos").run();
});

describe("todos テーブル", () => {
  it("INSERT した行を SELECT で取得できる", async () => {
    await env.DB.prepare("INSERT INTO todos (id, title, completed) VALUES (?, ?, ?)")
      .bind("1", "牛乳を買う", 0)
      .run();

    const { results } = await env.DB.prepare("SELECT * FROM todos WHERE id = ?").bind("1").all();

    expect(results).toEqual([{ id: "1", title: "牛乳を買う", completed: 0 }]);
  });
});
