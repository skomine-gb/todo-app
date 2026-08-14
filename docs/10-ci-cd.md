# 10. CI/CD（GitHub Actions）

GitHub Actions（GitHub が提供する自動実行の仕組み。リポジトリへの push などをきっかけに、GitHub 側のマシンでコマンドを実行できる）を使って、検証とデプロイを自動化する。

## 1. 目的

- **CI（継続的インテグレーション）**：PR を出す・更新するたびに、整形・Lint・型チェック・テスト・ビルドを自動実行する。「ローカルで検証を忘れたままマージしてしまう」事故を防ぎ、main を常に壊れていない状態に保つ
- **CD（継続的デリバリー）**：main が更新されたら（= PR がマージされたら）、Cloudflare Workers へ自動デプロイする。手動デプロイの「やり忘れ」「手順ミス」をなくし、main と本番を常に一致させる

## 2. トリガーと job の対応

ワークフローの定義は [ci.yml](../.github/workflows/ci.yml)（検証）と [deploy.yml](../.github/workflows/deploy.yml)（デプロイ）の 2 ファイル。分けるのは可読性のため —— デプロイは step が増えやすく、1 ファイルに同居させると肥大化する。

「CI が通ったら CD」は `workflow_run` トリガー（別ワークフローの完了をきっかけに起動する仕組み）で実現している。deploy.yml は「`CI` という名前のワークフローが main で完了した」ことを受けて起動し、job の `if` で **CI が成功したときだけ**デプロイに進む。注意点が 2 つ：

- `types: completed` は CI が**失敗して完了したときも発火する**（「完了」であって「成功」ではない）。成功判定は deploy.yml の job の `if`（`workflow_run.conclusion == 'success'`）が担っている
- `branches: [main]` フィルタは「CI を起動した **head ブランチの名前**」で判定されるため、**fork の main ブランチから PR を出されると、その PR の CI 完了でも deploy.yml が起動しうる**。job の `if` で「push（= main へのマージ）で走った CI」（`workflow_run.event == 'push'`）に絞ることで、部外者の PR が本番デプロイを発火させる経路を塞いでいる
- `workflows: [CI]` は ci.yml の `name` への**文字列参照**。名前を変えるときは両ファイルを揃える（ズレるとデプロイが黙って動かなくなる）

| きっかけ（トリガー）            | 実行されるワークフロー                                     |
| ------------------------------- | ---------------------------------------------------------- |
| PR の作成・更新（push のたび）  | `ci`（ci.yml）                                             |
| main への push（= PR のマージ） | `ci`（ci.yml）→ 成功したら `deploy`（deploy.yml → §4）     |
| Actions タブからの手動実行      | `deploy`（deploy.yml。main ブランチのみ。使いどころは §5） |

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

[deploy.yml](../.github/workflows/deploy.yml) は、main で `CI` が成功したとき（`workflow_run`。§2）と手動実行（`workflow_dispatch`）で動く。検証は起動条件である CI が済ませているため、deploy はビルドとデプロイに専念する。手動実行は任意のブランチから起動できてしまうため、main 以外は job の `if` で skip する（事故防止のガードで、厳密な強制ではない。強制が必要になったら GitHub Environments の deployment branches 制限で「main からしかデプロイできない」をサーバー側に持たせる）。

