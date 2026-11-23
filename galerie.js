const slug = new URLSearchParams(location.search).get('a') || decodeURIComponent(location.hash.slice(1));
const g = ACTUS.find(x => x.id === slug && x.photos);
const root = document.getElementById('galerie');
if (!g) {
  root.innerHTML = '<h1>Galerie introuvable</h1><p><a href="index.html#actus">Retour aux actualités</a></p>';
} else {
  document.title = g.titre + ' – photos – La XIème Légia';
  const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const sec = [].concat(g.section).map(k => k === 'unite' ? 'Toute l’unité' : SECTIONS[k].nom).join(' · ');
  const date = new Date(g.date + 'T12:00:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  root.innerHTML =
    '<a class="back" href="index.html#actus">← Toutes les actualités</a>' +
    '<h1>' + esc(g.titre) + '</h1><p class="lead">' + date + ' · ' + sec + '<br>' + (g.detail || g.texte) + '</p>' +
    (g.video ? '<div class="video"><iframe src="https://www.youtube.com/embed/' + g.video + '" title="Vidéo" allowfullscreen loading="lazy"></iframe></div>' : '') +
    '<div class="gal">' + g.photos.map((u, i) => '<button data-i="' + i + '" aria-label="Agrandir la photo ' + (i + 1) + '"><img src="' + u + '" alt="' + esc(g.titre) + ', photo ' + (i + 1) + '" loading="lazy"></button>').join('') + '</div>';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(.2,.7,.2,1)', easeIO = 'cubic-bezier(.7,0,.2,1)';
  const thumbs = [...root.querySelectorAll('.gal button')];

  /* Vignettes : apparition en cascade au défilement, une fois l'image chargée */
  const seen = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); seen.unobserve(en.target); } }), { rootMargin: '0px 0px -5% 0px' });
  thumbs.forEach((b, i) => { b.style.setProperty('--d', (i % 4) * 0.06 + 's'); seen.observe(b); });
  root.querySelectorAll('.gal img').forEach(i => { const ok = () => i.classList.add('ok'); i.complete ? ok() : (i.addEventListener('load', ok), i.addEventListener('error', ok)); });

  const lb = document.getElementById('lb'), img = lb.querySelector('img'), cnt = lb.querySelector('.cnt'), stage = lb.querySelector('.stage');
  let cur = 0, busy = false;
  const load = src => { img.src = src; return img.decode ? img.decode().catch(() => {}) : Promise.resolve(); };
  const count = () => { cnt.textContent = (cur + 1) + ' / ' + g.photos.length; };
  /* Transforme le rectangle a en rectangle b (pour l'effet « zoom depuis la vignette ») */
  /* … et recadre la photo comme la vignette (object-fit: cover) pour que l'agrandissement soit continu */
  const fromTo = (a, b) => {
    const k = Math.max(a.width / b.width, a.height / b.height);
    const ix = Math.max(0, (b.width - a.width / k) / 2), iy = Math.max(0, (b.height - a.height / k) / 2);
    return { transform: `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px,${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(${k})`,
             clipPath: `inset(${iy}px ${ix}px round ${6 / k}px)` };
  };
  const full = { transform: 'none', clipPath: 'inset(0px 0px round 0px)' };

  async function open(i) {
    if (busy) return; busy = true; cur = i;
    await load(g.photos[cur]); count();
    lb.showModal();
    if (!reduce && img.animate) {
      const t = thumbs[cur].getBoundingClientRect(), r = img.getBoundingClientRect();
      lb.animate([{ backgroundColor: 'rgba(20,26,32,0)' }, { backgroundColor: 'rgba(20,26,32,.94)' }], { duration: 450, easing: ease });
      lb.querySelectorAll('button,.cnt').forEach(el => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 250, fill: 'backwards' }));
      await img.animate([fromTo(t, r), full], { duration: 650, easing: easeIO }).finished.catch(() => {});
    }
    busy = false;
  }
  async function close() {
    if (busy || !lb.open) return; busy = true;
    const t = thumbs[cur].getBoundingClientRect(), r = img.getBoundingClientRect();
    const visible = t.bottom > 0 && t.top < innerHeight;
    if (!reduce && img.animate) {
      lb.querySelectorAll('button,.cnt').forEach(el => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }));
      lb.animate([{ backgroundColor: 'rgba(20,26,32,.94)' }, { backgroundColor: 'rgba(20,26,32,0)' }], { duration: 450, easing: ease, fill: 'forwards' });
      await img.animate(visible ? [full, fromTo(t, r)] : [{ opacity: 1 }, { opacity: 0, transform: 'scale(.96)' }],
        { duration: visible ? 520 : 300, easing: easeIO, fill: 'forwards' }).finished.catch(() => {});
    }
    lb.close();
    lb.getAnimations({ subtree: true }).forEach(a => a.cancel());
    thumbs[cur].focus({ preventScroll: true });
    busy = false;
  }
  /* Photo suivante / précédente : glissement dans le sens du geste */
  async function go(step) {
    if (busy) return; busy = true;
    const dir = step > 0 ? 1 : -1;
    cur = (cur + step + g.photos.length) % g.photos.length; count();
    let out = null;
    if (!reduce && img.animate) { out = img.animate([{ transform: img.style.transform || 'none', opacity: img.style.opacity || 1 }, { transform: `translateX(${-dir * 60}px)`, opacity: 0 }], { duration: 220, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }); await out.finished.catch(() => {}); }
    img.style.opacity = 0; img.style.transform = ''; if (out) out.cancel();
    await load(g.photos[cur]);
    img.style.opacity = '';
    if (!reduce && img.animate) await img.animate([{ transform: `translateX(${dir * 60}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: ease }).finished.catch(() => {});
    busy = false;
  }

  thumbs.forEach(b => b.addEventListener('click', () => open(+b.dataset.i)));
  lb.querySelector('.x').onclick = close;
  lb.querySelector('.p').onclick = () => go(-1);
  lb.querySelector('.n').onclick = () => go(1);
  lb.addEventListener('cancel', e => { e.preventDefault(); close(); });          /* touche Échap */
  lb.addEventListener('click', e => { if ((e.target === lb || e.target === stage) && !moved) close(); });
  document.addEventListener('keydown', e => { if (!lb.open) return; if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });

  /* Glisser le doigt (ou la souris) pour changer de photo ; la photo suit le geste */
  let x0 = null, y0 = 0, dx = 0, moved = false;
  stage.addEventListener('pointerdown', e => { if (busy || e.button > 0) return; x0 = e.clientX; y0 = e.clientY; dx = 0; moved = false; });
  stage.addEventListener('pointermove', e => {
    if (x0 === null) return;
    dx = e.clientX - x0;
    if (!moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - y0)) { moved = true; stage.setPointerCapture(e.pointerId); }
    if (moved && !reduce) { img.style.transform = `translateX(${dx}px)`; img.style.opacity = 1 - Math.min(Math.abs(dx) / 600, .4); }
  });
  const end = () => {
    if (x0 === null) return; x0 = null;
    if (moved && Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    else if (moved) {
      const from = img.style.transform; img.style.transform = ''; img.style.opacity = '';
      if (!reduce && img.animate) img.animate([{ transform: from }, { transform: 'none' }], { duration: 400, easing: ease });
    }
    setTimeout(() => { moved = false; }, 0);
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
}
