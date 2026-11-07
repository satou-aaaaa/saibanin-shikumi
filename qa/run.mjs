// 裁判員のしくみ の検査。全部の問題の中身（選び肢・答え・出典・答えを gen.js とは別に持った用語・区分・説明の正誤・数・罰・手続きの順の表で確かめる）・
// 今日の5問と上級の組み方（3年分）・通しで遊ぶ・まちがい・ヒント・続きから・上級・練習・とことん（何百回作って重ならない）・
// しくみ帳・実績・カレンダー・あとから・文字の大きさ・スマホ幅・正解のあとの札・PWA・引き継ぎコード・見やすさを確かめる。
// 使い方: node qa/run.mjs   失敗があれば終了コード 1。結果は qa-report/report.md。
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { checkTransfer } from "./transfer-check.mjs";
import { checkSwStall } from "./sw-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail: String(detail).slice(0, 400) });
const G = createRequire(import.meta.url)(path.join(root, "gen.js"));

// ---- 0. gen.js とは別に持つ表（出典メモ /mnt/project-files/games/saibanin-sources.md の表から写したもの）----
// 用語：[用語, 読み, 意味]
const TT = [["裁判員","さいばんいん","国民から選ばれ、裁判官と共に刑事裁判に加わる人"],["補充裁判員","ほじゅうさいばんいん","審理に立ち会い、裁判員が足りなくなったとき代わりに裁判員になる人"],["対象事件","たいしょうじけん","裁判員が加わる合議体で扱う重大な事件"],["合議体","ごうぎたい","何人かで話し合って裁判をする組。原則は裁判官3人と裁判員6人"],["構成裁判官","こうせいさいばんかん","裁判員と同じ合議体に入っている裁判官"],["裁判員の関与する判断","さいばんいんのかんよするはんだん","裁判員が裁判官と一緒に決めること：事実の認定・法令の適用・刑の量定"],["刑の量定（量刑）","けいのりょうてい（りょうけい）","有罪のとき、どんな刑をどれだけにするか決めること"],["法令の解釈","ほうれいのかいしゃく","法律の意味を決めること。裁判官だけで決める"],["欠格事由","けっかくじゆう","どの事件でも裁判員になれない理由（重い刑を受けた人など）"],["就職禁止事由","しゅうしょくきんしじゆう","その職業・立場にある間は裁判員の仕事に就けない理由"],["辞退事由","じたいじゆう","申し立てれば裁判員を辞退できる理由（70歳以上など）"],["不適格事由","ふてきかくじゆう","その事件にかかわりがあり、その事件だけ裁判員になれない理由"],["裁判員候補者予定者名簿","さいばんいんこうほしゃよていしゃめいぼ","市町村の選挙管理委員会が選挙人名簿からくじで選んで作る名簿"],["裁判員候補者名簿","さいばんいんこうほしゃめいぼ","予定者名簿をもとに地方裁判所が作る、翌年の候補者の名簿"],["名簿記載通知","めいぼきさいつうち","候補者名簿に載ったことのお知らせ。毎年11月ごろ届く"],["調査票","ちょうさひょう","名簿記載通知と一緒に届き、なれない職業や1年を通じた辞退希望を聞く紙"],["質問票","しつもんひょう","選任手続の前に、事件ごとの候補者に送る質問の紙"],["呼出状","よびだしじょう","選任手続の期日に裁判所へ来るよう知らせる書面"],["裁判員等選任手続","さいばんいんとうせんにんてつづき","事件ごとに候補者から裁判員・補充裁判員を選ぶ手続。公開しない"],["理由を示さない不選任の請求","りゆうをしめさないふせんにんのせいきゅう","検察官と被告人が、理由を言わずに候補者を外すよう求めること"],["宣誓","せんせい","法令に従い公平誠実に務めると誓うこと"],["公判前整理手続","こうはんぜんせいりてつづき","第1回の公判の前に、争点と証拠を整理する準備。対象事件では必ず行う"],["公判","こうはん","法廷で証拠を調べ、証人や被告人に質問する審理"],["評議","ひょうぎ","裁判官と裁判員が有罪・無罪や刑について話し合うこと"],["評決","ひょうけつ","評議の結論を決めること。裁判官・裁判員の双方を含む過半数による"],["評議の秘密","ひょうぎのひみつ","評議の経過、だれがどんな意見か、その数。漏らしてはならない"],["守秘義務","しゅひぎむ","評議の秘密など職務上知った秘密を漏らさない義務"],["自由心証主義","じゆうしんしょうしゅぎ","証拠をどれだけ信じるかは各裁判官・裁判員の自由な判断に任せる"],["日当","にっとう","裁判員・補充裁判員・出頭した候補者に1日ごとに払うお金"],["区分審理決定","くぶんしんりけってい","同じ被告人の多くの事件を分け、分けた事件ごとに順に審理する決定"],["部分判決","ぶぶんはんけつ","区分した事件ごとに出す、有罪などの判決"],["不利益取扱いの禁止","ふりえきとりあつかいのきんし","裁判員の仕事で休んだことなどを理由に、解雇などをしてはならない"],["過料","かりょう","刑罰ではないお金の制裁。正当な理由なく来ないときなど"],["任務の終了","にんむのしゅうりょう","裁判員の役目は、判決を言い渡した（終局裁判を告知した）とき終わる"]];
const TN = Object.fromEntries(TT.map(([n, y, w]) => [n, { n, y, w }])), TW = Object.fromEntries(TT.map(([n, , w]) => [w, n]));
const short = (w) => w.split("。")[0];
// 意味が重なる組（同じ問題の選び肢にすると答えが2つに見える）
const CONF = [["刑の量定（量刑）","裁判員の関与する判断"],["法令の解釈","裁判員の関与する判断"],["評議の秘密","守秘義務"]];
// 条文 → 区分（法14条＝欠格・15条＝就職禁止・16条と政令＝辞退・17条と18条＝不適格）
const KU = { k: "どの事件でもなれない（欠格事由）", s: "その立場の間はなれない（就職禁止事由）", j: "申し立てれば辞退できる（辞退事由）", f: "その事件だけなれない（不適格事由）" };
const catOf = (a) => (/^法14条/.test(a) ? "k" : /^法15条/.test(a) ? "s" : /^(法16条|政令)/.test(a) ? "j" : /^法1[78]条/.test(a) ? "f" : null);
// 説明の正誤（出典メモ 2章・3章・5章から）
const TRUTH = { "裁判員は、衆議院議員の選挙権がある人の中から選ばれる": 1, "70歳以上の人は、申し立てれば辞退できる": 1, "裁判員等選任手続は、公開しない": 1, "有罪・無罪や刑についての裁判員の意見は、裁判官と同じ重みを持つ": 1, "評議の秘密は、漏らしてはならない": 1, "裁判員から、証人などに質問することもできる": 1, "対象事件は、第1回の公判の前に必ず公判前整理手続をする": 1, "裁判員の役目は、判決の宣告で終わる": 1, "裁判員が加わるのは、地方裁判所の刑事裁判": 1, "裁判員の仕事で休んだことを理由に、解雇などをしてはならない": 1, "証拠をどれだけ信じるかは、裁判官・裁判員それぞれの自由な判断に任される": 1, "法令の解釈は、裁判官だけで決める": 1, "日本国籍を持っていない人が、裁判員に選ばれることはない": 1, "事件ごとに呼び出す候補者は、名簿の中からくじで選ぶ": 1,
  "70歳以上の人は、裁判員になれない": 0, "民事裁判（お金の貸し借りなど）にも裁判員が加わる": 0, "高等裁判所の控訴審にも裁判員が加わる": 0, "評決は、全員一致でなければならない": 0, "裁判員等選任手続は、だれでも見られる公開の法廷で行う": 0, "理由がなくても、自由に辞退できる": 0, "裁判員の意見は、裁判官の意見より軽く扱われる": 0, "評議は、裁判官だけで行い、裁判員は結果を聞く": 0, "法令の解釈も、裁判員を入れた多数決で決める": 0, "裁判員だけの意見でも、有罪と決められる": 0, "対象事件では、公判前整理手続をしない": 0, "裁判員は、法廷で証人に質問できない": 0 };
