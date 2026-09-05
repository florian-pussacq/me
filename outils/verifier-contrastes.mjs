/**
 * Vérifie les contrastes WCAG des quatre thèmes.
 *
 * Un thème est un jeu de valeurs dans un fichier CSS : personne ne peut
 * savoir à l'œil si `#8b9793` sur `#0c0f11` passe le seuil de 4,5:1. Ce
 * script le calcule, sur toutes les paires réellement employées, et sort en
 * erreur si l'une d'elles échoue. Il tourne en CI : un thème retouché ne
 * peut pas devenir illisible sans que le build le dise.
 *
 * Seuils WCAG 2.1 niveau AA :
 *   - 4,5:1 pour le texte courant (critère 1.4.3) ;
 *   - 3:1 pour les grands textes et les limites de composants (1.4.11).
 *
 * Lance-le avec `npm run verifier-contrastes`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const DOSSIER_THEMES = new URL('../src/styles/themes/', import.meta.url).pathname;
const FICHIER_BASE = new URL('../src/styles/base.css', import.meta.url).pathname;

/**
 * Paires à vérifier : [premier plan, arrière-plan, seuil, usage].
 *
 * Un seuil `null` signifie « mesuré et affiché, mais non bloquant ». Il est
 * réservé au décor pur, que la WCAG 2.1 exempte explicitement du critère
 * 1.4.11 (« Contrast (Minimum) … does not apply to … decorative elements »).
 * Un filet de séparation entre deux sections n'identifie aucun composant et
 * ne porte aucune information : l'imposer à 3:1 obligerait à tracer des
 * traits gris foncé en travers d'une mise en page qui vit de sa légèreté.
 *
 * La distinction est délibérée, et elle n'est pas un moyen de rendre le
 * test vert : les six autres paires, elles, échouent pour de bon.
 */
const PAIRES = [
  ['--texte', '--fond', 4.5, 'texte courant'],
  ['--texte-doux', '--fond', 4.5, 'texte secondaire (faits, périodes, méta)'],
  ['--accent-texte', '--fond', 4.5, 'titre professionnel, mentions, organisations'],
  ['--etiquette-texte', '--etiquette-fond', 4.5, 'étiquettes de technologies'],
  ['--sur-accent', '--accent-texte', 4.5, 'lien d’évitement, bouton de thème actif'],
  // Critère 1.4.11 : l'anneau de focus doit rester visible au clavier.
  // Celui-là est une vraie obligation, pas du décor.
  ['--accent', '--fond', 3, 'anneau de focus clavier'],
  ['--trait', '--fond', null, 'séparateurs (décor, exempté du critère 1.4.11)'],
];

/** Extrait les déclarations `--jeton: valeur;` d'un fragment de CSS. */
function jetons(fragment) {
  const trouves = {};
  for (const [, nom, valeur] of fragment.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    trouves[nom] = valeur.trim();
  }
  return trouves;
}

/** Découpe un fichier de thème en `{ clair, sombre }`. */
function modes(css) {
  const bloc = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{([\s\S]*?)\n\}/.exec(css);
  const sombre = bloc ? jetons(bloc[1]) : null;
  const clair = jetons(bloc ? css.replace(bloc[0], '') : css);
  return { clair, sombre };
}

/** Résout les `var(--autre)` en remontant la chaîne des alias. */
function resoudre(nom, table, profondeur = 0) {
  const valeur = table[nom];
  if (valeur === undefined || profondeur > 10) return null;
  const alias = /^var\(\s*(--[\w-]+)\s*\)$/.exec(valeur);
  if (alias) return resoudre(alias[1], table, profondeur + 1);
  return valeur;
}

function versRvb(couleur) {
  const hex = couleur.trim();
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

/** Luminance relative, formule WCAG 2.1. */
function luminance([r, v, b]) {
  const canal = (valeur) => {
    const c = valeur / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(v) + 0.0722 * canal(b);
}

function contraste(avant, arriere) {
  const [clair, sombre] = [luminance(avant), luminance(arriere)].sort((a, b) => b - a);
  return (clair + 0.05) / (sombre + 0.05);
}

const defauts = jetons(readFileSync(FICHIER_BASE, 'utf8'));
const fichiers = readdirSync(DOSSIER_THEMES).filter((f) => f.endsWith('.css'));

let echecs = 0;
let ignores = 0;

for (const fichier of fichiers) {
  const nomTheme = basename(fichier, '.css');
  const { clair, sombre } = modes(readFileSync(join(DOSSIER_THEMES, fichier), 'utf8'));

  for (const [mode, propres] of [
    ['clair', clair],
    ['sombre', sombre],
  ]) {
    if (!propres) continue;
    // Le mode sombre ne redéfinit qu'une partie des jetons : il hérite du
    // mode clair du même thème, qui hérite lui-même des replis de base.css.
    const table = { ...defauts, ...clair, ...propres };
    const etiquette = sombre ? `${nomTheme} (${mode})` : nomTheme;
    console.log(`\n  ${etiquette}`);

    for (const [nomAvant, nomArriere, seuil, usage] of PAIRES) {
      const avant = versRvb(resoudre(nomAvant, table) ?? '');
      const arriere = versRvb(resoudre(nomArriere, table) ?? '');

      // `transparent` : plusieurs thèmes rendent le fond des étiquettes
      // transparent, la paire à vérifier devient alors texte/fond, déjà
      // couverte par la première ligne du tableau.
      if (!avant || !arriere) {
        ignores += 1;
        console.log(`    –     ${nomAvant} sur ${nomArriere} — sans objet (${usage})`);
        continue;
      }

      const ratio = contraste(avant, arriere);
      if (seuil === null) {
        console.log(
          `    ·  ${ratio.toFixed(2).padStart(5)}:1 (non bloquant) ` +
            `${nomAvant} sur ${nomArriere} — ${usage}`,
        );
        continue;
      }

      const passe = ratio >= seuil;
      if (!passe) echecs += 1;
      console.log(
        `    ${passe ? '✓' : '✗'} ${ratio.toFixed(2).padStart(5)}:1 ` +
          `(seuil ${seuil}) ${nomAvant} sur ${nomArriere} — ${usage}`,
      );
    }
  }
}

console.log(`\n${echecs === 0 ? '✓' : '✗'} ${echecs} échec(s), ${ignores} paire(s) sans objet.\n`);
process.exit(echecs === 0 ? 0 : 1);
