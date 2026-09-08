/**
 * ═══════════════════════════════════════════════════════════════════════
 *  2077 — LA PAGE, EN VERSION 1.0.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Comme l'arrêt de 2026, celui-ci ne dessine pas de scène : c'est la page
 * elle-même qu'on regarde. Elle est seulement repeinte aux couleurs d'une
 * certaine ville de nuit, et elle part en morceaux.
 *
 * Deux mécaniques, et rien de plus :
 *
 * — La palette. Le thème du site est fait de jetons, donc en remplacer les
 *   valeurs suffit à repeindre toute la page — c'est la feuille de style
 *   qui s'en charge, pas ce module.
 * — Les bugs. Une boucle pose des classes sur des éléments réels, tirés au
 *   sort, pendant un court instant : décalage, texture manquante, chute
 *   hors de l'écran, dédoublement. Aucun texte n'est modifié, aucun nœud
 *   n'est déplacé — uniquement des classes, toutes retirées à la sortie.
 *   Un œuf de Pâques n'a pas le droit d'abîmer la page qui l'héberge.
 *
 * Le compteur d'images par seconde du bandeau est réellement mesuré. Le
 * reste des chiffres relève du décor, comme le journal d'erreurs — dont
 * chaque ligne renvoie à un bug de sortie que tout le monde a en tête.
 */
import { requis } from './dom';

/** Les éléments de la page qui peuvent se mettre à dysfonctionner. */
const CANDIDATS =
  '.principe, .poste, .diplome, .groupe, .etiquettes li, .section__titre, .entete__nom, .lien';

const BUGS = ['decalage', 'texture', 'chute', 'fantome', 'tranches'] as const;

/**
 * Intervalle entre deux incidents, et durée d'un incident.
 *
 * Les deux se recouvrent volontiers : deux ou trois éléments cassés en même
 * temps, ce qui suffit à faire désordre sans que la page cesse d'être
 * lisible — c'est encore un CV.
 */
const ENTRE_INCIDENTS = [320, 900] as const;
const DUREE_INCIDENT = [400, 1400] as const;

const JOURNAL: readonly string[] = [
  '[WRN] PNJ:conseiller_02 en T-pose — animation absente',
  '[ERR] texture non chargée : parcours/france-travail.dds',
  '[WRN] véhicule éjecté hors du monde (y = -inf)',
  '[ERR] sauvegarde > 8 Mo : corruption probable',
  '[WRN] police apparue derrière le joueur',
  '[ERR] LOD 0 jamais atteint — la foule reste floue',
  '[WRN] collision manquante : le joueur traverse le pied de page',
  '[ERR] chevelure détachée du crâne (physique)',
  '[WRN] cycle jour/nuit bloqué à 03:00',
  '[ERR] dialogue joué sans son — sous-titres seuls',
  '[WRN] usager assis dans le vide, chaise non instanciée',
  '[INF] correctif 1.0.1 annoncé — sans date',
];

function entre([min, max]: readonly [number, number]): number {
  return min + Math.random() * (max - min);
}

function auHasard<T>(elements: readonly T[]): T | undefined {
  return elements[Math.floor(Math.random() * elements.length)];
}

export interface VueBugs {
  readonly racine: HTMLElement;
  detruire(): void;
}

export function creerBugs(): VueBugs {
  const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const racine = document.createElement('div');
  racine.className = 'bugs';
  racine.innerHTML = `
    <div class="bugs__hud">
      <p class="bugs__titre">NIGHT CITY — BUILD 1.0</p>
      <p class="bugs__mesures">
        <span data-ips>IPS —</span>
        <span data-appels>DRAW 4 812</span>
        <span data-memoire>MÉM 7,9 / 8,0 Go</span>
      </p>
      <p class="bugs__flux"><span data-flux>STREAMING 0 %</span></p>
    </div>
    <ol class="bugs__journal" aria-hidden="true"></ol>
  `;

  const ips = requis<HTMLElement>(racine, '[data-ips]');
  const flux = requis<HTMLElement>(racine, '[data-flux]');
  const memoire = requis<HTMLElement>(racine, '[data-memoire]');
  const journal = requis<HTMLElement>(racine, '.bugs__journal');

  // Les éléments de la couche de traversée ne sont pas du décor de jeu :
  // le curseur doit rester lisible et cliquable pendant que tout casse.
  const cibles = Array.from(document.querySelectorAll<HTMLElement>(CANDIDATS)).filter(
    (element) => !element.closest('.epoques'),
  );

  const atteints = new Set<HTMLElement>();
  const minuteries = new Set<number>();
  let animation = 0;

  function nettoyer(element: HTMLElement): void {
    for (const bug of BUGS) element.classList.remove(`bug--${bug}`);
    atteints.delete(element);
  }

  function incident(): void {
    const cible = auHasard(cibles);
    if (cible && !atteints.has(cible)) {
      const bug = calme ? 'texture' : auHasard(BUGS);
      cible.classList.add(`bug--${bug}`);
      atteints.add(cible);
      const fin = window.setTimeout(() => {
        nettoyer(cible);
        minuteries.delete(fin);
      }, entre(DUREE_INCIDENT));
      minuteries.add(fin);
    }

    const suivant = window.setTimeout(() => {
      minuteries.delete(suivant);
      incident();
    }, entre(ENTRE_INCIDENTS));
    minuteries.add(suivant);
  }

  function ligneDeJournal(): void {
    const ligne = document.createElement('li');
    ligne.className = 'bugs__ligne';
    ligne.textContent = auHasard(JOURNAL) ?? '';
    journal.append(ligne);
    // Le journal ne garde que ses dernières lignes : il défile, il ne
    // s'accumule pas.
    while (journal.childElementCount > 5) journal.firstElementChild?.remove();

    const suivante = window.setTimeout(
      () => {
        minuteries.delete(suivante);
        ligneDeJournal();
      },
      entre([900, 2400]),
    );
    minuteries.add(suivante);
  }

  // Le seul chiffre honnête du bandeau : les images par seconde sont
  // comptées, pas inventées.
  let images = 0;
  let debutMesure = performance.now();
  let charge = 0;

  function mesurer(instant: number): void {
    images += 1;
    const ecoule = instant - debutMesure;
    if (ecoule >= 500) {
      ips.textContent = `IPS ${Math.round((images * 1000) / ecoule)}`;
      images = 0;
      debutMesure = instant;

      // Le chargement progresse, puis recommence : il n'aboutit jamais.
      charge = charge >= 100 ? 0 : charge + Math.round(entre([3, 17]));
      flux.textContent = `STREAMING ${Math.min(charge, 100)} %`;
      memoire.textContent = `MÉM ${(7.4 + Math.random() * 0.6).toFixed(1)} / 8,0 Go`;
    }
    animation = requestAnimationFrame(mesurer);
  }

  animation = requestAnimationFrame(mesurer);
  incident();
  ligneDeJournal();

  function detruire(): void {
    cancelAnimationFrame(animation);
    for (const minuterie of minuteries) window.clearTimeout(minuterie);
    minuteries.clear();
    // La page repart intacte : aucune classe posée ici ne lui survit.
    for (const element of [...atteints]) nettoyer(element);
    racine.remove();
  }

  return { racine, detruire };
}
