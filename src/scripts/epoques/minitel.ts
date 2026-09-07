/**
 * ═══════════════════════════════════════════════════════════════════════
 *  1985 — LE PROFIL SUR MINITEL.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Le même contenu que la page, rendu comme le Vidéotex le rendait : un
 * écran de 40 colonnes sur 24 lignes, des menus numérotés, une page à la
 * fois, et le texte qui arrive caractère par caractère.
 *
 * Les contraintes sont respectées parce qu'elles SONT le sujet :
 *
 * — 40×24. Tout est mis à la colonne, coupé, paginé. Une page qui déborde
 *   devient deux pages et une touche SUITE, comme à l'époque.
 * — 1200 bits par seconde, dix bits par caractère : cent vingt caractères
 *   par seconde. Une page pleine met huit secondes à s'afficher. Ce n'est
 *   pas un effet, c'est le débit du Minitel 1, et c'est le seul moyen de
 *   faire sentir ce que « lent » voulait dire.
 * — Pas de police téléchargée : la pile monospace du système suffit, comme
 *   pour le reste du site.
 *
 * Un écart assumé, et un seul : toucher une ligne de menu y va directement,
 * là où le vrai Minitel demandait de composer le numéro puis d'appuyer sur
 * ENVOI. On n'impose pas deux gestes à un doigt en 2026. Le clavier, lui,
 * suit encore l'usage d'origine.
 */
import { requis } from './dom';
import type { Profil } from './donnees';

const COLONNES = 40;
const LIGNES = 24;

/** 1200 bits/s, dix bits par caractère : le débit du Minitel 1. */
const CARACTERES_PAR_SECONDE = 120;

/** Interligne, en multiples de la taille du texte : serré, comme un tube. */
const INTERLIGNE = 1.1;

/** Temps de lecture de la page de connexion avant le sommaire. */
const PAUSE_CONNEXION = 900;

type Style = 'titre' | 'menu' | 'entete' | 'discret';

interface Ligne {
  readonly texte: string;
  readonly style?: Style;
  /** Rubrique atteinte en touchant la ligne, ou en composant son numéro. */
  readonly choix?: string;
  /** Le chiffre à composer au clavier pour cette ligne. */
  readonly numero?: string;
}

interface Rubrique {
  readonly titre: string;
  readonly pages: readonly (readonly Ligne[])[];
  /** Rubrique atteinte par RETOUR depuis la première page. */
  readonly parent: string;
}

// ── Mise en forme ──────────────────────────────────────────────────────

/**
 * Le Vidéotex de base ne connaissait pas les accents : ils demandaient une
 * séquence d'échappement que beaucoup de services ne prenaient pas la peine
 * d'émettre. Les titres et les menus s'en passent donc, comme à l'époque ;
 * le corps de texte, lui, les garde — la lisibilité passe avant la
 * reconstitution.
 */
function sansAccents(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/[’‘]/g, "'")
    .replace(/[—–]/g, '-');
}

function capitales(texte: string): string {
  return sansAccents(texte).toUpperCase();
}

/** Coupe un texte à la colonne, sans jamais casser un mot en deux. */
function couper(texte: string, largeur = COLONNES): string[] {
  const lignes: string[] = [];
  let courante = '';
  for (const mot of texte.split(/\s+/).filter(Boolean)) {
    if (courante && courante.length + 1 + mot.length > largeur) {
      lignes.push(courante);
      courante = '';
    }
    // Un mot plus long que l'écran doit être tronqué : il n'y a pas de
    // colonne 41 pour l'accueillir.
    courante = courante ? `${courante} ${mot}` : mot.slice(0, largeur);
  }
  if (courante) lignes.push(courante);
  return lignes;
}

function corps(texte: string): Ligne[] {
  return couper(texte).map((ligne) => ({ texte: ligne }));
}

