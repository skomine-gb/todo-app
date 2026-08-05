import { useCallback, useContext, useState } from "react";
import useSWR from "swr";
import { TodoApiContext } from "../api/TodoApiContext.ts";
import type { Todo } from "../../shared/types.ts";

const TODOS_KEY = "/api/todos";

// タスク一覧の状態と操作(追加・完了切替・削除・編集)をまとめたカスタムフック。
// 一覧はSWRで取得・キャッシュし、更新系(追加/更新/削除)は成功後にmutateで一覧を取り直す。
// 実際の通信は TodoApiContext から注入された TodoApi に任せ、このフックはHTTPの詳細を知らない
// (テストではfetchをモックする代わりにfakeのTodoApiを注入すればよい。src/front/tests/helper/todoApi.fake.ts参照)。
//
// 一覧取得の読み込み中・失敗はSWRの isLoading/error をそのまま公開する。
// 操作(追加/更新/削除/編集)の失敗は actionError にメッセージを入れて呼び出し元(App)に伝える。
export function useTodos() {
  const api = useContext(TodoApiContext);
  const { data, error, isLoading, mutate } = useSWR<Todo[]>(TODOS_KEY, () => api.fetchTodos());
  const todos = data ?? [];
  const [actionError, setActionError] = useState<string | null>(null);

  const addTodo = useCallback(
    async (title: string) => {
      setActionError(null);
      try {
        await api.addTodo(title);
        await mutate();
      } catch (err) {
        console.error("タスクの追加に失敗しました", err);
        setActionError("タスクの追加に失敗しました");
      }
    },
    [api, mutate],
  );

  const toggleTodo = useCallback(
    async (id: string, completed: boolean) => {
      setActionError(null);
      try {
        await api.updateTodo(id, { completed });
        await mutate();
      } catch (err) {
        console.error("完了状態の更新に失敗しました", err);
        setActionError("完了状態の更新に失敗しました");
      }
    },
    [api, mutate],
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      setActionError(null);
      try {
        await api.deleteTodo(id);
        await mutate();
      } catch (err) {
        console.error("タスクの削除に失敗しました", err);
        setActionError("タスクの削除に失敗しました");
      }
    },
    [api, mutate],
  );

  const editTodo = useCallback(
    async (id: string, title: string) => {
      setActionError(null);
      try {
        await api.updateTodo(id, { title });
        await mutate();
      } catch (err) {
        console.error("タスクの編集に失敗しました", err);
        setActionError("タスクの編集に失敗しました");
      }
    },
    [api, mutate],
  );

  return { todos, addTodo, toggleTodo, deleteTodo, editTodo, isLoading, error, actionError };
}
