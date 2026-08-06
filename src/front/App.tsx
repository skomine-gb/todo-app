import { TodoInput } from "./components/TodoInput.tsx";
import { TodoList } from "./components/TodoList.tsx";
import { useTodos } from "./hooks/useTodos.ts";

export function App() {
  const {
    todos,
    hasData,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    isLoading,
    error,
    actionError,
    isMutating,
  } = useTodos();

  const completedCount = todos.filter((todo) => todo.completed).length;
  const incompleteCount = todos.length - completedCount;

  return (
    <main className="app">
      <h1>My TODO</h1>
      {actionError && (
        <p className="todo-error-banner" role="alert">
          {actionError}
        </p>
      )}
      <TodoInput onAdd={addTodo} disabled={isMutating} />
      {isLoading && <p className="todo-loading">読み込み中…</p>}
      {!isLoading && !hasData && error && (
        <p className="todo-error-banner" role="alert">
          読み込みに失敗しました
        </p>
      )}
      {!isLoading && hasData && (
        <>
          {error && (
            <p className="todo-error-banner" role="alert">
              最新の状態を取得できませんでした
            </p>
          )}
          {todos.length > 0 && (
            <p className="todo-summary">
              全{todos.length}件（未完了{incompleteCount}件・完了{completedCount}件）
            </p>
          )}
          <TodoList
            todos={todos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEdit={editTodo}
            disabled={isMutating}
          />
        </>
      )}
    </main>
  );
}
