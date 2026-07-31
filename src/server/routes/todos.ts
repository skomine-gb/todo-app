import { Hono } from "hono";
import { z } from "zod";
import type { Todo } from "../../shared/types.ts";

// D1 の行（completed が 0/1 の INTEGER）を Todo 型（completed: boolean）へ変換する
const toTodo = (row: { id: string; title: string; completed: number }): Todo => ({
  id: row.id,
  title: row.title,
  completed: row.completed === 1,
});

// JSON パース失敗・非オブジェクト（null・配列・文字列など）はどちらも null にまとめる
const readJsonObjectBody = async (req: { json: () => Promise<unknown> }): Promise<unknown> => {
  const body = await req.json().catch(() => null);
  return body !== null && typeof body === "object" ? body : null;
};

// trim() を通した上で1文字以上であることを検査する（空文字・空白のみを弾く）
export const createTodoSchema = z.object({
  title: z.string().trim().min(1),
});

// title・completed とも省略可能にしつつ、refine で「両方とも未指定」を拒否する
export const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => data.title !== undefined || data.completed !== undefined, {
    message: "title または completed のいずれかを指定してください",
  });

export const todosRoute = new Hono<{ Bindings: Env }>()
  .get("/todos", async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT id, title, completed FROM todos ORDER BY rowid",
    ).all<{ id: string; title: string; completed: number }>();

    return c.json(results.map(toTodo));
  })
  .post("/todos", async (c) => {
    const body = await readJsonObjectBody(c.req);
    if (body === null) {
      return c.json({ error: "リクエストボディが JSON ではありません" }, 400);
    }

    const parsed = createTodoSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "title を入力してください" }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare("INSERT INTO todos (id, title, completed) VALUES (?, ?, 0)")
      .bind(id, parsed.data.title)
      .run();

    return c.body(null, 201);
  })
  .patch("/todos/:id", async (c) => {
    const body = await readJsonObjectBody(c.req);
    if (body === null) {
      return c.json({ error: "リクエストボディが JSON ではありません" }, 400);
    }

    const parsed = updateTodoSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "title または completed を正しく指定してください" }, 400);
    }

    const { title, completed } = parsed.data;
    const result = await c.env.DB.prepare(
      "UPDATE todos SET title = COALESCE(?, title), completed = COALESCE(?, completed) WHERE id = ?",
    )
      .bind(title ?? null, completed === undefined ? null : Number(completed), c.req.param("id"))
      .run();

    if (result.meta.changes === 0) {
      return c.json({ error: "指定された id のタスクが見つかりません" }, 404);
    }

    return c.body(null, 204);
  })
  .delete("/todos/:id", async (c) => {
    const result = await c.env.DB.prepare("DELETE FROM todos WHERE id = ?")
      .bind(c.req.param("id"))
      .run();

    if (result.meta.changes === 0) {
      return c.json({ error: "指定された id のタスクが見つかりません" }, 404);
    }

    return c.body(null, 204);
  });
