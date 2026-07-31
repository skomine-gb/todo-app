import { Hono } from "hono";
import type { Todo } from "../../shared/types.ts";

// D1 の行（completed が 0/1 の INTEGER）を Todo 型（completed: boolean）へ変換する
const toTodo = (row: { id: string; title: string; completed: number }): Todo => ({
  id: row.id,
  title: row.title,
  completed: row.completed === 1,
});

export const todosRoute = new Hono<{ Bindings: Env }>()
  .get("/todos", async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT id, title, completed FROM todos ORDER BY rowid",
    ).all<{ id: string; title: string; completed: number }>();

    return c.json(results.map(toTodo));
  })
  .post("/todos", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (body === null || typeof body !== "object") {
      return c.json({ error: "リクエストボディが JSON ではありません" }, 400);
    }

    const title = (body as Record<string, unknown>).title;
    if (typeof title !== "string" || title.trim().length === 0) {
      return c.json({ error: "title を入力してください" }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare("INSERT INTO todos (id, title, completed) VALUES (?, ?, 0)")
      .bind(id, title.trim())
      .run();

    return c.body(null, 201);
  });
