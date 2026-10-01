/* Inject shared blocks (nav / brands / testimonials / cta / footer) from index.html
   into every other page via <!--#NAV--> style markers, and set the active nav link. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function block(start, end) {
  const a = index.indexOf(start);
  const b = index.indexOf(end);
  if (a === -1 || b === -1) throw new Error('marker missing: ' + start);
  return index.slice(a, b + end.length);
}

const blocks = {
  '#NAV': block('<!--#NAV_START-->', '<!--#NAV_END-->'),
  '#CTA': block('<!--#CTA_START-->', '<!--#CTA_END-->'),
  '#FOOTER': block('<!--#FOOTER_START-->', '<!--#FOOTER_END-->'),
  '#BRANDS': block('<!-- ============ BRANDS ============ -->', '<!-- ============ OUR VALUES ============ -->').replace(
    /<!-- ============ OUR VALUES ============ -->$/, ''
  ),
  '#TESTIMONIALS': block('<!-- ============ TESTIMONIALS ============ -->', '<!--#CTA_START-->').replace(
    /<!--#CTA_START-->$/, ''
  )
};

/* file -> [nav href, nav link text] */
const activeMap = {
  'about.html': ['about.html', 'About Us'],
  'pricing.html': ['pricing.html', 'Pricing'],
  'blog.html': ['blog.html', 'Blogs']
};

const files = fs.readdirSync(root).filter((f) => f.endsWith('.html') && f !== 'index.html');

/* Pages already expanded by a previous run: fold their content back into markers
   so injection stays idempotent. */
function normalize(html) {
  return html
    .replace(/<!-- NAV -->[\s\S]*?(?=\n<main>)/, '<!--#NAV-->')
    .replace(/<!-- CTA -->[\s\S]*?(?=\n<!--)/, '<!--#CTA-->')
    .replace(/<!-- FOOTER -->[\s\S]*?<\/footer>/, '<!--#FOOTER-->');
}

files.forEach((file) => {
  let html = normalize(fs.readFileSync(path.join(root, file), 'utf8'));
  const before = html;

  Object.keys(blocks).forEach((key) => {
    if (html.includes('<!--' + key + '-->')) {
      html = html.split('<!--' + key + '-->').join(blocks[key]);
    }
  });

  // tidy: convert block boundary markers into plain comments
  html = html.replace(/<!--#(\w+)_START-->/g, '<!-- $1 -->');
  html = html.replace(/<!--#\w+_END-->/g, '');

  // reset any pre-existing active class, then mark this page's nav link
  html = html.replace(/ class="active"/g, '');
  html = html.replace(/ class="m-link active"/g, ' class="m-link"');
  const act = activeMap[file];
  if (act) {
    const re = new RegExp('(<a href="' + act[0] + '">)' + act[1]);
    html = html.replace(re, '<a href="' + act[0] + '" class="active">' + act[1]);
  }
  // contact lives in the nav CTA button + mobile menu, not the link row
  if (file === 'contact.html') {
    html = html.replace('<a class="m-link" href="contact.html">', '<a class="m-link active" href="contact.html">');
    html = html.replace('<a href="contact.html" class="btn btn-dark">', '<a href="contact.html" class="btn btn-dark active">');
  }

  // about page CTA uses capital S in "Start"
  if (file === 'about.html') {
    html = html.split('— start eco exploring now').join('— Start eco exploring now');
  }

  if (html !== before) {
    fs.writeFileSync(path.join(root, file), html);
    console.log('injected:', file);
  } else {
    console.log('unchanged:', file);
  }
});
