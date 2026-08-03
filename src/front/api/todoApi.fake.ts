import type { Todo } from "../../shared/types.ts";
import type { TodoApi } from "./todoApi.ts";

// テスト用のインメモリ偽実装。fetch/HTTPを一切介さず、渡した初期データを
// メモリ上で読み書きするだけなので、useTodos.test.tsx・App.test.tsx の両方から
// 同じ形で使い回せる。
export function createFakeApi(initial: Todo[]): TodoApi {
  let todos = initial.map((todo) => ({ ...todo }));

  return {
    fetchTodos: async () => todos,

    addTodo: async (title) => {
      todos = [...todos, { id: crypto.randomUUID(), title, completed: false }];
    },

    updateTodo: async (id, patch) => {
      todos = todos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo));
    },

    deleteTodo: async (id) => {
      todos = todos.filter((todo) => todo.id !== id);
    },
  };
}
