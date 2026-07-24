// タスク1件
export type Todo = {
  /** 識別子。crypto.randomUUID() で採番する */
  id: string;
  title: string;
  completed: boolean;
};
