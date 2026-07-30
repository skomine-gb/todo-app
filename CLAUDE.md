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
- 技術スタック: React 19 / TypeScript / Vite+ / Hono / Cloudflare Workers + D1。現在は **フェーズ2（バックエンド開発とフロント結合、STEP 8〜12）** に着手中（設計は [docs/06](./docs/06-backend-architecture.md)〜[docs/09](./docs/09-backend-steps.md)）。フェーズ1 の保存先だった localStorage は STEP 11 で D1 に置き換える。
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
  - コミット・push・PR の分担は後述の「Git 操作」を参照。
- **実装とテストはセット**。実装したコードには対応するテストを必ず書く。

## 検証（STEP 完了の基準）

各 STEP の終わりに以下を通す。すべて `vp` 経由で実行する。

- `vp check` … 整形・Lint・型チェック
- `vp test` … フロントエンドのテスト（jsdom）
- `vp run test:worker` … バックエンドのテスト（Workers ランタイム）
- `vp dev` … ブラウザで動作確認（SPA + API を同時起動。http://localhost:5173 で SPA、同じポートの `/api/*` が API）

`vp check`・`vp test`・`vp run test:worker` が通って初めて STEP 完了とみなす。環境に不調があれば `vp env doctor` の出力を添えて相談する。

本番相当の確認（Static Assets 配信込み）は `vp run cf:preview`（ビルドして `wrangler dev` で起動）。`wrangler.jsonc` の bindings や `main` を変更したときは `vp run types` で `worker-configuration.d.ts` を再生成してコミットする。

## Git 操作（コミット・push・PR）

作者が手を動かして学ぶことを優先するため、Claude は Git 操作を代行しない。以下の分担を守る。

- **コミット**：Claude は `git commit` を実行しない。代わりに次の2つを提示してそこで止まる。実際のコミットは作者が手動で行う。
  1. コミット対象のファイル一覧（`git status` で確認できる範囲）
  2. コミットメッセージ案
- **push**：Claude は実行しない。作者が手動で行う。
- **PR 作成**：作成そのものは作者が手動で行う。ただし **PR のタイトルと本文は Claude が作成して提示する**。

### Issue の書式

- **タイトル**：`STEP <n>: <日本語の内容>`（例：`STEP 5: 削除・編集機能を実装する`）
- **本文**：[.github/ISSUE_TEMPLATE/step-task.yml](./.github/ISSUE_TEMPLATE/step-task.yml) のフォームに従う（目的／やること／完了条件／備考）。

### コミットメッセージの形式

- 形式：`<prefix>: <日本語の説明>`
- prefix：`feat:`（機能追加）／`fix:`（修正）／`docs:`（ドキュメント）／`test:`（テスト追加・修正）／`refactor:`（動作を変えないコード整理）／`chore:`（環境整備・雑務）など
- 例：`feat: TODO 一覧画面を実装（TodoList / TodoItem）`

### PR タイトル・本文の形式

- **タイトル**：日本語。コミットと同じ prefix の感覚でよい。
- **本文**：日本語。[.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) の見出し構成（概要／Issue #N との対応／変更内容／検証／スコープ外／関連Issue）に従う。「関連Issue」に `Closes #<Issue番号>` を入れる（マージ時に対象 Issue が自動で閉じる）。

### ラベル運用

- ラベルはコミット prefix と 1:1 対応の 6 つ：`feat` `fix` `docs` `test` `refactor` `chore`
- **Issue と PR に、ブランチの prefix と同じラベルを 1 つ付ける**（1 STEP = 1 Issue = 1 ブランチ = 1 PR なので機械的に決まる）。

### Issue・実装・PR の整合性（重要）

作業は **Issue 作成 → 実装 → PR 作成** の順で進む。PR 本文を作るときは、この3つの間で矛盾が起きないようにする。

- **Issue と照らす**：PR 本文は、対応する Issue で宣言した「やること」に沿った内容にする。`Closes #<番号>` で紐づく Issue の中身を踏まえて書く。
- **実装と照らす**：PR 本文の記述は、実際の変更内容（`git diff` で確認できる範囲）と一致させる。やっていないことを書かない／やったことを書き漏らさない。
- **ズレを見つけたら黙って埋めない**：Issue で宣言したのに実装していない項目や、Issue にないのに実装した項目があれば、PR 本文でごまかさず **その差分を作者に伝える**。Issue を直すか、実装を直すか、PR に but 書きするかは作者が判断する。

## ディレクトリ構成（`src/` と `test/` が実装対象）

単一の Cloudflare Workers プロジェクトに SPA と API Worker を同居させる構成（参考: [skanehira/fullstack-worker-template](https://github.com/skanehira/fullstack-worker-template)）。`@cloudflare/vite-plugin` が `vp dev` / `vp build` で両方をまとめて面倒を見る。

```
src/
├── front/            React SPA（フロントエンド）
│   ├── main.tsx      起動エントリ（用意済み・触らない）
│   ├── App.tsx       全体のまとめ役
│   ├── style.css     見た目
│   ├── hooks/        状態の仕組み（useTodos など）
│   └── components/   画面の部品（TodoInput / TodoList / TodoItem）
├── server/           Hono の API Worker（wrangler.jsonc の main）
│   ├── index.ts      basePath("/api") でルートをまとめる
│   └── routes/       エンドポイントごとのルート定義（health など）
└── shared/
    └── types.ts      front / server で共有する型（Todo 型）
test/worker/          バックエンドのテスト（@cloudflare/vitest-pool-workers。vitest を直接 import する）
```

- 型は `src/shared/types.ts` に集約、部品は `front/components/`、状態ロジックは `front/hooks/` に置く。
- localStorage の保存・読み込みは `front/hooks/useTodos.ts` の 1 か所に集約する。
- フロントのテストは実装と同じディレクトリに置く（コロケーション）。バックエンドのテストだけ `test/worker/` に置く（Workers ランタイムで動かすため設定が別）。
- 本番は Worker が `dist/client`（SPA のビルド成果物）を Cloudflare Static Assets として配信する単一デプロイ（`wrangler.jsonc` の `assets`）。
