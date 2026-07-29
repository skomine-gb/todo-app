import type { Todo } from "./types.ts";
import { TodoInput } from "./components/TodoInput.tsx";
import { TodoList } from "./components/TodoList.tsx";
import { useTodos } from "./hooks/useTodos.ts";

// 初期表示用の仮データ。永続化（localStorage）は STEP6 で useTodos に追加する。
const initialTodos: Todo[] = [
  { id: "1", title: "牛乳を買う", completed: false },
  { id: "2", title: "部屋を掃除する", completed: true },
  { id: "3", title: "レポートを書く", completed: false },
];

export function App() {
  const { todos, addTodo, toggleTodo, deleteTodo, editTodo } = useTodos(initialTodos);

  return (
    <main className="app">
      <h1>My TODO</h1>
      <TodoInput onAdd={addTodo} />
      <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={editTodo} />
    </main>
  );
}
