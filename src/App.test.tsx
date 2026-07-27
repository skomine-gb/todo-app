import { afterEach, describe, expect, it } from "vite-plus/test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "./App.tsx";

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("入力して追加すると一覧の件数が1つ増え、タイトルが表示される", () => {
    render(<App />);

    const before = screen.getAllByRole("listitem").length;

    fireEvent.change(screen.getByLabelText("タスクを入力"), {
      target: { value: "散歩する" },
    });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(before + 1);
    expect(screen.getByText("散歩する")).toBeTruthy();
  });

  it("空文字・空白のみで追加しても件数は変わらない", () => {
    render(<App />);

    const before = screen.getAllByRole("listitem").length;

    fireEvent.change(screen.getByLabelText("タスクを入力"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(before);
  });
});