// 数（資料の値）：問題の始まり → 答え
const FT = [["裁判員が加わる裁判は、原則、裁判官何人","3人"],["裁判員が加わる裁判で、裁判員は原則何人","6人"],["何歳以上の人は","70歳以上"],["2022年4月から","18歳以上"],["裁判員制度が始まったのは何年","2009年（平成21年）"],["裁判員が加わるのは、どの裁判所","地方裁判所"],["裁判員は、どんな人の中から","衆議院議員の選挙権がある人"],
  ["争いのない事件などで","裁判官1人・裁判員4人"],["補充裁判員は","6人"],["地方裁判所が市町村に","9月1日"],["選挙管理委員会が","10月15日"],["選任手続のお知らせ","6週間前"],["裁判の日数が5日以内","70人程度"],["呼んだ候補者の名簿","2日前"],["裁判員・補充裁判員だった人","5年以内"],["候補者として選任手続","1年以内"],["妊娠中のほか","8週間"],["裁判官3人・裁判員6人で補充裁判員を選ばない","4人"],["裁判員制度が始まった日","2009年5月21日"]];
// 罰（法106〜112条）：問題の言葉 → 答え
const PT = [["来なかった","10万円以下の過料"],["宣誓を拒んだ","10万円以下の過料"],["裁判員が、評議の秘密など職務上知った秘密","6月以下の拘禁刑または50万円以下の罰金"],["請託","2年以下の拘禁刑または20万円以下の罰金"],["威迫","2年以下の拘禁刑または20万円以下の罰金"],["裁判員だった人が、評議の経過","50万円以下の罰金"],["候補者の氏名","1年以下の拘禁刑または50万円以下の罰金"]];
// 手続きの順（出典メモ 4章。公判前整理手続は前後が条文に無いので入れない）
const SQ = { 候補者の名簿ができるまで: ["地方裁判所が候補者の数を市町村に割り当てる","選挙管理委員会がくじで予定者名簿を作る","予定者名簿を地方裁判所へ送る","地方裁判所が候補者名簿を作る","名簿記載通知と調査票が届く"], 裁判員が選ばれて判決が出るまで: ["事件ごとのくじで候補者を選ぶ","呼出状と質問票が届く","裁判員等選任手続","宣誓","公判（法廷での審理）","評議","評決","判決の宣告"] };
const quoted = (t) => (t.match(/「(.+?)」/) || [])[1] || "";
const MED = /治る|治せる|治ります|予防できる|予防になる|効果があ|若返る|診断でき/;
const OLD = /懲役|禁錮|禁固/; // 2025-06-01 から拘禁刑（出典メモ 5章1）

