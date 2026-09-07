/**
 * ═══════════════════════════════════════════════════════════════════════
 *  CASSE-BRIQUES — le jeu caché de la page.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Cinq clics sur le nom, et les étiquettes de la section « Compétences »
 * deviennent les briques d'un casse-briques.
 *
 * Le parti pris tient en une phrase : il n'y a pas de terrain dessiné. Les
 * briques SONT les `<li>` de la page, à leur position réelle ; la toile ne
 * dessine que la balle et la raquette, par-dessus. Détruire une brique,
 * c'est poser une classe CSS sur son élément. On joue dans le CV, pas dans
 * une fenêtre posée sur le CV.
 *
 * Ce que ce choix impose, et qui explique la suite du fichier :
 *
 * — Le terrain dépend de la mise en page. On mesure les étiquettes une fois
 *   le défilement figé, on ne garde que celles qui tombent dans la zone de
 *   jeu, et un redimensionnement remesure tout.
 * — Une brique détruite garde sa place dans le flux (elle s'efface en
 *   opacité, jamais en `display`), sinon la page se réagencerait sous la
 *   balle à chaque impact.
 * — Quitter la partie remet la page dans l'état où on l'a trouvée : les
 *   briques repoussent. Un CV amputé de ses compétences serait un bug.
 *
 * Ce module — et sa feuille de style — ne sont chargés que si le jeu est
 * déclenché : `CasseBriques.astro` les importe dynamiquement. Une visite
 * normale ne les télécharge jamais.
 */
import '../styles/casse-briques.css';

/** Les étiquettes du parcours servent de décor : seules celles-ci jouent. */
const SELECTEUR_BRIQUES = '#competences .etiquettes li';

const ATTRIBUT_JEU = 'data-casse-briques';
const CLASSE_BRIQUE = 'jeu-brique';
const CLASSE_BRIQUE_CASSEE = 'jeu-brique--cassee';

const VIES_INITIALES = 3;

const BALLE_COTE = 14;
const BALLE_VITESSE_INITIALE = 420;
const BALLE_VITESSE_MAX = 820;
/** Chaque brique accélère un peu la balle : la fin de partie doit tendre. */
const BALLE_ACCELERATION = 1.02;

const RAQUETTE_HAUTEUR = 14;
const RAQUETTE_MARGE_BAS = 34;
const RAQUETTE_LARGEUR_MIN = 90;
const RAQUETTE_LARGEUR_MAX = 190;
const RAQUETTE_VITESSE_CLAVIER = 780;

/** Bande basse réservée à la raquette : aucune brique n'y est jouable. */
const ZONE_RAQUETTE = 110;

/** Marge laissée au-dessus de la première brique : le bandeau, et de l'air. */
const MARGE_HAUT = 150;

/** Angle de renvoi maximal par rapport à la verticale (60°). */
const RENVOI_ANGLE_MAX = Math.PI / 3;

/**
 * Déplacement maximal de la balle par sous-pas d'intégration.
 *
 * Les briques font une quinzaine de pixels de haut. À 800 px/s et 60 Hz, la
 * balle avance de 13 px par image : sans découpage, elle traverse une
 * étiquette sans jamais la toucher. On borne le pas sous la plus petite
 * dimension du terrain.
 */
const PAS_MAX = 5;

/** Au-delà, l'onglet était en arrière-plan : on ne rattrape pas le retard. */
const DELTA_MAX = 1 / 30;

type Phase = 'attente' | 'jeu' | 'gagne' | 'perdu';

interface Rectangle {
  x: number;
  y: number;
  l: number;
  h: number;
}

interface Brique extends Rectangle {
  readonly element: HTMLElement;
  /** Détruite ou non. */
  vivante: boolean;
  /** Dans la zone de jeu à la dernière mesure — sinon, hors partie. */
  jouable: boolean;
}

/** Une seule partie à la fois, quel que soit le nombre de déclenchements. */
let partieEnCours = false;

