import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import type { Todo } from "../shared/types.ts";
import { App } from "./App.tsx";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

// GET/POST/PATCH/DELETE を状態を持って擬似的に処理するfetchモック。
// App.tsx は変更せず、テスト側だけでサーバー相当の振る舞いを再現する。
function stubFakeServer(initial: Todo[]) {
  let todos = initial.map((todo) => ({ ...todo }));
  vi.stubGlobal(
    "fetch",
    // useTodos.ts は常に文字列URL・文字列bodyでfetchを呼ぶため、テストではその形に限定して扱う
    vi.fn(async (input: string, init?: { method?: string; body?: string }) => {
      const url = input;
      const method = init?.method ?? "GET";
      const idMatch = /^\/api\/todos\/(.+)$/.exec(url);

      if (url === "/api/todos" && method === "GET") return jsonResponse(todos);
      if (url === "/api/todos" && method === "POST") {
        const { title } = JSON.parse(init?.body ?? "{}") as { title: string };
        todos = [...todos, { id: crypto.randomUUID(), title, completed: false }];
        return emptyResponse(201);
      }
      if (idMatch && method === "PATCH") {
        const patch = JSON.parse(init?.body ?? "{}") as Partial<Todo>;
        todos = todos.map((todo) => (todo.id === idMatch[1] ? { ...todo, ...patch } : todo));
        return emptyResponse(204);
      }
      if (idMatch && method === "DELETE") {
        todos = todos.filter((todo) => todo.id !== idMatch[1]);
        return emptyResponse(204);
      }
      throw new Error(`未対応のリクエスト: ${method} ${url}`);
    }),
  );
}

function renderApp() {
  // テストごとに新しいMapを渡し、App.tsxを変更せずにSWRキャッシュを隔離する
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <App />
    </SWRConfig>,
  );
}

const initialTodos: Todo[] = [
  { id: "1", title: "牛乳を買う", completed: false },
  { id: "2", title: "部屋を掃除する", completed: true },
  { id: "3", title: "レポートを書く", completed: false },
];

beforeEach(() => {
  stubFakeServer(initialTodos);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("入力して追加すると一覧の件数が1つ増え、タイトルが表示される", async () => {
    const user = userEvent.setup();
    renderApp();

    const before = (await screen.findAllByRole("listitem")).length;

    await user.type(screen.getByLabelText("タスクを入力"), "散歩する");
    await user.click(screen.getByRole("button", { name: "追加" }));

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(before + 1));
    expect(await screen.findByText("散歩する")).toBeTruthy();
  });

  it("空文字・空白のみで追加しても件数は変わらない", async () => {
    const user = userEvent.setup();
    renderApp();

    const before = (await screen.findAllByRole("listitem")).length;

    await user.type(screen.getByLabelText("タスクを入力"), "   ");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(before);
  });

  it("チェックボックスを操作すると完了／未完了が切り替わる", async () => {
    const user = userEvent.setup();
    renderApp();

    const checkbox = await screen.findByRole("checkbox", { name: "牛乳を買う" });
    const item = checkbox.closest("li");
    await waitFor(() => expect(item?.classList.contains("completed")).toBe(false));

    await user.click(checkbox);
    await waitFor(() => expect(item?.classList.contains("completed")).toBe(true));

    await user.click(checkbox);
    await waitFor(() => expect(item?.classList.contains("completed")).toBe(false));
  });
});
