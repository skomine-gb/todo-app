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
// JSON ボディを送るのはこの2メソッドだけ。DELETE はボディを持たないため、
// 万一 body を渡し間違えても余計なヘッダーを付けないよう method 側で判定する。
const METHODS_WITH_JSON_BODY = new Set<string>(["POST", "PATCH"]);

// 失敗レスポンスの詳細(サーバー側のエラーメッセージ)は、フロントではなくサーバー側の
// console.error（Workers環境。ブラウザのDevTools Consoleには出ない）にだけ残す
// (src/server/routes/todos.ts の errorResponse 参照)。ここでは実装の詳細(URL・HTTPメソッド・
// サーバーの生のエラー文言)を一切含まない汎用エラーだけを呼び出し元(useTodos.ts)へ投げる。
async function throwOnFailure(res: Response): Promise<void> {
  if (res.ok) return;
  throw new Error("サーバーとの通信に失敗しました");
}

// fetch の実装を注入できるようにする。本番では既定の fetch(グローバル)を使い、
// テストではグローバルな fetch を差し替えずローカルな fake 関数を渡すだけで済むようにする
// (レビュー指摘: グローバルモックは避ける)。
export function createTodoApi(fetchImpl: typeof fetch = fetch): TodoApi {
  // fetchImpl を呼んで throwOnFailure まで済ませる下請け関数。
  // fetchTodos(戻り値のJSONが必要)と request(戻り値を捨てる)の両方から使う。
  async function fetchWithCheck(url: string, init?: RequestInit): Promise<Response> {
    const res = await fetchImpl(url, init);
    await throwOnFailure(res);
    return res;
  }

  // method が JSON ボディを持つときだけヘッダーと文字列化を自動で行う。
  // 呼び出し側は「メソッド・URL・送りたいデータ」だけを渡せばよく、
  // JSON_HEADERS を書き忘れる心配がない(レビュー指摘: APIが増えても付け忘れが起きない設計にする)。
  // GET(一覧取得)は fetchTodos が別途 fetchWithCheck を直接使うため、method には含めない。
  async function request(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: unknown,
  ): Promise<void> {
    const needsJsonBody = METHODS_WITH_JSON_BODY.has(method);
    await fetchWithCheck(url, {
      method,
      headers: needsJsonBody ? JSON_HEADERS : undefined,
      body: needsJsonBody ? JSON.stringify(body) : undefined,
    });
  }

  return {
    async fetchTodos() {
      const res = await fetchWithCheck(TODOS_URL);
      return (await res.json()) as Todo[];
    },

    addTodo: (title) => request(TODOS_URL, "POST", { title }),

    updateTodo: (id, patch) => request(`${TODOS_URL}/${id}`, "PATCH", patch),

    deleteTodo: (id) => request(`${TODOS_URL}/${id}`, "DELETE"),
  };
}

export const todoApi: TodoApi = createTodoApi();