// ---- 1. 問題（ブラウザを使わない）----
const FIRST_DAY = '[["seigo|1","jitai|12","imi|25-0","ayamari|3","kumi|32"],["narabe|16","bachi|3-0","kazu|0-0"]]';
{
  const all = Object.values(G.BANK), bad = [];
  const REAL = /ドラえもん|ポケモン|ジブリ|鬼滅|サンリオ|セーラームーン|逆転裁判|HERO/;
  const SRCOK = /^https:\/\/(laws\.e-gov\.go\.jp\/law\/|www\.courts\.go\.jp\/saibanin\/)/;
  check("表：gen.js の用語34が、別に持った表と名前・読み・意味まで同じ（名前と意味はみなちがう）", G.TERMS.length === TT.length && G.TERMS.every((x, i) => JSON.stringify([x.n, x.y, x.w]) === JSON.stringify(TT[i])) && new Set(TT.map((x) => x[2])).size === TT.length && G.TERMS.every((x) => [...x.w].length <= 40));
  check("表：なれない人・辞退できる人の区分が、条文の番号（14〜18条・政令）と合う", G.PEOPLE.length >= 35 && G.PEOPLE.every((x) => catOf(x.a) === x.c) && new Set(G.PEOPLE.map((x) => x.p)).size === G.PEOPLE.length, G.PEOPLE.filter((x) => catOf(x.a) !== x.c).map((x) => x.p).join(","));
  check("表：説明の正しい・まちがいが、別に持った表と合う（正しい14・まちがい12）", G.SAYS.length === Object.keys(TRUTH).length && G.SAYS.every((x) => TRUTH[x.t] === x.ok) && G.SAYS.filter((x) => x.ok).length === 14);
  check("表：数の問題は19で、どれも別に持った表の答えと合う（まちがいの候補に答えが無い）", G.EASY.length + G.HARDF.length === FT.length && [...G.EASY, ...G.HARDF].every((f) => { const m = FT.filter(([k]) => f.t.startsWith(k)); return m.length >= 1 && m[0][1] === f.a && !f.d.includes(f.a); }));
  check("表：手続きの順は2つで、別に持った表と同じ", G.SEQS.length === 2 && G.SEQS.every((q) => JSON.stringify(SQ[q.t]) === JSON.stringify(q.x)));
  check("表：まぎらわしい組は gen.js の NEAR にもある", CONF.every(([a, b]) => G.NEAR.some(([x, y]) => (x === a && y === b) || (x === b && y === a))));
  for (const q of all) {
    const P = G.make(q.key), why = [];
    if (!P) { bad.push(q.key + " 作れない"); continue; }
    const k = q.kind, t = P.scene.text;
    if (P.opts.length !== 4 || new Set(P.opts).size !== 4 || P.opts.filter((o) => o === P.ans).length !== 1) why.push("選び肢");
    if (!P.src.length || P.src.some((x) => !x || !SRCOK.test(x[1]))) why.push("出典");
    if ([...P.why].length > 90) why.push("説明が90字より長い");
    const txt = JSON.stringify([P.scene, P.opts, P.why]);
    if (/undefined|null|NaN/.test(txt)) why.push("中身が空");
    if (REAL.test(txt)) why.push("作品の名前");
    if (OLD.test(txt)) why.push("古い刑の名前（懲役・禁錮）");
    if (JSON.stringify(G.make(q.key)) !== JSON.stringify(P)) why.push("同じ key で同じ問題にならない");
    const conf = (xs) => CONF.some(([a, b]) => xs.includes(a) && xs.includes(b));
    if (k === "yogo") { if (TW[quoted(t)] !== P.ans || !P.opts.every((o) => TN[o]) || conf(P.opts)) why.push("言葉の答え"); }
    if (k === "imi") { const x = TN[quoted(t)]; if (!x || P.ans !== x.w || !P.opts.every((o) => TW[o]) || conf(P.opts.map((o) => TW[o]))) why.push("意味の答え"); }
    if (k === "jitai" || k === "kubun") { const pe = (o) => G.PEOPLE.find((x) => x.p === o);
      if (k === "jitai" && (!P.opts.every(pe) || P.opts.filter((o) => catOf(pe(o).a) === "j").length !== 1 || catOf(pe(P.ans).a) !== "j")) why.push("辞退の答え");
      if (k === "kubun") { const x = pe(quoted(t)); if (!x || P.ans !== KU[catOf(x.a)] || P.opts.join() !== ["k", "s", "j", "f"].map((c) => KU[c]).join()) why.push("区分の答え"); } }
    if (k === "seigo" || k === "ayamari") { const want = k === "seigo" ? 1 : 0; if (!P.opts.every((o) => o in TRUTH) || P.opts.filter((o) => TRUTH[o] === want).length !== 1 || TRUTH[P.ans] !== want) why.push("説明の答え"); }
    if (k === "ninzu" || k === "kazu") { const m = FT.find(([a]) => t.startsWith(a)); if (!m || P.ans !== m[1]) why.push("数の答え"); }
    if (k === "bachi") { const m = PT.filter(([a]) => t.includes(a)); if (m.length !== 1 || P.ans !== m[0][1]) why.push("罰の答え"); }
    if (k === "tsugi") { const m = t.match(/^(.+)の流れで、「(.+)」の(次|前)は？$/), x = m && SQ[m[1]], j = x ? x.indexOf(m[2]) : -1; if (j < 0 || P.ans !== x[j + (m[3] === "次" ? 1 : -1)]) why.push("次・前の答え"); }
    if (k === "narabe") { const x = SQ[(t.match(/^(.+)の流れで、/) || [])[1]] || [], ok = P.opts.filter((o) => { const v = o.split(" → ").map((y) => x.indexOf(y)); return v.length === 3 && v.every((n) => n >= 0) && v[0] < v[1] && v[1] < v[2]; }); if (ok.length !== 1 || ok[0] !== P.ans) why.push(`並びの答え（${ok.join("/")}）`); }
    if (k === "kumi") { const ps = P.opts.map((o) => o.split("：")), good = ps.filter(([n, w]) => TN[n] && short(TN[n].w) === w); if (good.length !== 1 || P.ans !== good[0].join("：") || conf(ps.map(([n]) => n))) why.push("組み合わせの答え"); }
    if (["yogo", "imi", "kumi"].includes(k)) { const a = k === "yogo" ? P.ans : k === "imi" ? quoted(t) : P.ans.split("：")[0]; if (!P.at.some((i) => G.TERMS[i] && G.TERMS[i].n === a)) why.push("札に答えの言葉が無い"); }
    if (P.at.some((i) => !G.TERMS[i])) why.push("札の番号");
    if (why.length) bad.push(q.key + "：" + why.join("・"));
  }
  check(`問題：全部の問題（${all.length}問）で、選び肢は4つで答えは1つ・e-Gov か最高裁判所の出典つき・説明90字以内・答えを別に持った表で確かめて合う`, bad.length === 0, bad.slice(0, 5).join(" / "));
  check("問題：とことん・練習で出る問題は400問以上（好きなだけ遊んでも、すぐに同じ問題にならない）", all.length >= 400, all.length);
  const per = G.KINDS.map((k) => [k.id, G.keysOf(k.id).length]).filter(([, n]) => n < 12);
  check("問題：どの種類も12問以上ある", per.length === 0, per.join(" "));
  check("問題：種類は12（やさしい4・ふつう4・むずかしい4）", G.KINDS.length === 12 && [0, 1, 2].map((l) => G.kindsOf(l).length).join() === "4,4,4", [0, 1, 2].map((l) => G.kindsOf(l).length).join());
  check("知らない key（constructor など）は問題にしない", G.make("constructor") === null && G.make("__proto__") === null && G.make("toString") === null);
  const longLook = G.KINDS.filter((k) => [...k.look].length > 45).map((k) => k.id);
  check("ヒントは45字以内（やさしい日本語。一文を短く）", !longLook.length, longLook.join(","));
  const ap = {}; for (const q of all) { if (q.fix) continue; const o = G.make(q.key).opts.indexOf(q.ans); ap[o] = (ap[o] || 0) + 1; }
  const ta = Object.values(ap).reduce((a, b) => a + b, 0);
  check("答えの場所（1〜4番目）がどれも1割5分以上（区分の問題は並びを決めてあるので除く）", [0, 1, 2, 3].every((i) => (ap[i] || 0) >= ta * 0.15), JSON.stringify(ap));
}
{
  // 今日の5問・上級の組み方（3年分）
  const bad = [], cover = new Set(); let sameAsPrev = 0, prev = "";
  const d0 = Date.parse("2026-11-07");
  const kd = (t) => G.BANK[t].kind;
  for (let i = 0; i < 365 * 3; i++) {
    const d = new Date(d0 + i * 864e5).toISOString().slice(0, 10), dl = G.dailyTags(d), hl = G.hardTags(d);
    const dk = dl.map(kd), hk = hl.map(kd);
    if (dl.length !== 5 || new Set(dk).size !== 5 || dk.map((k) => G.BY[k].lv).join() !== "0,0,1,1,2") bad.push(d + " 今日");
    if (hl.length !== 3 || new Set(hk).size !== 3 || hk.some((k) => G.BY[k].lv !== 2) || hk.includes(dk[4])) bad.push(d + " 上級");
    if (JSON.stringify(dl) !== JSON.stringify(G.dailyTags(d))) bad.push(d + " 同じにならない");
    if (dl.join() === prev) sameAsPrev++; prev = dl.join();
    if (i < 60) [...dk, ...hk].forEach((k) => cover.add(k));
  }
  check("今日の5問（やさしい2・ふつう2・むずかしい1、種類は重ねない）と上級（むずかしい3・今日のむずかしいと別）を3年分作れる", bad.length === 0, bad.slice(0, 5).join(","));
  check("2か月のうちに12種類が全部出る・前の日と同じ5問の日が無い", cover.size === 12 && sameAsPrev === 0, `${cover.size}種類・前の日と同じ ${sameAsPrev}日`);
  // 過去の日の問題を変えない：はじめの日の5問を控えと比べる（gen.js・BANK を変えたら、ここが落ちる）
  check("過去の日の問題が変わらない（第1回 2026-11-07 の5問と上級）", JSON.stringify([G.dailyTags("2026-11-07"), G.hardTags("2026-11-07")]) === FIRST_DAY, JSON.stringify([G.dailyTags("2026-11-07"), G.hardTags("2026-11-07")]));
}

