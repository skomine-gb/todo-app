# GitHub Actions のセキュリティ（サプライチェーン攻撃と SHA 固定）

> これは **提出しない個人用のメモ** です。PR #33 のレビューで指摘された「pinact でアクションを固定する」対応のときに学んだことをまとめています。CI 全体の設計は [docs/10-ci-cd.md](../docs/10-ci-cd.md) を参照。

---

## サプライチェーン攻撃とは

自分のコードを直接攻撃するのではなく、**自分が依存している供給元（サプライチェーン）を乗っ取って、そこ経由で攻撃する**手口。GitHub Actions の文脈では「みんなが `uses:` で使っているアクションのリポジトリを乗っ取る」ことを指す。

## なぜタグ指定（`@v5` など）が危険なのか

```yaml
- uses: actions/checkout@v5 # ← これはタグ
```

- git のタグは「この名前はこのコミットを指す」という**ただのラベル**で、リポジトリの管理者が**後から別のコミットに付け替えられる**
- つまり `@v1.17.0` のようにバージョンを細かく指定していても、明日には中身が別のコードになっているかもしれない
- アクションのリポジトリが乗っ取られてタグを付け替えられると、自分の CI は**次の実行から自動的に攻撃者のコードを実行**してしまう
- CI の中にはトークンや Secrets があるので、盗まれると被害が大きい

### 実際に起きた事件

2025年3月、`tj-actions/changed-files` という人気アクション（数万リポジトリが利用）が乗っ取られ、既存のバージョンタグが一斉に悪意あるコミットへ付け替えられた。CI の秘密情報をログに流出させる攻撃だった。「バージョンタグを指定していても防げない」ことが広く知られるきっかけになった。

## 対策: コミット SHA で固定する

```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

- コミット SHA は**コミット内容そのものから計算される不変の ID**。タグと違って誰にも付け替えられない
- `# v7.0.1` のコメントは人間が読むためのラベル（実行されるのは SHA の方）
- GitHub 公式のセキュリティガイドも SHA 固定を推奨している

## pinact の使い方

SHA を手で調べて書くのは大変なので、[pinact](https://github.com/suzuki-shunsuke/pinact) で自動化する。

```sh
brew install pinact   # インストール（1回だけ）
pinact run            # uses: を SHA 固定に書き換え（バージョンは据え置き）
pinact run -u         # 最新バージョンに更新してから SHA 固定（更新時はこちら）
```

- 書き換え後は `git diff` で確認してコミットする
- SHA 固定すると「タグを追って勝手に新しくなる」ことがなくなるので、**更新は意図的な操作になる**。ときどき `pinact run -u` を実行して差分を確認・コミットする運用

## SHA が本物か検証する方法（やらなくてもよいが安心）

pinact が書いた SHA が公式タグと一致するかは GitHub API で確認できる。

```sh
gh api repos/actions/checkout/git/ref/tags/v7.0.1 -q '.object | {type, sha}'
```

- `type` が `commit` ならその SHA がそのままコミット
- `type` が `tag` の場合は**注釈付きタグ**（タグ自体がオブジェクトを持つ形式）なので、もう一段たどる:

```sh
gh api repos/<owner>/<repo>/git/tags/<タグのsha> -q '.object | {type, sha}'
```

## このリポジトリでの適用状況

- `.github/workflows/ci.yml` と `deploy.yml` の全アクションを SHA 固定済み（PR #33 のレビュー対応。CD 追加時の cloudflare/wrangler-action も同様に固定）
- 運用ルールは [docs/10-ci-cd.md](../docs/10-ci-cd.md) §5 の運用メモに記載

## 参考リンク

- [pinact で GitHub Actions のバージョンを固定する（Zenn）](https://zenn.dev/shunsuke_suzuki/articles/pinact-pin-github-actions-version)
- [GitHub Actions のサプライチェーンリスク（LayerX）](https://tech.layerx.co.jp/entry/github-supplychain-risk-and-sponsorship)
