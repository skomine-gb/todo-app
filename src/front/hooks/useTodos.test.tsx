import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import type { ReactNode } from "react";
import type { Todo } from "../../shared/types.ts";
import { useTodos } from "./useTodos.ts";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// テストごとに空のMapを渡し、SWRのグローバルキャッシュを共有させない
function Wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

const initialTodos: Todo[] = [
  { id: "1", title: "牛乳を買う", completed: false },
  { id: "2", title: "部屋を掃除する", completed: true },
];

describe("useTodos", () => {
  it("GET /api/todos の結果を todos として返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(initialTodos));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTodos(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.todos).toEqual(initialTodos));
    expect(fetchMock).toHaveBeenCalledWith("/api/todos");
  });

  it("addTodo は POST 後に再取得して反映する", async () => {
    const added = { id: "3", title: "レポートを書く", completed: false };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(emptyResponse(201))
      .mockResolvedValueOnce(jsonResponse([added]));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTodos(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.todos).toEqual([]));

    result.current.addTodo("レポートを書く");

    await waitFor(() => expect(result.current.todos).toEqual([added]));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/todos",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "レポートを書く" }),
      }),
    );
    // 初期GET→POST→再取得GETの3回だけで、余分なfetchが発生していないことを確認する
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("toggleTodo は対象の completed を反転させて PATCH し、再取得して反映する", async () => {
    const toggled = { ...initialTodos[0], completed: true };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(initialTodos))
      .mockResolvedValueOnce(emptyResponse(204))
      .mockResolvedValueOnce(jsonResponse([toggled, initialTodos[1]]));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTodos(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.todos).toEqual(initialTodos));

    result.current.toggleTodo("1");

    await waitFor(() => expect(result.current.todos[0].completed).toBe(true));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/todos/1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ completed: true }) }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("deleteTodo は DELETE 後に再取得して反映する", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(initialTodos))
      .mockResolvedValueOnce(emptyResponse(204))
      .mockResolvedValueOnce(jsonResponse([initialTodos[1]]));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTodos(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.todos).toEqual(initialTodos));

    result.current.deleteTodo("1");

    await waitFor(() => expect(result.current.todos).toEqual([initialTodos[1]]));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/todos/1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("editTodo は title を PATCH し、再取得して反映する", async () => {
    const edited = { ...initialTodos[0], title: "パンを買う" };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(initialTodos))
      .mockResolvedValueOnce(emptyResponse(204))
      .mockResolvedValueOnce(jsonResponse([edited, initialTodos[1]]));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTodos(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.todos).toEqual(initialTodos));

    result.current.editTodo("1", "パンを買う");

    await waitFor(() => expect(result.current.todos[0].title).toBe("パンを買う"));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/todos/1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ title: "パンを買う" }) }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("addTodo が失敗しても例外にならず、一覧は変化せず console.error が呼ばれる", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(initialTodos))
      .mockResolvedValueOnce(jsonResponse({ error: "title を入力してください" }, 400));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTodos(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.todos).toEqual(initialTodos));

    result.current.addTodo("");

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    expect(result.current.todos).toEqual(initialTodos);
  });
});
