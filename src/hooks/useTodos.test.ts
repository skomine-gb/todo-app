import { afterEach, describe, expect, it } from "vite-plus/test";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { Todo } from "../types.ts";
import { useTodos } from "./useTodos.ts";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const initialTodos: Todo[] = [
  { id: "1", title: "牛乳を買う", completed: false },
  { id: "2", title: "部屋を掃除する", completed: true },
];

function setSavedTodos(todos: Todo[]) {
  localStorage.setItem("todos", JSON.stringify(todos));
}

describe("useTodos", () => {
  it("未保存なら空配列で始まる", () => {
    const { result } = renderHook(() => useTodos());

    expect(result.current.todos).toEqual([]);
  });

  it("保存済みのデータがあれば読み込んで復元する", () => {
    setSavedTodos(initialTodos);

    const { result } = renderHook(() => useTodos());

    expect(result.current.todos).toEqual(initialTodos);
  });

  it("todos が変わると localStorage に保存される", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("レポートを書く");
    });

    const saved = JSON.parse(localStorage.getItem("todos") ?? "[]") as Todo[];
    expect(saved).toEqual(result.current.todos);
  });

  it("addTodo で末尾に未完了のタスクが追加される", () => {
    setSavedTodos(initialTodos);
    const { result } = renderHook(() => useTodos());

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
    setSavedTodos(initialTodos);
    const { result } = renderHook(() => useTodos());

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
    setSavedTodos(initialTodos);
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.deleteTodo("1");
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBe("2");
  });

  it("editTodo で対象の title だけが書き換わる", () => {
    setSavedTodos(initialTodos);
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.editTodo("1", "パンを買う");
    });

    expect(result.current.todos[0].title).toBe("パンを買う");
    expect(result.current.todos[1].title).toBe("部屋を掃除する");
  });
});
