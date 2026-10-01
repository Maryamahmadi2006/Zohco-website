/* ============================================================
   Zohco recreation — interactions
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var onReady = function (fn) {
    if (doc.readyState !== 'loading') fn();
    else doc.addEventListener('DOMContentLoaded', fn);
  };

  /* ---------- split text: wrap words for reveal ---------- */
  function splitWords() {
    var els = doc.querySelectorAll('.split');
    els.forEach(function (el) {
      if (el.dataset.split) return;
      el.dataset.split = '1';
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach(function (w, i) {
        var span = doc.createElement('span');
        span.className = 'w';
        var inner = doc.createElement('i');
        inner.textContent = w;
        inner.style.setProperty('--wd', (i * 0.055).toFixed(3) + 's');
        span.appendChild(inner);
        el.appendChild(span);
        if (i < words.length - 1) el.appendChild(doc.createTextNode(' '));
      });
    });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    var targets = doc.querySelectorAll('[data-reveal], .split');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- counters ---------- */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function initCounters() {
    var nums = doc.querySelectorAll('[data-count]');
    if (!nums.length) return;
    var animate = function (el) {
      var end = parseInt(el.getAttribute('data-count'), 10) || 0;
      var dur = 1600;
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = String(Math.round(easeOut(p) * end));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) {
      nums.forEach(function (n) { n.textContent = n.getAttribute('data-count') || '0'; });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- nav: shadow on scroll + mobile menu ---------- */
  function initNav() {
    var nav = doc.getElementById('nav');
    var burger = doc.getElementById('burger');
    var menu = doc.getElementById('mobileMenu');

    var onScroll = function () {
      if (window.scrollY > 30) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
      var top = doc.getElementById('toTop');
      if (top) top.classList.toggle('show', window.scrollY > 700);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        burger.classList.toggle('on', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        doc.body.style.overflow = open ? 'hidden' : '';
      });
      menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          menu.classList.remove('open');
          burger.classList.remove('on');
          doc.body.style.overflow = '';
        });
      });
    }

    var top = doc.getElementById('toTop');
    if (top) {
      top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ---------- accordions (features + FAQ) ---------- */
  function setPanel(item, open) {
    var panel = item.querySelector('.acc-panel, .faq-a');
    var head = item.querySelector('.acc-head, .faq-q');
    if (!panel) return;
    item.classList.toggle('open', open);
    if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
  }

  function initAccordions() {
    var items = doc.querySelectorAll('.acc-item, .faq-item');
    items.forEach(function (item) {
      var head = item.querySelector('.acc-head, .faq-q');
      if (!head) return;
      head.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        var group = item.parentElement;
        if (group && (group.classList.contains('faq') || group.classList.contains('acc'))) {
          group.querySelectorAll('.faq-item.open, .acc-item.open').forEach(function (o) {
            if (o !== item) setPanel(o, false);
          });
        }
        setPanel(item, !isOpen);
      });
      /* initialize open state height */
      if (item.classList.contains('open')) {
        var panel = item.querySelector('.acc-panel, .faq-a');
        if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
    window.addEventListener('resize', function () {
      doc.querySelectorAll('.acc-item.open .acc-panel, .faq-item.open .faq-a').forEach(function (p) {
        p.style.maxHeight = p.scrollHeight + 'px';
      });
    });
    window.addEventListener('load', function () {
      doc.querySelectorAll('.acc-item.open .acc-panel, .faq-item.open .faq-a').forEach(function (p) {
        p.style.maxHeight = p.scrollHeight + 'px';
      });
    });
  }

  /* ---------- testimonial slider ---------- */
  function initSlider() {
    var root = doc.querySelector('[data-slider]');
    if (!root) return;
    var track = root.querySelector('.tst-track');
    var slides = Array.prototype.slice.call(track.children);
    if (slides.length < 2) return;
    var idx = 0;

    function perView() {
      if (window.innerWidth <= 1180) return 1;
      return 2;
    }
    function maxIdx() { return slides.length - perView(); }

    function go(n) {
      idx = Math.max(0, Math.min(n, maxIdx()));
      var card = slides[0];
      var style = window.getComputedStyle(track);
      var gap = parseFloat(style.columnGap || style.gap) || 28;
      var step = card.getBoundingClientRect().width + gap;
      track.style.transform = 'translateX(' + (-idx * step) + 'px)';
    }

    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function () { go(idx <= 0 ? maxIdx() : idx - 1); });
    if (next) next.addEventListener('click', function () { go(idx >= maxIdx() ? 0 : idx + 1); });
    window.addEventListener('resize', function () { go(idx); });
    go(0);
  }

  /* ---------- pricing toggle ---------- */
  function initPricing() {
    var toggle = doc.querySelector('.price-toggle');
    if (!toggle) return;
    var buttons = toggle.querySelectorAll('button');
    var prices = doc.querySelectorAll('.p-price [data-monthly]');

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        buttons.forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var yearly = b.dataset.cycle === 'yearly';
        prices.forEach(function (p) {
          p.textContent = yearly ? p.dataset.yearly : p.dataset.monthly;
        });
      });
    });
  }

  /* ---------- blog filters (cosmetic) ---------- */
  function initFilters() {
    var wrap = doc.querySelector('.filters');
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      wrap.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
    });
  }

  /* ---------- forms (demo) ---------- */
  function initForms() {
    doc.querySelectorAll('form').forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); });
    });
  }

  onReady(function () {
    splitWords();
    initReveal();
    initCounters();
    initNav();
    initAccordions();
    initSlider();
    initPricing();
    initFilters();
    initForms();
  });
})();
