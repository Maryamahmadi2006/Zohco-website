const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const pages = ['index', 'about', 'pricing', 'blog', 'contact'];

(async () => {
  for (const p of pages) {
    try {
      const r = await fetch('http://localhost:8080/' + p + '.html');
      const t = await r.text();
      const active = (t.match(/class="[^"]*\bactive\b[^"]*"/g) || []).length;
      console.log(
        p.padEnd(11),
        String(r.status),
        (t.length + 'B').padStart(8),
        'nav:' + t.includes('nav-inner'),
        'footer:' + t.includes('f-down'),
        'cta:' + t.includes('cta-inner'),
        'active:' + active
      );
    } catch (e) {
      console.log(p, 'ERR', e.message);
    }
  }

  // spot checks on pricing
  const s = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8');
  console.log('brands tracks:', (s.match(/brands-track/g) || []).length);
  console.log('active ctx:', (s.match(/<a href="[^"]*" class="active">[^<]*/g) || []).join(' | '));
  console.log('cta em-dash:', s.includes('— start eco exploring now'));
  console.log('testimonials:', (s.match(/class="tst-card"/g) || []).length);
  const ab = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
  console.log('about active:', (ab.match(/<a href="[^"]*" class="active">[^<]*/g) || []).join(' | '));
  console.log('about CTA Start:', ab.includes('— Start eco exploring now'));
  console.log('about order cta<testim:', ab.indexOf('<!-- CTA -->') < ab.indexOf('TESTIMONIALS'));

  console.log('--- removed pages must not be linked ---');
  ['index.html', 'about.html', 'pricing.html', 'blog.html', 'contact.html'].forEach((f) => {
    const s = fs.readFileSync(path.join(root, f), 'utf8');
    const hits = s.match(/href="(blog-post|404|privacy|terms)\.html"/g) || [];
    console.log(f, 'dead links:', hits.length ? hits.join(',') : 'none', '| m-extra:', s.includes('m-extra'));
  });

  console.log('--- form band video (contact) ---');
  const ct = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
  console.log('band-video:', ct.includes('class="band-video"'), '| hero.mp4:', ct.includes('assets/video/hero.mp4'));

  console.log('--- footer completeness ---');
  ['blog.html', 'contact.html', 'about.html', 'pricing.html'].forEach((f) => {
    const s = fs.readFileSync(path.join(root, f), 'utf8');
    console.log(
      f,
      'copyright:' + s.includes('2026 Copyright'),
      'socials:' + s.includes('class="socials"'),
      'newsletter:' + s.includes('news-form'),
      'mobileMenu:' + s.includes('mobile-menu'),
      'mainjs:' + s.includes('main.js'),
      'tostop:' + s.includes('to-top')
    );
  });
})();
