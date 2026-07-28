import { afterEach, describe, expect, it } from "vite-plus/test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App.tsx";

afterEach(() => {
  cleanup();
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

  it("削除ボタンを押すと一覧からタスクが消える", async () => {
    const user = userEvent.setup();
    render(<App />);

    const before = screen.getAllByRole("listitem").length;

    await user.click(screen.getByRole("button", { name: "牛乳を買う を削除" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(before - 1);
    expect(screen.queryByText("牛乳を買う")).toBeNull();
  });

  it("編集して確定すると表示テキストが更新される", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "牛乳を買う を編集" }));
    const input = screen.getByRole("textbox", { name: "牛乳を買う を編集" });
    await user.clear(input);
    await user.type(input, "パンを買う");
    await user.click(screen.getByRole("button", { name: "確定" }));

    expect(screen.queryByText("牛乳を買う")).toBeNull();
    expect(screen.getByText("パンを買う")).toBeTruthy();
  });

  it("編集で空文字にしようとすると変更されず、エラーが表示される", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "牛乳を買う を編集" }));
    const input = screen.getByRole("textbox", { name: "牛乳を買う を編集" });
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "確定" }));

    expect(screen.getByRole("alert").textContent).toBe("タスクを入力してください");
  });
});
