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

## Le jeu caché

Cinq clics sur le nom, en haut de page, et les étiquettes de la section
« Compétences » deviennent les briques d'un casse-briques. Le nom bascule
légèrement au troisième clic : c'est le seul indice.

Il n'y a pas de terrain dessiné. Les briques **sont** les `<li>` de la page,
à leur position réelle ; la toile ne dessine que la balle et la raquette,
par-dessus. Casser une brique, c'est poser une classe sur son élément — d'où
le fait qu'elles gardent leur place dans le flux en disparaissant, sinon la
page se réagencerait sous la balle à chaque impact. Quitter (Échap) rend la
page exacte : les compétences repoussent.

| Fichier                         | Rôle                                  |
| ------------------------------- | ------------------------------------- |
| `components/CasseBriques.astro` | Le compteur de clics, et rien d'autre |
| `scripts/casse-briques.ts`      | Le moteur, chargé à la demande        |
| `styles/casse-briques.css`      | L'habillage, en jetons du thème       |

Ce que ça coûte à une visite qui ne le déclenche jamais : 0,9 ko compressé
de compteur de clics, plus la feuille de style. Le moteur (2,6 ko compressé)
part dans un module séparé, importé dynamiquement au cinquième clic : il
n'est jamais téléchargé autrement.

## Déploiement

GitHub Actions build + publie sur Pages à chaque push (voir
`.github/workflows/deploiement.yml`). Le workflow bloque le déploiement si le
formatage, les types, les contrastes ou le contenu ne passent pas.

## Pourquoi ces choix

- **Astro + TypeScript strict** : HTML statique. Le seul JavaScript de la
  page compte cinq clics sur le nom ; le reste — le casse-briques — n'est
  téléchargé que si on le déclenche. Pas de Next.js (ni serveur, ni route,
  ni état à gérer ici).
- **Contenu typé, séparé du rendu** : `profil.ts` + Zod, sans dépendance
  supplémentaire (`astro/zod`).
- **Une page** : une carte de visite, pas un site.
- **CSS en jetons** : `base.css` décrit la disposition, `themes/brutaliste.css`
  fournit les valeurs.
- **Polices auto-hébergées** : pas de requête vers Google Fonts.
- **Pas d'ESLint, pas de tests unitaires** : pas de logique métier à tester.
  Le contenu est vérifié par son schéma, les contrastes par leur script. Le
  casse-briques, lui, a été vérifié dans un navigateur — collisions, vies,
  fin de partie, sortie propre — mais son harnais n'a pas sa place dans le
  dépôt d'une carte de visite.
