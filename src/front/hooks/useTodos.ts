import { useCallback } from "react";
import useSWR from "swr";
import type { Todo } from "../../shared/types.ts";

const TODOS_URL = "/api/todos";
const JSON_HEADERS = { "Content-Type": "application/json" };

async function fetchTodos(url: string): Promise<Todo[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} に失敗しました (status: ${res.status})`);
  return (await res.json()) as Todo[];
}

async function request(url: string, init?: RequestInit): Promise<void> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${url} に失敗しました (status: ${res.status})`);
  }
}

const postTodo = (title: string) =>
  request(TODOS_URL, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ title }) });

const patchTodo = (id: string, patch: Partial<Pick<Todo, "title" | "completed">>) =>
  request(`${TODOS_URL}/${id}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(patch),
  });

const deleteTodoRequest = (id: string) => request(`${TODOS_URL}/${id}`, { method: "DELETE" });

// タスク一覧の状態と操作(追加・完了切替・削除・編集)をまとめたカスタムフック。
// 一覧はSWRで取得・キャッシュし、更新系(POST/PATCH/DELETE)は成功後にmutateで一覧を取り直す。
export function useTodos() {
  const { data, mutate } = useSWR<Todo[]>(TODOS_URL, fetchTodos);
  const todos = data ?? [];

  const addTodo = useCallback(
    (title: string) => {
      void postTodo(title)
        .then(() => mutate())
        .catch((error: unknown) => {
          console.error("タスクの追加に失敗しました", error);
        });
    },
    [mutate],
  );

  const toggleTodo = useCallback(
    (id: string) => {
      const target = todos.find((todo) => todo.id === id);
      if (!target) return;

      void patchTodo(id, { completed: !target.completed })
        .then(() => mutate())
        .catch((error: unknown) => {
          console.error("完了状態の更新に失敗しました", error);
        });
    },
    [todos, mutate],
  );

  const deleteTodo = useCallback(
    (id: string) => {
      void deleteTodoRequest(id)
        .then(() => mutate())
        .catch((error: unknown) => {
          console.error("タスクの削除に失敗しました", error);
        });
    },
    [mutate],
  );

  const editTodo = useCallback(
    (id: string, title: string) => {
      void patchTodo(id, { title })
        .then(() => mutate())
        .catch((error: unknown) => {
          console.error("タスクの編集に失敗しました", error);
        });
    },
    [mutate],
  );

  return { todos, addTodo, toggleTodo, deleteTodo, editTodo };
}
