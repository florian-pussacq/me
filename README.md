# me

Mon site vitrine — une carte de visite en ligne.

**En ligne :** https://florian-pussacq.github.io/me

## Démarrer

```bash
npm install
npm run dev      # http://localhost:4321/me/
```

| Commande                      | Rôle                                   |
| ----------------------------- | -------------------------------------- |
| `npm run dev`                 | Serveur de développement               |
| `npm run build`               | Build dans `dist/` (valide le contenu) |
| `npm run preview`             | Sert le `dist/` construit              |
| `npm run check`               | Types TypeScript et templates Astro    |
| `npm run verifier-contrastes` | Contrastes WCAG du thème               |
| `npm run format`              | Prettier                               |

## Mettre à jour le contenu

Un seul fichier : `src/data/profil.ts`. Les composants ne contiennent pas de
texte.

Le contenu passe par un schéma Zod (`profil.schema.ts`) à l'import : une
donnée mal formée fait échouer `npm run build`, pas la mise en ligne. Vérifié :
format des dates, cohérence des périodes, ordre du parcours, longueur de la
description.

## Ce qu'il y a en plus

Trois choses. Deux sont cachées, la troisième se voit.

### Le casse-briques

Cinq clics sur le nom, en haut de page. Les étiquettes de la section
« Compétences » deviennent les briques d'un casse-briques : pas de terrain
dessiné, les briques **sont** les `<li>` de la page, à leur position réelle,
et la toile ne dessine que la balle et la raquette. Casser une brique, c'est
poser une classe sur son élément — d'où le fait qu'elles gardent leur place
dans le flux en disparaissant, sinon la page se réagencerait sous la balle à
chaque impact.

La raquette suit le doigt, le pointeur ou les flèches. Le terrain s'arrête au
bord inférieur du bandeau d'état, mesuré à chaque redimensionnement. Quitter
(Échap) rend la page exacte : les compétences repoussent.

### Le rapport de tests

On tape `tdd` n'importe où sur la page — la console le souffle à qui l'ouvre
— ou on appuie longuement sur le pied de page, seul geste possible sur un
téléphone : le clavier n'y apparaît que pour un champ de saisie, et cette
page n'en a aucun.

Les quatorze tests sont vrais. Ils lisent le DOM affiché, calculent les
rapports de contraste à partir des couleurs réellement appliquées par le
navigateur, interrogent l'API Performance sur ce qui a été téléchargé. Aucun
verdict n'est écrit d'avance : cassez l'ordre du parcours, ajoutez une police
distante, et le rapport devient rouge. Chaque test souligne dans la page les
éléments qu'il inspecte pendant qu'il tourne.

Le dernier échoue, toujours : `page.neChargeAucunJavaScript()`. Il ne peut
pas en être autrement, puisqu'il a fallu charger un module pour l'afficher.
Son bouton **Corriger** ne corrige rien — il lance le casse-briques.

### 3615 PUSSACQ

Un bouton visible dans le pied de page, qui ouvre un curseur à trois arrêts.

- **1985** — le profil sur Minitel. Quarante colonnes sur vingt-quatre
  lignes, menus numérotés à points de conduite, pagination, touches
  SOMMAIRE / RETOUR / SUITE. Le texte arrive à cent vingt caractères par
  seconde : mille deux cents bits sur dix bits par caractère, le débit du
  Minitel 1. Une page pleine met huit secondes ; un toucher l'affiche d'un
  coup.
- **2026** — cette page. La scène se vide, l'habillage laisse passer les
  clics, le défilement se débloque.
- **2077** — la page encore, mais en version 1.0. Palette néon, compteur
  d'images par seconde (mesuré), journal d'erreurs, et des éléments qui se
  décalent, chutent, se dédoublent ou perdent leur texture. Rien n'est
  déplacé dans le DOM et aucun texte n'est réécrit : uniquement des classes,
  toutes retirées à la sortie.

Le Minitel relit la page via `donnees.ts` : aucune ligne de contenu n'est
écrite deux fois, et modifier `profil.ts` le met à jour comme il met à jour
la page.

Le passage en néon de 2077 ne touche qu'une poignée de jetons. `base.css` ne
contient aucune couleur en dur, donc les remplacer suffit à repeindre le site
sans qu'une seule règle de mise en page bouge.

### Ce que ça coûte

| Fichier                           | Rôle                                       |
| --------------------------------- | ------------------------------------------ |
| `components/CasseBriques.astro`   | Le compteur de clics                       |
| `components/RapportDeTests.astro` | Les deux gestes du rapport                 |
| `components/Epoques.astro`        | Le bouton 3615, et lui seul                |
| `scripts/casse-briques.ts`        | Le moteur du jeu                           |
| `scripts/rapport-de-tests.ts`     | Les assertions                             |
| `scripts/epoques/`                | La traversée : coquille, Minitel, agents   |
| `styles/declencheurs.css`         | Les indices — la seule feuille toujours là |

Une visite qui ne déclenche rien télécharge **2,1 ko compressé** de
JavaScript : trois compteurs de gestes et l'aide de préchargement de Vite.
Une feuille de style ne peut pas attendre le déclenchement quand c'est elle
qui l'annonce ; les trois autres voyagent avec leur moteur et ne sont
téléchargées que si on va les chercher.

## Déploiement

GitHub Actions build + publie sur Pages à chaque push (voir
`.github/workflows/deploiement.yml`). Le workflow bloque le déploiement si le
formatage, les types, les contrastes ou le contenu ne passent pas.

## Pourquoi ces choix

- **Astro + TypeScript strict** : HTML statique. Le seul JavaScript de la
  page compte des clics et des touches ; le reste n'est téléchargé que si on
  le déclenche. Pas de Next.js (ni serveur, ni route, ni état à gérer ici).
- **Le contenu ne sait pas comment il est rendu** : c'est ce qui permet à un
  Minitel et à une page brutaliste d'afficher le même profil sans qu'une
  ligne de texte soit écrite deux fois.
- **Contenu typé, séparé du rendu** : `profil.ts` + Zod, sans dépendance
  supplémentaire (`astro/zod`).
- **Une page** : une carte de visite, pas un site.
- **CSS en jetons** : `base.css` décrit la disposition, `themes/brutaliste.css`
  fournit les valeurs.
- **Polices auto-hébergées** : pas de requête vers Google Fonts.
- **Pas d'ESLint, pas de tests unitaires** : pas de logique métier à tester.
  Le contenu est vérifié par son schéma, les contrastes par leur script, et
  le reste par le rapport de tests — qui a l'avantage de s'exécuter sur la
  page publiée plutôt que sur une copie en mémoire. Les deux œufs de Pâques
  ont été vérifiés dans un navigateur (collisions, fins de partie, sortie
  propre, verdicts de chaque assertion), mais ce harnais n'a pas sa place
  dans le dépôt d'une carte de visite.
