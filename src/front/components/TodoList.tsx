import type { Todo } from "../../shared/types.ts";
import { TodoItem } from "./TodoItem.tsx";

// 一覧のまとめ役。渡されたタスクの数だけ TodoItem を並べる。
// タスクが0件のときは案内メッセージを表示する（要件 F-2）。
type Props = {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
};

export function TodoList({ todos, onToggle, onDelete, onEdit }: Props) {
  if (todos.length === 0) {
    return <p className="todo-empty">タスクがありません</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}
