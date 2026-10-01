const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const css = fs.readFileSync(path.join(root, 'css', 'style.css'), 'utf8');
const open = (css.match(/\{/g) || []).length;
const close = (css.match(/\}/g) || []).length;
console.log('CSS braces:', open, close, open === close ? 'OK' : 'MISMATCH');
const cssClasses = new Set();
let m;
const clsRe = /\.([A-Za-z_][A-Za-z0-9_-]*)/g;
while ((m = clsRe.exec(css))) cssClasses.add(m[1]);

const voidTags = new Set(['img','br','hr','input','meta','link','source','path','circle','rect','use','col','area','base','embed','track','wbr']);
const jsOnly = new Set(['no-js','js','in','open','on','active','show','scrolled']);

const files = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
files.forEach((file) => {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const issues = [];

  if (file !== 'index.html') {
    if (/<!--#(NAV|CTA|FOOTER|BRANDS|TESTIMONials?)-->/i.test(html)) issues.push('leftover marker');
    if (/#NAV_START|#CTA_START|#FOOTER_START/.test(html)) issues.push('START marker leaked');
  }

  // tag balance
  const stack = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g;
  let t;
  while ((t = tagRe.exec(html))) {
    const name = t[1].toLowerCase();
    const closing = t[0][1] === '/';
    const selfClose = t[2] === '/' || voidTags.has(name);
    if (['svg','path','circle','rect','line','polyline','polygon','g','defs','stroke'].includes(name)) continue;
    if (selfClose) continue;
    if (!closing) stack.push(name);
    else {
      const top = stack.pop();
      if (top !== name) { issues.push('tag mismatch: </' + name + '> closed <' + top + '>'); break; }
    }
  }
  if (stack.length) issues.push('unclosed: ' + stack.join(','));

  // local asset refs
  const refRe = /(?:src|href)="([^"]+)"/g;
  let r;
  while ((r = refRe.exec(html))) {
    const ref = r[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(ref)) continue;
    const clean = ref.split('?')[0].split('#')[0];
    if (clean && !fs.existsSync(path.join(root, clean))) issues.push('missing file: ' + clean);
  }

  // classes not in CSS
  const classRe = /class="([^"]+)"/g;
  const unknown = new Set();
  let c;
  while ((c = classRe.exec(html))) {
    c[1].split(/\s+/).forEach((cl) => {
      if (!cl || jsOnly.has(cl)) return;
      if (!cssClasses.has(cl)) unknown.add(cl);
    });
  }
  if (unknown.size) issues.push('no CSS for: ' + [...unknown].join(', '));

  console.log(file.padEnd(16), issues.length ? 'ISSUES: ' + issues.join(' | ') : 'OK');
});
