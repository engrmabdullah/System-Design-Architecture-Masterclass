/* Removes duplicate glossary keys, keeping the richer definition.
   Run: node assets/dedupe-glossary.js */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'js', 'glossary.js');
let src = fs.readFileSync(file, 'utf8');

// --- split the file into: header | entries | footer ---
const open = src.indexOf('window.GLOSSARY = {');
const bodyStart = src.indexOf('{', open) + 1;

// walk from bodyStart to the matching closing brace of the object literal
function matchBrace(s, from) {
  let depth = 1, inStr = null;
  for (let i = from; i < s.length; i++) {
    const c = s[i], prev = s[i - 1];
    if (inStr) { if (c === inStr && prev !== '\\') inStr = null; continue; }
    if (c === '"' || c === "'") { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

const bodyEnd = matchBrace(src, bodyStart);
const header = src.slice(0, bodyStart);
const body = src.slice(bodyStart, bodyEnd);
const footer = src.slice(bodyEnd);

// --- collect entries: everything from a `  "key": {` to its matching `}` ---
const entryRe = /^[ \t]*"([^"]+)"\s*:\s*\{/gm;
const entries = [];
let m;
while ((m = entryRe.exec(body))) {
  const key = m[1];
  const braceAt = body.indexOf('{', m.index + m[0].length - 1);
  const end = matchBrace(body, braceAt + 1);
  if (end === -1) { console.error('unbalanced entry:', key); process.exit(1); }
  entries.push({ key, start: m.index, end: end + 1, text: body.slice(m.index, end + 1) });
  entryRe.lastIndex = end + 1;
}

// --- pick the richer definition for duplicates ---
const best = new Map();
const dupes = [];
for (const e of entries) {
  const cur = best.get(e.key);
  if (!cur) { best.set(e.key, e); continue; }
  dupes.push(e.key);
  if (e.text.length > cur.text.length) best.set(e.key, e);   // keep the longer one
}

if (!dupes.length) { console.log('no duplicates — nothing to do'); process.exit(0); }

// --- rebuild the body, preserving comment separators between groups ---
const keep = new Set([...best.values()].map(e => e.start));
const drop = entries.filter(e => !keep.has(e.start)).sort((a, b) => b.start - a.start);

let newBody = body;
for (const e of drop) {
  // also swallow the trailing comma + newline left behind
  let after = e.end;
  while (after < newBody.length && /[,\s]/.test(newBody[after])) {
    if (newBody[after] === '\n') { after++; break; }
    after++;
  }
  newBody = newBody.slice(0, e.start) + newBody.slice(after);
}

fs.writeFileSync(file, header + newBody + footer, 'utf8');
console.log(`removed ${drop.length} duplicate entr${drop.length === 1 ? 'y' : 'ies'}: ${[...new Set(dupes)].join(', ')}`);
