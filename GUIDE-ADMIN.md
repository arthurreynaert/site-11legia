# Site de la XIème Légia : mise en ligne et admin

Le site reste un site statique (HTML, CSS, JS). Ce qui change :

- Le contenu (actualités, sections, staffs, unité, cotisations) est rangé dans le dossier `contenu/`, en fichiers JSON.
- `build.js` recrée `data.js` à partir de `contenu/`. Netlify le lance automatiquement à chaque modification. **Ne modifiez plus `data.js` à la main.**
- La page `/admin/` permet de tout modifier depuis un navigateur, sans toucher aux fichiers.

## Où va quoi

| Contenu | Fichier | Fichiers envoyés |
|---|---|---|
| Actualités | `contenu/actus/AAAA/MM/<titre>.json` | `images/AAAA/MM/` (selon la date de l'actu) |
| Sections et staffs | `contenu/sections/<section>.json` | `images/staffs/` |
| Unité, cotisations, formulaire | `contenu/unite.json` | `images/documents/` |

Les photos envoyées via l'admin sont réduites à 1600 px de large et leurs métadonnées sont retirées (notamment la position GPS).

---

## 1. Créer le dépôt GitHub (une seule fois)

1. Créez un compte gratuit sur https://github.com.
2. Créez un dépôt **privé** nommé `site-11legia` (bouton « New repository »).
3. Envoyez-y le contenu du dossier `Site 11legia`. Le plus simple est **GitHub Desktop** (https://desktop.github.com) : « Add an existing repository » → choisir le dossier → « Publish repository ».
   (L'envoi par glisser-déposer sur github.com est limité à 100 fichiers à la fois.)
4. Dans `admin/config.yml`, remplacez `VOTRE-COMPTE-GITHUB/site-11legia` par `<votre-nom-github>/site-11legia`, puis envoyez la modification (« Commit » puis « Push » dans GitHub Desktop).

## 2. Mettre le site en ligne avec Netlify (une seule fois)

1. Créez un compte gratuit sur https://www.netlify.com en choisissant « Sign up with GitHub ».
2. « Add new site » → « Import an existing project » → GitHub → choisissez `site-11legia`.
3. Laissez les réglages proposés : ils viennent de `netlify.toml` (commande `node build.js`, dossier publié `.`). Cliquez sur « Deploy ».
4. Le site est en ligne sur une adresse du type `https://site-11legia.netlify.app`. Vous pouvez changer ce nom dans « Project configuration » → « Change project name ».

## 3. Activer la connexion à l'admin (une seule fois)

L'admin se connecte avec un compte GitHub. Netlify sert d'intermédiaire.

1. Sur GitHub : photo de profil → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
   - Application name : `Admin 11legia`
   - Homepage URL : l'adresse du site (ex. `https://site-11legia.netlify.app`)
   - Authorization callback URL : `https://api.netlify.com/auth/done`
   - Créez l'application, puis cliquez sur « Generate a new client secret ». Copiez tout de suite le **Client ID** et le **Client secret** : le secret ne sera plus visible ensuite.
2. Sur Netlify : votre projet → **Project configuration** → **Security** → **OAuth** → **Install provider** → GitHub → collez le Client ID et le Client secret.
3. Ouvrez `https://<votre-site>/admin/` et cliquez sur « Se connecter avec GitHub ».

## 4. Donner l'accès aux autres animateurs

Chaque personne qui doit modifier le site crée un compte GitHub gratuit. Ensuite, sur le dépôt : **Settings** → **Collaborators** → **Add people**. Une fois l'invitation acceptée, elle peut se connecter à `/admin/`.

Pour retirer l'accès, supprimez la personne de la même liste.

## 5. Utiliser votre nom de domaine (facultatif)

1. Netlify : votre projet → **Domain management** → **Add a domain** → par exemple `11legia.be`.
2. Chez le fournisseur du domaine (OVH, one.com, Combell…), dans la zone DNS :
   - `11legia.be` : enregistrement **A** vers `75.2.60.5`
   - `www.11legia.be` : enregistrement **CNAME** vers `<votre-site>.netlify.app`
   (Netlify affiche les valeurs exactes à utiliser : suivez celles-là en priorité.)
3. Le HTTPS (cadenas) est activé tout seul par Netlify, en quelques minutes à quelques heures.
4. Mettez à jour « Homepage URL » dans l'OAuth App GitHub (étape 3.1) avec la nouvelle adresse.

⚠️ Si `11legia.be` héberge encore les archives (ancien site), le faire pointer vers Netlify les rendra inaccessibles. Gardez les archives ailleurs (par exemple `archives.11legia.be`) ou utilisez un autre nom pour le nouveau site.

---

## Au quotidien

- **Nouvelle actualité** : `/admin/` → Actualités → « ＋ actualité ». Choisissez d'abord la date, puis ajoutez les photos (sélection multiple possible). La première photo sert de couverture ; les flèches ‹ › changent l'ordre. Cliquez sur « Publier » → « Publier maintenant ». Le site est à jour environ une minute plus tard.
- **Changer un staff ou sa photo** : `/admin/` → Sections et staffs → la section.
- **Cotisations, équipe d'unité, formulaire d'inscription** : `/admin/` → Unité.
- **Nouvelle année scoute** : changez « Année scoute » dans Unité, puis les staffs de chaque section.

Chaque modification est enregistrée dans l'historique GitHub : on peut toujours revenir à une version précédente.

## Tester sur son PC (facultatif, pour les curieux)

Il faut Node.js (https://nodejs.org).

```
node build.js                # régénère data.js, puis ouvrez index.html
npx decap-server             # dans un terminal, puis dans un autre :
npx serve .                  # et ouvrez http://localhost:3000/admin/
```

En local, l'admin modifie directement les fichiers du dossier, sans passer par GitHub.
