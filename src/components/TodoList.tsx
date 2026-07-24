import type { Todo } from "../types.ts";
import { TodoItem } from "./TodoItem.tsx";

// 一覧のまとめ役。渡されたタスクの数だけ TodoItem を並べる。
// タスクが0件のときは案内メッセージを表示する（要件 F-2）。
type Props = {
  todos: Todo[];
};

export function TodoList({ todos }: Props) {
  if (todos.length === 0) {
    return <p className="todo-empty">タスクがありません</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
