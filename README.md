# fantomatik

site vitrine du projet musical **fantomatik**. acid minimal sur machines, basé à lille.
page d'accueil unique, statique, hauntologique (esthétique crt / phosphore, « le fantôme
dans la machine »). aucune dépendance, aucun build, aucun tracker, aucun cookie.

> note de rédaction : ce dépôt n'utilise jamais le tiret cadratin. point, virgule,
> point-virgule ou deux-points selon la grammaire. merci de conserver cette règle.

## structure des fichiers

```
/
├── index.html              page unique (contenu, meta, structure)
├── css/
│   └── style.css           styles, couleurs, texture crt, responsive, reduced-motion
├── js/
│   └── main.js             ghost-waveform (canvas), boot, flicker, reveal au scroll
├── assets/
│   ├── favicon.svg         favicon spectral (point de phosphore + lueur)
│   ├── favicon.png         secours 32x32
│   ├── og-image.png        image de partage 1200x630 (réseaux sociaux)
│   ├── og-image.svg        source de l'image de partage (polices embarquées)
│   ├── affiche-5-xii-26.webp        affiche du concert, provisoire, optimisée pour le web
│   ├── affiche-5-xii-26-source.png  affiche en pleine résolution (master, non chargée par le site)
│   └── fonts/              polices auto-hébergées (woff2), aucune requête tierce
│       ├── major-mono-display-400.woff2
│       ├── space-mono-400.woff2
│       └── space-mono-700.woff2
└── README.md
```

`.DS_Store` et le dossier `.claude/` (outillage de prévisualisation local) sont exclus
du dépôt par `.gitignore`. `CNAME` n'est pas présent : voir « domaine personnalisé »
plus bas pour l'ajouter.

## prévisualiser en local

le site est 100 % statique. deux options :

1. **ouvrir directement** : double-cliquez sur `index.html`. tout fonctionne, sauf que
   certains navigateurs bloquent le chargement des polices via `file://`. pour un rendu
   fidèle, préférez l'option 2.
2. **petit serveur local** (recommandé) :

   ```bash
   cd fantomatik
   python3 -m http.server 8000
   ```

   puis ouvrez `http://localhost:8000/`.

## déployer sur github pages

1. créez un dépôt github et poussez le contenu de ce dossier à la racine.
2. dans le dépôt : **settings**, puis **pages**.
3. sous **build and deployment**, source : **deploy from a branch**.
4. branche : **main**, dossier : **/ (root)**. enregistrez.
5. patientez une minute. le site sera servi sur
   `https://<votre-utilisateur>.github.io/<nom-du-depot>/`.

### url canonique

l'url canonique est déjà réglée sur `https://dr-john-8bits.github.io/fantomatik/`
(compte github `Dr-John-8bits`, dépôt `fantomatik`). **si vous nommez le dépôt
autrement**, remplacez le segment `fantomatik` partout où l'adresse apparaît dans
`index.html` :

- la balise `<link rel="canonical">` ;
- `og:url` et `og:image` ;
- `twitter:image`.

(une recherche/remplacement de `dr-john-8bits.github.io/fantomatik` suffit.)

### domaine personnalisé (optionnel)

1. créez un fichier nommé `CNAME` à la racine, contenant uniquement votre domaine, par
   exemple :

   ```
   fantomatik.fr
   ```

2. chez votre hébergeur de domaine, ajoutez les enregistrements dns indiqués par github
   (un `CNAME` vers `<votre-utilisateur>.github.io`, ou les `A` records de github pages).
3. dans **settings, pages, custom domain**, saisissez le même domaine et cochez
   **enforce https**.
4. mettez à jour l'url canonique et les balises og (voir ci-dessus) avec le nouveau
   domaine.

## éditer le contenu et les liens

tout le texte visible est dans `index.html`, en minuscules, facile à retrouver.

| quoi | où (dans `index.html`) |
|---|---|
| wordmark `fantomatik` | balise `<h1 class="wordmark">` |
| tagline `le fantôme dans la machine` | `<p class="tagline">` |
| ligne technique du hero | `<p class="techline">` |
| manifeste (3 lignes) | section `#manifeste`, blocs `<p>` |
| sous-ligne transmission | `<p class="transmission-note">` |
| lien bandcamp (cta + liste) | rechercher `fantomatik.bandcamp.com` |
| lien de contact | le lien `contact` pointe vers la page bandcamp (formulaire de contact) |
| footer | balise `<footer class="pied">` |

