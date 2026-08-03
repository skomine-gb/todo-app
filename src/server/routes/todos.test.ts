import { describe, expect, it } from "vite-plus/test";
import type { TodoRepository } from "../repository.ts";
import { createTodoSchema, createTodosRoute } from "./todos.ts";

describe("createTodoSchema", () => {
  it("title の前後の空白を取り除く", () => {
    const result = createTodoSchema.safeParse({ title: "  牛乳を買う  " });

    expect(result.success).toBe(true);
    expect(result.success && result.data.title).toBe("牛乳を買う");
  });

  it("空文字の title を拒否する", () => {
    const result = createTodoSchema.safeParse({ title: "" });

    expect(result.success).toBe(false);
  });

  it("空白のみの title を拒否する", () => {
    const result = createTodoSchema.safeParse({ title: "   " });

    expect(result.success).toBe(false);
  });

  it("title が無い場合を拒否する", () => {
    const result = createTodoSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("title が文字列でない場合を拒否する", () => {
    const result = createTodoSchema.safeParse({ title: 42 });

    expect(result.success).toBe(false);
  });

  it("JSON でないボディ（null）を拒否する", () => {
    const result = createTodoSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("id / completed など余分なキーは無視される", () => {
    const result = createTodoSchema.safeParse({
      title: "牛乳を買う",
      id: "client-supplied-id",
      completed: true,
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual({ title: "牛乳を買う" });
  });
});

// テスト用の何もしないfake。個々のテストでは足りないメソッドだけ上書きする
const createFakeRepo = (overrides: Partial<TodoRepository> = {}): TodoRepository => ({
  list: async () => [],
  create: async () => {},
  update: async () => true,
  delete: async () => true,
  ...overrides,
});

describe("PATCH /todos/:id（handler、fakeリポジトリ）", () => {
  it("対象が存在しない（update が false を返す）とき 404 を返す", async () => {
    const app = createTodosRoute(() => createFakeRepo({ update: async () => false }));

    const res = await app.request("/todos/no-such-id", {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
    });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /todos/:id（handler、fakeリポジトリ）", () => {
  it("対象が存在しない（delete が false を返す）とき 404 を返す", async () => {
    const app = createTodosRoute(() => createFakeRepo({ delete: async () => false }));

    const res = await app.request("/todos/no-such-id", { method: "DELETE" });

    expect(res.status).toBe(404);
  });
});
