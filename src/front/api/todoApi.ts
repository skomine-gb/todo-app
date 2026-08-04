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

// body があるときだけ JSON 用ヘッダーと文字列化を自動で行う。
// 呼び出し側は「メソッド・URL・送りたいデータ」だけを渡せばよく、
// JSON_HEADERS を書き忘れる心配がない(レビュー指摘: APIが増えても付け忘れが起きない設計にする)。
async function request(url: string, method: string, body?: unknown): Promise<void> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : JSON_HEADERS,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  await throwOnFailure(res);
}

export const todoApi: TodoApi = {
  async fetchTodos() {
    const res = await fetch(TODOS_URL);
    await throwOnFailure(res);
    return (await res.json()) as Todo[];
  },

  addTodo: (title) => request(TODOS_URL, "POST", { title }),

  updateTodo: (id, patch) => request(`${TODOS_URL}/${id}`, "PATCH", patch),

  deleteTodo: (id) => request(`${TODOS_URL}/${id}`, "DELETE"),
};
