/* Structural validator for the decks. Run: node assets/validate.js */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = [
  'index.html',
  ...fs.readdirSync(path.join(root, 'modules')).sort().map(f => 'modules/' + f)
].filter(f => f.endsWith('.html'));

const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr','!doctype']);
const KNOWN_PREFIXES = ['slide','deck','hero','divider','card','termcard','tblock','callout','code','math','flow','node','arrow',
  'vs','pc','steps','stat','quote','bigstat','fragment','eyebrow','rule','badge','term','grid','g2','g3','g4','g5','g-2-1','g-1-2',
  'stack','row','spacer','center','mt','mb0','narrow','full','ltr','nowrap','sm','xs','dim','mute','clean','table','td-','tablewrap',
  'mod','hub','btn','counter','toc','help','progress','topbar','navbar','k','t','s','n','c','f','at','p','lbl','eq','res','var','cmt','en'];

let totalSlides = 0, hardFail = 0;
const stats = [];

for (const rel of files) {
  const file = path.join(root, rel);
  const html = fs.readFileSync(file, 'utf8');
  const issues = [];

  // strip comments + doctype before structural parsing (keep offsets by padding)
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, s => ' '.repeat(s.length))
    .replace(/<!doctype[^>]*>/gi, s => ' '.repeat(s.length));

  // --- tag balance ---
  const stack = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(stripped))) {
    const [, close, rawTag, attrs] = m;
    const tag = rawTag.toLowerCase();
    if (VOID.has(tag) || attrs.trimEnd().endsWith('/')) continue;
    if (!close) stack.push({ tag, i: m.index });
    else {
      if (!stack.length) { issues.push(`stray </${tag}>`); continue; }
      const top = stack.pop();
      if (top.tag !== tag) {
        const line = stripped.slice(0, m.index).split('\n').length;
        issues.push(`mismatch: </${tag}> at line ${line} closes <${top.tag}> opened at line ${stripped.slice(0, top.i).split('\n').length}`);
      }
    }
  }
  stack.forEach(o => issues.push(`unclosed <${o.tag}> at line ${stripped.slice(0, o.i).split('\n').length}`));

  // --- deck-specific checks ---
  const isDeck = rel.startsWith('modules/');
  const slides = [...html.matchAll(/<section class="slide[^"]*"([^>]*)>/g)];
  const count = (re) => (html.match(re) || []).length;
  // matches a class token even when combined, e.g. class="exercise fragment"
  const countClass = (name) =>
    (html.match(new RegExp(`class="[^"]*\\b${name}\\b[^"]*"`, 'g')) || []).length;

  if (isDeck) {
    totalSlides += slides.length;
    if (slides.length < 38) issues.push(`only ${slides.length} slides (need 40+)`);
    slides.forEach((s, i) => { if (!/data-title=/.test(s[1])) issues.push(`slide #${i + 1} missing data-title`); });

    if (!/<body[^>]*data-deck=/.test(html)) issues.push('body missing data-deck');
    if (!/href="\.\.\/assets\/css\/deck\.css"/.test(html)) issues.push('CSS link wrong/missing');
    if (!/src="\.\.\/assets\/js\/deck\.js"/.test(html)) issues.push('deck.js script missing');
    if (!/src="\.\.\/assets\/js\/glossary\.js"/.test(html)) issues.push('glossary.js script missing');
    if (/<style[\s>]/.test(html)) issues.push('contains a <style> block (forbidden)');
    if (!/dir="rtl"/.test(html)) issues.push('missing dir="rtl"');

    // --- teaching requirements ---
    // NOTE: "مرشّح" alone is a legitimate ML term (candidate generation) — only ban
    // it in the hiring sense, i.e. next to interview wording.
    const banned = html.match(
      /إنترفيو|Interview|المقابلة الشخصية|Whiteboard|45 دقيقة|المرشّح في المقابلة|هتفشل في المقابلة/gi);
    if (banned) issues.push(`BANNED interview wording found (${banned.length}x): ${[...new Set(banned)].slice(0,4).join(', ')}`);

    const decodes = countClass('decode');
    if (decodes < 6) issues.push(`only ${decodes} .decode blocks (need 6+)`);

    const exercises = countClass('exercise');
    if (exercises < 8) issues.push(`only ${exercises} exercises (need 8+)`);

    const solutions = countClass('solution');
    if (solutions < exercises) issues.push(`${exercises} exercises but only ${solutions} hidden solutions`);

    const examples = countClass('example');
    if (examples < 5) issues.push(`only ${examples} worked examples (need 5+)`);

    const checkpoints = countClass('checkpoint');
    if (checkpoints < 4) issues.push(`only ${checkpoints} checkpoints (need 4+)`);

    const codes = countClass('code');
    if (codes < 5) issues.push(`only ${codes} code blocks (need 5+)`);

    const dividers = count(/data-divider/g);
    if (dividers < 4) issues.push(`only ${dividers} section dividers (need 4+)`);

    stats.push({ rel, slides: slides.length, decodes, exercises, examples, checkpoints, codes });
  }

  // --- unescaped < inside code blocks ---
  for (const cb of html.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)) {
    const inner = cb[1];
    const bad = inner.match(/<(?!\/?span\b)[a-zA-Z\/!]/g);
    if (bad) issues.push(`unescaped '<' inside <pre><code> (${bad.length}x) — use &lt;`);
  }
  // --- <pre> must never appear inside .math ---
  if (/<div class="math"[\s\S]{0,4000}?<\/pre>/.test(html)) {
    const seg = html.match(/<div class="math"[^>]*>([\s\S]*?)<\/div>/g) || [];
    if (seg.some(s => s.includes('</pre>'))) issues.push('<pre> inside .math block');
  }

  // --- broken internal links ---
  for (const l of html.matchAll(/href="((?!http|#|mailto)[^"]+\.html)"/g)) {
    const target = path.resolve(path.dirname(file), l[1]);
    if (!fs.existsSync(target)) issues.push(`broken link → ${l[1]}`);
  }

  const label = rel.padEnd(34);
  if (issues.length) {
    hardFail++;
    console.log(`FAIL  ${label} ${isDeck ? slides.length + ' slides' : ''}`);
    issues.slice(0, 12).forEach(i => console.log(`        • ${i}`));
    if (issues.length > 12) console.log(`        • ...and ${issues.length - 12} more`);
  } else {
    console.log(`ok    ${label} ${isDeck ? slides.length + ' slides' : 'hub'}`);
  }
}

if (stats.length) {
  console.log('\n' + 'module'.padEnd(30) + 'slides  decode  exer  examp  chkpt  code');
  console.log('-'.repeat(70));
  const sum = { slides: 0, decodes: 0, exercises: 0, examples: 0, checkpoints: 0, codes: 0 };
  for (const s of stats) {
    for (const k of Object.keys(sum)) sum[k] += s[k];
    console.log(
      s.rel.replace('modules/', '').replace('.html', '').padEnd(30) +
      String(s.slides).padStart(5) + String(s.decodes).padStart(8) +
      String(s.exercises).padStart(6) + String(s.examples).padStart(7) +
      String(s.checkpoints).padStart(7) + String(s.codes).padStart(6));
  }
  console.log('-'.repeat(70));
  console.log('TOTAL'.padEnd(30) +
    String(sum.slides).padStart(5) + String(sum.decodes).padStart(8) +
    String(sum.exercises).padStart(6) + String(sum.examples).padStart(7) +
    String(sum.checkpoints).padStart(7) + String(sum.codes).padStart(6));
}

console.log(`\n${files.length} files · ${totalSlides} slides · ${hardFail} file(s) with issues`);
process.exit(hardFail ? 1 : 0);
