import type { Todo } from "./types.ts";
import { TodoList } from "./components/TodoList.tsx";

// Step2 では状態管理（useState / useTodos）はまだ入れず、
// 一覧の表示を確認するための「仮データ」を直接用意する。
// 実際のデータ追加・保存は STEP3 以降で実装する。
const sampleTodos: Todo[] = [
  { id: "1", title: "牛乳を買う", completed: false },
  { id: "2", title: "部屋を掃除する", completed: true },
  { id: "3", title: "レポートを書く", completed: false },
];

export function App() {
  return (
    <main className="app">
      <h1>My TODO</h1>
      <TodoList todos={sampleTodos} />
    </main>
  );
}
