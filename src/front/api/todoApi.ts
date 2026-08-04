import type { Todo } from "../../shared/types.ts";

// フロントとサーバーの通信(HTTPの詳細)をこの型の背後に隠す。
// useTodos はこの型を通じてしか通信しないため、テストではfetchではなく
// この型のfake実装を注入すればよくなる(src/front/tests/helper/todoApi.fake.ts参照)。
export type TodoApi = {
  fetchTodos(): Promise<Todo[]>;
  addTodo(title: string): Promise<void>;
  updateTodo(id: string, patch: Partial<Pick<Todo, "title" | "completed">>): Promise<void>;
  deleteTodo(id: string): Promise<void>;
};

const TODOS_URL = "/api/todos";
const JSON_HEADERS = { "Content-Type": "application/json" };

// 失敗レスポンスの詳細(サーバー側のエラーメッセージ)は、フロントではなくサーバー側の
// console.error（Workers環境。ブラウザのDevTools Consoleには出ない）にだけ残す
// (src/server/routes/todos.ts の errorResponse 参照)。ここでは実装の詳細(URL・HTTPメソッド・
// サーバーの生のエラー文言)を一切含まない汎用エラーだけを呼び出し元(useTodos.ts)へ投げる。
async function throwOnFailure(res: Response): Promise<void> {
  if (res.ok) return;
  throw new Error("サーバーとの通信に失敗しました");
}

async function request(url: string, init: RequestInit & { method: string }): Promise<void> {
  const res = await fetch(url, init);
  await throwOnFailure(res);
}

export const todoApi: TodoApi = {
  async fetchTodos() {
    const res = await fetch(TODOS_URL);
    await throwOnFailure(res);
    return (await res.json()) as Todo[];
  },

  addTodo: (title) =>
    request(TODOS_URL, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ title }) }),

  updateTodo: (id, patch) =>
    request(`${TODOS_URL}/${id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(patch),
    }),

  deleteTodo: (id) => request(`${TODOS_URL}/${id}`, { method: "DELETE" }),
};
