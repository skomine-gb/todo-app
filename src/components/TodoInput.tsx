import { useState } from "react";

// 入力欄と追加ボタンを担当する部品。
// 空文字（空白のみ含む）は追加せず、追加できたときだけ入力欄を空に戻す（要件 F-1）。
type Props = {
  onAdd: (title: string) => void;
};

export function TodoInput({ onAdd }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = value.trim();
    if (title === "") {
      setError("タスクを入力してください");
      return;
    }

    setError(null);
    onAdd(title);
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
        />
        <button type="submit">追加</button>
      </div>
      {error && (
        <p className="todo-input-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
