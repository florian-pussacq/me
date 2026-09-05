// @ts-check
import { defineConfig } from 'astro/config';

// Le site est publié sur les pages GitHub du dépôt `me`, donc dans un
// sous-chemin. `site` + `base` permettent à Astro de produire des URL
// correctes pour le canonical, les métadonnées Open Graph et les assets.
export default defineConfig({
  site: 'https://florian-pussacq.github.io',
  base: '/me',
  trailingSlash: 'ignore',
  build: {
    // Une seule page : le HTML est le chemin critique, autant lui éviter
    // un aller-retour réseau pour la feuille de style.
    inlineStylesheets: 'auto',
  },
  prefetch: false,
});
