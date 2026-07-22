/* Verifies glossary.js parses, has no duplicate keys, and every entry is well-formed.
   Run: node assets/check-glossary.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = path.join(__dirname, 'js', 'glossary.js');
const src = fs.readFileSync(file, 'utf8');

const sandbox = { window: {} };
try {
  vm.runInNewContext(src, sandbox, { filename: 'glossary.js' });
} catch (e) {
  console.error('❌ PARSE ERROR:', e.message);
  process.exit(1);
}

const G = sandbox.window.GLOSSARY;
if (!G || typeof G !== 'object') {
  console.error('❌ window.GLOSSARY is missing or not an object');
  process.exit(1);
}

const keys = Object.keys(G);
const issues = [];

// duplicate keys survive as one entry in the object, so scan the raw source
const seen = new Map();
for (const m of src.matchAll(/^\s{2}"([^"]+)"\s*:\s*\{/gm)) {
  const k = m[1];
  seen.set(k, (seen.get(k) || 0) + 1);
}
for (const [k, n] of seen) if (n > 1) issues.push(`duplicate key "${k}" appears ${n}×`);

// shape check
for (const [k, v] of Object.entries(G)) {
  if (k !== k.toLowerCase()) issues.push(`key "${k}" is not lowercase`);
  if (!v.ar)   issues.push(`"${k}" missing ar`);
  if (!v.desc) issues.push(`"${k}" missing desc`);
  if (v.desc && v.desc.length < 25) issues.push(`"${k}" desc too short`);
}

console.log(`glossary.js — ${keys.length} terms, ${seen.size} raw entries`);
if (issues.length) {
  console.log(`\n⚠️  ${issues.length} issue(s):`);
  issues.slice(0, 30).forEach(i => console.log('  • ' + i));
  if (issues.length > 30) console.log(`  • …and ${issues.length - 30} more`);
  process.exit(1);
}
console.log('✅ parses cleanly · no duplicates · all entries well-formed');
