# 03. データモデル — タスクのデータ構造と永続化

## 1. タスク1件のデータ項目

要件（[01](./01-requirements.md)）の5機能に必要な項目だけを持つ。期限・カテゴリなどはスコープ外のため持たない。

| 項目        | 意味                                 | 型        | 例               |
| ----------- | ------------------------------------ | --------- | ---------------- |
| `id`        | タスクを一意に識別する目印           | `string`  | `"3f2504e0-..."` |
| `title`     | タスクの内容（編集で書き換える対象） | `string`  | `"牛乳を買う"`   |
| `completed` | 完了しているか                       | `boolean` | `false`          |

`id` は、同じ `title` のタスクがあっても1件ずつを区別し、完了切り替え・削除・編集の対象を特定するために使う。生成にはブラウザ標準の `crypto.randomUUID()` を用いる。

## 2. 型定義

```ts
// タスク1件
export type Todo = {
  id: string; // 識別子（生成: crypto.randomUUID()）
  title: string; // タスクの内容
  completed: boolean; // 完了なら true
};
```

タスク一覧は、この `Todo` を並べた配列 `Todo[]` で表す。各操作が状態（`Todo[]`）に対して何をするか：

| 操作                | 状態への変更                                    |
| ------------------- | ----------------------------------------------- |
| 追加（F-1）         | 新しい `Todo`（`completed: false`）を配列に足す |
| 完了チェック（F-3） | 対象 `id` の `completed` を反転する             |
| 削除（F-4）         | 対象 `id` の要素を配列から取り除く              |
| 編集（F-5）         | 対象 `id` の `title` を新しい文字列に置き換える |

## 3. 永続化（localStorage）

localStorageは文字列しか保存できないため、JSONに変換して読み書きする。保存キーは `"todos"` とする。

```ts
// 保存
localStorage.setItem("todos", JSON.stringify(todos));

// 読み込み（未保存なら空配列）
const saved = localStorage.getItem("todos");
const todos: Todo[] = saved ? JSON.parse(saved) : [];
```

タスク一覧が変わるたびに保存する方針とし、この読み書きは `useTodos`（[05](./05-directory-and-steps.md)）に集約する。

## 4. データのライフサイクル

```mermaid
flowchart TD
    A["入力して「追加」"] --> C["Todo を生成<br/>id=自動, title=入力, completed=false"]
    C --> D["タスク一覧に追加"]
    D --> E["画面に表示"]
    D --> F["JSON文字列で localStorage に保存"]
    E --> G["チェック / 削除 / 編集"]
    G --> H["対象 id の要素を<br/>反転 / 除去 / title置換"]
    H --> D
```

## まとめ

- タスク1件は `id` / `title` / `completed`（型名 `Todo`）、一覧は `Todo[]`
- `id` は `crypto.randomUUID()` で採番し、完了・削除・編集の対象特定に使う
- 各操作は `Todo[]` への「追加・反転・除去・title置換」で表現する
- localStorageへはJSON文字列（キー `"todos"`）で永続化する
