# 裁判員のしくみ

裁判員はどう選ばれる？だれが辞退できる？評議・評決とは？裁判員法の34の言葉、なれない人と辞退できる人、手続きの順番、人数や期限などの数、罰のきまりを、4つから選んで当てる1日5問のゲーム。知らなくても遊べます。押すだけ、時間制限なし。

- 遊ぶ: https://satou-aaaaa.github.io/saibanin-shikumi/
- 今日の5問（やさしい2・ふつう2・むずかしい1）はだれでも同じで1日1回。上級（むずかしい3問・ヒントなし）、練習（何度でも）、とことん（まちがえても続く・一発で何問当てられるか）、解いた種類が集まる「しくみ帳」があります。
- 問題は「言葉をあてる」「辞退できる人」「基本の数」「正しい説明」「言葉の意味」「なれない・辞退」「まちがい探し」「次の手続き」「細かい数」「罰のきまり」「手続きの順」「正しい組み合わせ」。正解すると「なぜ」ともとの条文・ページへのリンク、言葉の札（読み・条文・意味）が出ます。
- 問題は434問（12種類）。チケット・回数制限はありません。
- 文字の大きさは3段から選べます。見やすさの設定（読みやすい文字・色の見分け・動きを減らす・読み上げ）もあります。
- 機種を変えるときは「引き継ぎ」で、記録をコードと QR にして移せます。

このゲームは、裁判員制度のしくみを知るためのものです。法律相談には使えません。届いた通知や辞退のことは、通知に書いてある裁判所にたずねてください。

## 中身の出どころ

- [e-Gov 法令検索「裁判員の参加する刑事裁判に関する法律」](https://laws.e-gov.go.jp/law/416AC0000000063)
- [e-Gov 法令検索「裁判員法第十六条第八号のやむを得ない事由を定める政令」](https://laws.e-gov.go.jp/law/420CO0000000003)
- [最高裁判所「裁判員制度の概要」](https://www.courts.go.jp/saibanin/introduction/index.html)
- [最高裁判所「裁判員の選ばれ方」](https://www.courts.go.jp/saibanin/introduction/how_to_choose/index.html)
- [最高裁判所「裁判員制度Q&A」](https://www.courts.go.jp/saibanin/introduction/qa/index.html)
- [最高裁判所「裁判員の仕事や役割」](https://www.courts.go.jp/saibanin/introduction/work_and_role/index.html)
- [最高裁判所「名簿記載通知について」](https://www.courts.go.jp/saibanin/kouhosha/notification/index.html)
- [最高裁判所「調査票でおたずねすること」](https://www.courts.go.jp/saibanin/kouhosha/tyousa/index.html)
- [最高裁判所「裁判員の選任資格に関する法改正について」](https://www.courts.go.jp/saibanin/topics/detail/age_down.html)

条文は e-Gov 法令検索の、2026年7月24日施行の版です。2025年6月から懲役・禁錮は「拘禁刑」になったので、問題は今の言い方で書いています。日当の額のように改正で変わった数や、資料によって書き方が分かれること（補充裁判員の数の書き方・18歳になった年と選ばれ始めた年など）は、問題の答えにしないか、聞き方をはっきりさせています。法律はこれからも改正されることがあるので、年に一度 e-Gov で読み直します。

## 記録と通信

記録は遊ぶ人のブラウザにだけ残り、ゲームから自動で外へ送ることはありません。例外は2つ：画面を開くと文字（Google Fonts）のために Google へつなぐので、文字が端末に保存済みでも Google に IP アドレスが届くことがあります。「Xで投稿」「LINEで送る」「結果をシェア」を押したときだけ、結果の文が選んだ先に渡ります（問題と答えは入りません）。

## 開発

```bash
bash scripts/setup.sh   # 最初に一度（最後に何かするよう出たら、それをしてから次へ）
node qa/run.mjs         # 検査（CI と同じ）
```

問題は `gen.js`（決まりは AGENTS.md）。

感想は [Issue のフォーム](https://github.com/satou-aaaaa/saibanin-shikumi/issues/new?template=feedback.yml) からどうぞ。
