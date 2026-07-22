# Deck Component Reference

Use ONLY these classes. Never add `<style>` blocks or new CSS.

---

## ⚠️ TEACHING PHILOSOPHY — read this before writing any slide

This is a **learning course for a working developer**, NOT interview prep.

**FORBIDDEN — never write any of this:**
- The words "إنترفيو", "interview", "candidate", "مرشح", "الـ Interviewer"
- "في 45 دقيقة", time budgets for answering, "هتفشل", "بيفرّق بين Mid و Senior"
- "إزاي تجاوب", "اكتب على الـ Whiteboard", "الإجابة اللي بتفشّل"
- Anything framed as "how to impress someone"

**REQUIRED framing instead:** "إزاي تفهم"، "إزاي تقرر"، "إزاي تطبّق ده على نظامك"، "إمتى تستخدمه وإمتى لأ".

**Every English fragment must be decoded.** Never leave a technical line unexplained.
If you write `10M DAU, 500K peak concurrent` or `p99 latency < 200ms` — you MUST follow it
with a `.decode` block breaking down **every single token**. This is the #1 requirement.

**Every concept needs:** تعريف → تشبيه ملموس → مثال محلول → تمرين بحل مخفي.
Never move to the next concept without an exercise on the current one.

---

## File skeleton (copy exactly)

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NN — العنوان العربي | English Title</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/deck.css">
</head>
<body data-deck="mNN" data-module-title="NN — العنوان العربي">
<div class="deck">
  <!-- slides -->
</div>
<script src="../assets/js/glossary.js"></script>
<script src="../assets/js/deck.js"></script>
</body>
</html>
```

Both `<script>` tags are required, in that order. The engine builds the progress bar,
nav bar, TOC, help overlay, pronunciation and glossary popups automatically.

Every slide: `<section class="slide" data-title="عنوان قصير للفهرس"> … </section>`

---

## 🔊 DECODE — تفكيك السطر التقني (THE most important component)

Use it after **every** compact technical line, formula, config value, or metric string.

```html
<div class="decode">
  <div class="decode__raw">10M DAU, 500K peak concurrent</div>
  <div class="decode__hint">السطر ده مكتوب مختصر جدًا — خلينا نفكّه كلمة كلمة</div>
  <div class="decode__rows">
    <div class="decode__row">
      <span class="decode__tok">10M</span>
      <div class="decode__exp"><b>10 مليون</b>. الحرف <code>M</code> اختصار <span class="term">Million</span>.</div>
    </div>
    <div class="decode__row">
      <span class="decode__tok">DAU</span>
      <div class="decode__exp">اختصار <span class="term">Daily Active Users</span> — عدد المستخدمين الفريدين خلال 24 ساعة.</div>
    </div>
  </div>
  <div class="decode__sum">عندنا 10 مليون شخص بيستخدموا التطبيق يوميًا، منهم 500 ألف موجودين في نفس اللحظة وقت الذروة.</div>
</div>
```

`.decode__tok` is clickable → pronounces + shows the glossary card. `.decode__sum` is the plain-Arabic summary (required).

---

## 💬 PLAIN — الشرح بالبلدي

```html
<div class="plain">
  <span class="plain__label">يعني إيه بالبلدي؟</span>
  الجملة دي معناها ببساطة إن…
</div>
```

---

## 🧩 EXAMPLE — مثال محلول

```html
<div class="example">
  <div class="example__head">مثال محلول: نظام كاشير في 200 فرع</div>
  <div class="example__body">
    …الخطوات بالتفصيل، ويفضّل معاها <div class="math">…</div>
  </div>
</div>
```

## ✏️ EXERCISE — تمرين + حل مخفي

```html
<div class="exercise">
  <div class="exercise__head">تمرين 1 — احسب الـ QPS<span class="exercise__level">سهل</span></div>
  <div class="exercise__body">
    <p>عندك تطبيق بـ 2 مليون <span class="term">DAU</span>، كل مستخدم بيعمل 15 قراءة يوميًا. احسب الـ Read QPS.</p>
    <details class="solution">
      <summary>شوف الحل</summary>
      <div class="solution__body">
        <div class="math">…</div>
        <p>خطوات الحل بالتفصيل…</p>
      </div>
    </details>
  </div>
