import { describe, expect, it, vi } from "vite-plus/test";
import { createTodoApi } from "./todoApi.ts";

// todoApi.ts はHTTP通信そのものを担う層なので、ここでは fetch の実装を fake に差し替えて
// URL・メソッド・ボディの組み立てと、失敗時に汎用エラーを投げることを検証する。
// createTodoApi に fake の fetch を注入するだけで済み、グローバルな fetch は汚さない。
// サーバー側のエラーメッセージの扱い(ログに残す等)は src/server/routes/todos.ts の責務で、
// フロント側はそれを一切読み取らない(useTodos.test.tsx / App.test.tsx は fake の TodoApi を
// 注入するため fetch を知らない)。

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

describe("todoApi.fetchTodos", () => {
  it("正しいURLでGETし、レスポンスのJSONをそのまま返す", async () => {
    const todos = [{ id: "1", title: "牛乳を買う", completed: false }];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(todos));
    const api = createTodoApi(fetchMock);

    await expect(api.fetchTodos()).resolves.toEqual(todos);

    expect(fetchMock).toHaveBeenCalledWith("/api/todos", undefined);
  });

  it("失敗時は汎用エラーを投げる", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "DBに接続できません" }, 500));
    const api = createTodoApi(fetchMock);

    await expect(api.fetchTodos()).rejects.toThrow("サーバーとの通信に失敗しました");
  });
});

describe("todoApi.addTodo", () => {
  it("正しいURL・メソッド・ボディでPOSTする", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(201));
    const api = createTodoApi(fetchMock);

    await api.addTodo("レポートを書く");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/todos",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "レポートを書く" }),
      }),
    );
  });

  it("失敗時は汎用エラーを投げる", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: "title を入力してください" }, 400));
    const api = createTodoApi(fetchMock);

    await expect(api.addTodo("")).rejects.toThrow("サーバーとの通信に失敗しました");
  });
});

describe("todoApi.updateTodo", () => {
  it("正しいURL・メソッド・ボディでPATCHする", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    const api = createTodoApi(fetchMock);

    await api.updateTodo("1", { completed: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/todos/1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      }),
    );
  });

  it("失敗時は汎用エラーを投げる", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "存在しません" }, 404));
    const api = createTodoApi(fetchMock);

    await expect(api.updateTodo("no-such-id", { completed: true })).rejects.toThrow(
      "サーバーとの通信に失敗しました",
    );
  });
});

describe("todoApi.deleteTodo", () => {
  it("正しいURL・メソッドでDELETEし、JSONヘッダーやボディを付けない", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    const api = createTodoApi(fetchMock);

    await api.deleteTodo("1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/todos/1",
      expect.objectContaining({ method: "DELETE", headers: undefined, body: undefined }),
    );
  });

  it("失敗時は汎用エラーを投げる", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "存在しません" }, 404));
    const api = createTodoApi(fetchMock);

    await expect(api.deleteTodo("no-such-id")).rejects.toThrow("サーバーとの通信に失敗しました");
  });
});