function liste(elements: readonly string[], puce = '- '): Ligne[] {
  return elements.flatMap((element) =>
    couper(element, COLONNES - puce.length).map((ligne, rang) => ({
      texte: (rang === 0 ? puce : ' '.repeat(puce.length)) + ligne,
    })),
  );
}

/** Le menu à points de conduite, signature des sommaires Vidéotex. */
function entree(numero: string, libelle: string, choix: string): Ligne {
  const gauche = ` ${numero} `;
  const droite = capitales(libelle).slice(0, COLONNES - gauche.length - 2);
  const points = '.'.repeat(Math.max(1, COLONNES - gauche.length - droite.length - 1));
  return { texte: `${gauche}${points} ${droite}`, style: 'menu', choix, numero };
}

const VIDE: Ligne = { texte: '' };
const FILET: Ligne = { texte: '-'.repeat(COLONNES), style: 'discret' };

/** Découpe un corps de page en écrans de 24 lignes. */
function paginer(lignes: readonly Ligne[], entete: readonly Ligne[]): Ligne[][] {
  const disponibles = LIGNES - entete.length;
  const pages: Ligne[][] = [];
  for (let debut = 0; debut < lignes.length || pages.length === 0; debut += disponibles) {
    pages.push([...entete, ...lignes.slice(debut, debut + disponibles)]);
  }
  return pages;
}

// ── Le service ─────────────────────────────────────────────────────────

