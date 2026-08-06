import { memo, useState } from "react";
import type { Todo } from "../../shared/types.ts";

// タスク1件の表示を担当する部品。
// 完了切替（F-3）はチェックボックスの操作で行う。削除（F-4）はボタン1つで即座に反映し、
// 編集（F-5）は行全体を入力欄に切り替えるインライン編集で行う。
// 既知の制限: 編集・削除ボタン等のアクセシブルネームは todo.title ベースのため、
// 同じタイトルのタスクが複数あると区別できない（チェックボックスも同様）。
// disabled は他の行を含めた操作(追加/更新/削除/編集)が実行中であることを表す。操作を
// 1つずつ順番に処理させるため、実行中はチェックボックス・ボタン・編集中の入力欄も無効化する。
type Props = {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  disabled?: boolean;
};

// 未変更のタスクまで再レンダリングされていたことを console.log で確認したうえで
// React.memo を追加している（判断の経緯は notes/学習メモ.md 参照）。
function TodoItemComponent({ todo, onToggle, onDelete, onEdit, disabled = false }: Props) {
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
    if (disabled) return;

    const title = draftTitle.trim();
    if (title === "") {
      setError("タスクを入力してください");
      return;
    }

    onEdit(todo.id, title);
    // onEditの成否を待たずに無条件で表示モードに戻す。失敗時は useTodos の actionError が
    // 画面上部に汎用メッセージを出す(STEP12のスコープ)ので、この行だけを編集モードに
    // 留めたり、失敗をこの行に紐づけて示したりはしない。
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
            disabled={disabled}
          />
          <button type="submit" disabled={disabled}>
            確定
          </button>
          <button type="button" onClick={cancelEditing} disabled={disabled}>
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
        onChange={() => onToggle(todo.id, !todo.completed)}
        aria-labelledby={`todo-title-${todo.id}`}
        disabled={disabled}
      />
      <span id={`todo-title-${todo.id}`} className="todo-title">
        {todo.title}
      </span>
      <div className="todo-item-actions">
        <button
          type="button"
          onClick={startEditing}
          aria-label={`${todo.title} を編集`}
          disabled={disabled}
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => onDelete(todo.id)}
          aria-label={`${todo.title} を削除`}
          disabled={disabled}
        >
          削除
        </button>
      </div>
    </li>
  );
}

export const TodoItem = memo(TodoItemComponent);
