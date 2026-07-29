import { afterEach, describe, expect, it } from "vite-plus/test";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { Todo } from "../types.ts";
import { useTodos } from "./useTodos.ts";

afterEach(() => {
  cleanup();
});

const initialTodos: Todo[] = [
  { id: "1", title: "牛乳を買う", completed: false },
  { id: "2", title: "部屋を掃除する", completed: true },
];

describe("useTodos", () => {
  it("初期データがそのまま todos になる", () => {
    const { result } = renderHook(() => useTodos(initialTodos));

    expect(result.current.todos).toEqual(initialTodos);
  });

  it("addTodo で末尾に未完了のタスクが追加される", () => {
    const { result } = renderHook(() => useTodos(initialTodos));

    act(() => {
      result.current.addTodo("レポートを書く");
    });

    expect(result.current.todos).toHaveLength(3);
    const added = result.current.todos[2];
    expect(added.title).toBe("レポートを書く");
    expect(added.completed).toBe(false);
    expect(added.id).toBeTruthy();
  });

  it("toggleTodo で対象の completed だけが反転する", () => {
    const { result } = renderHook(() => useTodos(initialTodos));

    act(() => {
      result.current.toggleTodo("1");
    });

    expect(result.current.todos[0].completed).toBe(true);
    expect(result.current.todos[1].completed).toBe(true);

    act(() => {
      result.current.toggleTodo("1");
    });

    expect(result.current.todos[0].completed).toBe(false);
  });

  it("deleteTodo で対象だけが取り除かれる", () => {
    const { result } = renderHook(() => useTodos(initialTodos));

    act(() => {
      result.current.deleteTodo("1");
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBe("2");
  });

  it("editTodo で対象の title だけが書き換わる", () => {
    const { result } = renderHook(() => useTodos(initialTodos));

    act(() => {
      result.current.editTodo("1", "パンを買う");
    });

    expect(result.current.todos[0].title).toBe("パンを買う");
    expect(result.current.todos[1].title).toBe("部屋を掃除する");
  });
});
