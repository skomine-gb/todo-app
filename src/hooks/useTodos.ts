import { useCallback, useState } from "react";
import type { Todo } from "../types.ts";

// タスク一覧の状態と操作（追加・完了切替・削除・編集）をまとめたカスタムフック。
// localStorage への永続化は STEP6 でここに追加する。
export function useTodos(initialTodos: Todo[]) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  const addTodo = useCallback((title: string) => {
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), title, completed: false }]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const editTodo = useCallback((id: string, title: string) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, title } : todo)));
  }, []);

  return { todos, addTodo, toggleTodo, deleteTodo, editTodo };
}
