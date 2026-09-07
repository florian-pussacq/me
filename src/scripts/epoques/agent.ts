/**
 * ═══════════════════════════════════════════════════════════════════════
 *  2067 — LE PROFIL LU PAR UNE MACHINE.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Le miroir exact de 1985. Là-bas, une page mettait huit secondes à
 * s'afficher parce que la ligne ne savait pas faire mieux. Ici, l'échange
 * entier tient dans quelques centaines de microsecondes, et il faut le
 * ralentir de plusieurs milliers de fois pour qu'un œil humain en voie
 * quelque chose. Aucune des deux époques n'est à la vitesse de son lecteur.
 * Celle du milieu, si.
 *
 * Le pari de cette vue, c'est de ne rien inventer. Les chiffres affichés
 * sont comptés dans les données `schema.org/Person` que la page publie
 * déjà — quarante-sept technologies, cinq postes, quatre établissements —
 * et la cohérence du parcours est réellement vérifiée, pas affirmée. Une
 * page qui mentirait à son propre agent ferait rougir cet écran.
 *
 * Et l'échange se termine sur la seule question qui compte en entretien,
 * celle qu'aucune donnée structurée ne portera jamais. La réponse est un
 * 204, et une adresse. C'est la même conclusion qu'en 1985, à quatre-vingt
 * -deux ans d'écart : pour ça, il faut écrire à quelqu'un.
 */
import { requis } from './dom';
import type { Profil } from './donnees';

/** Durée du rejeu, en millisecondes réelles. */
const DUREE_REJEU = 7000;

type Sens = 'demande' | 'reponse';

interface Echange {
  /** Microsecondes écoulées depuis l'ouverture de la session. */
  readonly instant: number;
  readonly sens: Sens;
  readonly acteur: string;
  readonly intitule: string;
  readonly detail?: string;
  /** La question sans réponse : traitée à part, c'est la chute. */
  readonly ouverte?: boolean;
}

function tableau(valeur: unknown): readonly unknown[] {
  return Array.isArray(valeur) ? valeur : [];
}

function nombre(valeur: number): string {
  return valeur.toLocaleString('fr-FR');
}

function construireSession(profil: Profil): Echange[] {
  const savoirs = tableau(profil.structurees.knowsAbout).length;
  const ecoles = tableau(profil.structurees.alumniOf).length;
  const profils = tableau(profil.structurees.sameAs).length;
  const faits = profil.parcours.reduce((somme, poste) => somme + poste.faits.length, 0);
  const debuts = profil.parcours.map((poste) => poste.debut);
  const premier = debuts.at(-1) ?? '';

  // La cohérence est vérifiée, pas affirmée : si `profil.ts` perdait son
  // ordre, l'agent le dirait ici comme le rapport de tests le dit ailleurs.
  const ordonne = debuts.every((date, rang) => {
    const precedente = debuts[rang - 1];
    return precedente === undefined || precedente > date;
  });

  return [
    {
      instant: 0,
      sens: 'demande',
      acteur: 'agent://recruteur',
      intitule: 'ouverture de session',
      detail: 'me.pussacq · vocabulaire schema.org/Person',
    },
    {
      instant: 14,
      sens: 'reponse',
      acteur: 'agent://pussacq',
      intitule: '1 sujet exposé',
      detail: `${nombre(profils)} profils liés · aucune authentification requise`,
    },
    {
      instant: 47,
      sens: 'demande',
      acteur: 'agent://recruteur',
      intitule: 'interroge knowsAbout',
      detail: 'attendu : plateforme JVM, web, architecture applicative',
    },
    {
      instant: 71,
      sens: 'reponse',
      acteur: 'agent://pussacq',
      intitule: `${nombre(savoirs)} assertions`,
      detail: tableau(profil.structurees.knowsAbout).slice(0, 6).join(' · ') + ' · …',
    },
    {
      instant: 108,
      sens: 'demande',
      acteur: 'agent://recruteur',
      intitule: 'interroge le parcours',
      detail: 'profondeur recherchée : dix ans, même domaine',
    },
    {
      instant: 139,
      sens: 'reponse',
      acteur: 'agent://pussacq',
      intitule: `${nombre(profil.parcours.length)} postes · depuis ${premier}`,
      detail: `${nombre(faits)} faits déclarés · ${nombre(ecoles)} établissements`,
    },
    {
      instant: 186,
      sens: 'demande',
      acteur: 'agent://recruteur',
      intitule: 'vérifie la cohérence',
      detail: 'ordre des périodes, recouvrements, trous',
    },
    {
      instant: 221,
      sens: 'reponse',
      acteur: 'agent://pussacq',
      intitule: ordonne ? 'aucune contradiction' : 'incohérence détectée',
      detail: ordonne
        ? 'les périodes se suivent, la page le vérifie elle-même'
        : 'le parcours n’est plus antichronologique',
    },
    {
      instant: 274,
      sens: 'demande',
      acteur: 'agent://recruteur',
      intitule: 'demande une projection',
      detail: 'tiendra-t-il un composant réglementaire pendant dix ans ?',
    },
    {
      instant: 309,
      sens: 'reponse',
      acteur: 'agent://pussacq',
      intitule: 'hors compétence',
      detail: 'je porte des faits, pas des promesses',
    },
    {
      instant: 358,
      sens: 'demande',
      acteur: 'agent://recruteur',
      intitule: '« est-ce qu’on a envie de travailler avec lui ? »',
    },
    {
      instant: 412,
      sens: 'reponse',
      acteur: 'agent://pussacq',
      intitule: '204 — hors périmètre',
      detail:
        'Cette assertion n’existe dans aucun profil. Elle ne s’infère pas d’un parcours et ne se prouve pas par une signature. Il reste un canal, et il n’a pas changé depuis 1985 : écrivez-lui.',
      ouverte: true,
    },
  ];
}

