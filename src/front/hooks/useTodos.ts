import { useCallback, useRef } from "react";
import useSWR from "swr";
import type { Todo } from "../../shared/types.ts";

const TODOS_URL = "/api/todos";
const JSON_HEADERS = { "Content-Type": "application/json" };

async function fetchTodos(url: string): Promise<Todo[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} に失敗しました (status: ${res.status})`);
  return (await res.json()) as Todo[];
}

async function request(url: string, init: RequestInit & { method: string }): Promise<void> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`${init.method} ${url} に失敗しました (status: ${res.status})`);
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
//
// 既知の制限: API呼び出し失敗時は console.error のみでUIには何も表示しない(STEP12で対応予定)。
// そのため TodoInput/TodoItem 側の入力欄クリア・編集モード終了は無条件に走ってしまい、
// 失敗時もユーザーからは操作が成功したように見えてしまう。
export function useTodos() {
  const { data, mutate } = useSWR<Todo[]>(TODOS_URL, fetchTodos);
  const todos = data ?? [];

  // toggleTodo が todos の変化のたびに再生成されると、React.memo(TodoItem) の効果が
  // 薄れてしまう(他のタスクの完了切替でも全件が再レンダリング対象になる)ため、
  // ref経由で最新のtodosを参照し、useCallbackの依存はmutateだけに保つ。
  const todosRef = useRef(todos);
  todosRef.current = todos;

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
      const target = todosRef.current.find((todo) => todo.id === id);
      if (!target) return;

      void patchTodo(id, { completed: !target.completed })
        .then(() => mutate())
        .catch((error: unknown) => {
          console.error("完了状態の更新に失敗しました", error);
        });
    },
    [mutate],
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
