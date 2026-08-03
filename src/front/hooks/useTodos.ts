import { useCallback, useContext } from "react";
import useSWR from "swr";
import { TodoApiContext } from "../api/TodoApiContext.ts";
import type { Todo } from "../../shared/types.ts";

const TODOS_KEY = "/api/todos";

// タスク一覧の状態と操作(追加・完了切替・削除・編集)をまとめたカスタムフック。
// 一覧はSWRで取得・キャッシュし、更新系(追加/更新/削除)は成功後にmutateで一覧を取り直す。
// 実際の通信は TodoApiContext から注入された TodoApi に任せ、このフックはHTTPの詳細を知らない
// (テストではfetchをモックする代わりにfakeのTodoApiを注入すればよい。src/front/api/todoApi.fake.ts参照)。
//
// 既知の制限: API呼び出し失敗時は console.error のみでUIには何も表示しない(STEP12で対応予定)。
// そのため TodoInput/TodoItem 側の入力欄クリア・編集モード終了は無条件に走ってしまい、
// 失敗時もユーザーからは操作が成功したように見えてしまう。
export function useTodos() {
  const api = useContext(TodoApiContext);
  const { data, mutate } = useSWR<Todo[]>(TODOS_KEY, () => api.fetchTodos());
  const todos = data ?? [];

  const addTodo = useCallback(
    (title: string) => {
      void api
        .addTodo(title)
        .then(() => mutate())
        .catch((error: unknown) => {
          console.error("タスクの追加に失敗しました", error);
        });
    },
    [api, mutate],
  );

  const toggleTodo = useCallback(
    (id: string, completed: boolean) => {
      void api
        .updateTodo(id, { completed })
        .then(() => mutate())
        .catch((error: unknown) => {
          console.error("完了状態の更新に失敗しました", error);
        });
    },
    [api, mutate],
  );

  const deleteTodo = useCallback(
    (id: string) => {
      void api
        .deleteTodo(id)
        .then(() => mutate())
        .catch((error: unknown) => {
          console.error("タスクの削除に失敗しました", error);
        });
    },
    [api, mutate],
  );

  const editTodo = useCallback(
    (id: string, title: string) => {
      void api
        .updateTodo(id, { title })
        .then(() => mutate())
        .catch((error: unknown) => {
          console.error("タスクの編集に失敗しました", error);
        });
    },
    [api, mutate],
  );

  return { todos, addTodo, toggleTodo, deleteTodo, editTodo };
}
