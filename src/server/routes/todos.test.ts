import { describe, expect, it } from "vite-plus/test";
import { createTodoSchema } from "./todos.ts";

describe("createTodoSchema", () => {
  it("title の前後の空白を取り除く", () => {
    const result = createTodoSchema.safeParse({ title: "  牛乳を買う  " });

    expect(result.success).toBe(true);
    expect(result.success && result.data.title).toBe("牛乳を買う");
  });

  it("空文字の title を拒否する", () => {
    const result = createTodoSchema.safeParse({ title: "" });

    expect(result.success).toBe(false);
  });

  it("空白のみの title を拒否する", () => {
    const result = createTodoSchema.safeParse({ title: "   " });

    expect(result.success).toBe(false);
  });

  it("title が無い場合を拒否する", () => {
    const result = createTodoSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("title が文字列でない場合を拒否する", () => {
    const result = createTodoSchema.safeParse({ title: 42 });

    expect(result.success).toBe(false);
  });

  it("JSON でないボディ（null）を拒否する", () => {
    const result = createTodoSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("id / completed など余分なキーは無視される", () => {
    const result = createTodoSchema.safeParse({
      title: "牛乳を買う",
      id: "client-supplied-id",
      completed: true,
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual({ title: "牛乳を買う" });
  });
});
