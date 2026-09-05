/**
 * Génère `public/apercu.png`, l'image affichée quand le lien du site est
 * partagé (LinkedIn, Slack, messageries…).
 *
 * Sans elle, la carte de partage est une vignette grise : c'est-à-dire
 * exactement le contraire de ce qu'on attend d'une carte de visite.
 *
 * L'image est un fichier versionné, pas une étape du build : elle ne change
 * qu'avec l'identité, soit à peu près jamais. La regénérer reste possible en
 * une commande — `node outils/generer-apercu.mjs` — pour qu'elle ne devienne
 * pas un artefact que plus personne ne sait reproduire.
 *
 * Les polices ne sont volontairement pas embarquées : le rasteriseur SVG ne
 * lit pas les woff2, et une image de partage doit rester lisible quelle que
 * soit la police retenue. La composition tient donc à la mise en page, pas
 * au dessin des lettres.
 */
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

// Palette du thème brutaliste. À réaligner si le thème change un jour.
const FOND = '#fffdf7';
const TEXTE = '#0a0a0a';
const DOUX = '#3d3d3d';
const ACCENT = '#b32a08'; // variante lisible de l'accent, voir base.css

const NOM = 'FLORIAN PUSSACQ';
const TITRE = 'TECH LEAD & DÉVELOPPEUR FULL STACK';
const LIGNES = [
  'Logiciel de service public et bancaire.',
  'TDD, architecture hexagonale, code qui survit.',
];
// `ADRESSE` et non `URL` : ce dernier masquerait le constructeur global.
const ADRESSE = 'florian-pussacq.github.io/me';

const echapper = (texte) =>
  texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${FOND}"/>
  <rect x="0" y="0" width="1200" height="630" fill="none" stroke="${TEXTE}" stroke-width="10"/>
  <text x="96" y="250" font-family="Helvetica, Arial, sans-serif" font-weight="900"
        letter-spacing="-2" font-size="82" fill="${TEXTE}">${echapper(NOM)}</text>
  <text x="96" y="304" font-family="Helvetica, Arial, sans-serif" font-weight="700"
        letter-spacing="1" font-size="32" fill="${ACCENT}">${echapper(TITRE)}</text>
  <rect x="96" y="352" width="88" height="6" fill="${TEXTE}"/>
  ${LIGNES.map(
    (ligne, i) =>
      `<text x="96" y="${418 + i * 42}" font-family="Helvetica, Arial, sans-serif" ` +
      `font-size="28" fill="${DOUX}">${echapper(ligne)}</text>`,
  ).join('\n  ')}
  <text x="96" y="558" font-family="Helvetica, Arial, sans-serif" font-size="24"
        fill="${DOUX}">${echapper(ADRESSE)}</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(new URL('../public/apercu.png', import.meta.url), png);
console.log(`✓ public/apercu.png — 1200×630, ${(png.length / 1024).toFixed(1)} Ko`);
