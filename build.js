/* ============================================================
   GÉNÈRE data.js À PARTIR DU DOSSIER contenu/
   ------------------------------------------------------------
   Ne modifiez plus data.js à la main : il est recréé à chaque
   mise en ligne (Netlify lance « node build.js » tout seul).
   Le contenu se modifie via l'admin (https://<site>/admin/)
   ou, à la main, dans les fichiers JSON de contenu/.
   Pour prévisualiser en local : lancer-site-local.bat (ou node build.js).
   ============================================================ */
const fs = require('fs'), path = require('path');
const root = __dirname, dir = path.join(root, 'contenu');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.json') ? [path.join(d, e.name)] : []) : [];
const list = v => v == null || v === '' ? [] : [].concat(v).filter(Boolean);
const clean = p => String(p).replace(/^\/+/, '');
const youtube = v => { if (!v) return ''; const m = String(v).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : String(v).trim(); };

function build() {
  const UNITE = read(path.join(dir, 'unite.json'));
  const ORDRE = ['baladins', 'louveteaux', 'eclaireurs', 'pionniers'];
  const SECTIONS = {};
  for (const k of ORDRE) {
    const s = read(path.join(dir, 'sections', k + '.json'));
    s.staff = list(s.staff).map(m => { const o = { t: m.t || '', n: m.n || '' }; if (m.tel) o.tel = m.tel; if (m.resp) o.resp = true; return o; });
    if (s.photo_staff) s.photo_staff = clean(s.photo_staff);
    SECTIONS[k] = s;
  }

  const ids = new Set();
  const ACTUS = walk(path.join(dir, 'actus')).map(f => {
    const a = read(f);
    let id = path.basename(f, '.json');
    while (ids.has(id)) id += '-2';
    ids.add(id);
    const date = String(a.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.warn('Date manquante, actu ignorée :', f); return null; }
    const o = { id, date, section: list(a.section).length ? list(a.section) : ['unite'], titre: a.titre || '', texte: a.texte || '' };
    if (a.detail) o.detail = a.detail;
    const v = youtube(a.video); if (v) o.video = v;
    const ph = list(a.photos).flatMap(p => typeof p === 'object' ? list(p.photo) : [p]).map(clean);
    if (ph.length) o.photos = ph;
    return o;
  }).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const out = '/* FICHIER GÉNÉRÉ PAR build.js À PARTIR DE contenu/ : NE PAS MODIFIER À LA MAIN. */\n' +
    'const UNITE = ' + JSON.stringify(UNITE, null, 2) + ';\n\n' +
    'const SECTIONS = ' + JSON.stringify(SECTIONS, null, 2) + ';\n\n' +
    'const ACTUS = ' + JSON.stringify(ACTUS, null, 2) + ';\n';
  fs.writeFileSync(path.join(root, 'data.js'), out);
  console.log('data.js généré : ' + ACTUS.length + ' actualités, ' + ORDRE.length + ' sections.');
}

build();

/* node build.js --watch : régénère data.js à chaque modification de contenu/ (utile en local) */
if (process.argv.includes('--watch')) {
  let t;
  fs.watch(dir, { recursive: true }, () => {
    clearTimeout(t);
    t = setTimeout(() => { try { build(); } catch (e) { console.error('Erreur :', e.message); } }, 800);
  });
  console.log('Surveillance de contenu/ : data.js sera régénéré après chaque publication. (Ctrl+C pour arrêter)');
}
