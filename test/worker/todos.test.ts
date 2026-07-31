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

  it("id / completed をクライアントが送っても無視される（サーバー採番・completed は常に false）", async () => {
    await SELF.fetch("https://example.com/api/todos", {
      method: "POST",
      body: JSON.stringify({ title: "牛乳を買う", id: "client-supplied-id", completed: true }),
    });

    const response = await SELF.fetch("https://example.com/api/todos");
    const todos = (await response.json()) as { id: string; completed: boolean }[];

    expect(todos[0].id).not.toBe("client-supplied-id");
    expect(todos[0].completed).toBe(false);
  });

  it("不正な title（空文字）は 400 を返す（バリデーションの分岐自体は createTodoSchema の単体テストで検証済み。ここでは配線を確認する）", async () => {
    const response = await SELF.fetch("https://example.com/api/todos", {
      method: "POST",
      body: JSON.stringify({ title: "" }),
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

describe("PATCH /api/todos/:id", () => {
  const createTodo = async (title: string) => {
    await SELF.fetch("https://example.com/api/todos", {
      method: "POST",
      body: JSON.stringify({ title }),
    });

    const response = await SELF.fetch("https://example.com/api/todos");
    const todos = (await response.json()) as { id: string }[];
    return todos[0].id;
  };

  it("completed の反転が 204 で成功し、GET に反映される", async () => {
    const id = await createTodo("牛乳を買う");

    const response = await SELF.fetch(`https://example.com/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");

    const list = (await (await SELF.fetch("https://example.com/api/todos")).json()) as {
      id: string;
      completed: boolean;
    }[];
    expect(list.find((todo) => todo.id === id)?.completed).toBe(true);
  });

  it("title の編集が 204 で成功し、GET に反映される", async () => {
    const id = await createTodo("牛乳を買う");

    const response = await SELF.fetch(`https://example.com/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: "パンを買う" }),
    });

    expect(response.status).toBe(204);

    const list = (await (await SELF.fetch("https://example.com/api/todos")).json()) as {
      id: string;
      title: string;
    }[];
    expect(list.find((todo) => todo.id === id)?.title).toBe("パンを買う");
  });

  it("空文字の title は 400 を返す", async () => {
    const id = await createTodo("牛乳を買う");

    const response = await SELF.fetch(`https://example.com/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: "" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });

  it("title・completed のどちらも未指定の場合は 400 を返す", async () => {
    const id = await createTodo("牛乳を買う");

    const response = await SELF.fetch(`https://example.com/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });

  it("存在しない id は 404 を返す", async () => {
    const response = await SELF.fetch("https://example.com/api/todos/no-such-id", {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });
});

describe("DELETE /api/todos/:id", () => {
  it("204 を返し、一覧から消える", async () => {
    await SELF.fetch("https://example.com/api/todos", {
      method: "POST",
      body: JSON.stringify({ title: "牛乳を買う" }),
    });
    const created = (await (await SELF.fetch("https://example.com/api/todos")).json()) as {
      id: string;
    }[];
    const id = created[0].id;

    const response = await SELF.fetch(`https://example.com/api/todos/${id}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");

    const list = (await (await SELF.fetch("https://example.com/api/todos")).json()) as unknown[];
    expect(list).toEqual([]);
  });

  it("存在しない id は 404 を返す", async () => {
    const response = await SELF.fetch("https://example.com/api/todos/no-such-id", {
      method: "DELETE",
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });
});
