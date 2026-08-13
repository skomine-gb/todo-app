# 10. CI/CD（GitHub Actions）

GitHub Actions（GitHub が提供する自動実行の仕組み。リポジトリへの push などをきっかけに、GitHub 側のマシンでコマンドを実行できる）を使って、検証とデプロイを自動化する。

## 1. 目的

- **CI（継続的インテグレーション）**：PR を出す・更新するたびに、整形・Lint・型チェック・テスト・ビルドを自動実行する。「ローカルで検証を忘れたままマージしてしまう」事故を防ぎ、main を常に壊れていない状態に保つ
- **CD（継続的デリバリー）**：main が更新されたら、Cloudflare Workers へ自動デプロイする（※次のタスクで追加予定。追加後にこのドキュメントへ追記する）

## 2. トリガーと job の対応

ワークフローの定義は [.github/workflows/ci.yml](../.github/workflows/ci.yml) の 1 ファイル。

| きっかけ（トリガー）            | 実行される job |
| ------------------------------- | -------------- |
| PR の作成・更新（push のたび）  | `ci`           |
| main への push（= PR のマージ） | `ci`           |

## 3. ci job がやること

ローカルの検証コマンド（[05 §5](./05-directory-and-steps.md#5-検証コマンド)）と同じものを GitHub 上でも実行する。**CI はローカル検証の代わりではなく保険**。ローカルで通してから push する運用は変わらない。

| ステップ                                | 内容                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `actions/checkout`                      | リポジトリのコードを CI マシンに取得                                                          |
| `voidzero-dev/setup-vp`                 | Vite+ 公式アクション。vp CLI・Node.js・pnpm のセットアップと依存キャッシュをこれ 1 つで行う   |
| `vp install --frozen-lockfile`          | lockfile どおりに依存をインストール。ローカルと同じバージョンの wrangler / workerd が使われる |
| `vp run types` + `git diff --exit-code` | 型定義ファイルを再生成し、コミット済み内容とのズレ（`vp run types` のコミット忘れ）を検出     |
| `vp check`                              | 整形・Lint・型チェック                                                                        |
| `vp test`                               | フロントエンドのテスト（jsdom）                                                               |
| `vp run test:worker`                    | バックエンドのテスト（Workers ランタイム）                                                    |
| `vp build`                              | 本番と同じ手順でビルドできることを確認                                                        |

`setup-vp` が `vp` を CI マシンの PATH に入れるため、検証コマンドはローカルとまったく同じ書き方になる。バージョンの情報源はワークフローの外に 1 か所ずつ：pnpm は `package.json` の `devEngines.packageManager`、Node.js は `.node-version`（ローカルの Vite+ も CI の `setup-vp` も同じファイルを読むため、二重管理にならない）。

## 4. deploy job（自動デプロイ）

次のタスクで追加予定。main への push で `ci` job が成功したら、D1 マイグレーションの適用と `wrangler deploy` を自動実行する構成にする。

## 5. 運用メモ

- **アクションはコミット SHA で固定する**：`uses:` のタグ（`@v5` など）は上流で別のコミットに付け替え可能で、サプライチェーン攻撃の入り口になる。[pinact](https://github.com/suzuki-shunsuke/pinact) で SHA 固定しており、更新は `pinact run -u` で行う（最新化と SHA 固定をまとめてやってくれる）
- **`vp install` には `--frozen-lockfile` を明示する**：実は CI 環境では pnpm のデフォルトでも lockfile 厳守になる（`CI=true` のとき `frozen-lockfile` が既定で有効になることが pnpm の公式ドキュメントに明記されている）。それでもフラグを書くのは、「ローカルと同じ wrangler / workerd を CI でも使う」という意図を、デフォルト任せにせずコマンド自体に残すため
- **CI が red になったら**：Actions タブで失敗したステップのログを見る。ローカルで同じコマンド（`vp check` など）を実行すれば再現できるはず。ローカルで通るのに CI で落ちる場合は、依存バージョンのズレ（lockfile のコミット忘れ）や生成ファイルの差分を疑う
- **`wrangler.jsonc` の `compatibility_date`**：lockfile で固定された workerd が対応している日付にする必要がある（wrangler 更新時に注意）。CI も `--frozen-lockfile` で同じ workerd を使うため、ローカルで通れば CI でも通る
- **fork からの PR**：GitHub の仕様で Secrets は fork からの PR には渡らない。`ci` job は Secrets を使わないので問題なく動く