le texte de l'écran de boot et les réglages d'animation (vitesses, amplitudes) sont en
haut de `js/main.js`, dans l'objet `REGLAGES`.

les couleurs sont des variables css en haut de `css/style.css` (bloc `:root`).

### contact

le lien `contact` renvoie vers la page bandcamp, dont le formulaire de contact sert de
point d'entrée. si vous obtenez plus tard une adresse e-mail dédiée, remplacez le `href`
du lien `contact` par `mailto:votre-adresse`.

## ajouter une sortie plus tard

la section transmission est prête à grandir. chaque sortie est un bloc
`<article class="release">`. pour en ajouter une, dupliquez le bloc et remplissez les
champs. un patron complet est déjà en commentaire dans `index.html`, juste avant la
liste des sorties. exemple :

```html
<article class="release" data-status="out">
  <span class="release-code">FTK-002</span>
  <span class="release-title">titre de la sortie</span>
  <span class="release-year">2026</span>
  <a class="release-link"
     href="https://fantomatik.bandcamp.com/album/xxx"
     target="_blank" rel="noopener noreferrer">écouter →</a>
</article>
```

- `data-status="soon"` : sortie à venir (titre affiché en gris).
- `data-status="out"` : sortie disponible.
- le code suit le catalogue : `FTK-001`, `FTK-002`, etc.

### concert et affiche (section « en direct »)

la section `#live` annonce le premier concert (`5 XII 2026 · lille`) et affiche une
affiche provisoire, traitée comme un signal capté sur le moniteur (cadre crt, balayage,
vacillement, glitch au survol ; tout se fige sous `prefers-reduced-motion`).

pour la mettre à jour, dans `index.html`, section `#live` :

- **changer la date / le lieu** : éditez `<span class="affiche-date">5 XII 2026 · lille</span>`.
- **remplacer l'affiche** : déposez la nouvelle image dans `assets/` (idéalement en
  `.webp`, environ 640 px de large) et pointez le `src` du `<img>` dessus. mettez à jour
  l'attribut `alt`, les attributs `width`/`height` et le label. l'affiche actuelle est un
  visuel provisoire ; le master pleine résolution est dans
  `assets/affiche-5-xii-26-source.png` (vous pouvez le supprimer une fois la vraie
  affiche en place).

pour regénérer une version web optimisée depuis une grande image :

```bash
cwebp -q 78 -resize 640 0 votre-affiche.png -o assets/affiche-5-xii-26.webp
```

### intégrer un lecteur bandcamp

quand une sortie existe, bandcamp fournit un code d'`<iframe>`. un emplacement commenté
l'attend dans `index.html`, dans la section transmission. collez-y l'iframe fournie.

### activer les réseaux sociaux

dans la section liens d'`index.html`, des entrées `instagram`, `soundcloud`, etc. sont
déjà présentes en commentaire. décommentez et complétez les adresses.

## accessibilité et mouvement

- contrastes vérifiés au moins au niveau aa sur le fond noir.
- focus clavier visible (anneau phosphore).
- `prefers-reduced-motion` respecté : forme d'onde figée, pas d'écran de boot animé,
  pas de scintillement ni de glitch. le site reste beau et lisible au repos.

## remplacer les polices ou l'image de partage

les polices sont auto-hébergées dans `assets/fonts/` (sous-ensemble latin de
**major mono display** et **space mono**, depuis google fonts, licence ofl). pour les
mettre à jour, remplacez les fichiers `.woff2` et ajustez les blocs `@font-face` en haut
de `css/style.css`.

l'image de partage `assets/og-image.png` est rendue à partir de `assets/og-image.svg`
(qui embarque les polices). pour la regénérer après un changement de texte, ouvrez le
`.svg` dans un navigateur, faites une capture à 1200x630, ou utilisez un outil de rendu
svg vers png fidèle aux `@font-face`.

## licences

- code du site : à vous.
- polices major mono display et space mono : sil open font license (ofl).
