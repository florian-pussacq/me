/**
 * Le peu de plomberie DOM que les trois modules de la traversée partagent.
 *
 * `requis` existe parce que le typage strict et les fonctions déclarées ne
 * s'entendent pas : une garde `if (!element) return` n'affine rien à
 * l'intérieur d'une fonction remontée à l'ouverture de la portée. Renvoyer
 * un type non-nullable règle la question à la source, et une erreur ici ne
 * peut venir que d'un gabarit écrit juste au-dessus.
 *
 * Les trois modules finissent dans le même morceau : les mettre en commun
 * ne coûte aucune requête.
 */
export function requis<T extends Element>(racine: ParentNode, selecteur: string): T {
  const element = racine.querySelector<T>(selecteur);
  if (!element) throw new Error(`Traversée : élément introuvable (${selecteur}).`);
  return element;
}