// ---- 2. ファイルの中身 ----
const html = readFileSync(path.join(root, "index.html"), "utf8"), gen = readFileSync(path.join(root, "gen.js"), "utf8");
const ext = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => m[1]).filter((u) => !/^https:\/\/fonts\.googleapis\.com(\/|$)|^https:\/\/ko-fi\.com\/satouaaaaa$/.test(u));
check("外から読むのは文字（Google Fonts）だけ。スクリプト・広告・解析を入れない（出典のリンクは押したときに開くだけ）", ext.length === 0 && ![...html.matchAll(/<script[^>]+src="([^"]+)"/g)].some((m) => /^https?:/.test(m[1])), ext.join(","));
check("CSP で通信先を自分だけにしている", /connect-src 'self'/.test(html) && !/connect-src[^;"]*https/.test(html));
check("Math.random は練習・とことんの並びと回の名札だけ（今日の5問・上級は日付の乱数。gen.js には無い）", (html.match(/Math\.random/g) || []).length === 3 && !/Math\.random/.test(gen));
check("乱数は sort の比較の中で引かない（ブラウザで引く回数が変わる）", !/\.sort\(\s*\([^)]*\)\s*=>[^\n;]*\b(R|rng|rand|Math\.random)\s*\(/.test(html + gen));
check("一行の式の途中にコメント // を足さない（行の残りが消える。rosen-hitofude 2026-11-04）", !/;\s*\/\/[^\n]*;\s*\w/.test(gen.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n")));
check("このゲームについて：出典（e-Gov・最高裁判所）を載せ、法律相談には使えないこと・改正で変わった数を答えにしないこと・拘禁刑のことを書く", /法律相談には使えません/.test(html) && /拘禁刑/.test(html) && /問題の答えにしません/.test(html) && /G\.SRC/.test(html) && Object.values(G.SRC).length >= 8);
check("画面に医療の効果を言い切る言葉を入れない（治る・予防できる など）", !MED.test(html) && !MED.test(gen));
check("チケット・回数制限・🔒で開くモードを入れない（好きなだけ遊べる。shared-workflows game-dev.md F1・F2）", !/🎫|チケット|ライフ|スタミナ|すると開く|のあとで開く/.test(html));
check("画面にお笑いの言葉を入れない（本物っぽく）", !/お笑い|ギャグ|ツッコミ|なんでやねん|（うそ）/.test(html));
check("引き継ぎ：transfer.js をゲームの script より前に、このゲームの記録のキーだけで読む", /<script src="transfer\.js" data-game="saibanin-shikumi" data-keys="saiban-v1,saiban-fs"><\/script>\s*<\/head>/.test(html) && html.indexOf('src="transfer.js"') < html.indexOf('src="gen.js"') && /data-hk/.test(html) && existsSync(path.join(root, "transfer.js")));
{ const og = (k) => (html.match(new RegExp(`<meta (?:property|name)="${k}" content="([^"]+)"`)) || [])[1] || "";
  const png = readFileSync(path.join(root, "og.png"));
  check("SNS で貼ると絵と題が出る（OGP・1200×630・絶対URL）", og("og:title") && og("og:description") && og("og:image") === "https://satou-aaaaa.github.io/saibanin-shikumi/og.png" && og("twitter:card") === "summary_large_image" && png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630); }
{ const fy = readFileSync(path.join(root, ".github/ISSUE_TEMPLATE/feedback.yml"), "utf8");
  check("感想フォームの name が3字以上（2字だとフォームが出ない。shared-workflows incidents/2026-11-05-feedback-form-not-shown.md）", [...((fy.match(/^name:\s*(.+)$/m) || [])[1] || "").trim()].length >= 3);
  check("感想フォームは名前・メールを聞かない", /id: fun/.test(fy) && !/id: (name|email|mail)/.test(fy) && /labels: \["感想"\]/.test(fy)); }
check("README の URL のすぐ後ろに全角の字を続けない（Link check が URL の一部と読む）", !/https?:\/\/[\x21-\x7e]*[^\x00-\x7f]/.test(readFileSync(path.join(root, "README.md"), "utf8").replace(/\]\(https?:\/\/[^)\s]+\)/g, "").replace(/<https?:\/\/[^>\s]+>/g, "")));
{ const sw = readFileSync(path.join(root, "sw.js"), "utf8"), mf = JSON.parse(readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  const shell = JSON.parse(sw.match(/SHELL = (\[[^\]]+\])/)[1]);
  { const st = await checkSwStall(sw); check("PWA：本文の途中で通信が止まっても、保存した画面を返す（ふつうはネットの返事）", st.ok, st); }
  check("PWA：sw.js は画面のファイルを全部保存し（引き継ぎの transfer.js も）、外へ何も送らない", ["./index.html", "./gen.js", "./transfer.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"].every((f) => shell.includes(f)) && !/https?:\/\//.test(sw.replace(/^\/\/.*$/gm, "")));
  check("PWA：manifest にアイコン2つと名前がある", mf.name === "裁判員のしくみ" && mf.icons.length >= 2 && mf.start_url === "./"); }

// ---- 3. ブラウザで遊ぶ ----
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname), f = path.join(root, p === "/" ? "index.html" : p);
  const rel = path.relative(root, f);
  if (rel.startsWith("..") || path.isAbsolute(rel) || !existsSync(f)) { res.writeHead(404); return res.end(); } // リポジトリの外（同じ名前で始まる隣のフォルダも）は返さない
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r)); // 外からつながらないよう、この機械の中だけで開く
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const dayBefore = (n) => new Date(Date.parse(TODAY) - n * 864e5).toISOString().slice(0, 10);
async function newPage(w = 390, ctx) {
  const c = ctx || await browser.newContext({ viewport: { width: w, height: 800 } });
  await c.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const p = await c.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED|net::/.test(m.text())) errors.push(m.text()); });
  await p.goto(url); await p.waitForTimeout(200);
  return p;
}
const closeHow = async (p) => { if (await p.locator("#howto[open]").count()) await p.click("#howto-ok"); };
const ansIdx = (p) => p.evaluate(() => { const c = __km.cur(); return c.P.opts.indexOf(c.P.ans); });
const wrongIdx = (p) => p.evaluate(() => { const c = __km.cur(); return c.P.opts.findIndex((o) => o !== c.P.ans && !c.wrong.includes(o)); });
const mem = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("saiban-v1") || "{}"));
async function solve(p, { wrong = 0 } = {}) {
  for (let i = 0; i < wrong; i++) await p.click(`.ch[data-j="${await wrongIdx(p)}"]`);
  await p.click(`.ch[data-j="${await ansIdx(p)}"]`);
  await p.waitForSelector(".verdict");
}

