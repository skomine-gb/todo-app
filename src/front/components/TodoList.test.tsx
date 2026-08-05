import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Todo } from "../../shared/types.ts";
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

    render(<TodoList todos={todos} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);

    expect(screen.getByText("牛乳を買う")).toBeTruthy();
    expect(screen.getByText("部屋を掃除する")).toBeTruthy();
  });

  it("0件のときは「タスクがありません」と案内が表示される", () => {
    render(<TodoList todos={[]} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);

    expect(screen.getByText("タスクがありません")).toBeTruthy();
  });

  it("チェックボックスを操作すると onToggle が対象の id で呼ばれる", async () => {
    const todos: Todo[] = [
      { id: "1", title: "牛乳を買う", completed: false },
      { id: "2", title: "部屋を掃除する", completed: true },
    ];
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(<TodoList todos={todos} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} />);

    await user.click(screen.getByRole("checkbox", { name: "部屋を掃除する" }));

    expect(onToggle).toHaveBeenCalledWith("2", false);
  });

  it("削除ボタンを押すと onDelete が対象の id で呼ばれる", async () => {
    const todos: Todo[] = [
      { id: "1", title: "牛乳を買う", completed: false },
      { id: "2", title: "部屋を掃除する", completed: true },
    ];
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(<TodoList todos={todos} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "部屋を掃除する を削除" }));

    expect(onDelete).toHaveBeenCalledWith("2");
  });

  it("編集して確定すると onEdit が対象の id と新しいタイトルで呼ばれる", async () => {
    const todos: Todo[] = [
      { id: "1", title: "牛乳を買う", completed: false },
      { id: "2", title: "部屋を掃除する", completed: true },
    ];
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(<TodoList todos={todos} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);

    await user.click(screen.getByRole("button", { name: "部屋を掃除する を編集" }));
    const input = screen.getByRole("textbox", { name: "部屋を掃除する を編集" });
    await user.clear(input);
    await user.type(input, "部屋とキッチンを掃除する");
    await user.click(screen.getByRole("button", { name: "確定" }));

    expect(onEdit).toHaveBeenCalledWith("2", "部屋とキッチンを掃除する");
  });
});
