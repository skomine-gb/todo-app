import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Todo } from "../../shared/types.ts";
import { TodoItem } from "./TodoItem.tsx";

afterEach(() => {
  cleanup();
});

describe("TodoItem", () => {
  it("タスクのタイトルが表示される", () => {
    const todo: Todo = { id: "1", title: "牛乳を買う", completed: false };

    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);

    expect(screen.getByText("牛乳を買う")).toBeTruthy();
  });

  it("完了タスクには打ち消し線用の completed クラスが付く", () => {
    const todo: Todo = { id: "1", title: "部屋を掃除する", completed: true };

    const { container } = render(
      <TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />,
    );

    const item = container.querySelector("li");
    expect(item?.classList.contains("completed")).toBe(true);
  });

  it("未完了タスクには completed クラスが付かない", () => {
    const todo: Todo = { id: "1", title: "牛乳を買う", completed: false };

    const { container } = render(
      <TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />,
    );

    const item = container.querySelector("li");
    expect(item?.classList.contains("completed")).toBe(false);
  });

  it("チェックボックスを操作すると onToggle が対象の id で呼ばれる", async () => {
    const todo: Todo = { id: "1", title: "牛乳を買う", completed: false };
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(<TodoItem todo={todo} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} />);

    await user.click(screen.getByRole("checkbox", { name: todo.title }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("1", true);
  });

  it("削除ボタンを押すと onDelete が対象の id で呼ばれる", async () => {
    const todo: Todo = { id: "1", title: "牛乳を買う", completed: false };
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "牛乳を買う を削除" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("編集ボタンを押すと入力欄に切り替わり、元のタイトルが入っている", async () => {
    const todo: Todo = { id: "1", title: "牛乳を買う", completed: false };
    const user = userEvent.setup();

    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "牛乳を買う を編集" }));

    const input = screen.getByRole("textbox", { name: "牛乳を買う を編集" }) as HTMLInputElement;
    expect(input.value).toBe("牛乳を買う");
  });

  it("編集して確定すると onEdit が新しいタイトルで呼ばれ、表示モードに戻る", async () => {
    const todo: Todo = { id: "1", title: "牛乳を買う", completed: false };
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);

    await user.click(screen.getByRole("button", { name: "牛乳を買う を編集" }));
    const input = screen.getByRole("textbox", { name: "牛乳を買う を編集" });
    await user.clear(input);
    await user.type(input, "パンを買う");
    await user.click(screen.getByRole("button", { name: "確定" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith("1", "パンを買う");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("編集して空文字で確定すると onEdit は呼ばれず、エラーが表示される", async () => {
    const todo: Todo = { id: "1", title: "", completed: false };
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);

    await user.click(screen.getByRole("button", { name: "を編集" }));
    await user.click(screen.getByRole("button", { name: "確定" }));

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("タスクを入力してください");
  });

  it("編集中にキャンセルすると onEdit は呼ばれず、元のタイトルの表示に戻る", async () => {
    const todo: Todo = { id: "1", title: "牛乳を買う", completed: false };
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);

    await user.click(screen.getByRole("button", { name: "牛乳を買う を編集" }));
    const input = screen.getByRole("textbox", { name: "牛乳を買う を編集" });
    await user.clear(input);
    await user.type(input, "パンを買う");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText("牛乳を買う")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
