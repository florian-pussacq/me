/**
 * Le site vit dans un sous-chemin (`/me/`). Écrire `/favicon.svg` en dur
 * marcherait en développement et casserait en production — et l'inverse si
 * un jour le site déménage sur un domaine racine.
 *
 * Cette fonction est le seul endroit qui connaît le préfixe.
 */
export function actif(chemin: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${chemin.replace(/^\//, '')}`;
}