try {
  // はじめて：遊び方が出る・文字の大きさ
  const p = await newPage();
  check("はじめて開くと遊び方が出る", await p.locator("#howto[open]").count() === 1);
  await p.click("#howto-ok");
  {
    const q = await newPage();
    await q.keyboard.press("Escape"); await q.waitForTimeout(100);
    const shut = await q.locator("#howto[open]").count() === 0;
    await q.reload(); await q.waitForTimeout(150);
    const again = await q.locator("#howto[open]").count();
    await q.click("#go-p"); await q.click("#back"); await q.waitForTimeout(100);
    check("遊び方を Esc で閉じたあと、開き直しても・ホームに戻っても遊び方が出ない", shut && again === 0 && await q.locator("#howto[open]").count() === 0);
    await q.close();
  }
  { const r = await newPage(); const big = []; // 題が h1{flex:1} を受け継いで縦に伸び、iPad の縦で大きなすき間が出た（shared-workflows incidents/2026-11-07-title-stretched.md）
    for (const [w, h] of [[820, 1180], [390, 844], [1280, 800]]) { await r.setViewportSize({ width: w, height: h }); await r.reload(); await r.waitForTimeout(200); await r.keyboard.press("Escape"); await r.waitForTimeout(100);
      const v = await r.evaluate(() => { const e = [...document.querySelectorAll(".title")].find((x) => x.offsetParent); if (!e) return null; const h = e.getBoundingClientRect().height; const f = e.style.flex; e.style.flex = "none"; const n = e.getBoundingClientRect().height; e.style.flex = f; return h - n; });
      if (v === null || v > 4) big.push(`${w}x${h}:${v === null ? "題なし" : "+" + Math.round(v) + "px"}`); }
    check("ホームの題は縦長の画面でも縦に伸びない（820×1180・390×844・1280×800）", big.length === 0, big.join(" ")); await r.close(); }
  check("文字の大きさ：はじめは「大きい」（21px）", await p.evaluate(() => getComputedStyle(document.documentElement).fontSize) === "21px");
  await p.click('.fsrow button[data-fs="3"]');
  await p.reload(); await p.waitForTimeout(150);
  check("文字の大きさ：「とても大きい」にすると開き直しても残る", await p.evaluate(() => getComputedStyle(document.documentElement).fontSize) === "25px" && await p.locator('.fsrow button[data-fs="3"][aria-pressed="true"]').count() === 1);
  await p.click('.fsrow button[data-fs="2"]');
  check("ホームに今日の心得が出る", (await p.textContent("#tip")).includes("今日の心得"));

  // 今日の5問：1問目はまちがえる、2問目はヒント2回、ほかはそのまま
  await p.click("#go-d");
  const tags = await p.evaluate(() => __km.load().runs.d.list);
  check("今日の5問は日付から決まる（gen.js の dailyTags と同じ）", JSON.stringify(tags) === JSON.stringify(G.dailyTags(TODAY)));
  check("問題の画面：答える前は言葉の札を出さない（答えが見えてしまう）・大きな選び肢（高さ56px以上）", await p.locator("#scene .card").count() === 0 && (await p.$$eval(".ch", (b) => b.map((x) => x.getBoundingClientRect().height))).every((h) => h >= 56) && await p.locator(".ch").count() >= 2);
  await p.click(`.ch[data-j="${await wrongIdx(p)}"]`);
  check("まちがえると ✕ の印と「ちがう」の文字（色だけで分けない）・知らせは role=status", await p.locator(".ch.ng").count() === 1 && (await p.evaluate(() => getComputedStyle(document.querySelector(".ch.ng"), "::after").content)).includes("ちがう") && (await p.textContent("#msg")).includes("ちがいます") && await p.getAttribute("#msg", "role") === "status");
  // 開き直しても、まちがえた選び肢は残る
  await p.reload(); await p.waitForTimeout(150); await p.click("#go-d");
  check("途中で閉じても続きから（同じ問題・まちがえた印のまま）", await p.locator(".ch.ng").count() === 1 && await p.evaluate(() => __km.cur().i) === 0);
  await solve(p);
  check("正解すると ✓ の印・なぜの説明・出典のリンク・★2（まちがい1回）", await p.locator(".ch.ok").count() === 1 && (await p.textContent(".verdict .why")).length > 6 && await p.locator(".verdict .src a").count() >= 1 && (await p.getAttribute(".verdict .stars", "aria-label")) === "星2つ");
  await p.click("#next");
  await p.click("#hint");
  check("ヒント1は見るところを言う（答えは言わない）", (await p.textContent("#hintbox")).includes("💡") && await p.locator(".ch.ng").count() === 0);
  const nOpt = await p.locator(".ch").count();
  if (nOpt > 2) { await p.click("#hint"); check("ヒント2はまちがいの選び肢を消し、2つにしぼる・ヒントは2回まで", await p.locator(".ch:not(.ng)").count() === 2 && await p.locator("#hint:disabled").count() === 1); }
  else check("選び肢が2つの問題は、ヒントは1回まで（しぼる段は無い）", await p.locator("#hint:disabled").count() === 1);
  const h2 = nOpt > 2 ? 2 : 1;
  await solve(p);
  check("ヒントの数だけ★がへる", (await p.getAttribute(".verdict .stars", "aria-label")) === `星${h2 === 2 ? 1 : 2}つ`);
  await p.click("#next");
  for (let i = 2; i < 5; i++) { await solve(p); await p.click("#next"); }
  await p.waitForTimeout(150);
  const s1 = await mem(p);
  check("5問で結果：今日の記録に1問ごとのまちがい（1・ヒント・0・0・0）", JSON.stringify(s1.days[TODAY]?.m) === JSON.stringify([1, h2, 0, 0, 0]));
  const share = await p.textContent(".share");
  check("シェアの文に答え・問題を出さない（題・回・日付と印だけ）", /^裁判員のしくみ 第\d+回 \d+\/\d+\n(🟢|🔶|🔺){5}( まちがいなし)?$/u.test(share.trim()), share);
  check("まちがいのある日は Ko-fi の一言を出さない", await p.locator(".kofi").count() === 0);
  check("結果に「あと少しの実績」と、続けて遊ぶ・上級のボタン", await p.locator("#achnext").count() === 1 && await p.locator("#go-e").count() === 1 && await p.locator("#go-h").count() === 1);
  check("しくみ帳に解いた種類が載る", Object.keys(s1.dex).length === 5);
  await p.click("#back");
  check("今日を終えたら、ホームは「今日の結果を見る」と上級", (await p.textContent("#go-d")).includes("結果") && await p.locator("#go-h").count() === 1);
  // 上級：ヒントなし・3問
  await p.click("#go-h");
  check("上級はヒントのボタンが無い・3問", await p.locator("#hint").count() === 0 && (await p.evaluate(() => __km.load().runs.h.list.length)) === 3);
  for (let i = 0; i < 3; i++) { await solve(p); await p.click("#next"); }
  await p.waitForTimeout(150);
  check("上級の記録は hdays に入る", (await mem(p)).hdays[TODAY]?.m.length === 3);
  // 練習：記録を増やさない
  await p.click("#back"); await p.click("#go-p"); await p.click('.lv button[data-t="2"]');
  const before = await mem(p);
  for (let i = 0; i < 5; i++) { await solve(p); await p.click("#next"); }
  await p.waitForTimeout(150);
  const after = await mem(p);
  check("練習は今日の記録を増やさない（しくみ帳の数はふえる）", JSON.stringify(after.days) === JSON.stringify(before.days) && Object.values(after.dex).reduce((a, b) => a + b) === Object.values(before.dex).reduce((a, b) => a + b) + 5);
  // しくみ帳からその種類だけで練習
  await p.click("#back"); await p.click("#go-dex");
  const firstKind = await p.getAttribute(".book button", "data-k");
  await p.click(".book button");
  check("しくみ帳の種類を押すと、その種類だけで練習", (await p.evaluate(() => __km.load().runs.p.list)).every((t) => t.startsWith(firstKind + "|")));
  // とことん：まちがえても続く・「ここで降りる」まで終わらない・自己ベストは一発で正解した数
  await p.click("#back"); await p.click("#go-e");
  check("とことんは種類を混ぜて60問以上を用意し、同じ問題は出さない", await p.evaluate(() => { const l = __km.load().runs.e.list; return l.length >= 60 && new Set(l).size === l.length; }));
  await solve(p); await p.click("#next"); await solve(p); await p.click("#next");
  await solve(p, { wrong: 1 }); await p.click("#next");
  await p.click(`.ch[data-j="${await wrongIdx(p)}"]`);
  check("とことんはまちがえても終わらない・ヒントも押せる", await p.locator(".verdict").count() === 0 && await p.locator("#hint:not([disabled])").count() === 1 && await p.locator(".ch:not([disabled])").count() >= 1);
  await solve(p); await p.click("#next");
  await p.click("#quit"); await p.waitForTimeout(150);
  check("「ここで降りる」で終わり、一発で正解した数（2問）が自己ベストに残る", (await mem(p)).ebest === 2 && (await p.textContent("#eres")).includes("2問") && !(await mem(p)).runs.e);
  await p.reload(); await p.waitForTimeout(250);
  check("降りたあと開き直しても、とことんの続きにならない", await p.locator(".ch").count() === 0);
  // とことんの並びを何百回作り、足していっても、全部出し切るまで同じ問題を出さない・同じ種類を続けない
  const er = await p.evaluate(() => { const K = __km, bad = []; let kinds = 0;
    for (let n = 0; n < 300; n++) { const r = { list: K.endlessList(), cyc: 0 }; const first = r.list.slice(0, 15).map((t) => K.G.BY[K.G.BANK[t].kind].lv); if (new Set(r.list).size !== r.list.length) bad.push("same" + n);
      if (first.slice(0, 5).some((l) => l !== 0) || first.slice(5, 15).some((l) => l !== 1)) bad.push("ramp" + n);
      if (n < 3) { while (r.list.length < K.ALLKEYS.length + 200) K.moreList(r); const a = r.list.slice(0, K.ALLKEYS.length); if (new Set(a).size !== a.length) bad.push("dup" + n); if (new Set(a).size !== K.ALLKEYS.length) bad.push("cover" + n); const b = r.list.slice(r.cyc); if (new Set(b).size !== b.length) bad.push("dup2-" + n); }
      for (let i = 1; i < Math.min(r.list.length, 60); i++) if (K.G.BANK[r.list[i]].kind === K.G.BANK[r.list[i - 1]].kind) kinds++;
    }
    return [bad.slice(0, 5), kinds]; });
  {
    // 前の回の最後の問題を除いて作り直しても、やさしい5→ふつう10から始まり、その問題を1問目にしない（2026-11-07 CodeRabbit）
    const rr = await p.evaluate(() => { const K = __km, bad = []; for (let n = 0; n < 100; n++) { const last = K.ALLKEYS[n * 7 % K.ALLKEYS.length], l = K.endlessList(new Set([last]), K.G.BANK[last].kind); const lv = l.slice(0, 15).map((t) => K.G.BY[K.G.BANK[t].kind].lv); if (lv.slice(0, 5).some((x) => x !== 0) || lv.slice(5).some((x) => x !== 1) || l.includes(last) || K.G.BANK[l[0]].kind === K.G.BANK[last].kind) bad.push(n); } return bad; });
    check("とことんを2回目に始めても、やさしい→ふつうから・前の最後の問題と種類を1問目にしない", rr.length === 0, JSON.stringify(rr.slice(0, 5)));
  }
  check("とことんの並びを300回作る：やさしい5→ふつう10から始まり、全部出し切るまで同じ問題なし・同じ種類が続く所はほぼ無い", er[0].length === 0 && er[1] < 300 * 3, JSON.stringify(er));
  {
    // 引き継ぎコードなどで数の所に文字が入っても、画面に HTML として出さない（2026-11-05 CodeRabbit）
    const q = await newPage(); await closeHow(q);
    await q.evaluate(() => { const s = JSON.parse(localStorage.getItem("saiban-v1")) || { v: 1 }; s.ebest = '<img id="xss" src=x>'; s.dex = { yogo: '"><b id="xss2">', add: 3, constructor: 4, toString: 2 }; s.elast = '"><u id="xss4">'; s.runs = { z: { mode: "z", id: "z", date: "2026-11-05", list: [], res: [] }, e: { mode: "e", id: "x", date: "2026-11-05", list: ["yogo|0-0", "yogo|0-1"], res: [], life: '"><i id="xss3">' }, h: { list: "bad", res: [] }, p: { mode: "p", id: "y", date: "2026-11-05", list: ["constructor|1"], res: [] }, d: { mode: "d", id: "z", date: "x", list: ["yogo|1-0"], res: [] }, h2: { date: "2026-11-07", list: [], res: [] }, a1: { mode: "a", id: "a1", date: "2026-11-04", list: ["yogo|1-0"], res: [null] }, a2: { mode: "a", id: "a2", date: "2026-11-03", list: "bad", res: [] }, "a:2026-11-02": { mode: "a", id: "a3", date: "2026-11-02", list: ["yogo|1-0", "yogo|2-0"], res: [{ m: 0 }], cur: { i: 1, tag: "yogo|2-0", wrong: "x", hints: 0 } } }; s.days = { "2026-11-05": { m: "x" }, bad: { m: [0] }, "2026-02-30": { m: [0] }, "2026-11-06": { m: [] } }; localStorage.setItem("saiban-v1", JSON.stringify(s)); });
    await q.reload(); await q.waitForTimeout(250);
    const st = await q.evaluate(() => __km.load());
    check("記録の形を直す：数の所の文字は0に・しくみ帳の知らない種類（constructor など）は捨てる・前の版の花（life）は読まない・形のちがう途中経過（置き場とモードが合わない回も）と日ごとの記録（問題の数が合わないものも）は捨てる", st.ebest === 0 && st.dex.yogo === 0 && Object.keys(st.dex).join() === "yogo" && !("life" in st.runs.e) && st.elast === null && !("h" in st.runs) && !("p" in st.runs) && !("d" in st.runs) && !("a1" in st.runs) && !("a2" in st.runs) && !("h2" in st.runs) && !("z" in st.runs) && st.runs["a:2026-11-02"] && st.runs["a:2026-11-02"].cur === null && Object.keys(st.days).length === 0);
    await q.click("#go-e").catch(() => {}); await q.waitForTimeout(150);
    check("記録の文字を HTML として出さない", await q.locator("#xss, #xss2, #xss3, #xss4").count() === 0);
    await q.context().close();
  }
  // 実績・このゲームについて
  await p.click("#go-ach");
  check("実績は13個で、腕前・集める・続けるの3つの組", await p.locator(".ach").count() === 13 && await p.locator(".agrp").count() === 3 && await p.locator(".ach.got").count() >= 3);
  check("達成した実績は ✓ の文字も付く（色だけで分けない）", (await p.textContent(".ach.got b")).startsWith("✓"));
  await p.click("#back"); await p.click("#f-about");
  check("このゲームについて：出典のリンクと、法律相談には使えないこと", (await p.textContent("#about")).includes("法律相談には使えません") && await p.locator("#about a").count() >= 8);
  await p.context().close();

  // まちがいなしの日は Ko-fi を1回だけ
  {
    const q = await newPage(); await closeHow(q); await q.click("#go-d");
    for (let i = 0; i < 5; i++) { await solve(q); await q.click("#next"); }
    await q.waitForTimeout(150);
    check("全部まちがいなしで初めて終えたときだけ Ko-fi の一言", await q.locator(".kofi").count() === 1 && (await q.textContent(".big")).includes("まちがいなし"));
    await q.click("#back"); await q.click("#go-d");
    check("結果をもう一度見ても Ko-fi は出さない", await q.locator(".kofi").count() === 0);
    await q.context().close();
  }

  // カレンダー・あとから：過去の日の記録を置いて見る
  {
    // 第1回（2026-11-07）から日がたった日に時計を合わせる（第1回の日でも、取りこぼした日を確かめられる）
    const cctx = await browser.newContext({ viewport: { width: 390, height: 800 } }); await cctx.clock.setFixedTime(new Date("2026-11-17T03:00:00Z"));
    const T2 = "2026-11-17", dayBefore = (n) => new Date(Date.parse(T2) - n * 864e5).toISOString().slice(0, 10);
    const q = await newPage(390, cctx);
    await q.evaluate(([d2, d3]) => { localStorage.setItem("saiban-v1", JSON.stringify({ v: 1, tut: true, days: { [d2]: { m: [0, 0, 0, 0, 0], k: [] }, [d3]: { m: [1, 0, 0, 2, 0], k: [] } }, hdays: {}, adays: {}, dex: {}, runs: {}, kofi: {}, ach: {}, ebest: 0 })); }, [dayBefore(2), dayBefore(3)]);
    await q.reload(); await q.waitForTimeout(150);
    check("ホームの「続けて」は、きのうを休んだら — （休んだ日を責めない）", (await q.textContent(".stats")).includes("—"));
    await q.click("#go-cal");
    const lateList = await q.evaluate(() => __km.lateDays(__km.load()));
    const exp = [1, 4, 5, 6, 7].map(dayBefore).filter((d) => d >= "2026-11-07");
    check("カレンダー：取りこぼした過去7日（第1回より後）を押せる", JSON.stringify(lateList) === JSON.stringify(exp), lateList.join(","));
    check("カレンダー：遊んだ日は★の数の文字も付く", (await q.locator(".cal .c.p3").count()) + (await q.locator(".cal .c.p2").count()) + (await q.locator(".cal .c.p1").count()) >= (dayBefore(3).slice(0, 7) === T2.slice(0, 7) ? 2 : 0));
    if (lateList.length) {
      const d = lateList[0];
      await q.evaluate((d) => { const b = document.querySelector(`.cal .miss[data-k="${d}"]`); if (b) b.click(); else { const m = document.querySelector(".calnav #prev"); m && m.click(); } }, d);
      if (!(await q.locator(".ch").count())) await q.click(`.cal .miss[data-k="${d}"]`);
      check("あとから：その日の今日の5問と同じ問題", JSON.stringify(await q.evaluate((d) => __km.load().runs["a:" + d].list, d)) === JSON.stringify(G.dailyTags(d)));
      for (let i = 0; i < 5; i++) { await solve(q); await q.click("#next"); }
      await q.waitForTimeout(150);
      const s = await mem(q);
      check("あとからは adays に入り、今日の記録・続けた日には数えない", s.adays[d] && !s.days[d] && (await q.locator(".share").count()) === 0 && (await q.locator(".kofi").count()) === 0);
    } else check("あとから：遊べる日がある", false, "第1回の日から日がたっていない");
    await q.context().close();
  }

  // 古いタブ：同じ問題を2つのタブで開き、片方で答えたら、もう片方は二重に入れない
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const a = await newPage(390, ctx); await closeHow(a); await a.click("#go-d");
    const b = await ctx.newPage(); b.on("pageerror", (e) => errors.push(e.message)); await b.goto(url); await b.waitForTimeout(150); await b.click("#go-d");
    await solve(a);
    await b.click(`.ch[data-j="${await ansIdx(b)}"]`);
    await b.waitForTimeout(200);
    const s = await mem(a);
    check("古いタブで同じ問題に答えても二重に数えない", s.runs.d.res.length === 1 && Object.values(s.dex).reduce((x, y) => x + y) === 1);
    // ヒントの数は、別のタブで使った分も減らさない
    await a.click("#next"); await b.goto(url); await b.waitForTimeout(150); await b.click("#go-d");
    const c2 = await ctx.newPage(); c2.on("pageerror", (e) => errors.push(e.message)); await c2.goto(url); await c2.waitForTimeout(150); await c2.click("#go-d"); await c2.waitForTimeout(100); // ヒントを使う前に開いた古いタブ
    let used = 0; for (let i = 0; i < 2; i++) if (await a.locator("#hint").isEnabled()) { await a.click("#hint"); used++; } // 2択の問題はヒント1回まで
    if (await b.locator("#hint").isEnabled()) await b.click("#hint");
    check("別のタブで使ったヒントの数を減らさない", used >= 1 && (await mem(a)).runs.d.cur.hints === used);
    // ヒントを使っていない古いタブで正解しても、別のタブのヒントを★に数える（2026-11-07 CodeRabbit）
    await c2.click(`.ch[data-j="${await ansIdx(c2)}"]`); await c2.waitForTimeout(150);
    check("古いタブの正解でも、別のタブで使ったヒントを★に数える", (await mem(a)).runs.d.res[1].m >= used, JSON.stringify((await mem(a)).runs.d.res));
    await c2.close();
    await ctx.close();
  }

  // スマホ幅・とても大きい文字でもはみ出さない・押す所は44px以上
  {
    const bad = [], small = [];
    for (const [w, fs] of [[320, 3], [390, 2], [320, 1]]) {
      const q = await newPage(w); await closeHow(q);
      await q.evaluate((fs) => localStorage.setItem("saiban-fs", String(fs)), fs); await q.reload(); await q.waitForTimeout(150);
      for (const go of [null, "#go-d", "solve", "#go-cal", "#go-dex", "#go-ach", "#go-e"]) {
        if (go === "solve") { await solve(q); }
        else if (go) { await q.goto(url); await q.waitForTimeout(100); await q.click(go); }
        await q.waitForTimeout(100);
        const ov = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (ov > 0) bad.push(`${w}px 文字${fs} ${go || "ホーム"} ${ov}px`);
        small.push(...(await q.$$eval("button:not([disabled]), a[href]", (bs) => bs.filter((b) => b.checkVisibility() && !b.closest(".cal")).filter((b) => b.getBoundingClientRect().height < 44).map((b) => (b.id || b.className || b.textContent).slice(0, 20)))).map((x) => `${w}/${fs}/${go}:${x}`));
      }
      await q.context().close();
    }
    // とことん：正解したすぐあとでも「ここで降りる」で終われる（2026-11-07 CodeRabbit。前は次の問題へ進むまで押しても何も起きなかった）
    {
      const q = await newPage(); await closeHow(q); await q.click("#go-e"); await q.waitForTimeout(150);
      const ans = await q.evaluate(() => __km.cur().P.ans);
      await q.locator(".ch").nth(await ansIdx(q)).click(); await q.waitForTimeout(100);
      const lab = (await q.textContent("#quit")) || "";
      await q.click("#quit"); await q.waitForTimeout(150);
      check("とことん：正解したあとでも「ここで降りる」で結果へ進み、ボタンの数も答えた数になる", /1問で終える/.test(lab) && await q.locator("#eres").count() === 1, lab);
      await q.context().close();
    }
    // 正解すると、言葉の札（読み・条文・意味）が出る。幅320pxでも札ははみ出さない
    {
      const q = await newPage(320); await closeHow(q); await q.click("#go-e"); await q.waitForTimeout(150);
      await q.evaluate(() => { __km.save((x) => { x.runs.e.list[x.runs.e.res.length] = "kumi|0"; }); __km.play(); });
      await q.waitForTimeout(150);
      const ans = await q.evaluate(() => __km.cur().P.ans);
      await q.locator(".ch").nth(await ansIdx(q)).click(); await q.waitForTimeout(100);
      const cd = await q.evaluate(() => { const cs = [...document.querySelectorAll("#scene .card")]; return { n: cs.length, txt: cs.map((c) => c.textContent), w: Math.max(0, ...cs.map((c) => c.getBoundingClientRect().right)), sw: document.documentElement.scrollWidth }; });
      check("正解すると、選び肢の言葉の札が出る（組み合わせの問題は4枚。読み・条文・意味。幅320pxではみ出さない）", cd.n === 4 && cd.txt.some((t) => t.includes(ans.split("：")[0] + "（")) && cd.txt.some((t) => /法\d+条/.test(t)) && cd.w <= 320 && cd.sw <= 320, JSON.stringify(cd).slice(0, 300));
      await q.context().close();
    }
    check("幅320px・とても大きい文字でも横にはみ出さない", bad.length === 0, bad.join(" / "));
    check("押せる所は高さ44px以上", small.length === 0, [...new Set(small)].slice(0, 8).join(","));
  }

  // 見やすさの設定を全部入れても、ページの一番下まで動ける（読み上げの class が html に当たって固まった。2026-11-05）
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 700 } });
    await ctx.addInitScript(() => localStorage.setItem("a11y-v1", JSON.stringify({ read: true, cvd: true, calm: true, say: true, ruby: true })));
    const q = await newPage(390, ctx); await closeHow(q);
    const r = await q.evaluate(() => { window.scrollTo(0, 1e5); const f = document.querySelector("footer").getBoundingClientRect(); return [scrollY, Math.round(f.bottom), innerHeight, getComputedStyle(document.documentElement).position]; });
    check("見やすさの設定を全部入れても、いちばん下まで動ける（html が固定されない）", r[0] > 0 && r[1] <= r[2] && r[3] === "static", r.join(","));
    await ctx.close();
  }
  // キーボードだけで遊べる（Tab と Enter）
  {
    const q = await newPage(); await closeHow(q);
    await q.focus("#go-d"); await q.keyboard.press("Enter"); await q.waitForTimeout(100);
    const j = await ansIdx(q);
    await q.focus(`.ch[data-j="${j}"]`); await q.keyboard.press("Enter"); await q.waitForTimeout(100);
    check("キーボードだけで選んで答えられる", await q.locator(".verdict").count() === 1);
    await q.context().close();
  }
} catch (e) { check("ブラウザでの検査が最後まで動く", false, e.stack.split("\n").slice(0, 3).join(" ")); }

