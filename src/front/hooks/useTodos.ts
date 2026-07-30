import { useCallback, useEffect, useState } from "react";
import type { Todo } from "../../shared/types.ts";

const STORAGE_KEY = "todos";

// 保存済みのタスク一覧を読み込む。未保存なら空配列から始める。
// 壊れたデータ（不正な JSON・配列でない JSON）も空配列にフォールバックし、
// 起動時のクラッシュを防ぐ（docs/03）。壊れたデータは次の保存で上書きされる。
function loadTodos(): Todo[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) return [];
  try {
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as Todo[]) : [];
  } catch {
    return [];
  }
}

// タスク一覧の状態と操作（追加・完了切替・削除・編集）をまとめたカスタムフック。
// localStorage への保存・読み込みもここに集約する。
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

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
