// SNS で貼られたときの絵（og.png 1200×630）を作る。今日の問題（答え）は入れず、天びんと9つの席の絵だけ。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const art = `
    <path d="M75 30 v90 M40 120 h70 M25 50 h100" stroke="#1f3a5c" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M25 50 l-18 40 h36 z M125 50 l-18 40 h36 z" fill="#b8402a" opacity=".85"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${190 + i * 30}" y="${i < 3 ? 40 : 90}" width="22" height="34" rx="6" fill="${i < 3 ? "#1f3a5c" : "#e0a35a"}"/>`).join("")}`;
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:56px 64px;background:#f6f1e7;color:#2a2420;display:flex;flex-direction:column;gap:36px;justify-content:center">
    <div>
      <div style="font-size:32px;color:#86291a;letter-spacing:.06em">裁判員はどう選ばれる？だれが辞退できる？</div>
      <div style="font-size:112px;font-weight:900;margin-top:4px;color:#1f3a5c;white-space:nowrap">裁判員の<span style="color:#b8402a">しくみ</span></div>
      <div style="font-size:30px;margin-top:8px;white-space:nowrap">選ばれ方・辞退・評議・手続きの順を当てる1日5問</div>
    </div>
    <svg width="470" height="150" viewBox="0 0 470 150" style="align-self:flex-end;transform:scale(1.3);transform-origin:right bottom">${art}</svg>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