// 引き継ぎコード（shared-workflows template/qa/transfer-check.mjs）
try {
  const sample = { "saiban-v1": JSON.stringify({ v: 1, tut: true, days: { "2026-11-07": { m: [0, 1, 0, 0, 2], k: ["yogo", "jitai", "imi", "kubun", "narabe"] } }, hdays: {}, adays: {}, dex: { yogo: 1, jitai: 1, imi: 1, kubun: 1, narabe: 1 }, runs: {}, kofi: {}, ach: {}, ebest: 7, elast: null, t: 1 }), "saiban-fs": "3" };
  await checkTransfer({ browser, url, game: "saibanin-shikumi", sample, check, open: async (pg) => { if (await pg.locator("#howto[open]").count()) await pg.click("#howto-ok"); } });
} catch (e) { check("引き継ぎの検査が最後まで動く", false, e.message.split("\n")[0]); }
await browser.close();
server.close();
check("画面のエラーが無い", errors.length === 0, errors.slice(0, 3).join(" | "));

{ // 見やすさ・読みやすさ・偏り（shared-workflows template/qa/a11y.mjs の写し）
  const { spawnSync } = await import("node:child_process");
  const a = spawnSync(process.execPath, [path.join(root, "qa", "a11y.mjs")], { encoding: "utf8", env: process.env });
  check("見やすさ・読みやすさの検査（qa/a11y.mjs。中身は qa-report/a11y.md）", a.status === 0, (a.stdout.match(/^- ❌.*$/gm) || []).join(" / ") || (a.status ? a.stderr.slice(-300) : ""));
}

const ng = results.filter((r) => !r.ok);
const md = `# 裁判員のしくみ QA\n\n${results.map((r) => `- ${r.ok ? "✅" : "❌"} ${r.name}${r.detail ? `（${r.detail}）` : ""}`).join("\n")}\n\n${ng.length ? `❌ ${ng.length}件` : `✅ ${results.length}項目すべて通過`}\n`;
mkdirSync(path.join(root, "qa-report"), { recursive: true });
writeFileSync(path.join(root, "qa-report/report.md"), md);
console.log(md);
process.exit(ng.length ? 1 : 0);