</div>
```

`exercise__level` values: `سهل` / `متوسط` / `صعب`.
Rule: **at least one exercise per major concept**, and 6–10 exercises per module minimum.

## 🎯 CHECKPOINT — قبل ما تكمل

```html
<div class="checkpoint">
  <div class="checkpoint__title">قبل ما تنتقل للجزء الجاي، تأكد إنك تقدر تجاوب على ده</div>
  <ul>
    <li>إيه الفرق بين <span class="term">Latency</span> و<span class="term">Throughput</span>؟</li>
    <li>ليه المتوسط مضلّل وبنستخدم <span class="term">p99</span> بدله؟</li>
  </ul>
</div>
```
Put one at the end of every section (before each divider).

---

## Slide header

```html
<div class="slide__head">
  <span class="eyebrow">المفهوم 03</span>
  <h2 class="slide__title">العنوان</h2>
  <p class="slide__sub">جملة تمهيدية.</p>
  <div class="rule"></div>
</div>
<div class="slide__body"> …content… </div>
```

## Hero (slide 1) — `slide slide--center`
```html
<div class="hero">
  <div class="hero__module">NN</div>
  <h1 class="hero__title slide__title">العنوان</h1>
  <p class="hero__sub">وصف</p>
  <div class="hero__meta"><span class="badge">Tag</span><span class="badge badge--v">Tag</span></div>
</div>
```

## Divider — `slide slide--center` + `data-divider`
```html
<div class="divider" style="--accent:var(--amber)">
  <div class="divider__num">02</div>
  <h2 class="divider__title">العنوان</h2>
  <p class="divider__sub">وصف</p>
</div>
```

## TERM CARD — the core teaching unit, one per key term
```html
<div class="termcard termcard--v">   <!-- (none)=cyan, --v --a --e --r --b -->
  <div class="termcard__head">
    <span class="termcard__en">Consistent Hashing</span>
    <span class="termcard__ar">التجزئة المتسقة</span>
  </div>
  <div class="termcard__body">
    <div class="tblock"><span class="tblock__label">التعريف الدقيق</span> …</div>
    <div class="tblock tblock--analogy"><span class="tblock__label">تشبيه</span> …</div>
    <div class="tblock tblock--net"><span class="tblock__label">تطبيق .NET</span> …</div>
    <div class="tblock tblock--trap"><span class="tblock__label">فخ شائع ⚠️</span> …</div>
    <div class="tblock tblock--win"><span class="tblock__label">إمتى تستخدمه</span> …</div>
  </div>
</div>
```
`.termcard__en` is auto-clickable → pronunciation + Arabic meaning.

## Cards
```html
<div class="grid g2">   <!-- g2 g3 g4 g5 g-2-1 g-1-2 ; child class="full" spans all -->
  <div class="card card--e">        <!-- card--c/v/a/e/r/b ; card--flat = no top bar -->
    <span class="card__num">01</span>
    <div class="card__icon">🔑</div>
    <h3 class="card__title">عنوان</h3>
    <p class="card__body">نص</p>
  </div>
</div>
```

## Callouts
```html
<div class="callout callout--key">   <!-- --info --tip --warn --danger --key -->
  <div class="callout__icon">💡</div>
  <div class="callout__body"><span class="callout__title">عنوان</span> نص</div>
</div>
```

## Inline
- `<span class="term">Load Balancer</span>` — wrap **every** English technical term. Variants `term--v` `term--a` `term--e` `term--r`.
- `<span class="ltr">99.99%</span>` — wrap every latin/number run sitting inside Arabic prose.
- `<span class="say">any english</span>` — pronounceable but not styled as a term chip.
- `<strong>` white bold · `<em>` amber · `<mark>` highlight · `<code>` inline code.

## Code block (escape `<`→`&lt;`, `&`→`&amp;`)
```html
<div class="code">
  <div class="code__bar"><span class="code__dots"><i></i><i></i><i></i></span><span>File.cs</span><span class="code__lang">C# / .NET 9</span></div>
