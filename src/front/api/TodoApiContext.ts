import { createContext } from "react";
import { todoApi } from "./todoApi.ts";
import type { TodoApi } from "./todoApi.ts";

// デフォルト値は本物のAPI実装。テストだけがfake実装をProviderで差し替える。
export const TodoApiContext = createContext<TodoApi>(todoApi);
