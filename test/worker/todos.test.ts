import { beforeEach, describe, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM todos").run();
});

describe("GET /api/todos", () => {
  it("タスクがないときは 200 と [] を返す", async () => {
    const response = await SELF.fetch("https://example.com/api/todos");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});

describe("POST /api/todos", () => {
  it("正しい title を送ると 201（ボディなし）を返す", async () => {
    const response = await SELF.fetch("https://example.com/api/todos", {
      method: "POST",
      body: JSON.stringify({ title: "牛乳を買う" }),
    });

    expect(response.status).toBe(201);
    expect(await response.text()).toBe("");
  });

  it("POST 後の GET に追加したタスクが反映される", async () => {
    await SELF.fetch("https://example.com/api/todos", {
      method: "POST",
      body: JSON.stringify({ title: "牛乳を買う" }),
    });

    const response = await SELF.fetch("https://example.com/api/todos");
    const todos = (await response.json()) as { id: string; title: string; completed: boolean }[];

    expect(todos).toHaveLength(1);
    expect(todos[0]).toMatchObject({ title: "牛乳を買う", completed: false });
    expect(todos[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("空文字の title は 400 を返す", async () => {
    const response = await SELF.fetch("https://example.com/api/todos", {
      method: "POST",
      body: JSON.stringify({ title: "" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });

  it("空白のみの title は 400 を返す", async () => {
    const response = await SELF.fetch("https://example.com/api/todos", {
      method: "POST",
      body: JSON.stringify({ title: "   " }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });

  it("JSON でないボディは 400 を返す", async () => {
    const response = await SELF.fetch("https://example.com/api/todos", {
      method: "POST",
      body: "not json",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });
});
