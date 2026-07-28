import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Todo } from "../types.ts";
import { TodoList } from "./TodoList.tsx";

afterEach(() => {
  cleanup();
});

describe("TodoList", () => {
  it("渡したタスクのタイトルがすべて表示される", () => {
    const todos: Todo[] = [
      { id: "1", title: "牛乳を買う", completed: false },
      { id: "2", title: "部屋を掃除する", completed: true },
    ];

    render(<TodoList todos={todos} onToggle={vi.fn()} />);

    expect(screen.getByText("牛乳を買う")).toBeTruthy();
    expect(screen.getByText("部屋を掃除する")).toBeTruthy();
  });

  it("0件のときは「タスクがありません」と案内が表示される", () => {
    render(<TodoList todos={[]} onToggle={vi.fn()} />);

    expect(screen.getByText("タスクがありません")).toBeTruthy();
  });

  it("チェックボックスを操作すると onToggle が対象の id で呼ばれる", async () => {
    const todos: Todo[] = [
      { id: "1", title: "牛乳を買う", completed: false },
      { id: "2", title: "部屋を掃除する", completed: true },
    ];
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(<TodoList todos={todos} onToggle={onToggle} />);

    await user.click(screen.getByRole("checkbox", { name: "部屋を掃除する" }));

    expect(onToggle).toHaveBeenCalledWith("2");
  });
});
