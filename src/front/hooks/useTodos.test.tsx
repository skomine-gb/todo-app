import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import type { ReactNode } from "react";
import type { Todo } from "../../shared/types.ts";
import { TodoApiContext } from "../api/TodoApiContext.ts";
import { createFakeApi } from "../api/todoApi.fake.ts";
import type { TodoApi } from "../api/todoApi.ts";
import { useTodos } from "./useTodos.ts";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// テストごとに新しいSWRキャッシュ(Map)とfakeのTodoApiをContext経由で注入する。
// fetchをモックする必要がなくなり、「操作したら一覧に反映される」という
// 振る舞いだけをテストできる(HTTPの詳細は todoApi.ts / test/worker 側の責務)。
function renderUseTodos(api: TodoApi) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SWRConfig value={{ provider: () => new Map() }}>
        <TodoApiContext.Provider value={api}>{children}</TodoApiContext.Provider>
      </SWRConfig>
    );
  }
  return renderHook(() => useTodos(), { wrapper: Wrapper });
}

const initialTodos: Todo[] = [
  { id: "1", title: "牛乳を買う", completed: false },
  { id: "2", title: "部屋を掃除する", completed: true },
];

// 「操作が失敗しても例外にならず、一覧は変化せず console.error が呼ばれる」という
// 同じ形の検証を4操作ぶん並べるので、操作ごとの違い(モックするAPIメソッド・呼び出し方)
// だけをテーブルにして it.each でまとめる。
type FailureCase = {
  name: string;
  apiMethod: keyof TodoApi;
  act: (hookResult: ReturnType<typeof useTodos>) => void;
};

const FAILURE_CASES: FailureCase[] = [
  { name: "addTodo", apiMethod: "addTodo", act: (hookResult) => hookResult.addTodo("") },
  {
    name: "toggleTodo",
    apiMethod: "updateTodo",
    act: (hookResult) => hookResult.toggleTodo("1", true),
  },
  { name: "deleteTodo", apiMethod: "deleteTodo", act: (hookResult) => hookResult.deleteTodo("1") },
  {
    name: "editTodo",
    apiMethod: "updateTodo",
    act: (hookResult) => hookResult.editTodo("1", ""),
  },
];

describe("useTodos", () => {
  it("一覧を取得して todos として返す", async () => {
    const { result } = renderUseTodos(createFakeApi(initialTodos));

    await waitFor(() => expect(result.current.todos).toEqual(initialTodos));
  });

  it("addTodo で末尾に未完了のタスクが追加される", async () => {
    const { result } = renderUseTodos(createFakeApi(initialTodos));
    await waitFor(() => expect(result.current.todos).toEqual(initialTodos));

    result.current.addTodo("レポートを書く");

    await waitFor(() => expect(result.current.todos).toHaveLength(3));
    const added = result.current.todos[2];
    expect(added.title).toBe("レポートを書く");
    expect(added.completed).toBe(false);
  });

  it("toggleTodo で対象の completed だけが指定した値に更新される", async () => {
    const { result } = renderUseTodos(createFakeApi(initialTodos));
    await waitFor(() => expect(result.current.todos).toEqual(initialTodos));

    result.current.toggleTodo("1", true);

    await waitFor(() => expect(result.current.todos[0].completed).toBe(true));
    expect(result.current.todos[1].completed).toBe(true);
  });

  it("deleteTodo で対象だけが取り除かれる", async () => {
    const { result } = renderUseTodos(createFakeApi(initialTodos));
    await waitFor(() => expect(result.current.todos).toEqual(initialTodos));

    result.current.deleteTodo("1");

    await waitFor(() => expect(result.current.todos).toHaveLength(1));
    expect(result.current.todos[0].id).toBe("2");
  });

  it("editTodo で対象の title だけが書き換わる", async () => {
    const { result } = renderUseTodos(createFakeApi(initialTodos));
    await waitFor(() => expect(result.current.todos).toEqual(initialTodos));

    result.current.editTodo("1", "パンを買う");

    await waitFor(() => expect(result.current.todos[0].title).toBe("パンを買う"));
    expect(result.current.todos[1].title).toBe("部屋を掃除する");
  });

  it.each(FAILURE_CASES)(
    "$name が失敗しても例外にならず、一覧は変化せず console.error が呼ばれる",
    async ({ apiMethod, act }) => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const api = createFakeApi(initialTodos);
      vi.spyOn(api, apiMethod).mockRejectedValue(new Error("失敗"));

      const { result } = renderUseTodos(api);
      await waitFor(() => expect(result.current.todos).toEqual(initialTodos));

      act(result.current);

      await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
      expect(result.current.todos).toEqual(initialTodos);
    },
  );
});
