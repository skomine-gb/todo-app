import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TodoInput } from "./TodoInput.tsx";

afterEach(() => {
  cleanup();
});

describe("TodoInput", () => {
  it("入力して追加ボタンを押すと onAdd が呼ばれ、入力欄が空に戻る", () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    const input = screen.getByLabelText("タスクを入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "牛乳を買う" } });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith("牛乳を買う");
    expect(input.value).toBe("");
  });

  it("空文字・空白のみでは onAdd が呼ばれない", () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    const input = screen.getByLabelText("タスクを入力");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));

    expect(onAdd).not.toHaveBeenCalled();
  });
});
