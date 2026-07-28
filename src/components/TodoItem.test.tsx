import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Todo } from "../types.ts";
import { TodoItem } from "./TodoItem.tsx";

afterEach(() => {
  cleanup();
});

describe("TodoItem", () => {
  it("タスクのタイトルが表示される", () => {
    const todo: Todo = { id: "1", title: "牛乳を買う", completed: false };

    render(<TodoItem todo={todo} onToggle={vi.fn()} />);

    expect(screen.getByText("牛乳を買う")).toBeTruthy();
  });

  it("完了タスクには打ち消し線用の completed クラスが付く", () => {
    const todo: Todo = { id: "1", title: "部屋を掃除する", completed: true };

    const { container } = render(<TodoItem todo={todo} onToggle={vi.fn()} />);

    const item = container.querySelector("li");
    expect(item?.classList.contains("completed")).toBe(true);
  });

  it("未完了タスクには completed クラスが付かない", () => {
    const todo: Todo = { id: "1", title: "牛乳を買う", completed: false };

    const { container } = render(<TodoItem todo={todo} onToggle={vi.fn()} />);

    const item = container.querySelector("li");
    expect(item?.classList.contains("completed")).toBe(false);
  });

  it("チェックボックスを操作すると onToggle が対象の id で呼ばれる", async () => {
    const todo: Todo = { id: "1", title: "牛乳を買う", completed: false };
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(<TodoItem todo={todo} onToggle={onToggle} />);

    await user.click(screen.getByRole("checkbox", { name: todo.title }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("1");
  });
});
