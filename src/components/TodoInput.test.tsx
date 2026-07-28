import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoInput } from "./TodoInput.tsx";

afterEach(() => {
  cleanup();
});

describe("TodoInput", () => {
  it("入力して追加ボタンを押すと onAdd が呼ばれ、入力欄が空に戻る", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<TodoInput onAdd={onAdd} />);

    const input = screen.getByLabelText("タスクを入力") as HTMLInputElement;
    await user.type(input, "牛乳を買う");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith("牛乳を買う");
    expect(input.value).toBe("");
  });

  it("空文字・空白のみでは onAdd が呼ばれない", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<TodoInput onAdd={onAdd} />);

    const input = screen.getByLabelText("タスクを入力");
    await user.type(input, "   ");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("空文字・空白のみで追加を押すとエラーメッセージが表示される", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<TodoInput onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.getByRole("alert").textContent).toBe("タスクを入力してください");
  });

  it("エラー表示後に有効な文字を入力して追加するとエラーメッセージが消える", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<TodoInput onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(screen.getByRole("alert")).toBeTruthy();

    await user.type(screen.getByLabelText("タスクを入力"), "牛乳を買う");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
