/* One-off cleanup: remove links to deleted pages (blog-post.html). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

function patch(file, pairs) {
  const p = path.join(root, file);
  let s = fs.readFileSync(p, 'utf8');
  pairs.forEach(([a, b, all]) => {
    const before = s;
    s = all ? s.split(a).join(b) : s.replace(a, b);
    if (s === before) console.log('  ! no change for: ' + JSON.stringify(a).slice(0, 70));
  });
  fs.writeFileSync(p, s);
  console.log('patched ' + file);
}

patch('blog.html', [
  ['<a class="post-card" href="blog-post.html"', '<div class="post-card"', true],
  ['</h3>\n      </a>', '</h3>\n      </div>', true],
  ['<a class="ph" href="blog-post.html" data-reveal="left"><img src="assets/img/wind-dusk.jpg" alt=""></a>',
   '<div class="ph" data-reveal="left"><img src="assets/img/wind-dusk.jpg" alt=""></div>'],
  ['<a href="blog-post.html" class="btn btn-dark">Read full blogs', '<span class="btn btn-dark">Read full blogs'],
  ['</svg>\n        </a>', '</svg>\n        </span>'],
]);
