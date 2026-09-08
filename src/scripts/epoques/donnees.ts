/**
 * ═══════════════════════════════════════════════════════════════════════
 *  LE PROFIL, RELU DEPUIS LA PAGE.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Les époques affichent le même contenu. Encore faut-il qu'elles le tiennent
 * de la même source — sinon ce ne sont plus des rendus d'un profil, mais des
 * textes qui se ressemblent et qui divergeront au premier changement de
 * `profil.ts`.
 *
 * Cette source, c'est la page elle-même : on relit le DOM rendu, rien n'est
 * dupliqué, rien n'est embarqué. Modifier `profil.ts` change les époques du
 * même coup, sans que personne ait à y penser.
 */

export interface Poste {
  readonly titre: string;
  readonly organisation: string;
  readonly lieu: string;
  /** Format AAAA-MM, tel que porté par l'attribut `datetime`. */
  readonly debut: string;
  readonly periode: string;
  readonly contexte: string;
  readonly faits: readonly string[];
  readonly stack: readonly string[];
}

export interface Groupe {
  readonly intitule: string;
  readonly elements: readonly string[];
}

export interface Diplome {
  readonly intitule: string;
  readonly etablissement: string;
  readonly annees: string;
}

export interface Principe {
  readonly titre: string;
  readonly explication: string;
}

export interface Lien {
  readonly libelle: string;
  readonly url: string;
}

export interface Profil {
  readonly nom: string;
  readonly titre: string;
  readonly accroche: string;
  readonly localisation: string;
  readonly principes: readonly Principe[];
  readonly parcours: readonly Poste[];
  readonly competences: readonly Groupe[];
  readonly formation: readonly Diplome[];
  readonly complements: readonly Groupe[];
  readonly liens: readonly Lien[];
}

function texte(racine: ParentNode, selecteur: string): string {
  return racine.querySelector(selecteur)?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
}

function textes(racine: ParentNode, selecteur: string): string[] {
  return Array.from(racine.querySelectorAll(selecteur), (element) =>
    (element.textContent ?? '').trim().replace(/\s+/g, ' '),
  ).filter(Boolean);
}

export function lireProfil(): Profil {
  const parcours: Poste[] = Array.from(document.querySelectorAll('.poste'), (poste) => ({
    titre: texte(poste, '.poste__titre'),
    organisation: texte(poste, '.poste__organisation b'),
    lieu: texte(poste, '.poste__organisation')
      .replace(texte(poste, '.poste__organisation b'), '')
      .replace(/^\s*·\s*/, ''),
    debut: poste.querySelector('time')?.getAttribute('datetime') ?? '',
    periode: texte(poste, '.poste__periode'),
    contexte: texte(poste, '.poste__contexte'),
    faits: textes(poste, '.poste__faits li'),
    stack: textes(poste, '.etiquettes li'),
  }));

  const competences: Groupe[] = Array.from(
    document.querySelectorAll('#competences .groupe'),
    (groupe) => ({
      intitule: texte(groupe, '.groupe__titre'),
      elements: textes(groupe, '.etiquettes li'),
    }),
  );

  const formation: Diplome[] = Array.from(document.querySelectorAll('.diplome'), (diplome) => ({
    intitule: texte(diplome, '.diplome__intitule'),
    etablissement: texte(diplome, '.diplome__etablissement'),
    annees: texte(diplome, '.diplome__annees'),
  }));

  // Langues et centres d'intérêt sont une liste de définitions : chaque
  // `<div>` porte son intitulé et ses valeurs.
  const complements: Groupe[] = Array.from(
    document.querySelectorAll('.complements > div'),
    (bloc) => ({ intitule: texte(bloc, 'dt'), elements: textes(bloc, 'dd') }),
  );

  const principes: Principe[] = Array.from(document.querySelectorAll('.principe'), (principe) => ({
    titre: texte(principe, '.principe__titre'),
    explication: texte(principe, '.principe__texte'),
  }));

  // Les liens sont répétés dans l'en-tête et dans la section de contact :
  // on les dédoublonne par URL.
  const liens = new Map<string, Lien>();
  for (const ancre of document.querySelectorAll<HTMLAnchorElement>('.liens a')) {
    liens.set(ancre.href, { libelle: (ancre.textContent ?? '').trim(), url: ancre.href });
  }

  return {
    nom: texte(document, '.entete__nom'),
    titre: texte(document, '.entete__titre'),
    accroche: texte(document, '.entete__accroche'),
    localisation: texte(document, '.entete__lieu'),
    principes,
    parcours,
    competences,
    formation,
    complements,
    liens: [...liens.values()],
  };
}
