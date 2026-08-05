import { Hono, type Context } from "hono";
import { z } from "zod";
import { createD1TodoRepository, type TodoRepository } from "../repository.ts";

// JSON パース失敗・非オブジェクト（null・配列・文字列など）はどちらも null にまとめる
const readJsonObjectBody = async (req: { json: () => Promise<unknown> }): Promise<unknown> => {
  const body = await req.json().catch((error: unknown) => {
    console.error("リクエストボディのJSONパースに失敗しました", error);
    return null;
  });
  return body !== null && typeof body === "object" ? body : null;
};

// エラーレスポンスを返す直前にサーバー側（Workers環境）でログを残す。
// このログはブラウザのDevTools Consoleには出ず、`wrangler tail`や本番のCloudflare側でしか見えない。
// フロント（src/front/api/todoApi.ts）には { error: message } のみを返し、詳細はサーバー側に留める。
function errorResponse(c: Context, status: 400 | 404, message: string) {
  console.error(`${c.req.method} ${c.req.path} -> ${status}: ${message}`);
  return c.json({ error: message }, status);
}

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

// handler は TodoRepository（何ができるかの約束）にだけ依存し、本物のD1かfakeかを知らない
export const createTodosRoute = (getRepo: (env: Env) => TodoRepository) =>
  new Hono<{ Bindings: Env }>()
    .get("/todos", async (c) => {
      const todos = await getRepo(c.env).list();
      return c.json(todos);
    })
    .post("/todos", async (c) => {
      const body = await readJsonObjectBody(c.req);
      if (body === null) {
        return errorResponse(c, 400, "リクエストボディが JSON ではありません");
      }

      const parsed = createTodoSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(c, 400, "title を入力してください");
      }

      await getRepo(c.env).create({
        id: crypto.randomUUID(),
        title: parsed.data.title,
      });

      return c.body(null, 201);
    })
    .patch("/todos/:id", async (c) => {
      const body = await readJsonObjectBody(c.req);
      if (body === null) {
        return errorResponse(c, 400, "リクエストボディが JSON ではありません");
      }

      const parsed = updateTodoSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(c, 400, "title または completed を正しく指定してください");
      }

      const updated = await getRepo(c.env).update(c.req.param("id"), parsed.data);
      if (!updated) {
        return errorResponse(c, 404, "指定された id のタスクが見つかりません");
      }

      return c.body(null, 204);
    })
    .delete("/todos/:id", async (c) => {
      const deleted = await getRepo(c.env).delete(c.req.param("id"));
      if (!deleted) {
        return errorResponse(c, 404, "指定された id のタスクが見つかりません");
      }

      return c.body(null, 204);
    });

export const todosRoute = createTodosRoute((env) => createD1TodoRepository(env.DB));
