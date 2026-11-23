(() => {
  /* Photos de staff : déposer images/staffs/<section>.jpg (baladins, louveteaux, eclaireurs, pionniers ; jpg, jpeg, png ou webp) */
  document.querySelectorAll('.staff-photo').forEach(f => {
    const img = f.querySelector('img'), exts = ['jpg', 'jpeg', 'png', 'webp']; let i = 0;
    const next = () => { if (i >= exts.length) { f.remove(); return; } img.src = 'images/staffs/' + f.dataset.staff + '.' + exts[i++]; };
    img.onload = () => { f.hidden = false; };
    img.onerror = next;
    next();
  });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const header = $('.top');
  const menu = $('#menu'), burger = $('#burger');

  /* Menu mobile */
  burger.innerHTML = '<span class="bars" aria-hidden="true"><i></i><i></i></span><span class="lbl">Menu</span>';
  $$('li', menu).forEach((li, i) => li.style.setProperty('--i', i));
  const setOpen = open => {
    menu.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    $('.lbl', burger).textContent = open ? 'Fermer' : 'Menu';
  };
  const closeMenu = () => { if (menu.classList.contains('open')) setOpen(false); };
  burger.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); burger.focus(); } });
  document.addEventListener('pointerdown', e => { if (!header.contains(e.target)) closeMenu(); });

  /* Défilement centré sous l'en-tête (ou titre aligné si le bloc dépasse l'écran) */
  function goTo(hash, smooth) {
    if (!hash || hash === '#') { scrollTo({ top: 0, behavior: reduce || !smooth ? 'auto' : 'smooth' }); return true; }
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!el) return false;
    const inner = el.querySelector(':scope > .wrap') || el;
    const r = inner.getBoundingClientRect();
    const h = header.offsetHeight, avail = innerHeight - h;
    const y = r.height + 56 <= avail
      ? scrollY + r.top - h - (avail - r.height) / 2
      : scrollY + r.top - h - 28;
    scrollTo({ top: Math.max(0, y), behavior: reduce || !smooth ? 'auto' : 'smooth' });
    return true;
  }
  const norm = p => p.replace(/(index)?(\.html)?$/, '');   /* accepte /baladins.html et /baladins */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || a.target || e.metaKey || e.ctrlKey) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin && location.protocol !== 'file:') return;
    if (norm(u.pathname) !== norm(location.pathname) || !u.hash && a.getAttribute('href') !== '#') return;
    if (menuLinks.includes(a) && document.getElementById(decodeURIComponent(u.hash.slice(1)))) { lockSpy(); setMark(a); }
    if (goTo(u.hash, true)) { e.preventDefault(); history.pushState(null, '', u.hash || location.pathname); closeMenu(); }
  });
  if (location.hash) {
    const again = () => goTo(location.hash, false);
    addEventListener('load', () => { again(); setTimeout(again, 250); });
  }

  /* ---------- Bulle du menu ----------
     Une seule pastille, animée par deux ressorts (bord gauche / bord droit).
     Le bord qui mène part plus vite que l'autre : la bulle s'étire vers sa cible
     puis se resserre, sans jamais se couper. Interruptible à tout moment. */
  const pill = document.createElement('div'); pill.className = 'pill'; pill.setAttribute('aria-hidden', 'true');
  const ghost = document.createElement('div'); ghost.className = 'pill ghost'; ghost.setAttribute('aria-hidden', 'true');
  menu.prepend(ghost, pill);
  const mq = matchMedia('(min-width: 921px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const menuLinks = $$('a', menu);
  const keyOf = a => a.getAttribute('href').replace(/^index\.html/, '');
  let cur = null;

  /* Boîtes des liens relatives au menu (mises en cache, recalculées au redimensionnement) */
  let boxes = new Map();
  const measure = () => {
    const m = menu.getBoundingClientRect();
    boxes = new Map(menuLinks.map(a => { const r = a.getBoundingClientRect(); return [a, { l: r.left - m.left, r: r.right - m.left, t: r.top - m.top, h: r.height }]; }));
  };

  const FAST = { k: 230, z: .9 }, SLOW = { k: 105, z: 1 }, EVEN = { k: 240, z: 1 };
  const mover = (el, onFrame) => {
    const L = { x: 0, v: 0, t: 0 }, R = { x: 0, v: 0, t: 0 };
    let pl = EVEN, pr = EVEN, top = 0, h = 0, raf = 0, last = 0;
    const step = (e, p, dt) => { const c = 2 * Math.sqrt(p.k) * p.z; e.v += (-p.k * (e.x - e.t) - c * e.v) * dt; e.x += e.v * dt; };
    const draw = () => {
      const a = Math.min(L.x, R.x), w = Math.abs(R.x - L.x);
      const stretch = Math.max(0, w - (R.t - L.t));
      const hh = h * (1 - Math.min(stretch / 900, .14));          /* s'affine légèrement quand elle s'étire */
      el.style.transform = `translate3d(${a.toFixed(2)}px,${(top + (h - hh) / 2).toFixed(2)}px,0)`;
      el.style.width = w.toFixed(2) + 'px'; el.style.height = hh.toFixed(2) + 'px';
      if (onFrame) onFrame(a, a + w);
    };
    const frame = now => {
      let dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      while (dt > 0) { const s = Math.min(dt, 1 / 240); step(L, pl, s); step(R, pr, s); dt -= s; }
      const done = [L, R].every(e => Math.abs(e.x - e.t) < .2 && Math.abs(e.v) < 2);
      if (done) { L.x = L.t; R.x = R.t; L.v = R.v = 0; raf = 0; draw(); return; }
      draw(); raf = requestAnimationFrame(frame);
    };
    return {
      /* box : cible ; mode : 'snap' (immédiat), 'grow' (naît depuis le centre), 'stretch' ou 'even' */
      go(box, mode) {
        top = box.t; h = box.h; L.t = box.l; R.t = box.r;
        if (mode === 'snap' || reduce) { cancelAnimationFrame(raf); raf = 0; L.x = L.t; R.x = R.t; L.v = R.v = 0; draw(); return; }
        if (mode === 'grow') { L.x = R.x = (box.l + box.r) / 2; L.v = R.v = 0; }
        if (mode === 'stretch') {
          const right = (L.t + R.t) > (L.x + R.x);                   /* sens du déplacement */
          pl = right ? SLOW : FAST; pr = right ? FAST : SLOW;
        } else pl = pr = EVEN;
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      }
    };
  };

  /* Le texte passe en clair dès que la bulle le recouvre (même en transit) */
  let litOn = false;
  const light = (a, b) => menuLinks.forEach(l => {
    const x = boxes.get(l); if (!x) return;
    const cover = litOn ? (Math.min(b, x.r) - Math.max(a, x.l)) / (x.r - x.l) : 0;
    l.classList.toggle('lit', cover > .55);
  });
  const P = mover(pill, light), G = mover(ghost);

  const refresh = () => {
    document.documentElement.classList.toggle('blob', mq.matches);
    if (!mq.matches) return;
    measure();
    if (cur) P.go(boxes.get(cur), 'snap');
    if (hovered) G.go(boxes.get(hovered), 'snap');
  };
  function setMark(a, instant) {
    document.documentElement.classList.toggle('blob', mq.matches);
    menuLinks.forEach(l => l.classList.toggle('active', l === a));
    if (a === cur) return;
    const was = cur; cur = a;
    try { sessionStorage.setItem('navmark', a ? keyOf(a) : ''); } catch (e) {}
    if (!a) { pill.classList.remove('on'); litOn = false; light(0, 0); return; }
    pill.classList.toggle('red', a.classList.contains('cta'));
    if (!mq.matches) return;
    if (!boxes.size) measure();
    litOn = true;
    P.go(boxes.get(a), instant ? 'snap' : was ? 'stretch' : 'grow');
    pill.classList.add('on');
  }

  /* Bulle fantôme au survol (souris uniquement) */
  let hovered = null;
  menu.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse' || !fine.matches || !mq.matches) return;
    const a = e.target.closest('a'); if (!a || a === hovered) return;
    if (!boxes.size) measure();
    G.go(boxes.get(a), ghost.classList.contains('on') ? 'even' : 'snap');
    ghost.classList.toggle('red', a.classList.contains('cta'));
    ghost.classList.add('on'); hovered = a;
  });
  menu.addEventListener('pointerleave', () => { ghost.classList.remove('on'); hovered = null; });

  addEventListener('resize', refresh);
  addEventListener('load', refresh);
  mq.addEventListener('change', () => { refresh(); if (!mq.matches) closeMenu(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  measure();

  /* Cible du marqueur selon la page */
  const file = (location.pathname.split('/').pop().replace(/\.html$/, '') || 'index') + '.html';
  const isHome = file === 'index.html' || file === '';
  const pageLink = menuLinks.find(l => !l.getAttribute('href').includes('#') && l.getAttribute('href') === file)
    || (file === 'galerie.html' ? menuLinks.find(l => keyOf(l) === '#actus') : null);
  menuLinks.forEach(l => { if (l === pageLink && file !== 'galerie.html') l.setAttribute('aria-current', 'page'); });
  let prev = null; try { prev = sessionStorage.getItem('navmark'); } catch (e) {}
  const prevLink = menuLinks.find(l => keyOf(l) === prev);
  if (pageLink) {
    if (prevLink && prevLink !== pageLink && mq.matches && !reduce) {
      /* la bulle repart de l'onglet de la page précédente, une fois les polices prêtes */
      setMark(prevLink, true);
      const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      Promise.race([fontsReady, new Promise(r => setTimeout(r, 400))]).then(() => setTimeout(() => { refresh(); setMark(pageLink); }, 90));
    }
    else setMark(pageLink, true);
  }

  /* Page d'accueil : le marqueur suit la section au centre de l'écran, de gauche à droite */
  const homeLinks = menuLinks.filter(l => l.getAttribute('href').includes('#'));
  const zones = $$('main > .hero, main > section[id]');
  /* Pendant un défilement lancé par un clic, le suivi est suspendu : la bulle va droit au but */
  let locked = false, idle = 0;
  const unlock = () => { locked = false; clearTimeout(idle); };
  function lockSpy() { locked = true; clearTimeout(idle); idle = setTimeout(unlock, 250); }
  ['wheel', 'touchstart', 'keydown'].forEach(t => addEventListener(t, () => { if (locked) { unlock(); } }, { passive: true }));
  function spy() {
    if (!isHome || locked) return;
    const h = header.offsetHeight, mid = h + (innerHeight - h) / 2;
    const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 6;
    let z = atBottom ? zones[zones.length - 1] : zones.find(s => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
    if (!z) return;
    if (z.classList.contains('hero')) return setMark(null);
    const l = homeLinks.find(x => x.getAttribute('href').endsWith('#' + z.id));
    if (l) setMark(l);              /* sections sans lien (uniformes, contact) : le marqueur reste */
  }

  /* Arrivée sur l'accueil avec une ancre (ex. depuis une page de section) : la bulle va sur l'onglet demandé */
  if (isHome && location.hash) {
    const target = homeLinks.find(x => x.getAttribute('href').endsWith(location.hash));
    if (target) {
      if (prevLink && prevLink !== target && mq.matches) setMark(prevLink, true);
      locked = true;
      setTimeout(() => setMark(target), 120);
      addEventListener('load', () => setTimeout(unlock, 700));
    }
  }

  /* Barre de progression, ombre de l'en-tête, retour en haut */
  const bar = document.createElement('div'); bar.className = 'progress'; document.body.prepend(bar);
  const top = document.createElement('button'); top.className = 'totop'; top.setAttribute('aria-label', 'Retour en haut'); top.textContent = '↑';
  top.onclick = () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); document.body.append(top);
  let tick = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
    header.classList.toggle('scrolled', scrollY > 10);
    top.classList.toggle('show', scrollY > 700);
    if (locked) { clearTimeout(idle); idle = setTimeout(() => { unlock(); spy(); }, 140); }
    if (!tick) { tick = true; requestAnimationFrame(() => { spy(); tick = false; }); }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  addEventListener('load', spy);

  /* Apparition progressive des blocs */
  const groups = ['.priorites > div', '.numbers > div', '.prices > div', '.news article', '.team > div', '.infos > div', '.checks li', '.staff li', '.crew > *', '.info-cards li', '.two > *', 'section .lead', '.legend', '.team-photo'];
  groups.forEach(sel => $$(sel).forEach(el => {
    if (el.closest('.hero')) return;
    el.classList.add('reveal');
    el.style.setProperty('--d', Math.min([...el.parentElement.children].indexOf(el), 6) * 0.07 + 's');
  }));
  const countUp = el => {
    const m = /^(~?)(\d+)$/.exec(el.textContent.trim()); if (!m || reduce) return;
    const end = +m[2], t0 = performance.now(), dur = 900;
    const step = t => { const p = Math.min((t - t0) / dur, 1); el.textContent = m[1] + Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    el.textContent = m[1] + '0'; requestAnimationFrame(step);
  };
  /* Titres : chaque mot monte depuis un masque (le texte reste lisible par les lecteurs d'écran) */
  const split = h => {
    if (h.classList.contains('split')) return;
    const label = h.textContent.replace(/\s+/g, ' ').trim();
    let k = 0;
    const wrap = node => { const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true'); const i = document.createElement('span'); i.style.setProperty('--k', k++); i.append(node); w.append(i); return w; };
    [...h.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
        parts.forEach(t => { if (!t) return; frag.append(/^\s+$/.test(t) ? document.createTextNode(' ') : wrap(document.createTextNode(t))); });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) n.replaceWith(wrap(n.cloneNode(true)) );
    });
    h.setAttribute('aria-label', label);
    h.classList.add('split');
  };
  /* ids conservés : un élément cloné garde son id (ex. #cot-annee) */
  $$('.hero h1, .page-head h1').forEach(h => { split(h); requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add('in'))); });
  $$('main section h2').forEach(split);

  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    if (en.target.matches('.numbers > div')) countUp($('strong', en.target));
    io.unobserve(en.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, h2.split').forEach(el => io.observe(el));

  /* Boutons « aimantés » (souris uniquement) */
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.btn, .totop').forEach(b => {
      b.classList.add('mag');
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5) * 10 + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5) * 8 + 'px');
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }
})();
