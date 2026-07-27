import type { Todo } from "../types.ts";

// タスク1件の表示を担当する部品。
// 完了切替（F-3）はチェックボックスの操作で行う。削除・編集は後続 STEP で追加する。
type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
};

export function TodoItem({ todo, onToggle }: Props) {
  return (
    <li className={todo.completed ? "todo-item completed" : "todo-item"}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-labelledby={`todo-title-${todo.id}`}
      />
      <span id={`todo-title-${todo.id}`} className="todo-title">
        {todo.title}
      </span>
    </li>
  );
}
