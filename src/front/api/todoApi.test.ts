import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { todoApi } from "./todoApi.ts";

// todoApi.ts はHTTP通信そのものを担う層なので、ここでは実際に fetch をモックして
// URL・メソッド・ボディの組み立てと、失敗時に汎用エラーを投げることを検証する。
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("todoApi.fetchTodos", () => {
  it("成功時は一覧を返す", async () => {
    const todos = [{ id: "1", title: "牛乳を買う", completed: false }];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(todos)));

    await expect(todoApi.fetchTodos()).resolves.toEqual(todos);
  });

  it("失敗時は汎用エラーを投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "DBに接続できません" }, 500)),
    );

    await expect(todoApi.fetchTodos()).rejects.toThrow("サーバーとの通信に失敗しました");
  });
});

describe("todoApi.addTodo", () => {
  it("正しいURL・メソッド・ボディでPOSTする", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(201));
    vi.stubGlobal("fetch", fetchMock);

    await todoApi.addTodo("レポートを書く");

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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "title を入力してください" }, 400)),
    );

    await expect(todoApi.addTodo("")).rejects.toThrow("サーバーとの通信に失敗しました");
  });
});

describe("todoApi.updateTodo", () => {
  it("正しいURL・メソッド・ボディでPATCHする", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    await todoApi.updateTodo("1", { completed: true });

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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "存在しません" }, 404)));

    await expect(todoApi.updateTodo("no-such-id", { completed: true })).rejects.toThrow(
      "サーバーとの通信に失敗しました",
    );
  });
});

describe("todoApi.deleteTodo", () => {
  it("正しいURL・メソッドでDELETEする", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    await todoApi.deleteTodo("1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/todos/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("失敗時は汎用エラーを投げる", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "存在しません" }, 404)));

    await expect(todoApi.deleteTodo("no-such-id")).rejects.toThrow(
      "サーバーとの通信に失敗しました",
    );
  });
});
