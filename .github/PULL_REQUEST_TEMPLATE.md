## 概要

<!-- このPRで何をするか、1〜2行で。対応する STEP 番号も書く -->

対応: [docs/05-directory-and-steps.md](../blob/main/docs/05-directory-and-steps.md) STEP <!-- 番号 -->

## Issue #N との対応

<!--
Issueで宣言した「やること」と実装の対応を書く。
ズレがある場合（宣言したが未実装／宣言外だが実装した）は、ここに書いて隠さない。
ズレが無ければ「Issue のやることをすべて実装。ズレなし」でよい。
-->

-

## 変更内容

<!-- 実際に変更したこと（git diff で確認できる範囲）を書く。必要なら「### 〇〇機能」の小見出しで分割 -->

-

## 検証

- [ ] `vp check`（整形・Lint・型チェック）が通る
- [ ] `vp test` が通る
- [ ] `vp run test:worker`（バックエンドのテスト）が通る
- [ ] `migrations/` を変更した場合：後方互換（追加的）になっている（[docs/07 §3](../blob/main/docs/07-db-schema.md)）
- [ ] `vp dev` でブラウザ確認した
- [ ] CI（GitHub Actions）が green

## スコープ外（後続STEP）

<!-- 今回やらないことを明記する。なければ「なし」 -->

-

## 関連Issue

Closes #<!-- Issue番号 -->
