import type { Todo } from "../../shared/types.ts";

// フロントとサーバーの通信(HTTPの詳細)をこの型の背後に隠す。
// useTodos はこの型を通じてしか通信しないため、テストではfetchではなく
// この型のfake実装を注入すればよくなる(src/front/api/todoApi.fake.ts参照)。
export type TodoApi = {
  fetchTodos(): Promise<Todo[]>;
  addTodo(title: string): Promise<void>;
  updateTodo(id: string, patch: Partial<Pick<Todo, "title" | "completed">>): Promise<void>;
  deleteTodo(id: string): Promise<void>;
};

const TODOS_URL = "/api/todos";
const JSON_HEADERS = { "Content-Type": "application/json" };

async function request(url: string, init: RequestInit & { method: string }): Promise<void> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`${init.method} ${url} に失敗しました (status: ${res.status})`);
  }
}

export const todoApi: TodoApi = {
  async fetchTodos() {
    const res = await fetch(TODOS_URL);
    if (!res.ok) throw new Error(`GET ${TODOS_URL} に失敗しました (status: ${res.status})`);
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
