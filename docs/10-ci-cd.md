# 10. CI/CD（GitHub Actions）

GitHub Actions（GitHub が提供する自動実行の仕組み。リポジトリへの push などをきっかけに、GitHub 側のマシンでコマンドを実行できる）を使って、検証とデプロイを自動化する。

## 1. 目的

- **CI（継続的インテグレーション）**：PR を出す・更新するたびに、整形・Lint・型チェック・テスト・ビルドを自動実行する。「ローカルで検証を忘れたままマージしてしまう」事故を防ぎ、main を常に壊れていない状態に保つ
- **CD（継続的デリバリー）**：main が更新されたら（= PR がマージされたら）、Cloudflare Workers へ自動デプロイする。手動デプロイの「やり忘れ」「手順ミス」をなくし、main と本番を常に一致させる

## 2. トリガーと job の対応

ワークフローの定義は [.github/workflows/ci-cd.yml](../.github/workflows/ci-cd.yml) の 1 ファイル。CI と CD を同じファイルに置くのは、「`ci` job が成功したときだけ `deploy` job を動かす」という依存関係（`needs: ci`）が同一ワークフロー内でしか書けないため。ファイルを分ける場合は `workflow_run` トリガーでワークフロー名の文字列頼みに連携することになり、壊れやすく読みにくい。

| きっかけ（トリガー）            | 実行される job                     |
| ------------------------------- | ---------------------------------- |
| PR の作成・更新（push のたび）  | `ci`                               |
| main への push（= PR のマージ） | `ci` → 成功したら `deploy`（→ §4） |

## 3. ci job がやること

ローカルの検証コマンド（[05 §5](./05-directory-and-steps.md#5-検証コマンド)）と同じものを GitHub 上でも実行する。**CI はローカル検証の代わりではなく保険**。ローカルで通してから push する運用は変わらない。

| ステップ                       | 内容                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `actions/checkout`             | リポジトリのコードを CI マシンに取得                                                          |
| `voidzero-dev/setup-vp`        | Vite+ 公式アクション。vp CLI・Node.js・pnpm のセットアップと依存キャッシュをこれ 1 つで行う   |
| `vp install --frozen-lockfile` | lockfile どおりに依存をインストール。ローカルと同じバージョンの wrangler / workerd が使われる |
| `vp check`                     | 整形・Lint・型チェック                                                                        |
| `vp test`                      | フロントエンドのテスト（jsdom）                                                               |
| `vp run test:worker`           | バックエンドのテスト（Workers ランタイム）                                                    |
| `vp build`                     | 本番と同じ手順でビルドできることを確認                                                        |

`setup-vp` が `vp` を CI マシンの PATH に入れるため、検証コマンドはローカルとまったく同じ書き方になる。バージョンの情報源はワークフローの外に 1 か所ずつ：pnpm は `package.json` の `devEngines.packageManager`、Node.js は `.node-version`（ローカルの Vite+ も CI の `setup-vp` も同じファイルを読むため、二重管理にならない）。

## 4. deploy job（自動デプロイ）

main への push（= PR のマージ）で `ci` job が成功したときだけ実行される（`needs: ci` + `if: github.event_name == 'push'`）。検証を通ったコードだけが本番に届く。

| ステップ                                                        | 内容                                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| checkout〜`vp install`                                          | `ci` job と同じセットアップ（job ごとに別マシンで動くため再セットアップが必要） |
| `vp build`                                                      | デプロイする成果物を作る（`dist/client` = SPA と Worker 本体）                  |
| `wrangler-action`（`d1 migrations apply todo-app-db --remote`） | 本番 D1 に未適用のマイグレーションだけを適用（[07 §3](./07-db-schema.md)）      |
| `wrangler-action`（`deploy`）                                   | Worker と SPA（Static Assets）を本番へデプロイ                                  |

設計上のポイント：

- **[cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action) を使う**：Cloudflare 公式のアクションで、API トークンの受け渡しと wrangler の実行を面倒見てくれる。`wranglerVersion` は指定しない —— `vp install` で node_modules に入った lockfile どおりの wrangler をアクションがそのまま使うため、テスト・ローカル・デプロイのすべてが同じバージョンになる（二重管理にならない）
- **マイグレーション → デプロイの順**：新しいコードは新しいスキーマを前提に動くため、先にスキーマを合わせる。逆順だと、新コードが古いテーブルを触る瞬間ができてしまう
- **認証は Secrets**：リポジトリの Secrets に登録した `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を wrangler-action に渡す。ローカルの `wrangler login`（ブラウザ認証）は CI では使えないため、API トークン方式を使う
- **デプロイは途中でキャンセルされない**：concurrency の `cancel-in-progress` は main への push では false（§5 の全文コメント参照）。デプロイが途中で打ち切られて本番が中途半端になる事態を防ぐ

手動デプロイの手順（notes/ のデプロイ手順メモ）は、初回セットアップやトラブル時の切り分け用として引き続き有効。

## 5. 運用メモ

- **生成ファイル（`worker-configuration.d.ts`）の鮮度チェックは pre-push フックで行う**：[.vite-hooks/pre-push](../.vite-hooks/pre-push) が push の直前に `vp run types` を実行し、コミット済み内容とのズレ（`wrangler.jsonc` 変更後のコミット忘れ）を検出する。CI で数分待って気づくより手元で数秒で気づく方が速い、というレビュー指摘（シフトレフト）による。フックは `--no-verify` で飛ばせるが、型定義が古い場合の多くは CI の `vp check`（型チェック）が別途エラーにする
- **アクションはコミット SHA で固定する**：`uses:` のタグ（`@v5` など）は上流で別のコミットに付け替え可能で、サプライチェーン攻撃の入り口になる。[pinact](https://github.com/suzuki-shunsuke/pinact) で SHA 固定しており、更新は `pinact run -u` で行う（最新化と SHA 固定をまとめてやってくれる）
- **`vp install` には `--frozen-lockfile` を明示する**：実は CI 環境では pnpm のデフォルトでも lockfile 厳守になる（`CI=true` のとき `frozen-lockfile` が既定で有効になることが pnpm の公式ドキュメントに明記されている）。それでもフラグを書くのは、「ローカルと同じ wrangler / workerd を CI でも使う」という意図を、デフォルト任せにせずコマンド自体に残すため
- **CI が red になったら**：Actions タブで失敗したステップのログを見る。ローカルで同じコマンド（`vp check` など）を実行すれば再現できるはず。ローカルで通るのに CI で落ちる場合は、依存バージョンのズレ（lockfile のコミット忘れ）や生成ファイルの差分を疑う
- **`wrangler.jsonc` の `compatibility_date`**：lockfile で固定された workerd が対応している日付にする必要がある（wrangler 更新時に注意）。CI も `--frozen-lockfile` で同じ workerd を使うため、ローカルで通れば CI でも通る
- **fork からの PR**：GitHub の仕様で Secrets は fork からの PR には渡らない。`ci` job は Secrets を使わないので問題なく動く。Secrets を使う `deploy` job は `if: github.event_name == 'push'` により PR ではそもそも実行されない
- **デプロイが red になったら**：本番は直前のデプロイのまま残る（失敗したデプロイで上書きされることはない）。Actions のログで「マイグレーション適用」と「deploy」のどちらで失敗したかを確認し、ローカルから同じコマンド（`wrangler d1 migrations apply todo-app-db --remote` / `vp run deploy`）で切り分けられる
