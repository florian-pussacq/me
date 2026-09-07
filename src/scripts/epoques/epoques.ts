/**
 * ═══════════════════════════════════════════════════════════════════════
 *  LA TRAVERSÉE — 1985, cette page, 2067.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Un curseur, trois arrêts, un seul contenu.
 *
 * L'arrêt du milieu n'est pas une reconstitution : c'est la page elle-même,
 * qu'on voit au travers dès que le curseur s'y pose. C'est ce qui fait
 * tenir l'ensemble — on ne compare pas deux pastiches, on compare deux
 * pastiches À un original, et l'original est sous vos yeux.
 *
 * Ce que la traversée raconte tient dans l'écart des vitesses. En 1985, une
 * page mettait huit secondes à arriver parce que la ligne ne savait pas
 * faire mieux. En 2067, l'échange entier tient dans quatre cents
 * microsecondes et personne ne le lit. Entre les deux, une page écrite pour
 * être lue par quelqu'un.
 *
 * Techniquement, c'est la démonstration du choix d'architecture du site :
 * `profil.ts` ne sait pas comment il est rendu. Trois moteurs relisent la
 * même page — via `donnees.ts` — et rien n'est dupliqué. Modifier le
 * contenu déplace les trois époques du même coup.
 */
import '../../styles/epoques.css';
import { requis } from './dom';
import { lireProfil } from './donnees';
import { creerMinitel, type Minitel } from './minitel';
import { creerAgent, type VueAgent } from './agent';

const ATTRIBUT = 'data-epoques';

interface Arret {
  readonly annee: string;
  readonly nom: string;
  readonly legende: string;
}

const ARRETS: readonly Arret[] = [
  {
    annee: '1985',
    nom: 'Minitel',
    legende: '40 colonnes, 1 200 bauds. Huit secondes pour une page pleine.',
  },
  {
    annee: '2026',
    nom: 'Cette page',
    legende: 'La seule des trois qui soit écrite à la vitesse de son lecteur.',
  },
  {
    annee: '2067',
    nom: 'Agents',
    legende: 'Quatre cents microsecondes, et plus personne pour la lire.',
  },
];

/** L'arrêt du milieu : la page elle-même, sans rien par-dessus. */
const PRESENT = 1;

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
      <p class="epoques__legende"></p>
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
  const legende = requis<HTMLElement>(racine, '.epoques__legende');
  const fermeture = requis<HTMLButtonElement>(racine, '.epoques__fermer');

  const arrets = Array.from(racine.querySelectorAll<HTMLButtonElement>('[data-arret]'));

  let epoque = -1;
  let minitel: Minitel | undefined;
  let agent: VueAgent | undefined;

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
    agent?.detruire();
    agent = undefined;
    scene.replaceChildren();
  }

  function afficher(rang: number): void {
    const cible = Math.max(0, Math.min(rang, ARRETS.length - 1));
    if (cible === epoque) return;
    epoque = cible;

    vider();
    verrouiller(cible !== PRESENT);

    if (cible === 0) {
      minitel = creerMinitel(profil);
      scene.append(minitel.racine);
      minitel.ajuster();
    } else if (cible === 2) {
      agent = creerAgent(profil);
      scene.append(agent.racine);
    }

    racine.dataset.epoque = String(cible);
    document.documentElement.setAttribute(ATTRIBUT, String(cible));
    legende.textContent = ARRETS[cible]?.legende ?? '';
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
  // Trois boutons pour le doigt et le clavier, plus un glissement continu
  // sur le rail : c'est un curseur temporel, on doit pouvoir le faire
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