function requis<T extends Element>(racine: ParentNode, selecteur: string): T {
  const element = racine.querySelector<T>(selecteur);
  if (!element) throw new Error(`Casse-briques : élément introuvable (${selecteur}).`);
  return element;
}

function chevauche(a: Rectangle, b: Rectangle): boolean {
  return a.x < b.x + b.l && a.x + a.l > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function borner(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

const GABARIT = `
  <canvas class="jeu__toile" aria-hidden="true"></canvas>
  <p class="jeu__hud">
    <span class="jeu__compteur" data-vies></span>
    <span class="jeu__compteur" data-briques></span>
    <span class="jeu__aide">Souris ou ← → · Espace pour lancer · Échap pour sortir</span>
  </p>
  <div class="jeu__panneau" role="status" hidden>
    <p class="jeu__titre" data-titre></p>
    <p class="jeu__texte" data-texte></p>
    <p class="jeu__actions">
      <button type="button" class="jeu__bouton" data-rejouer>Rejouer</button>
      <button type="button" class="jeu__bouton" data-quitter>Quitter</button>
    </p>
  </div>
`;

export function demarrerCasseBriques(): void {
  if (partieEnCours) return;

  const etiquettes = Array.from(document.querySelectorAll<HTMLElement>(SELECTEUR_BRIQUES));
  const premiere = etiquettes[0];
  if (!premiere) return;

  // ── Figer la page ────────────────────────────────────────────────────
  //
  // D'abord amener les étiquettes sous les yeux du joueur, ensuite bloquer
  // le défilement : le terrain est mesuré après, sur une page qui ne bouge
  // plus. `position: fixed` sur le corps fait disparaître la barre de
  // défilement, donc décale la mise en page de quelques pixels — raison de
  // plus pour mesurer une fois le verrou posé, jamais avant.

  // La position de lecture d'avant la partie : c'est là qu'on rendra la page
  // en sortant, pas là où le jeu l'aura emmenée.
  const defilementAvant = window.scrollY;

  const marge = Math.min(MARGE_HAUT, window.innerHeight * 0.22);
  const cible = defilementAvant + premiere.getBoundingClientRect().top - marge;
  window.scrollTo({ top: Math.max(0, cible), behavior: 'instant' });

  const defilement = window.scrollY;
  const styleCorps = document.body.style;
  styleCorps.position = 'fixed';
  styleCorps.top = `-${defilement}px`;
  styleCorps.left = '0';
  styleCorps.right = '0';
  document.documentElement.setAttribute(ATTRIBUT_JEU, '');

  const couche = document.createElement('div');
  couche.className = 'jeu';
  couche.tabIndex = -1;
  couche.setAttribute('role', 'dialog');
  couche.setAttribute('aria-modal', 'true');
  couche.setAttribute('aria-label', 'Casse-briques');
  couche.innerHTML = GABARIT;
  document.body.append(couche);

  /** Défait le verrou de défilement et rend la page à sa position d'avant. */
  function rendreLaPage(): void {
    couche.remove();
    document.documentElement.removeAttribute(ATTRIBUT_JEU);
    styleCorps.position = '';
    styleCorps.top = '';
    styleCorps.left = '';
    styleCorps.right = '';
    window.scrollTo({ top: defilementAvant, behavior: 'instant' });
    partieEnCours = false;
  }

  const toile = requis<HTMLCanvasElement>(couche, '.jeu__toile');
  const contexteEventuel = toile.getContext('2d');
  if (!contexteEventuel) {
    // Pas de contexte 2D, pas de jeu : la page repart intacte plutôt que de
    // rester coincée sous une couche qui ne dessinera jamais rien.
    rendreLaPage();
    return;
  }
  // Le type est écrit à la main : les fonctions déclarées plus bas sont
  // remontées à l'ouverture de la portée, et n'héritent donc pas de
  // l'affinement de type opéré par la garde ci-dessus.
  const contexte: CanvasRenderingContext2D = contexteEventuel;

  const affichageVies = requis<HTMLElement>(couche, '[data-vies]');
  const affichageBriques = requis<HTMLElement>(couche, '[data-briques]');
  const panneau = requis<HTMLElement>(couche, '.jeu__panneau');
  const titrePanneau = requis<HTMLElement>(couche, '[data-titre]');
  const textePanneau = requis<HTMLElement>(couche, '[data-texte]');
  const boutonRejouer = requis<HTMLButtonElement>(couche, '[data-rejouer]');
  const boutonQuitter = requis<HTMLButtonElement>(couche, '[data-quitter]');

  const briques: Brique[] = etiquettes.map((element) => ({
    element,
    x: 0,
    y: 0,
    l: 0,
    h: 0,
    vivante: true,
    jouable: false,
  }));

  // Les couleurs viennent du thème actif, jamais du jeu : changer de thème
  // change le jeu, et rien ici n'a besoin d'être tenu à jour.
  const jetons = getComputedStyle(document.documentElement);
  const encre = jetons.getPropertyValue('--texte').trim() || '#0a0a0a';
  const accent = jetons.getPropertyValue('--accent').trim() || '#e8380d';

  const raquette: Rectangle = { x: 0, y: 0, l: RAQUETTE_LARGEUR_MIN, h: RAQUETTE_HAUTEUR };
  const balle: Rectangle = { x: 0, y: 0, l: BALLE_COTE, h: BALLE_COTE };

  let largeur = 0;
  let hauteur = 0;
  let phase: Phase = 'attente';
  let vies = VIES_INITIALES;
  let vitesse = BALLE_VITESSE_INITIALE;
  let vx = 0;
  let vy = 0;
  let versGauche = false;
  let versDroite = false;
  let animation = 0;
  let horodatage = 0;

  // Comptés à la main plutôt que par `filter` : ces deux fonctions sont
  // appelées à chaque sous-pas d'intégration, et un tableau intermédiaire
  // soixante fois par seconde n'a pas de raison d'être.
  function restantes(): number {
    let total = 0;
    for (const brique of briques) if (brique.vivante && brique.jouable) total += 1;
    return total;
  }

  function jouables(): number {
    let total = 0;
    for (const brique of briques) if (brique.jouable) total += 1;
    return total;
  }

  // ── Terrain ──────────────────────────────────────────────────────────

  function mesurer(): void {
    const plafond = hauteur - ZONE_RAQUETTE;
    for (const brique of briques) {
      const rect = brique.element.getBoundingClientRect();
      brique.x = rect.left;
      brique.y = rect.top;
      brique.l = rect.width;
      brique.h = rect.height;
      // Une étiquette hors de la zone atteignable sortirait la partie de
      // toute possibilité de victoire : elle est simplement hors jeu.
      brique.jouable = rect.width > 0 && rect.top >= 4 && rect.bottom <= plafond;
      brique.element.classList.toggle(CLASSE_BRIQUE, brique.jouable);
    }
  }

  function redimensionner(): void {
    largeur = window.innerWidth;
    hauteur = window.innerHeight;

    const densite = Math.min(window.devicePixelRatio || 1, 2);
    toile.width = Math.round(largeur * densite);
    toile.height = Math.round(hauteur * densite);
    toile.style.width = `${largeur}px`;
    toile.style.height = `${hauteur}px`;
    contexte.setTransform(densite, 0, 0, densite, 0, 0);

    raquette.l = borner(largeur * 0.18, RAQUETTE_LARGEUR_MIN, RAQUETTE_LARGEUR_MAX);
    raquette.y = hauteur - RAQUETTE_MARGE_BAS - RAQUETTE_HAUTEUR;
    raquette.x = borner(raquette.x, 0, largeur - raquette.l);

    mesurer();
    majHud();
  }

  // ── Boucle ───────────────────────────────────────────────────────────

  function replacerBalle(): void {
    phase = 'attente';
    vitesse = BALLE_VITESSE_INITIALE;
    vx = 0;
    vy = 0;
    collerBalle();
  }

  function collerBalle(): void {
    balle.x = raquette.x + raquette.l / 2 - balle.l / 2;
    balle.y = raquette.y - balle.h - 2;
  }

  function lancer(): void {
    if (phase !== 'attente') return;
    phase = 'jeu';
    // Un départ légèrement aléatoire, pour que deux parties ne se jouent pas
    // exactement de la même manière.
    const angle = (Math.random() - 0.5) * 0.6;
    vx = Math.sin(angle) * vitesse;
    vy = -Math.cos(angle) * vitesse;
  }

  function deplacerRaquette(delta: number): void {
    const direction = (versDroite ? 1 : 0) - (versGauche ? 1 : 0);
    if (direction === 0) return;
    raquette.x = borner(
      raquette.x + direction * RAQUETTE_VITESSE_CLAVIER * delta,
      0,
      largeur - raquette.l,
    );
  }

  /** Renvoi sur le côté le moins enfoncé : le rebond suit la face touchée. */
  function rebondir(cible: Rectangle): void {
    const enfoncementX = vx > 0 ? balle.x + balle.l - cible.x : cible.x + cible.l - balle.x;
    const enfoncementY = vy > 0 ? balle.y + balle.h - cible.y : cible.y + cible.h - balle.y;

    if (enfoncementX < enfoncementY) {
      vx = -vx;
      balle.x += vx > 0 ? enfoncementX : -enfoncementX;
    } else {
      vy = -vy;
      balle.y += vy > 0 ? enfoncementY : -enfoncementY;
    }
  }

  function casser(brique: Brique): void {
    brique.vivante = false;
    brique.element.classList.add(CLASSE_BRIQUE_CASSEE);

    vitesse = Math.min(BALLE_VITESSE_MAX, vitesse * BALLE_ACCELERATION);
    const norme = Math.hypot(vx, vy) || 1;
    vx = (vx / norme) * vitesse;
    vy = (vy / norme) * vitesse;

    majHud();
  }

  function avancerDUnPas(delta: number): void {
    balle.x += vx * delta;
    balle.y += vy * delta;

    if (balle.x <= 0) {
      balle.x = 0;
      vx = Math.abs(vx);
    } else if (balle.x + balle.l >= largeur) {
      balle.x = largeur - balle.l;
      vx = -Math.abs(vx);
    }

    if (balle.y <= 0) {
      balle.y = 0;
      vy = Math.abs(vy);
    }

    if (vy > 0 && chevauche(balle, raquette)) {
      // L'angle dépend du point d'impact : c'est ce qui fait qu'une raquette
      // se pilote au lieu de subir.
      balle.y = raquette.y - balle.h;
      const ecart = (balle.x + balle.l / 2 - (raquette.x + raquette.l / 2)) / (raquette.l / 2);
      const angle = borner(ecart, -1, 1) * RENVOI_ANGLE_MAX;
      vx = Math.sin(angle) * vitesse;
      vy = -Math.cos(angle) * vitesse;
      return;
    }

    for (const brique of briques) {
      if (!brique.vivante || !brique.jouable || !chevauche(balle, brique)) continue;
      casser(brique);
      rebondir(brique);
      break;
    }

    if (restantes() === 0) {
      terminer('gagne');
      return;
    }

    if (balle.y > hauteur) {
      vies -= 1;
      majHud();
      if (vies <= 0) terminer('perdu');
      else replacerBalle();
    }
  }

  function avancer(delta: number): void {
    const parcouru = Math.hypot(vx, vy) * delta;
    const sousPas = Math.max(1, Math.ceil(parcouru / PAS_MAX));
    for (let i = 0; i < sousPas && phase === 'jeu'; i += 1) {
      avancerDUnPas(delta / sousPas);
    }
  }

  function dessinerBloc(rectangle: Rectangle, remplissage: string, ombre: string): void {
    // L'ombre portée pleine, sans flou : la signature du thème brutaliste.
    contexte.fillStyle = ombre;
    contexte.fillRect(rectangle.x + 4, rectangle.y + 4, rectangle.l, rectangle.h);
    contexte.fillStyle = remplissage;
    contexte.fillRect(rectangle.x, rectangle.y, rectangle.l, rectangle.h);
  }

  function dessiner(): void {
    contexte.clearRect(0, 0, largeur, hauteur);
    dessinerBloc(raquette, encre, accent);
    if (phase === 'attente' || phase === 'jeu') dessinerBloc(balle, accent, encre);
  }

  function boucle(instant: number): void {
    const delta = Math.min((instant - horodatage) / 1000, DELTA_MAX);
    horodatage = instant;

    deplacerRaquette(delta);
    if (phase === 'attente') collerBalle();
    else if (phase === 'jeu') avancer(delta);

    dessiner();
    animation = requestAnimationFrame(boucle);
  }

  // ── Interface ────────────────────────────────────────────────────────

  function majHud(): void {
    const total = jouables();
    const debout = restantes();
    affichageVies.textContent = `Vies ${'■'.repeat(Math.max(vies, 0))}${'□'.repeat(Math.max(VIES_INITIALES - vies, 0))}`;
    affichageBriques.textContent = `Briques ${debout}/${total}`;
  }

  function terminer(issue: 'gagne' | 'perdu'): void {
    phase = issue;
    titrePanneau.textContent = issue === 'gagne' ? 'Terrain dégagé' : 'Perdu';
    textePanneau.textContent =
      issue === 'gagne'
        ? 'Toutes les compétences y sont passées. Rassurez-vous : elles repoussent.'
        : `Il restait ${restantes()} briques debout.`;
    panneau.hidden = false;
    boutonRejouer.focus();
  }

  function rejouer(): void {
    for (const brique of briques) {
      brique.vivante = true;
      brique.element.classList.remove(CLASSE_BRIQUE_CASSEE);
    }
    vies = VIES_INITIALES;
    panneau.hidden = true;
    couche.focus();
    replacerBalle();
    majHud();
  }

  function quitter(): void {
    cancelAnimationFrame(animation);
    window.removeEventListener('resize', redimensionner);
    window.removeEventListener('keydown', surTouche);
    window.removeEventListener('keyup', surRelachement);

    // Les briques repoussent : on ne laisse pas un CV amputé derrière soi.
    for (const brique of briques) {
      brique.element.classList.remove(CLASSE_BRIQUE, CLASSE_BRIQUE_CASSEE);
    }
    rendreLaPage();

    // `preventScroll` : rendre le focus au nom ne doit pas défaire la
    // position de lecture qu'on vient tout juste de restaurer.
    document.querySelector<HTMLElement>('.entete__nom')?.focus({ preventScroll: true });
  }

  function surTouche(evenement: KeyboardEvent): void {
    switch (evenement.key) {
      case 'ArrowLeft':
        versGauche = true;
        break;
      case 'ArrowRight':
        versDroite = true;
        break;
      case ' ':
        lancer();
        break;
      case 'Escape':
        quitter();
        return;
      default:
        return;
    }
    evenement.preventDefault();
  }

  function surRelachement(evenement: KeyboardEvent): void {
    if (evenement.key === 'ArrowLeft') versGauche = false;
    if (evenement.key === 'ArrowRight') versDroite = false;
  }

  couche.addEventListener('pointermove', (evenement) => {
    raquette.x = borner(evenement.clientX - raquette.l / 2, 0, largeur - raquette.l);
  });
  couche.addEventListener('pointerdown', () => lancer());
  boutonRejouer.addEventListener('click', rejouer);
  boutonQuitter.addEventListener('click', quitter);
  window.addEventListener('resize', redimensionner);
  window.addEventListener('keydown', surTouche);
  window.addEventListener('keyup', surRelachement);

  partieEnCours = true;
  redimensionner();

  // Sur une fenêtre trop courte, aucune étiquette ne tient dans la zone de
  // jeu : mieux vaut rendre la page que proposer une partie injouable.
  if (jouables() === 0) {
    quitter();
    return;
  }

  couche.focus();
  replacerBalle();
  majHud();
  horodatage = performance.now();
  animation = requestAnimationFrame(boucle);
}