| ステップ                                           | 内容                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| checkout〜`vp install`                             | `ci` job（[§3](#3-ci-job-がやること)）と同じセットアップ。**CI が検証したコミット**（`workflow_run.head_sha`）を取得する |
| `vp build`                                         | デプロイする成果物を作る（`dist/client` = SPA、`dist/todo_app` = Worker 本体）                                           |
| `vp exec wrangler d1 migrations apply DB --remote` | 本番 D1 に未適用のマイグレーションだけを適用（[07 §3](./07-db-schema.md)）                                               |
| `vp exec wrangler deploy`                          | Worker と SPA（Static Assets）を本番へデプロイ                                                                           |

設計上のポイント：

- **wrangler は `vp exec` で直接実行する**：`vp install` で node_modules に入った lockfile どおりの wrangler が使われ、テスト・ローカル・デプロイのすべてが同じバージョンになる（二重管理にならない）。§5 の復旧コマンドとも完全に同じ書き方。当初は Cloudflare 公式の [wrangler-action](https://github.com/cloudflare/wrangler-action) を使っていたが、このプロジェクトでは動かない —— アクションは pnpm か npm で wrangler を起動しようとするが、ランナーに pnpm コマンドはなく（Vite+ は pnpm を内部管理していて PATH に公開しない）、npm は package.json の `devEngines.packageManager: pnpm` の宣言を強制して実行を拒否する（`EBADDEVENGINES`。npm 11.17 で確認）
- **DB は binding 名で指定**：`d1 migrations apply DB` の `DB` は wrangler.jsonc の binding 名。データベース名（`todo-app-db`）を書き写すと二重管理になるうえ、名前が config とズレたとき wrangler はアカウント内を名前で検索するため、古い DB に黙って適用される事故がありうる
- **マイグレーション → デプロイの順**：新しいコードは新しいスキーマを前提に動くため、先にスキーマを合わせる。ただしこの順序にも「適用完了からデプロイ完了までの間、**旧コードが新スキーマの上で動く**」窓が残る（deploy 失敗時はその状態が続く）。そこで運用ルールとして、**マイグレーションは既存コードでも動く形（後方互換・追加的）で書く**。列の rename や drop が必要になったら、1 回のマイグレーションでやらず「新列を追加 → コードを移行 → 後続 STEP で旧列を削除」と分割する
- **認証は Secrets**：リポジトリの Secrets に登録した `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を、wrangler を実行するステップの `env` として渡す（wrangler は環境変数から認証情報を読む）。ローカルの `wrangler login`（ブラウザ認証）は CI では使えないため、API トークン方式を使う
- **デプロイ中の自動キャンセルはされない**：`cancel-in-progress: false` で、走行中のデプロイは新しい run に割り込まれない（設定と解説は [deploy.yml](../.github/workflows/deploy.yml) 冒頭の concurrency コメント）。ただし絶対ではなく、job の timeout（15 分）や Actions 画面からの手動 Cancel では途中で止まりうる。止まった場合は §5 の「デプロイが red になったら」に従って復旧する

手動デプロイの手順（notes/ のデプロイ手順メモ）は、初回セットアップやトラブル時の切り分け用として引き続き有効。

## 5. 運用メモ

- **生成ファイル（`worker-configuration.d.ts`）の鮮度チェックは pre-push フックで行う**：[.vite-hooks/pre-push](../.vite-hooks/pre-push) が push の直前に `vp run types` を実行し、コミット済み内容とのズレ（`wrangler.jsonc` 変更後のコミット忘れ）を検出する。CI で数分待って気づくより手元で数秒で気づく方が速い、というレビュー指摘（シフトレフト）による。フックは `--no-verify` で飛ばせるが、型定義が古い場合の多くは CI の `vp check`（型チェック）が別途エラーにする
- **アクションはコミット SHA で固定する**：`uses:` のタグ（`@v5` など）は上流で別のコミットに付け替え可能で、サプライチェーン攻撃の入り口になる。[pinact](https://github.com/suzuki-shunsuke/pinact) で SHA 固定しており、更新は `pinact run -u` で行う（最新化と SHA 固定をまとめてやってくれる）
- **`vp install` には `--frozen-lockfile` を明示する**：実は CI 環境では pnpm のデフォルトでも lockfile 厳守になる（`CI=true` のとき `frozen-lockfile` が既定で有効になることが pnpm の公式ドキュメントに明記されている）。それでもフラグを書くのは、「ローカルと同じ wrangler / workerd を CI でも使う」という意図を、デフォルト任せにせずコマンド自体に残すため
- **CI が red になったら**：Actions タブで失敗したステップのログを見る。ローカルで同じコマンド（`vp check` など）を実行すれば再現できるはず。ローカルで通るのに CI で落ちる場合は、依存バージョンのズレ（lockfile のコミット忘れ）や生成ファイルの差分を疑う
- **`wrangler.jsonc` の `compatibility_date`**：lockfile で固定された workerd が対応している日付にする必要がある（wrangler 更新時に注意）。CI も `--frozen-lockfile` で同じ workerd を使うため、ローカルで通れば CI でも通る
- **fork からの PR**：GitHub の仕様で Secrets は fork からの PR には渡らない。`ci` job は Secrets を使わないので問題なく動く。deploy.yml は fork の main ブランチからの PR の CI 完了でも起動しうるが（§2）、job の `if`（`workflow_run.event == 'push'`）で skip されるため、デプロイには進まない
- **デプロイが red になったら**：Worker は直前のデプロイのまま残るが、**マイグレーションは適用済みの可能性がある**。Actions のログでどちらのステップで失敗したかをまず確認する
  - マイグレーション適用の失敗 → 適用済みの分だけスキーマが進んでいる可能性がある（複数ファイルは 1 つずつ順に適用され、失敗したファイルは「適用済み」と記録されない）。後方互換ルール（§4）を守っていれば旧コードはそのまま動く。原因を直して再マージすれば、未適用のものだけが再適用される
  - deploy の失敗 → 本番が「新スキーマ × 旧コード」になっている。後方互換ルール（§4）を守っていれば動き続けるが、**速やかに再デプロイする**。Actions タブで Deploy ワークフローを「Run workflow」から手動実行するのが確実（最新の main をビルドしてデプロイし直せる）。ただし**手動実行には CI 成功のチェックがない**ため、実行前に main の最新コミットの CI が green であることを確認する。**ブランチは必ず main を選ぶ** —— 別のブランチを選ぶと job が skip されて run は green に見えるが、何もデプロイされていない。ローカルからなら `vp run deploy`（マイグレーションの手動適用は `vp exec wrangler d1 migrations apply DB --remote`）
  - **古い run の「Re-run」で復旧しない**：Re-run はその run の（古い）コミットをビルドしてデプロイするため、より新しいデプロイが完了していた場合に本番が巻き戻る。やり直しは上記の手動実行（最新の main が対象）で行う
