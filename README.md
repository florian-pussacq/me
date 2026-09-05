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

## Déploiement

GitHub Actions build + publie sur Pages à chaque push (voir
`.github/workflows/deploiement.yml`). Le workflow bloque le déploiement si le
formatage, les types, les contrastes ou le contenu ne passent pas.

## Pourquoi ces choix

- **Astro + TypeScript strict** : HTML statique, zéro JS client. Pas de
  Next.js (ni serveur, ni route, ni état à gérer ici).
- **Contenu typé, séparé du rendu** : `profil.ts` + Zod, sans dépendance
  supplémentaire (`astro/zod`).
- **Une page** : une carte de visite, pas un site.
- **CSS en jetons** : `base.css` décrit la disposition, `themes/brutaliste.css`
  fournit les valeurs.
- **Polices auto-hébergées** : pas de requête vers Google Fonts.
- **Pas d'ESLint, pas de tests unitaires** : pas de logique métier à tester.
  Le contenu est vérifié par son schéma, les contrastes par leur script.
