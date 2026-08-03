import type { Todo } from "../shared/types.ts";

// D1 の行（completed が 0/1 の INTEGER）を Todo 型（completed: boolean）へ変換する
const toTodo = (row: { id: string; title: string; completed: number }): Todo => ({
  id: row.id,
  title: row.title,
  completed: row.completed === 1,
});

// handler は D1 を直接知らず、この interface が示す操作だけに依存する
export interface TodoRepository {
  list(): Promise<Todo[]>;
  // 新規作成時は必ず completed: false になるという制約を型で表す（呼び出し側は completed を渡せない）
  create(todo: Omit<Todo, "completed">): Promise<void>;
  update(id: string, patch: { title?: string; completed?: boolean }): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export const createD1TodoRepository = (db: D1Database): TodoRepository => ({
  async list() {
    const { results } = await db
      .prepare("SELECT id, title, completed FROM todos ORDER BY rowid")
      .all<{ id: string; title: string; completed: number }>();

    return results.map(toTodo);
  },

  async create(todo) {
    await db
      .prepare("INSERT INTO todos (id, title, completed) VALUES (?, ?, 0)")
      .bind(todo.id, todo.title)
      .run();
  },

  async update(id, patch) {
    const result = await db
      .prepare(
        "UPDATE todos SET title = COALESCE(?, title), completed = COALESCE(?, completed) WHERE id = ?",
      )
      .bind(patch.title ?? null, patch.completed === undefined ? null : Number(patch.completed), id)
      .run();

    return result.meta.changes > 0;
  },

  async delete(id) {
    const result = await db.prepare("DELETE FROM todos WHERE id = ?").bind(id).run();

    return result.meta.changes > 0;
  },
});
