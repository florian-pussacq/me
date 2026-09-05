/**
 * Mise en forme des dates du parcours.
 *
 * Les dates sont stockées au format AAAA-MM (voir `profil.schema.ts`) et
 * rendues en français au build. Rien de tout ceci n'atteint le navigateur.
 */

const MOIS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

/** `2023-10` → `octobre 2023`. */
export function formaterMois(mois: string): string {
  const [annee, numero] = mois.split('-');
  const libelle = MOIS_FR[Number(numero) - 1];
  // Le schéma garantit le format ; cette garde n'existe que pour satisfaire
  // le typage strict et signaler une régression de façon lisible.
  if (!annee || !libelle) throw new Error(`mois invalide : ${mois}`);
  return `${libelle} ${annee}`;
}

/** `2023-10` + `present` → `octobre 2023 — aujourd’hui`. */
export function formaterPeriode(debut: string, fin: string): string {
  return `${formaterMois(debut)} — ${fin === 'present' ? 'aujourd’hui' : formaterMois(fin)}`;
}

/** `2014-09` → `2014`. */
export function annee(mois: string): string {
  const [annee] = mois.split('-');
  if (!annee) throw new Error(`mois invalide : ${mois}`);
  return annee;
}
