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

## Les trois écarts

Trois choses en plus de la page. Deux sont cachées, la troisième se voit.

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

La raquette suit le doigt, le pointeur ou les flèches. Le terrain s'arrête
au bord inférieur du bandeau d'état, mesuré à chaque redimensionnement : le
haut de l'écran ne lui appartient pas, et une balle qui rebondit derrière un
bandeau opaque est une balle qu'on a perdue.

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

### 3615 PUSSACQ

Un bouton visible, dans le pied de page. Un code de service Vidéotex ne se
cachait pas : il s'affichait en bas des publicités et des génériques, et
c'était toute son élégance. C'est aussi le seul des trois qu'un doigt trouve
sans rien savoir.

Il ouvre un curseur à trois arrêts, qu'on fait glisser :

- **1985** — le même profil sur Minitel. Quarante colonnes sur vingt-quatre
  lignes, menus numérotés à points de conduite, une page à la fois, touches
  SOMMAIRE / RETOUR / SUITE. Le texte arrive à **cent vingt caractères par
  seconde** : mille deux cents bits sur dix bits par caractère, le débit du
  Minitel 1. Une page pleine met huit secondes. Ce n'est pas un effet, c'est
  la seule façon de faire sentir ce que « lent » voulait dire — et un
  toucher l'affiche d'un coup, parce qu'on n'inflige pas 1985 à quelqu'un.
- **2026** — cette page. La scène se vide, l'habillage laisse passer les
  clics, le défilement se débloque. C'est ce qui fait tenir l'ensemble : on
  ne compare pas deux pastiches, on les compare à un original qui est sous
  les yeux.
- **2067** — le profil lu par une machine. Deux agents s'accordent sur ce
  que la page affirme et se quittent, en quatre cent douze microsecondes.
  Il faut ralentir la trace de dix-sept mille fois pour qu'un œil humain en
  voie quelque chose. Le miroir exact de 1985 : aucune des deux époques
  n'est à la vitesse de son lecteur, celle du milieu si.

Les chiffres de 2067 ne sont pas décoratifs — ils sont comptés dans les
données `schema.org/Person` que la page publie déjà, et la cohérence du
parcours y est vérifiée, pas affirmée. L'échange se termine sur la seule
question qui compte en entretien, celle qu'aucune donnée structurée ne
portera jamais. La réponse est un `204`, et une adresse. C'est déjà la
conclusion de la page « Me joindre » du Minitel, quatre-vingt-deux ans plus
tôt.

Techniquement, la traversée est la démonstration du choix d'architecture du
site : `profil.ts` ne sait pas comment il est rendu. Les trois époques
relisent la même page — via `donnees.ts` — et rien n'est dupliqué. Modifier
le contenu les déplace toutes les trois.

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
qui l'annonce ; les trois autres voyagent avec leur moteur (2,7, 4,4 et
6,0 ko compressés) et ne sont téléchargées que si on va les chercher.

## Déploiement

GitHub Actions build + publie sur Pages à chaque push (voir
`.github/workflows/deploiement.yml`). Le workflow bloque le déploiement si le
formatage, les types, les contrastes ou le contenu ne passent pas.

## Pourquoi ces choix

- **Astro + TypeScript strict** : HTML statique. Le seul JavaScript de la
  page compte des clics et des touches ; le reste n'est téléchargé que si on
  le déclenche. Pas de Next.js (ni serveur, ni route, ni état à gérer ici).
- **Le contenu ne sait pas comment il est rendu** : c'est ce qui permet à un
  Minitel, à une page brutaliste et à une trace inter-agents d'afficher le
  même profil sans qu'une ligne de texte soit écrite deux fois.
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
