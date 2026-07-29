import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Todo } from "./types.ts";
import { App } from "./App.tsx";

const initialTodos: Todo[] = [
  { id: "1", title: "牛乳を買う", completed: false },
  { id: "2", title: "部屋を掃除する", completed: true },
  { id: "3", title: "レポートを書く", completed: false },
];

beforeEach(() => {
  localStorage.setItem("todos", JSON.stringify(initialTodos));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("App", () => {
  it("入力して追加すると一覧の件数が1つ増え、タイトルが表示される", async () => {
    const user = userEvent.setup();
    render(<App />);

    const before = screen.getAllByRole("listitem").length;

    await user.type(screen.getByLabelText("タスクを入力"), "散歩する");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(before + 1);
    expect(screen.getByText("散歩する")).toBeTruthy();
  });

  it("空文字・空白のみで追加しても件数は変わらない", async () => {
    const user = userEvent.setup();
    render(<App />);

    const before = screen.getAllByRole("listitem").length;

    await user.type(screen.getByLabelText("タスクを入力"), "   ");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(before);
  });

  it("チェックボックスを操作すると完了／未完了が切り替わる", async () => {
    const user = userEvent.setup();
    render(<App />);

    const checkbox = screen.getByRole("checkbox", { name: "牛乳を買う" });
    const item = checkbox.closest("li");
    expect(item?.classList.contains("completed")).toBe(false);

    await user.click(checkbox);
    expect(item?.classList.contains("completed")).toBe(true);

    await user.click(checkbox);
    expect(item?.classList.contains("completed")).toBe(false);
  });
});
