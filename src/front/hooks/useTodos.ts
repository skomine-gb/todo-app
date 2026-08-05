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
//
// 4つの操作はどれも「APIを呼ぶ」→「mutateで一覧を取り直す」という同じ形なので runAction にまとめた。
// try/catchを2段に分けているのは、前半(API呼び出し)が失敗したときだけ actionError をセットしたいから。
// 後半(mutate)は操作自体が成功したあとの単なる再取得なので、ここだけ失敗しても「操作に失敗した」とは
// 言えない(例: 追加は成功したのに「追加に失敗しました」と表示するのは誤り)。再取得の失敗は
// SWR自身の error に表れるので、actionError は立てずログだけ残す。
//
// isMutating は「4操作のうちどれかが実行中か」を表す。actionError は1つの状態を全操作・
// 全行で共有しているため、複数の操作が同時に走ると「別の行の結果が表示される」
// 「表示中のエラーが無関係な操作で消える」といった食い違いが起きる。isMutating を
// 呼び出し元(App)でボタンの無効化に使ってもらうことで、常に1操作ずつ順番に実行されるようにする。
export function useTodos() {
  const api = useContext(TodoApiContext);
  const { data, error, isLoading, mutate } = useSWR<Todo[], Error>(TODOS_KEY, () =>
    api.fetchTodos(),
  );
  const todos = data ?? [];
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const runAction = useCallback(
    async (message: string, operation: () => Promise<void>) => {
      setActionError(null);
      setIsMutating(true);
      try {
        try {
          await operation();
        } catch (err) {
          console.error(message, err);
          setActionError(message);
          return;
        }
        try {
          await mutate();
        } catch (err) {
          console.error("一覧の再取得に失敗しました", err);
        }
      } finally {
        setIsMutating(false);
      }
    },
    [mutate],
  );

  const addTodo = useCallback(
    (title: string) => runAction("タスクの追加に失敗しました", () => api.addTodo(title)),
    [runAction, api],
  );

  const toggleTodo = useCallback(
    (id: string, completed: boolean) =>
      runAction("完了状態の更新に失敗しました", () => api.updateTodo(id, { completed })),
    [runAction, api],
  );

  const deleteTodo = useCallback(
    (id: string) => runAction("タスクの削除に失敗しました", () => api.deleteTodo(id)),
    [runAction, api],
  );

  const editTodo = useCallback(
    (id: string, title: string) =>
      runAction("タスクの編集に失敗しました", () => api.updateTodo(id, { title })),
    [runAction, api],
  );

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    isLoading,
    error,
    actionError,
    isMutating,
  };
}
