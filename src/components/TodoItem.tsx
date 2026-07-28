import { useState } from "react";
import type { Todo } from "../types.ts";

// タスク1件の表示を担当する部品。
// 完了切替（F-3）はチェックボックスの操作で行う。削除（F-4）はボタン1つで即座に反映し、
// 編集（F-5）は行全体を入力欄に切り替えるインライン編集で行う。
type Props = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
};

export function TodoItem({ todo, onToggle, onDelete, onEdit }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(todo.title);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setDraftTitle(todo.title);
    setError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = draftTitle.trim();
    if (title === "") {
      setError("タスクを入力してください");
      return;
    }

    onEdit(todo.id, title);
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <li className="todo-item">
        <form className="todo-edit-form" onSubmit={handleEditSubmit}>
          <input
            type="text"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            aria-label={`${todo.title} を編集`}
          />
          <button type="submit">確定</button>
          <button type="button" onClick={cancelEditing}>
            キャンセル
          </button>
          {error && (
            <p className="todo-input-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </li>
    );
  }

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
      <div className="todo-item-actions">
        <button type="button" onClick={startEditing} aria-label={`${todo.title} を編集`}>
          編集
        </button>
        <button type="button" onClick={() => onDelete(todo.id)} aria-label={`${todo.title} を削除`}>
          削除
        </button>
      </div>
    </li>
  );
}
