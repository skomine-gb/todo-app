import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import type { Todo } from "../shared/types.ts";
import { TodoApiContext } from "./api/TodoApiContext.ts";
import { createFakeApi } from "./tests/helper/todoApi.fake.ts";
import type { TodoApi } from "./api/todoApi.ts";
import { App } from "./App.tsx";

function renderApp(api: TodoApi) {
  // テストごとに新しいMapとTodoApiを渡し、App.tsxを変更せずに
  // SWRキャッシュの隔離とHTTP通信の差し替えを行う。failしたい操作だけ
  // vi.spyOn で上書きしたfakeを渡せば、失敗系のテストもこのヘルパーで書ける。
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TodoApiContext.Provider value={api}>
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
    renderApp(createFakeApi(initialTodos));

    const before = (await screen.findAllByRole("listitem")).length;

    await user.type(screen.getByLabelText("タスクを入力"), "散歩する");
    await user.click(screen.getByRole("button", { name: "追加" }));

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(before + 1));
    expect(await screen.findByText("散歩する")).toBeTruthy();
  });

  it("空文字・空白のみで追加しても件数は変わらない", async () => {
    const user = userEvent.setup();
    renderApp(createFakeApi(initialTodos));

    const before = (await screen.findAllByRole("listitem")).length;

    await user.type(screen.getByLabelText("タスクを入力"), "   ");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(before);
  });

  it("チェックボックスを操作すると完了／未完了が切り替わる", async () => {
    const user = userEvent.setup();
    renderApp(createFakeApi(initialTodos));

    const checkbox = await screen.findByRole("checkbox", { name: "牛乳を買う" });
    const item = checkbox.closest("li");
    await waitFor(() => expect(item?.classList.contains("completed")).toBe(false));

    await user.click(checkbox);
    await waitFor(() => expect(item?.classList.contains("completed")).toBe(true));

    await user.click(checkbox);
    await waitFor(() => expect(item?.classList.contains("completed")).toBe(false));
  });

  it("読み込み中は「読み込み中…」が表示される", () => {
    renderApp(createFakeApi(initialTodos));

    expect(screen.getByText("読み込み中…")).toBeTruthy();
  });

  it("一覧の取得に失敗すると「読み込みに失敗しました」が表示される", async () => {
    const api = createFakeApi(initialTodos);
    vi.spyOn(api, "fetchTodos").mockRejectedValue(new Error("失敗"));
    renderApp(api);

    expect(await screen.findByText("読み込みに失敗しました")).toBeTruthy();
  });

  it("追加に失敗すると対応するエラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    const api = createFakeApi(initialTodos);
    vi.spyOn(api, "addTodo").mockRejectedValue(new Error("失敗"));
    renderApp(api);

    await screen.findAllByRole("listitem");
    await user.type(screen.getByLabelText("タスクを入力"), "散歩する");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(await screen.findByText("タスクの追加に失敗しました")).toBeTruthy();
  });

  it("編集に失敗すると対応するエラーメッセージが表示され、行は編集モードを抜けて元のタイトルのままになる", async () => {
    const user = userEvent.setup();
    const api = createFakeApi(initialTodos);
    vi.spyOn(api, "updateTodo").mockRejectedValue(new Error("失敗"));
    renderApp(api);

    await user.click(await screen.findByRole("button", { name: "牛乳を買う を編集" }));
    const input = screen.getByRole("textbox", { name: "牛乳を買う を編集" });
    await user.clear(input);
    await user.type(input, "パンを買う");
    await user.click(screen.getByRole("button", { name: "確定" }));

    expect(await screen.findByText("タスクの編集に失敗しました")).toBeTruthy();
    // 編集は失敗しても onEdit の成否を待たずに表示モードへ戻るため、元のタイトルのままになる
    expect(screen.getByText("牛乳を買う")).toBeTruthy();
    expect(screen.queryByText("パンを買う")).toBeNull();
  });
});