function construireService(profil: Profil): Map<string, Rubrique> {
  const service = new Map<string, Rubrique>();

  // La vidéo inverse d'un titre Vidéotex court d'un bord à l'autre : on
  // complète la ligne à quarante colonnes pour que la barre soit pleine.
  const barre = (texte: string): Ligne => ({
    texte: capitales(texte).slice(0, COLONNES).padEnd(COLONNES),
    style: 'titre',
  });

  const titre = (texte: string): Ligne[] => [barre(texte), VIDE];

  // — Connexion —
  service.set('connexion', {
    titre: 'APPEL',
    parent: 'connexion',
    pages: [
      [
        VIDE,
        VIDE,
        { texte: 'APPEL EN COURS...', style: 'discret' },
        VIDE,
        { texte: 'CONNEXION ETABLIE - 1200 BAUDS', style: 'discret' },
        VIDE,
        barre('3615 PUSSACQ'),
      ],
    ],
  });

  // — Sommaire —
  service.set('sommaire', {
    titre: 'SOMMAIRE',
    parent: 'sommaire',
    pages: [
      [
        barre(profil.nom),
        { texte: capitales(profil.titre).slice(0, COLONNES), style: 'entete' },
        { texte: capitales(profil.localisation), style: 'discret' },
        VIDE,
        entree('1', 'Parcours professionnel', 'parcours'),
        entree('2', 'Competences', 'competences'),
        entree('3', 'Ce que je defends', 'principes'),
        entree('4', 'Formation', 'formation'),
        entree('5', 'Me joindre', 'contact'),
        VIDE,
        FILET,
        ...corps(sansAccents(profil.accroche)),
      ],
    ],
  });

  // — Parcours : un sommaire, puis une rubrique par poste —
  service.set('parcours', {
    titre: 'PARCOURS',
    parent: 'sommaire',
    pages: [
      [
        ...titre('Parcours'),
        ...profil.parcours.map((poste, rang) =>
          entree(String(rang + 1), poste.organisation, `poste-${rang}`),
        ),
      ],
    ],
  });

  profil.parcours.forEach((poste, rang) => {
    service.set(`poste-${rang}`, {
      titre: capitales(poste.organisation),
      parent: 'parcours',
      pages: paginer(
        [
          { texte: capitales(poste.periode).slice(0, COLONNES), style: 'discret' },
          ...corps(capitales(poste.titre)),
          VIDE,
          ...corps(sansAccents(poste.contexte)),
          VIDE,
          { texte: 'FAITS', style: 'entete' },
          ...liste(poste.faits.map(sansAccents)),
          VIDE,
          { texte: 'TECHNIQUE', style: 'entete' },
          ...corps(capitales(poste.stack.join(' - '))),
        ],
        titre(poste.organisation),
      ),
    });
  });

  // — Compétences —
  service.set('competences', {
    titre: 'COMPETENCES',
    parent: 'sommaire',
    pages: paginer(
      profil.competences.flatMap((groupe) => [
        { texte: capitales(groupe.intitule).slice(0, COLONNES), style: 'entete' as const },
        ...corps(capitales(groupe.elements.join(' - '))),
        VIDE,
      ]),
      titre('Competences'),
    ),
  });

  // — Principes : un sommaire, puis une rubrique par principe —
  service.set('principes', {
    titre: 'CE QUE JE DEFENDS',
    parent: 'sommaire',
    pages: [
      [
        ...titre('Ce que je defends'),
        ...profil.principes.map((principe, rang) =>
          entree(String(rang + 1), principe.titre, `principe-${rang}`),
        ),
      ],
    ],
  });

  profil.principes.forEach((principe, rang) => {
    service.set(`principe-${rang}`, {
      titre: capitales(principe.titre),
      parent: 'principes',
      pages: paginer(corps(sansAccents(principe.explication)), titre(principe.titre)),
    });
  });

  // — Formation —
  service.set('formation', {
    titre: 'FORMATION',
    parent: 'sommaire',
    pages: paginer(
      [
        ...profil.formation.flatMap((diplome) => [
          { texte: capitales(diplome.intitule).slice(0, COLONNES), style: 'entete' as const },
          ...corps(sansAccents(`${diplome.etablissement} · ${diplome.annees}`)),
          VIDE,
        ]),
        ...profil.complements.flatMap((groupe) => [
          { texte: capitales(groupe.intitule), style: 'entete' as const },
          ...liste(groupe.elements.map(sansAccents)),
          VIDE,
        ]),
      ],
      titre('Formation'),
    ),
  });

  // — Contact —
  service.set('contact', {
    titre: 'ME JOINDRE',
    parent: 'sommaire',
    pages: [
      [
        ...titre('Me joindre'),
        ...profil.liens.flatMap((lien) => [
          { texte: capitales(lien.libelle), style: 'entete' as const },
          ...corps(sansAccents(lien.url.replace(/^https?:\/\//, ''))),
          VIDE,
        ]),
        FILET,
        ...corps('En 1985 il aurait fallu ecrire, et attendre. C’est encore le meilleur moyen.'),
      ],
    ],
  });

  return service;
}

// ── L'écran ────────────────────────────────────────────────────────────

const TOUCHES = [
  { cle: 'sommaire', libelle: 'Sommaire' },
  { cle: 'retour', libelle: 'Retour' },
  { cle: 'suite', libelle: 'Suite' },
] as const;

export interface Minitel {
  readonly racine: HTMLElement;
  /** À rappeler quand le conteneur change de taille. */
  ajuster(): void;
  detruire(): void;
}

export function creerMinitel(profil: Profil): Minitel {
  const service = construireService(profil);

  const racine = document.createElement('div');
  racine.className = 'minitel';
  racine.innerHTML = `
    <div class="minitel__cadre">
      <div class="minitel__ecran">
        <div class="minitel__zone">
          <div class="minitel__tube">
            <p class="minitel__etat">
              <span class="minitel__service">3615 PUSSACQ</span>
              <span class="minitel__page"></span>
            </p>
            <div class="minitel__lignes"></div>
          </div>
          <span class="minitel__sonde" aria-hidden="true"></span>
        </div>
      </div>
    </div>
    <div class="minitel__clavier">
      ${TOUCHES.map(
        ({ cle, libelle }) =>
          `<button type="button" class="minitel__touche" data-touche="${cle}">${libelle}</button>`,
      ).join('')}
    </div>
  `;

  const ecran = requis<HTMLElement>(racine, '.minitel__ecran');
  const aire = requis<HTMLElement>(racine, '.minitel__zone');
  const tube = requis<HTMLElement>(racine, '.minitel__tube');
  const etat = requis<HTMLElement>(racine, '.minitel__etat');
  const zone = requis<HTMLElement>(racine, '.minitel__lignes');
  const sonde = requis<HTMLElement>(racine, '.minitel__sonde');
  const numeroPage = requis<HTMLElement>(racine, '.minitel__page');

  let rubriqueCourante = 'connexion';
  let page = 0;
  let lignes: readonly Ligne[] = [];
  let revele = 0;
  let total = 0;
  let animation = 0;
  let horodatage = 0;
  let minuterie = 0;
  let composition = '';

  /** Les éléments de ligne sont recyclés : 24 nœuds, jamais plus. */
  const elements: HTMLParagraphElement[] = Array.from({ length: LIGNES }, () => {
    const element = document.createElement('p');
    element.className = 'minitel__ligne';
    zone.append(element);
    return element;
  });

  function dessiner(): void {
    let restant = revele;
    const emission = revele < total;
    for (const [rang, element] of elements.entries()) {
      const ligne = lignes[rang];
      const texte = ligne?.texte ?? '';
      const montre = Math.max(0, Math.min(texte.length, restant));
      // Le pavé clignotant se pose là où la ligne s'arrête d'arriver : sur
      // la seule ligne encore incomplète.
      const enCours = emission && restant >= 0 && montre < texte.length;
      restant -= texte.length;

      element.textContent = texte.slice(0, montre) + (enCours ? '\u2588' : '');
      element.className = `minitel__ligne${ligne?.style ? ` minitel__ligne--${ligne.style}` : ''}`;
      element.classList.toggle('minitel__ligne--choix', Boolean(ligne?.choix));
      if (ligne?.choix) element.dataset.choix = ligne.choix;
      else delete element.dataset.choix;
    }
  }

  function boucle(instant: number): void {
    const delta = Math.min((instant - horodatage) / 1000, 0.25);
    horodatage = instant;
    revele = Math.min(total, revele + delta * CARACTERES_PAR_SECONDE);
    dessiner();

    if (revele < total) {
      animation = requestAnimationFrame(boucle);
      return;
    }
    animation = 0;
    ecran.classList.remove('minitel__ecran--emission');
    if (rubriqueCourante === 'connexion') {
      minuterie = window.setTimeout(() => aller('sommaire'), PAUSE_CONNEXION);
    }
  }

  function aller(cle: string, numero = 0): void {
    const rubrique = service.get(cle);
    if (!rubrique) return;

    window.clearTimeout(minuterie);
    cancelAnimationFrame(animation);

    rubriqueCourante = cle;
    page = Math.max(0, Math.min(numero, rubrique.pages.length - 1));
    lignes = rubrique.pages[page] ?? [];
    total = lignes.reduce((somme, ligne) => somme + ligne.texte.length, 0);
    revele = 0;
    composition = '';

    numeroPage.textContent =
      rubrique.pages.length > 1
        ? `${rubrique.titre} ${page + 1}/${rubrique.pages.length}`
        : rubrique.titre;

    for (const touche of racine.querySelectorAll<HTMLButtonElement>('[data-touche]')) {
      const cleTouche = touche.dataset.touche;
      touche.disabled =
        cle === 'connexion' ||
        (cleTouche === 'suite' && page >= rubrique.pages.length - 1) ||
        (cleTouche === 'sommaire' && cle === 'sommaire');
    }

    ecran.classList.add('minitel__ecran--emission');
    dessiner();
    horodatage = performance.now();
    animation = requestAnimationFrame(boucle);
  }

  /** Affiche d'un coup ce qui reste à émettre. */
  function terminerEmission(): boolean {
    if (revele >= total) return false;
    revele = total;
    dessiner();
    return true;
  }

  function actionner(touche: string): void {
    const rubrique = service.get(rubriqueCourante);
    if (!rubrique) return;
    if (touche === 'sommaire') aller('sommaire');
    else if (touche === 'suite') aller(rubriqueCourante, page + 1);
    else if (page > 0) aller(rubriqueCourante, page - 1);
    else aller(rubrique.parent);
  }

  ecran.addEventListener('pointerdown', (evenement) => {
    // Tant que la page arrive, toucher l'écran l'affiche d'un coup : huit
    // secondes d'attente était une contrainte de 1985, pas une punition.
    if (terminerEmission()) return;

    const cible = (evenement.target as HTMLElement).closest<HTMLElement>('[data-choix]');
    if (cible?.dataset.choix) aller(cible.dataset.choix);
  });

  for (const touche of racine.querySelectorAll<HTMLButtonElement>('[data-touche]')) {
    touche.addEventListener('click', () => actionner(touche.dataset.touche ?? ''));
  }

  function surTouche(evenement: KeyboardEvent): void {
    if (evenement.key >= '0' && evenement.key <= '9') {
      composition += evenement.key;
      const trouvee = lignes.find((ligne) => ligne.numero === composition);
      // Le vrai Minitel attendait ENVOI ; comme les menus n'ont jamais plus
      // de neuf entrées, le numéro suffit à lever l'ambiguïté.
      if (trouvee?.choix) aller(trouvee.choix);
      return;
    }
    if (evenement.key === 'Enter' || evenement.key === ' ') terminerEmission();
    if (evenement.key === 'Backspace') actionner('retour');
  }

  window.addEventListener('keydown', surTouche);

  /**
   * Quarante colonnes, vingt-quatre lignes, et rien d'autre à respecter.
   *
   * Un Minitel affichait sa grille dans un tube au format 4/3, dont la
   * cellule faisait huit pixels sur dix. Reproduire ce format sur un
   * téléphone tenu debout donnerait un bloc écrasé, minuscule, entouré de
   * noir : la reconstitution y gagnerait, la lecture y perdrait tout. On
   * garde donc la grille — c'est elle, la signature — et on laisse le
   * format au tube d'origine.
   *
   * La taille se cale sur la contrainte la plus serrée des deux, largeur ou
   * hauteur, et le bloc se centre dans ce qui reste. La chasse est mesurée
   * sur une sonde plutôt que supposée : elle n'est pas la même sous macOS,
   * Windows et Android, et c'est d'elle que dépend la quarantième colonne.
   */
  function ajuster(): void {
    const dispoL = aire.clientWidth;
    // La ligne d'état appartient à la même grille : elle prend sa part de
    // la hauteur, et elle prendra la largeur exacte du bloc.
    const dispoH = aire.clientHeight - etat.offsetHeight;
    if (dispoL === 0 || dispoH <= 0) return;

    sonde.style.fontSize = '100px';
    sonde.textContent = 'M'.repeat(COLONNES);
    const chasse = sonde.getBoundingClientRect().width / (100 * COLONNES);
    sonde.textContent = '';
    if (chasse === 0) return;

    const taille = Math.min(dispoL / (COLONNES * chasse), dispoH / (LIGNES * INTERLIGNE));
    zone.style.fontSize = `${taille}px`;
    zone.style.lineHeight = `${taille * INTERLIGNE}px`;
    const largeurGrille = COLONNES * chasse * taille;
    zone.style.width = `${largeurGrille}px`;
    zone.style.height = `${LIGNES * INTERLIGNE * taille}px`;
    tube.style.width = `${largeurGrille}px`;
  }

  function detruire(): void {
    cancelAnimationFrame(animation);
    window.clearTimeout(minuterie);
    window.removeEventListener('keydown', surTouche);
    racine.remove();
  }

  aller('connexion');

  return { racine, ajuster, detruire };
}
