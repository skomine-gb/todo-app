import { afterEach, describe, expect, it } from "vite-plus/test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import type { Todo } from "../shared/types.ts";
import { TodoApiContext } from "./api/TodoApiContext.ts";
import { createFakeApi } from "./api/todoApi.fake.ts";
import { App } from "./App.tsx";

function renderApp(initial: Todo[]) {
  // テストごとに新しいMapとfakeのTodoApiを渡し、App.tsxを変更せずに
  // SWRキャッシュの隔離とHTTP通信の差し替えを行う。
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TodoApiContext.Provider value={createFakeApi(initial)}>
        <App />
      </TodoApiContext.Provider>
    </SWRConfig>,
  );
}

const initialTodos: Todo[] = [
  { id: "1", title: "牛乳を買う", completed: false },
  { id: "2", title: "部屋を掃除する", completed: true },
  { id: "3", title: "レポートを書く", completed: false },
];

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("入力して追加すると一覧の件数が1つ増え、タイトルが表示される", async () => {
    const user = userEvent.setup();
    renderApp(initialTodos);

    const before = (await screen.findAllByRole("listitem")).length;

    await user.type(screen.getByLabelText("タスクを入力"), "散歩する");
    await user.click(screen.getByRole("button", { name: "追加" }));

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(before + 1));
    expect(await screen.findByText("散歩する")).toBeTruthy();
  });

  it("空文字・空白のみで追加しても件数は変わらない", async () => {
    const user = userEvent.setup();
    renderApp(initialTodos);

    const before = (await screen.findAllByRole("listitem")).length;

    await user.type(screen.getByLabelText("タスクを入力"), "   ");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(before);
  });

  it("チェックボックスを操作すると完了／未完了が切り替わる", async () => {
    const user = userEvent.setup();
    renderApp(initialTodos);

    const checkbox = await screen.findByRole("checkbox", { name: "牛乳を買う" });
    const item = checkbox.closest("li");
    await waitFor(() => expect(item?.classList.contains("completed")).toBe(false));

    await user.click(checkbox);
    await waitFor(() => expect(item?.classList.contains("completed")).toBe(true));

    await user.click(checkbox);
    await waitFor(() => expect(item?.classList.contains("completed")).toBe(false));
  });
});
