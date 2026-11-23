/* Construit les pages à partir de data.js (chargé avant script.js). */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = d => new Date(d + 'T12:00:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  const secs = a => [].concat(a.section);
  const label = a => secs(a).map(k => k === 'unite' ? 'Toute l’unité' : SECTIONS[k].nom).join(' · ');
  const color = a => { const l = secs(a); return l.length === 1 && l[0] !== 'unite' ? SECTIONS[l[0]].ab + '-n' : ''; };
  const sorted = [...ACTUS].sort((a, b) => b.date.localeCompare(a.date));

  const card = a => {
    const href = 'galerie.html?a=' + a.id + '#' + a.id;   /* le # survit aux redirections du serveur local */
    return '<article class="' + color(a) + '" data-s="' + secs(a).join(' ') + '">' +
      (a.photos ? '<a href="' + href + '" tabindex="-1" aria-hidden="true"><img class="cover" src="' + a.photos[0] + '" alt="" loading="lazy" onerror="this.parentNode.hidden=true"></a>' : '') +
      '<div class="body"><span class="chip">' + esc(label(a)) + '</span><time datetime="' + a.date + '">' + fmt(a.date) + '</time>' +
      '<h3>' + (a.photos ? '<a href="' + href + '">' + esc(a.titre) + '</a>' : esc(a.titre)) + '</h3><p>' + a.texte + '</p>' +
      (a.photos ? '<a class="more" href="' + href + '">Voir les photos (' + a.photos.length + ') →</a>' : '') + '</div></article>';
  };

  /* ----- Accueil : actualités filtrables + équipe d'unité ----- */
  const nw = $('#news');
  if (nw) {
    nw.innerHTML = sorted.map(card).join('');
    const f = $('#filters');
    f.innerHTML = [['all', 'Tout'], ['unite', 'Unité'], ...Object.keys(SECTIONS).map(k => [k, SECTIONS[k].nom])]
      .map(([k, n], i) => '<button data-k="' + k + '" aria-pressed="' + !i + '">' + n + '</button>').join('');
    f.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      [...f.children].forEach(x => x.setAttribute('aria-pressed', x === b));
      /* Les cartes glissent vers leur nouvelle place (technique FLIP) */
      const arts = [...nw.querySelectorAll('article')];
      const before = new Map(arts.filter(a => !a.hidden).map(a => [a, a.getBoundingClientRect()]));
      arts.forEach(a => { a.hidden = b.dataset.k !== 'all' && !a.dataset.s.split(' ').includes(b.dataset.k); a.classList.add('in'); });
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || !nw.animate) return;
      const ease = 'cubic-bezier(.2,.7,.2,1)';
      arts.filter(a => !a.hidden).forEach((a, i) => {
        a.getAnimations().forEach(x => x.cancel());
        const r = a.getBoundingClientRect(), o = before.get(a);
        if (o) {
          const dx = o.left - r.left, dy = o.top - r.top;
          if (dx || dy) a.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 650, easing: ease });
        } else a.animate([{ opacity: 0, transform: 'translateY(24px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 80 + Math.min(i, 6) * 45, easing: ease, fill: 'backwards' });
      });
    };
  }
  const tm = $('#team');
  if (tm) tm.innerHTML = UNITE.equipe.map(m => '<div><b>' + esc(m.n) + '</b><span>' + esc(m.tel || '') + '</span></div>').join('');

  /* ----- Accueil : cotisations et formulaire d'inscription (modifiables dans l'admin) ----- */
  const C = UNITE.cotisations;
  if (C && $('#cotisations')) {
    $('#cot-annee').textContent = UNITE.annee;
    $('#cot-tarifs').innerHTML = (C.tarifs || []).map(t => '<div><strong>' + esc(t.prix) + '</strong>' + esc(t.texte) + '</div>').join('');
    $('#cot-echeance').textContent = 'pour le ' + C.echeance + ' au plus tard';
    $('#cot-iban').textContent = 'IBAN : ' + C.iban;
  }
  const fo = $('#formulaire');
  if (fo && UNITE.formulaire) fo.href = UNITE.formulaire;

  /* ----- Pages de section ----- */
  const root = $('#page'), key = document.body.dataset.section, S = SECTIONS[key];
  if (!root || !S) return;

  const crew = S.staff.map(m =>
    '<div class="' + (m.resp ? 'resp-card' : '') + '"><span class="av">' + esc(m.t[0]) + '</span><div><b>' + esc(m.t) +
    (m.resp ? ' <em>responsable</em>' : '') + '</b><span>' + esc(m.n) + '</span>' +
    (m.tel ? '<a href="tel:' + m.tel.replace(/\s/g, '') + '">' + esc(m.tel) + '</a>' : '') + '</div></div>').join('');

  const mine = sorted.filter(a => secs(a).includes(key));
  const others = Object.keys(SECTIONS).filter(k => k !== key).map(k => {
    const o = SECTIONS[k];
    return '<a class="s-' + o.ab + '" href="' + k + '.html"><span class="badge"><img src="images/logos/logo-' + k + '.png" alt="Logo ' + o.nom + '"></span><span><b>' + o.nom + '</b><small>' + o.ages + '</small><span class="go">Voir la section →</span></span></a>';
  }).join('');

  root.innerHTML =
    '<div class="page-head ' + S.ab + '"><div class="wrap">' +
      '<span class="badge"><img src="images/logos/logo-' + key + '.png" alt="Logo ' + S.nom + '"></span>' +
      '<div><a class="back" href="index.html">← Accueil</a><h1>' + S.nom + '</h1><p><b>' + S.ages + ' · ' + S.tag + '</b></p><p>' + S.intro + '</p></div>' +
      '<figure class="team-photo" hidden><img alt="L’équipe d’animation des ' + S.nom + '"><figcaption>L’équipe d’animation · ' + UNITE.annee + '</figcaption></figure>' +
    '</div></div>' +
    '<section><div class="wrap infos">' +
      '<div><h2>Infos pratiques</h2><div class="numbers" style="margin:0 0 22px;padding-top:18px"><div><strong>' + S.effectif + '</strong><span>' + S.unit + '</span></div></div>' +
        '<ul class="info-cards"><li><small>Réunions</small>' + S.reunions + '</li>' +
        (S.camp ? '<li><small>Camp d’été</small>' + S.camp + '</li>' : '') +
        '<li><small>Contact</small><a href="mailto:' + S.email + '">' + S.email + '</a></li></ul>' +
        '<p><a class="btn" href="index.html#inscription">Inscrire mon enfant</a> <a class="btn ghost" href="index.html#cotisations">Cotisations</a></p></div>' +
      '<div><h2>Le staff <small>' + UNITE.annee + '</small></h2><div class="crew" style="--c:' + S.color + '">' + crew + '</div></div>' +
    '</div></section>' +
    '<section class="soft"><div class="wrap"><h2>Activités de la section</h2>' +
      (mine.length ? '<div class="news">' + mine.map(card).join('') + '</div>' : '<p>Les récits et photos de la section apparaîtront ici.</p>') +
      '<p><a href="index.html#actus">Toutes les actualités de l’unité</a></p></div></section>' +
    '<nav class="stripes" aria-label="Autres sections">' + others + '</nav>';

  /* Photo de staff : champ photo_staff (admin), sinon images/staffs/<section>.(jpg|jpeg|png|webp), sinon rien */
  const fig = $('.team-photo', root), img = $('img', fig), ex = ['jpg', 'jpeg', 'png', 'webp']; let i = 0;
  img.onload = () => { fig.hidden = false; $('.page-head', root).classList.add('has-photo'); };
  img.onerror = () => { if (i < ex.length) img.src = 'images/staffs/' + key + '.' + ex[i++]; };
  if (S.photo_staff) img.src = S.photo_staff; else img.onerror();
})();
