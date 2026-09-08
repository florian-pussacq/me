/**
 * ═══════════════════════════════════════════════════════════════════════
 *  LA TRAVERSÉE — 1985, cette page, 2077.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Un curseur, trois arrêts, un seul contenu.
 *
 * Les arrêts 2026 et 2077 ne sont pas des reconstitutions : c'est la page
 * elle-même, qu'on voit au travers dès que le curseur s'y pose — intacte
 * pour le premier, en morceaux pour le second.
 *
 * `profil.ts` ne sait pas comment il est rendu : le Minitel relit la page
 * via `donnees.ts`, sans qu'une ligne de contenu soit écrite deux fois.
 */
import '../../styles/epoques.css';
import { requis } from './dom';
import { lireProfil } from './donnees';
import { creerMinitel, type Minitel } from './minitel';
import { creerBugs, type VueBugs } from './bugs';

const ATTRIBUT = 'data-epoques';

interface Arret {
  readonly annee: string;
  readonly nom: string;
}

const ARRETS: readonly Arret[] = [
  { annee: '1985', nom: 'Minitel' },
  { annee: '2026', nom: 'Cette page' },
  { annee: '2077', nom: 'Patch 1.0' },
];

/** Les arrêts qui montrent la page elle-même : elle doit rester parcourable. */
const SUR_LA_PAGE = new Set([1, 2]);

let ouverte = false;

export function ouvrirEpoques(): void {
  if (ouverte) return;
  ouverte = true;

  const profil = lireProfil();
  const defilementAvant = window.scrollY;
  const styleCorps = document.body.style;

  const racine = document.createElement('div');
  racine.className = 'epoques';
  racine.tabIndex = -1;
  racine.setAttribute('role', 'dialog');
  racine.setAttribute('aria-modal', 'true');
  racine.setAttribute('aria-label', 'Le même profil à trois époques');
  racine.innerHTML = `
    <div class="epoques__scene"></div>
    <div class="epoques__barre">
      <div class="epoques__rail" role="group" aria-label="Choisir une époque">
        <span class="epoques__pastille" aria-hidden="true"></span>
        ${ARRETS.map(
          (arret, rang) => `
          <button type="button" class="epoques__arret" data-arret="${rang}">
            <span class="epoques__annee">${arret.annee}</span>
            <span class="epoques__nom">${arret.nom}</span>
          </button>`,
        ).join('')}
      </div>
      <button type="button" class="epoques__fermer">Fermer</button>
    </div>
  `;
  document.body.append(racine);
  document.documentElement.setAttribute(ATTRIBUT, '0');

  const scene = requis<HTMLElement>(racine, '.epoques__scene');
  const rail = requis<HTMLElement>(racine, '.epoques__rail');
  const pastille = requis<HTMLElement>(racine, '.epoques__pastille');
  const fermeture = requis<HTMLButtonElement>(racine, '.epoques__fermer');

  const arrets = Array.from(racine.querySelectorAll<HTMLButtonElement>('[data-arret]'));

  let epoque = -1;
  let minitel: Minitel | undefined;
  let bugs: VueBugs | undefined;

  /**
   * Le défilement du document n'est bloqué qu'en dehors du présent.
   *
   * Au milieu, la page redevient une page : on doit pouvoir la parcourir,
   * sinon l'arrêt de 2026 ne montre rien de ce qu'il prétend montrer.
   */
  function verrouiller(actif: boolean): void {
    if (actif && styleCorps.position !== 'fixed') {
      styleCorps.position = 'fixed';
      styleCorps.top = `-${window.scrollY}px`;
      styleCorps.left = '0';
      styleCorps.right = '0';
    } else if (!actif && styleCorps.position === 'fixed') {
      const y = Math.abs(Number.parseInt(styleCorps.top || '0', 10));
      styleCorps.position = '';
      styleCorps.top = '';
      styleCorps.left = '';
      styleCorps.right = '';
      window.scrollTo({ top: y, behavior: 'instant' });
    }
  }

  function vider(): void {
    minitel?.detruire();
    minitel = undefined;
    bugs?.detruire();
    bugs = undefined;
    scene.replaceChildren();
  }

  function afficher(rang: number): void {
    const cible = Math.max(0, Math.min(rang, ARRETS.length - 1));
    if (cible === epoque) return;
    epoque = cible;

    vider();
    verrouiller(!SUR_LA_PAGE.has(cible));

    if (cible === 0) {
      minitel = creerMinitel(profil);
      scene.append(minitel.racine);
      minitel.ajuster();
    } else if (cible === 2) {
      bugs = creerBugs();
      scene.append(bugs.racine);
    }

    racine.dataset.epoque = String(cible);
    document.documentElement.setAttribute(ATTRIBUT, String(cible));
    pastille.style.setProperty('--rang', String(cible));
    for (const [rangArret, bouton] of arrets.entries()) {
      bouton.setAttribute('aria-pressed', String(rangArret === cible));
    }
  }

  function fermer(): void {
    vider();
    verrouiller(false);
    racine.remove();
    document.documentElement.removeAttribute(ATTRIBUT);
    window.removeEventListener('keydown', surTouche);
    window.removeEventListener('resize', surRedimensionnement);
    window.scrollTo({ top: defilementAvant, behavior: 'instant' });
    ouverte = false;
    document.querySelector<HTMLElement>('.pied__3615')?.focus({ preventScroll: true });
  }

  function surTouche(evenement: KeyboardEvent): void {
    if (evenement.key === 'Escape') fermer();
    else if (evenement.key === 'ArrowLeft') afficher(epoque - 1);
    else if (evenement.key === 'ArrowRight') afficher(epoque + 1);
    else return;
    evenement.preventDefault();
  }

  function surRedimensionnement(): void {
    minitel?.ajuster();
  }

  // ── Le curseur ───────────────────────────────────────────────────────
  //
  // Un bouton par arrêt pour le doigt et le clavier, plus un glissement
  // continu sur le rail : c'est un curseur, on doit pouvoir le faire
  // glisser.

  function arretSousLePointeur(x: number): number {
    const zone = rail.getBoundingClientRect();
    const fraction = (x - zone.left) / Math.max(1, zone.width);
    return Math.round(fraction * (ARRETS.length - 1));
  }

  let glisse = false;

  rail.addEventListener('pointerdown', (evenement) => {
    glisse = true;
    rail.setPointerCapture(evenement.pointerId);
    afficher(arretSousLePointeur(evenement.clientX));
  });

  rail.addEventListener('pointermove', (evenement) => {
    if (glisse) afficher(arretSousLePointeur(evenement.clientX));
  });

  for (const fin of ['pointerup', 'pointercancel']) {
    rail.addEventListener(fin, () => {
      glisse = false;
    });
  }

  for (const [rang, bouton] of arrets.entries()) {
    // Le rail suffit au doigt et à la souris, mais un bouton doit rester un
    // bouton : entrée et espace passent par `click`, pas par `pointerdown`.
    bouton.addEventListener('click', () => afficher(rang));
  }

  fermeture.addEventListener('click', fermer);
  window.addEventListener('keydown', surTouche);
  window.addEventListener('resize', surRedimensionnement);

  racine.focus();
  afficher(0);
}
