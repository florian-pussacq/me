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

## Ce qui est caché dans la page

Deux choses, qui finissent par se rejoindre.

### Le casse-briques

Cinq clics sur le nom, en haut de page, et les étiquettes de la section
« Compétences » deviennent les briques d'un casse-briques. Le nom bascule
légèrement au troisième clic : c'est le seul indice.

Il n'y a pas de terrain dessiné. Les briques **sont** les `<li>` de la page,
à leur position réelle ; la toile ne dessine que la balle et la raquette,
par-dessus. Casser une brique, c'est poser une classe sur son élément — d'où
le fait qu'elles gardent leur place dans le flux en disparaissant, sinon la
page se réagencerait sous la balle à chaque impact. Quitter (Échap) rend la
page exacte : les compétences repoussent.

### Le rapport de tests

On tape `tdd` n'importe où sur la page — la console le souffle à qui
l'ouvre — et un bandeau de test runner s'ouvre en bas de l'écran. Au doigt,
c'est un appui long sur le pied de page : le clavier d'un téléphone
n'apparaît que pour un champ de saisie, et cette page n'en a aucun, donc
sans ce second geste le rapport y serait inaccessible. Une barre d'accent
grandit sous le pied de page pendant l'appui, sinon rien ne distingue un
appui long d'une page qui ne répond pas.

Les quatorze tests sont vrais. Ils lisent le DOM affiché, calculent les
rapports de contraste à partir des couleurs réellement appliquées par le
navigateur, interrogent l'API Performance sur ce qui a été téléchargé.
Aucun verdict n'est écrit d'avance : cassez l'ordre du parcours, ajoutez une
police distante, et le rapport devient rouge. Chaque test souligne dans la
page les éléments qu'il inspecte pendant qu'il tourne — c'est la seule
preuve honnête qu'il lit bien quelque chose.

Le dernier échoue, toujours : `page.neChargeAucunJavaScript()`. Il ne peut
pas en être autrement, puisqu'il a fallu charger un module pour l'afficher.
Son bouton **Corriger** ne corrige rien. Il lance le casse-briques.

| Fichier                           | Rôle                                                                |
| --------------------------------- | ------------------------------------------------------------------- |
| `components/CasseBriques.astro`   | Le compteur de clics, et rien d'autre                               |
| `components/RapportDeTests.astro` | Les deux gestes, et rien d'autre                                    |
| `scripts/casse-briques.ts`        | Le moteur du jeu, chargé à la demande                               |
| `scripts/rapport-de-tests.ts`     | Les assertions, chargées à la demande                               |
| `styles/declencheurs.css`         | Les deux indices — la seule feuille des trois à partir avec la page |
| `styles/casse-briques.css`        | L'habillage du jeu, avec son moteur                                 |
| `styles/rapport-de-tests.css`     | L'habillage du bandeau, avec le sien                                |

Ce que ça coûte à une visite qui ne déclenche rien : 1,8 ko compressé de
JavaScript — deux compteurs de gestes et l'aide de préchargement de Vite —
et les quelques lignes de `declencheurs.css`. Une feuille de style ne peut
pas attendre le déclenchement quand c'est elle qui l'annonce ; les deux
autres, elles, voyagent avec leur moteur (2,6 et 4,4 ko compressés) et ne
sont téléchargées que si on va les chercher.

## Déploiement

GitHub Actions build + publie sur Pages à chaque push (voir
`.github/workflows/deploiement.yml`). Le workflow bloque le déploiement si le
formatage, les types, les contrastes ou le contenu ne passent pas.

## Pourquoi ces choix

- **Astro + TypeScript strict** : HTML statique. Le seul JavaScript de la
  page compte des clics et des touches ; le reste n'est téléchargé que si on
  le déclenche. Pas de Next.js (ni serveur, ni route, ni état à gérer ici).
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
