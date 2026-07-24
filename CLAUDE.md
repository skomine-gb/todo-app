<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

---

# このプロジェクトについて

React + TypeScript で **TODO アプリ** を作る学習用プロジェクト。作者は初学者で、「動くものを作る」だけでなく **仕組みを理解しながら進める** ことを目的としている。

- 設計ドキュメント: [docs/](./docs/)（要件・アーキテクチャ・データモデル・UI・実装ステップ）
- 個人メモ: [notes/](./notes/)（学習メモ・開発の進め方。※提出しない）
- 技術スタック: React 19 / TypeScript / Vite+ / localStorage（サーバー・DB は次フェーズ）
- 状態管理は React 標準の `useState` のみ。Redux などの大きなライブラリは入れない。

## 応答スタイル

- **日本語**で応答する。
- **初学者向けに、「なぜそうするか」を丁寧に説明**しながら進める。コードを出すだけで終わらせない。
- 専門用語には短い補足を添える。ただし冗長になりすぎない範囲で。

## 進め方のルール（重要）

- **勝手にコードを書き進めない**。まず方針を説明し、合意してから実装する。
- **STEP 単位で区切って進める**。先回りして複数 STEP をまとめて実装しない。実装ステップは [docs/05-directory-and-steps.md](./docs/05-directory-and-steps.md) を参照。
- 基本単位は **1 STEP = 1 Issue = 1 ブランチ = 1 PR**（詳細は [notes/開発の進め方.md](./notes/開発の進め方.md)）。
  - ブランチ名は `feat/` `docs/` `fix/` などのプレフィックスを揃える。
  - コミットメッセージ・PR 本文は日本語。PR 本文に `Closes #<Issue番号>` を入れる。
- **実装とテストはセット**。実装したコードには対応するテストを必ず書く。

## 検証（STEP 完了の基準）

各 STEP の終わりに以下を通す。すべて `vp` 経由で実行する。

- `vp check` … 整形・Lint・型チェック
- `vp test` … テスト実行
- `vp dev` … ブラウザで動作確認

`vp check` と `vp test` が通って初めて STEP 完了とみなす。環境に不調があれば `vp env doctor` の出力を添えて相談する。

## ディレクトリ構成（`src/` が実装対象）

```
src/
├── main.tsx          起動エントリ（用意済み・触らない）
├── App.tsx           全体のまとめ役
├── types.ts          Todo 型
├── style.css         見た目
├── hooks/            状態の仕組み（useTodos など）
└── components/       画面の部品（TodoInput / TodoList / TodoItem）
```

- 型は `types.ts` に集約、部品は `components/`、状態ロジックは `hooks/` に置く。
- localStorage の保存・読み込みは `hooks/useTodos.ts` の 1 か所に集約する。
