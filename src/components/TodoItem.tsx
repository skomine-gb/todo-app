import type { Todo } from "../types.ts";

// タスク1件の表示を担当する部品。
// Step2 では「表示」だけを行い、完了切替・削除・編集の操作は後続 STEP で追加する。
type Props = {
  todo: Todo;
};

export function TodoItem({ todo }: Props) {
  return (
    <li className={todo.completed ? "todo-item completed" : "todo-item"}>
      {/* Step2 は表示のみなので、チェックボックスは操作できない（readOnly）。
          完了切替の実装は STEP4 で行う。 */}
      <input
        type="checkbox"
        checked={todo.completed}
        readOnly
        aria-labelledby={`todo-title-${todo.id}`}
      />
      <span id={`todo-title-${todo.id}`} className="todo-title">
        {todo.title}
      </span>
    </li>
  );
}