<pre><code><span class="c">// تعليق بالعربي مسموح جوّه الكود</span>
<span class="k">public</span> <span class="k">async</span> <span class="t">Task</span> <span class="f">DoAsync</span>()
{
    <span class="k">var</span> x <span class="p">=</span> <span class="s">"str"</span> <span class="p">+</span> <span class="n">42</span>;
}</code></pre>
</div>
```
Tokens: `k`=keyword `t`=type `s`=string `n`=number `c`=comment `f`=function `at`=attribute `p`=punctuation.
**After every code block, add a short Arabic paragraph or `.plain` explaining what it does line by line.**

## Math / capacity block (auto-LTR — never put `<pre>` inside)
```html
<div class="math">
<span class="cmt">// ═══ عنوان ═══</span>
<span class="lbl">DAU</span> <span class="eq">=</span> <span class="n">100</span> <span class="var">million</span>
<span class="lbl">QPS</span> <span class="eq">=</span> <span class="res">20,000</span>
</div>
```
Spans: `lbl` grey label · `eq` amber operator · `n` number · `var` cyan variable · `res` green result · `cmt` comment.
**Every `.math` block must be followed by a `.decode` or a plain-Arabic sentence explaining the result.**

## Table
```html
<div class="tablewrap"><table>
  <thead><tr><th>عمود</th></tr></thead>
  <tbody><tr><td>قيمة</td><td class="td-ok">جيد</td><td class="td-bad">سيء</td><td class="td-mid">متوسط</td></tr></tbody>
</table></div>
```

## Architecture flow
```html
<div class="flow">                        <!-- flow--col for vertical tiers -->
  <div class="node node--c"><span class="node__ico">⚖️</span>Load Balancer<span class="node__sub">L7</span></div>
  <span class="arrow">←</span>             <!-- RTL: flow reads right-to-left, use ← -->
  <div class="node node--e"><span class="node__ico">⚙️</span>Service</div>
</div>

<div class="flow flow--col">
  <div class="flow__tier"> …nodes… </div>
  <div class="flow__vert">↓</div>
  <div class="flow__tier"> …nodes… </div>
</div>
```
Node colors `node--c/v/a/e/r/b`, `node--ghost` for optional parts.
**Always follow a diagram with a numbered walkthrough of one request through it.**

## Compare
```html
<div class="vs">
  <div class="card card--e">…</div>
  <div class="vs__mid">VS</div>
  <div class="card card--r">…</div>
</div>
```

## Lists
```html
<ul class="pc pc--pro">…</ul>       <!-- ✔ أخضر -->
<ul class="pc pc--con">…</ul>       <!-- ✘ أحمر -->
<ul class="pc pc--neutral">…</ul>   <!-- ◆ أصفر -->
<ul class="clean">…</ul>            <!-- نقاط ماسية -->
```

## Steps
```html
<ol class="steps">
  <li style="--accent:var(--cyan)"><h4>عنوان</h4><p>شرح</p></li>
</ol>
```

## Stats
```html
<div class="grid g3">
  <div class="stat stat--a"><span class="stat__value">99.99%</span><span class="stat__label">وصف</span></div>
</div>
```
Animated: `<span class="stat__value" data-count="80" data-suffix="%">0%</span>`

## Quote / big number
```html
<div class="quote"><span class="quote__mark">"</span>النص<span class="quote__by">— المصدر</span></div>
<div class="bigstat">10×</div>
```

## Reveal step by step
`class="fragment"` on a direct child of `.slide__body`. Max 3 per slide, never on the first child.

## Badges
`<span class="badge badge--v">Text</span>` — `--v --a --e --r --muted`

## Utilities
`sm` `xs` `dim` `mute` `center` `mt` `mb0` `narrow` `full` `ltr` `nowrap` `row` `row--center` `stack` `spacer`

## Last slide of every module
```html
<section class="slide slide--center" data-title="الموديول القادم">
  <div class="divider">
    <span class="eyebrow">اللي جاي</span>
    <h2 class="divider__title">الموديول NN — <span class="term" style="font-size:.55em">English Title</span></h2>
    <p class="divider__sub">المواضيع</p>
    <div class="row row--center mt">
      <a class="btn btn--primary btn--solo" href="NEXT-FILE.html" style="text-decoration:none">ابدأ الموديول NN ←</a>
      <a class="btn btn--solo" href="../index.html" style="text-decoration:none">⌂ كل الموديولات</a>
    </div>
  </div>
</section>
```

## Adding to the glossary
If you introduce a term that is central to your module, add it to
`assets/js/glossary.js` in the same object format:
```js
"consistent hashing": { ar: "التجزئة المتسقة", full: "Consistent Hashing",
  desc: "شرح بالعربي مع <b>تمييز</b>…", eg: "مثال قصير." },
```
Keys are lowercase. Only append — never rewrite existing entries.
