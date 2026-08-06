import { useState } from "react";

// 入力欄と追加ボタンを担当する部品。
// 空文字（空白のみ含む）は追加せず、追加できたときだけ入力欄を空に戻す（要件 F-1）。
// disabled は他の操作(追加/更新/削除/編集)が実行中であることを表す。操作を1つずつ
// 順番に処理させるため、実行中は入力欄・ボタンの両方を無効化する。
type Props = {
  onAdd: (title: string) => void;
  disabled?: boolean;
};

export function TodoInput({ onAdd, disabled = false }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;

    const title = value.trim();
    if (title === "") {
      setError("タスクを入力してください");
      return;
    }

    setError(null);
    onAdd(title);
    // onAddの成否を待たずに無条件でクリアする。失敗時は useTodos の actionError が
    // 画面上部に汎用メッセージを出す(STEP12のスコープ)ので、入力内容の保持はしない。
    setValue("");
  };

  return (
    <form className="todo-input-form" onSubmit={handleSubmit}>
      <div className="todo-input-row">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="タスクを入力..."
          aria-label="タスクを入力"
          disabled={disabled}
        />
        <button type="submit" disabled={disabled}>
          追加
        </button>
      </div>
      {error && (
        <p className="todo-input-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