export interface VueAgent {
  readonly racine: HTMLElement;
  detruire(): void;
}

export function creerAgent(profil: Profil): VueAgent {
  const session = construireSession(profil);
  const duree = session.at(-1)?.instant ?? 1;
  const ralenti = Math.round((DUREE_REJEU * 1000) / duree);

  const racine = document.createElement('div');
  racine.className = 'agent';
  racine.innerHTML = `
    <div class="agent__defilement">
      <p class="agent__annonce">Échange inter-agents</p>
      <p class="agent__intro">
        Quarante et un ans après cette page. Personne ne la lit plus : deux
        agents s’accordent sur ce qu’elle affirme, et se quittent.
      </p>
      <ol class="agent__trace"></ol>
      <p class="agent__bilan" aria-live="polite"></p>
    </div>
  `;

  const trace = requis<HTMLElement>(racine, '.agent__trace');
  const bilan = requis<HTMLElement>(racine, '.agent__bilan');

  const minuteries: number[] = [];

  session.forEach((echange, rang) => {
    // Le rejeu respecte les écarts de la session : les silences de la
    // machine sont à l'échelle, eux aussi.
    const retard = (echange.instant / duree) * DUREE_REJEU;
    minuteries.push(
      window.setTimeout(() => {
        const ligne = document.createElement('li');
        ligne.className = `agent__ligne agent__ligne--${echange.sens}`;
        if (echange.ouverte) ligne.classList.add('agent__ligne--ouverte');

        const marge = document.createElement('p');
        marge.className = 'agent__instant';
        marge.textContent = `${echange.instant.toString().padStart(3, '0')} µs`;

        const acteur = document.createElement('p');
        acteur.className = 'agent__acteur';
        acteur.textContent = `${echange.sens === 'demande' ? '→' : '←'} ${echange.acteur}`;

        const intitule = document.createElement('p');
        intitule.className = 'agent__intitule';
        intitule.textContent = echange.intitule;

        ligne.append(marge, acteur, intitule);

        if (echange.detail) {
          const detail = document.createElement('p');
          detail.className = 'agent__detail';
          detail.textContent = echange.detail;
          ligne.append(detail);
        }

        if (echange.ouverte) {
          const canal = document.createElement('a');
          canal.className = 'agent__canal';
          canal.href = profil.liens[0]?.url ?? '#';
          canal.rel = 'me noopener';
          canal.target = '_blank';
          canal.textContent = profil.liens[0]?.libelle ?? 'Écrire';
          ligne.append(canal);
        }

        trace.append(ligne);
        // Le rejeu suit sa propre trace : sans cela, la chute s'écrit sous
        // le pli et personne ne la voit.
        ligne.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

        if (rang === session.length - 1) {
          bilan.textContent = `Session close en ${duree} µs · rejouée ${nombre(ralenti)} fois plus lentement pour que vous puissiez la suivre.`;
        }
      }, retard),
    );
  });

  function detruire(): void {
    for (const minuterie of minuteries) window.clearTimeout(minuterie);
    racine.remove();
  }

  return { racine, detruire };
}
