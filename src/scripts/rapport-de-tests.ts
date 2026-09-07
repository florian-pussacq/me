/**
 * ═══════════════════════════════════════════════════════════════════════
 *  RAPPORT DE TESTS — la page qui passe ses propres tests.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * On tape « tdd » sur la page, un bandeau s'ouvre en bas, et une suite de
 * tests s'exécute sous les yeux du visiteur.
 *
 * Le seul intérêt de la chose tient dans un mot : les tests sont vrais. Ils
 * lisent le DOM affiché, calculent réellement les rapports de contraste à
 * partir des couleurs appliquées, interrogent réellement l'API Performance
 * sur les ressources téléchargées. Rien n'est écrit d'avance, aucun verdict
 * n'est en dur. Faites échouer la page — cassez l'ordre du parcours,
 * ajoutez une police distante — et le rapport devient rouge.
 *
 * D'où la structure : un test est une fonction qui renvoie un constat, pas
 * un texte à afficher. Le rendu, lui, ne décide de rien.
 *
 * Deux détails assumés :
 *
 * — Chaque test désigne les éléments qu'il inspecte, et le rapport les
 *   souligne dans la page pendant qu'il tourne. C'est la seule preuve
 *   honnête qu'on lit bien la page, et pas une liste écrite à l'avance.
 * — Le dernier test échoue, toujours. C'est le prix de ce rapport, et il
 *   est affiché plutôt que caché.
 *
 * Ce module — et sa feuille de style — ne sont chargés qu'au déclenchement.
 */
import '../styles/rapport-de-tests.css';

const ATTRIBUT_RAPPORT = 'data-rapport-de-tests';
const CLASSE_INSPECTE = 'tests-inspecte';

/** Seuil WCAG 2.1 AA pour le texte courant (critère 1.4.3). */
const SEUIL_AA = 4.5;

/** Limite au-delà de laquelle les moteurs tronquent la méta-description. */
const LIMITE_DESCRIPTION = 160;

/**
 * Budget du JavaScript chargé sans qu'on l'ait demandé.
 *
 * Les deux compteurs — celui des clics sur le nom, celui des touches —
 * pèsent moins d'un kilo-octet chacun une fois compressés. Le budget laisse
 * de la marge, mais pas la place d'y glisser une bibliothèque.
 */
const BUDGET_CRITIQUE = 8 * 1024;

/** Durée de mise en évidence d'un élément inspecté. */
const TEMPS_INSPECTION = 420;

/** Respiration entre deux tests : un rapport instantané ne se lit pas. */
const TEMPS_ENTRE_TESTS = 90;

interface Constat {
  reussi: boolean;
  attendu: string;
  recu: string;
  /** Précision affichée sous un échec, ou en marge d'une réussite. */
  note?: string;
  /** Les éléments réellement lus, soulignés dans la page pendant le test. */
  cibles?: readonly Element[];
  /** Proposée sous un échec, quand il y a quelque chose à en faire. */
  correction?: { libelle: string; appliquer(): Promise<void> };
}

interface Test {
  nom: string;
  executer(): Constat;
}

interface Suite {
  fichier: string;
  tests: readonly Test[];
}

/** Un seul rapport à la fois. */
let rapportOuvert = false;

// ── Petits outils ──────────────────────────────────────────────────────

/**
 * Le rapport ne s'inspecte pas lui-même.
 *
 * Son bandeau est un `<section>` comme les autres, et sans cette exclusion
 * il ferait échouer le test qui vérifie que chaque section est reliée à son
 * titre. Un harnais qui se compte dans ses propres mesures ne mesure plus
 * la page : il se mesure lui-même.
 */
const HORS_INSPECTION = '.tests, .jeu';

function tous<T extends Element>(selecteur: string): T[] {
  return Array.from(document.querySelectorAll<T>(selecteur)).filter(
    (element) => !element.closest(HORS_INSPECTION),
  );
}

function premier<T extends Element>(selecteur: string): T | undefined {
  return tous<T>(selecteur)[0];
}

function constater(
  reussi: boolean,
  attendu: string,
  recu: string,
  extra: Omit<Constat, 'reussi' | 'attendu' | 'recu'> = {},
): Constat {
  return { reussi, attendu, recu, ...extra };
}

function nombre(valeur: number, decimales = 0): string {
  return valeur.toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

function ressources(): PerformanceResourceTiming[] {
  return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
}

/** Les modules JavaScript effectivement téléchargés par le navigateur. */
function modulesCharges(): PerformanceResourceTiming[] {
  return ressources().filter((entree) => {
    try {
      return new URL(entree.name).pathname.endsWith('.js');
    } catch {
      return false;
    }
  });
}

function estInterne(url: string): boolean {
  try {
    return new URL(url, location.href).origin === location.origin;
  } catch {
    return false;
  }
}

// ── Contraste ──────────────────────────────────────────────────────────
//
// Le même calcul que `outils/verifier-contrastes.mjs`, mais appliqué aux
// couleurs RÉELLEMENT calculées par le navigateur plutôt qu'aux jetons du
// thème : héritage, cascade et surcharges compris.

type Couleur = readonly [number, number, number];

function lireCouleur(valeur: string): Couleur | null {
  const nombres = valeur.match(/[\d.]+/g);
  if (!nombres || nombres.length < 3) return null;
  const [r, g, b, alpha] = nombres.map(Number);
  if (r === undefined || g === undefined || b === undefined) return null;
  // Une couleur translucide se mélangerait à son fond : hors sujet ici, on
  // préfère ne rien mesurer plutôt que mesurer faux.
  if (alpha !== undefined && alpha < 1) return null;
  return [r, g, b];
}

function canal(composante: number): number {
  const proportion = composante / 255;
  return proportion <= 0.04045 ? proportion / 12.92 : ((proportion + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Couleur): number {
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function rapportDeContraste(premier: Couleur, second: Couleur): number {
  const a = luminance(premier);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Le premier fond opaque en remontant les ancêtres. */
function fondEffectif(element: Element): Couleur {
  let courant: Element | null = element;
  while (courant) {
    const couleur = lireCouleur(getComputedStyle(courant).backgroundColor);
    if (couleur) return couleur;
    courant = courant.parentElement;
  }
  return [255, 255, 255];
}

interface Mesure {
  element: Element;
  intitule: string;
  ratio: number;
}

function mesurerContrastes(): Mesure[] {
  const echantillons: readonly [string, string][] = [
    ['.poste__contexte', 'texte courant'],
    ['.poste__faits li', 'texte secondaire'],
    ['.entete__titre', 'titre professionnel'],
    ['.etiquettes li', 'étiquettes'],
    ['.diplome__annees', 'années de formation'],
  ];

  const mesures: Mesure[] = [];
  for (const [selecteur, intitule] of echantillons) {
    const element = premier(selecteur);
    if (!element) continue;
    const texte = lireCouleur(getComputedStyle(element).color);
    if (!texte) continue;
    mesures.push({ element, intitule, ratio: rapportDeContraste(texte, fondEffectif(element)) });
  }
  return mesures;
}

// ── Les suites ─────────────────────────────────────────────────────────

const CONTENU: Suite = {
  fichier: 'contenu.spec',
  tests: [
    {
      nom: 'parcours.estAntichronologique()',
      executer() {
        const reperes = tous<HTMLTimeElement>('.poste__periode time');
        const dates = reperes.map((repere) => repere.dateTime);
        const desordre = dates.findIndex((date, rang) => {
          const precedente = dates[rang - 1];
          return precedente !== undefined && precedente <= date;
        });
        return constater(
          desordre === -1,
          'du plus récent au plus ancien',
          desordre === -1
            ? `${dates.length} postes, de ${dates.at(-1)} à ${dates[0]}`
            : `rupture au poste ${desordre + 1} (${dates[desordre]})`,
          { cibles: reperes },
        );
      },
    },
    {
      nom: 'parcours.decritChaquePoste()',
      executer() {
        const postes = tous('.poste');
        const muets = postes.filter(
          (poste) =>
            !poste.querySelector('.poste__contexte')?.textContent?.trim() ||
            poste.querySelectorAll('.poste__faits li').length === 0,
        );
        return constater(
          muets.length === 0,
          'un contexte et au moins un fait par poste',
          muets.length === 0
            ? `${postes.length} postes documentés`
            : `${muets.length} sans contenu`,
          { cibles: muets.length === 0 ? postes : muets },
        );
      },
    },
    {
      nom: 'metaDescription.tientDansLaLimiteDesMoteurs()',
      executer() {
        const balise = premier<HTMLMetaElement>('meta[name="description"]');
        const longueur = balise?.content.length ?? 0;
        return constater(
          longueur > 0 && longueur <= LIMITE_DESCRIPTION,
          `≤ ${LIMITE_DESCRIPTION} caractères`,
          `${longueur} caractères`,
        );
      },
    },
    {
      nom: 'profil.neDivulgueAucuneCoordonnee()',
      executer() {
        // Une page publique est aspirée par les robots : le contact passe
        // par les réseaux. Ce test garde la promesse écrite dans `profil.ts`.
        const texte = document.body.innerText;
        const courriel = texte.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
        const telephone = texte.match(/\b0[1-9](?:[ .-]?\d{2}){4}\b/);
        const trouve = courriel?.[0] ?? telephone?.[0];
        return constater(
          trouve === undefined,
          'ni adresse e-mail ni numéro de téléphone',
          trouve === undefined ? 'aucune coordonnée en clair' : `trouvé : ${trouve}`,
        );
      },
    },
  ],
};

const ACCESSIBILITE: Suite = {
  fichier: 'accessibilite.spec',
  tests: [
    {
      nom: 'titres.neSautentAucunNiveau()',
      executer() {
        const titres = tous<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6');
        const niveaux = titres.map((titre) => Number(titre.tagName[1]));
        const premiers = niveaux.filter((niveau) => niveau === 1).length;
        const saut = niveaux.findIndex((niveau, rang) => {
          const precedent = niveaux[rang - 1];
          return precedent !== undefined && niveau > precedent + 1;
        });
        const reussi = premiers === 1 && saut === -1;
        return constater(
          reussi,
          'un seul h1, aucun niveau sauté',
          reussi
            ? `${titres.length} titres, profondeur ${Math.max(...niveaux)}`
            : premiers !== 1
              ? `${premiers} h1`
              : `h${niveaux[saut]} après h${niveaux[saut - 1]}`,
          { cibles: titres },
        );
      },
    },
    {
      nom: 'sections.sontRelieesAUnTitre()',
      executer() {
        const sections = tous<HTMLElement>('section');
        const orphelines = sections.filter((section) => {
          const idTitre = section.getAttribute('aria-labelledby');
          const titre = idTitre ? document.getElementById(idTitre) : null;
          return !titre?.textContent?.trim();
        });
        return constater(
          orphelines.length === 0,
          'chaque section pointe vers son titre',
          orphelines.length === 0
            ? `${sections.length} sections étiquetées`
            : `${orphelines.length} sans aria-labelledby valide`,
          { cibles: orphelines.length === 0 ? sections : orphelines },
        );
      },
    },
    {
      nom: 'icones.sontMasqueesAuxLecteursDEcran()',
      executer() {
        const icones = tous<SVGElement>('svg');
        const bavardes = icones.filter((icone) => icone.getAttribute('aria-hidden') !== 'true');
        return constater(
          bavardes.length === 0,
          'toute icône décorative est masquée',
          bavardes.length === 0
            ? `${icones.length} icônes en aria-hidden`
            : `${bavardes.length} icônes annoncées deux fois`,
          { cibles: bavardes.length === 0 ? icones : bavardes },
        );
      },
    },
    {
      nom: 'liens.annoncentTousLeurDestination()',
      executer() {
        const liens = tous<HTMLAnchorElement>('a[href]');
        const muets = liens.filter(
          (lien) => !(lien.getAttribute('aria-label') ?? lien.textContent ?? '').trim(),
        );
        return constater(
          muets.length === 0,
          'aucun lien sans intitulé',
          muets.length === 0 ? `${liens.length} liens nommés` : `${muets.length} liens muets`,
          { cibles: muets.length === 0 ? liens : muets },
        );
      },
    },
    {
      nom: 'contrastes.atteignentLeSeuilAA()',
      executer() {
        const mesures = mesurerContrastes();
        const pire = mesures.reduce(
          (minimum, mesure) => (minimum && minimum.ratio <= mesure.ratio ? minimum : mesure),
          mesures[0],
        );
        const reussi = mesures.length > 0 && (pire?.ratio ?? 0) >= SEUIL_AA;
        return constater(
          reussi,
          `≥ ${nombre(SEUIL_AA, 1)}:1 sur ${mesures.length} paires mesurées`,
          pire ? `${nombre(pire.ratio, 2)}:1 au plus faible — ${pire.intitule}` : 'rien à mesurer',
          {
            note: 'Calculé sur les couleurs appliquées par le navigateur, pas sur les jetons du thème.',
            cibles: mesures.map((mesure) => mesure.element),
          },
        );
      },
    },
  ],
};

const SOBRIETE: Suite = {
  fichier: 'sobriete.spec',
  tests: [
    {
      nom: 'page.neChargeAucuneRessourceTierce()',
      executer() {
        const tierces = ressources().filter((entree) => !estInterne(entree.name));
        const domaines = [...new Set(tierces.map((entree) => new URL(entree.name).host))];
        return constater(
          tierces.length === 0,
          'aucun domaine hors du site',
          tierces.length === 0
            ? `${ressources().length} ressources, toutes locales`
            : domaines.join(', '),
        );
      },
    },
    {
      nom: 'polices.sontAutoHebergees()',
      executer() {
        const sources: string[] = [];
        for (const feuille of Array.from(document.styleSheets)) {
          let regles: CSSRuleList;
          try {
            regles = feuille.cssRules;
          } catch {
            // Feuille d'une autre origine : illisible, donc déjà tierce.
            continue;
          }
          for (const regle of Array.from(regles)) {
            if (!(regle instanceof CSSFontFaceRule)) continue;
            for (const url of regle.style
              .getPropertyValue('src')
              .matchAll(/url\(["']?([^"')]+)/g)) {
              if (url[1]) sources.push(url[1]);
            }
          }
        }
        const distantes = sources.filter((source) => !estInterne(source));
        return constater(
          sources.length > 0 && distantes.length === 0,
          'toutes les @font-face servies par ce site',
          distantes.length > 0
            ? `${distantes.length} distantes`
            : `${sources.length} fichiers de police locaux`,
          { note: 'Aucune requête vers Google Fonts, donc aucune adresse IP transmise.' },
        );
      },
    },
    {
      nom: 'navigateur.neConserveRienDeVous()',
      executer() {
        const lire = (stockage: Storage): string[] => {
          try {
            // Les clés `astro:` viennent de la barre d'outils du serveur de
            // développement, absente du site publié.
            return Object.keys(stockage).filter((cle) => !cle.startsWith('astro:'));
          } catch {
            return [];
          }
        };
        const traces = [
          ...document.cookie.split(';').filter((morceau) => morceau.trim()),
          ...lire(localStorage),
          ...lire(sessionStorage),
        ];
        return constater(
          traces.length === 0,
          'ni cookie, ni stockage local',
          traces.length === 0 ? 'rien d’écrit sur votre machine' : `${traces.length} entrées`,
        );
      },
    },
  ],
};

const HONNETETE: Suite = {
  fichier: 'honnetete.spec',
  tests: [
    {
      nom: 'javascriptCritique.resteSousSonBudget()',
      executer() {
        // « Sans demande » se mesure au moment du téléchargement, pas au
        // nombre de balises `<script>` : les modules qu'elles importent
        // pèsent tout autant, et arrivent eux aussi avant la fin du
        // chargement. Ce qui vient après — les deux œufs de Pâques — a été
        // demandé par quelqu'un, et ne compte pas dans ce budget.
        const navigation = performance.getEntriesByType('navigation')[0] as
          PerformanceNavigationTiming | undefined;
        const finDuChargement = navigation?.loadEventEnd || Number.POSITIVE_INFINITY;
        const critiques = modulesCharges().filter((entree) => entree.startTime <= finDuChargement);
        const poids = critiques.reduce((total, entree) => total + entree.encodedBodySize, 0);
        return constater(
          poids <= BUDGET_CRITIQUE,
          `≤ ${nombre(BUDGET_CRITIQUE / 1024)} ko chargés sans demande`,
          `${nombre(poids)} octets pour ${critiques.length} modules`,
          {
            note: 'Deux compteurs de gestes et l’aide de préchargement de Vite. Tout le reste attend qu’on le demande.',
          },
        );
      },
    },
    {
      nom: 'page.neChargeAucunJavaScript()',
      executer() {
        return constater(false, '0 module', `${modulesCharges().length} modules`, {
          note: 'Ce test échouera toujours : vous venez d’en charger un pour lire ce rapport. « Zéro JavaScript » et « presque zéro », ce n’est pas la même promesse — la page affiche celle qu’elle tient. Il n’existe pas de correctif à ce test. Il existe autre chose.',
          // Le seul test rouge de la page ouvre sur le second œuf de Pâques :
          // le module du jeu est déjà un morceau séparé, il n'arrive que là.
          correction: {
            libelle: 'Corriger',
            async appliquer() {
              const { demarrerCasseBriques } = await import('./casse-briques');
              demarrerCasseBriques();
            },
          },
        });
      },
    },
  ],
};

const SUITES: readonly Suite[] = [CONTENU, ACCESSIBILITE, SOBRIETE, HONNETETE];

// ── Rendu ──────────────────────────────────────────────────────────────

interface Panneau {
  racine: HTMLElement;
  liste: HTMLOListElement;
  bilan: HTMLParagraphElement;
  fermeture: HTMLButtonElement;
}

function element<B extends keyof HTMLElementTagNameMap>(
  balise: B,
  classe: string,
  texte?: string,
): HTMLElementTagNameMap[B] {
  const cree = document.createElement(balise);
  cree.className = classe;
  if (texte !== undefined) cree.textContent = texte;
  return cree;
}

/**
 * Le bandeau est construit élément par élément plutôt que par `innerHTML` :
 * on en ressort avec des références typées, sans avoir à réinterroger le
 * DOM pour retrouver ce qu'on vient d'y écrire.
 */
function construirePanneau(): Panneau {
  const racine = element('section', 'tests');
  racine.tabIndex = -1;
  racine.setAttribute('role', 'region');
  racine.setAttribute('aria-label', 'Rapport de tests de cette page');

  const commande = element('p', 'tests__commande', 'npm run test ');
  commande.append(element('span', 'tests__portee', '— cette page, maintenant'));

  const fermeture = element('button', 'tests__fermer', 'Fermer (Échap)');
  fermeture.type = 'button';

  const entete = element('div', 'tests__entete');
  entete.append(commande, fermeture);

  const liste = element('ol', 'tests__liste');

  const bilan = element('p', 'tests__bilan');
  bilan.setAttribute('aria-live', 'polite');

  racine.append(entete, liste, bilan);
  return { racine, liste, bilan, fermeture };
}

function attendre(millisecondes: number): Promise<void> {
  return new Promise((resoudre) => window.setTimeout(resoudre, millisecondes));
}

export function ouvrirRapport(): void {
  if (rapportOuvert) return;
  rapportOuvert = true;

  const { racine: panneau, liste, bilan, fermeture } = construirePanneau();
  document.body.append(panneau);
  document.documentElement.setAttribute(ATTRIBUT_RAPPORT, '');

  let interrompu = false;

  function fermer(): void {
    interrompu = true;
    for (const element of tous(`.${CLASSE_INSPECTE}`)) element.classList.remove(CLASSE_INSPECTE);
    panneau.remove();
    document.documentElement.removeAttribute(ATTRIBUT_RAPPORT);
    window.removeEventListener('keydown', surTouche);
    rapportOuvert = false;
  }

  function surTouche(evenement: KeyboardEvent): void {
    if (evenement.key === 'Escape') fermer();
  }

  fermeture.addEventListener('click', fermer);
  window.addEventListener('keydown', surTouche);

  /** Souligne dans la page ce que le test est en train de lire. */
  async function inspecter(cibles: readonly Element[]): Promise<void> {
    if (cibles.length === 0) return;
    for (const cible of cibles) cible.classList.add(CLASSE_INSPECTE);

    // Le lien d'évitement, premier lien du document, vit hors de l'écran :
    // on défile vers la première cible qu'on peut réellement montrer.
    const montrable = cibles.find((cible) => {
      const zone = cible.getBoundingClientRect();
      return zone.width > 0 && zone.height > 0 && zone.top + window.scrollY >= 0;
    });
    if (montrable) {
      // Le défilement vise le milieu de la BANDE VISIBLE, pas celui de la
      // fenêtre : `scrollIntoView({ block: 'center' })` ignore le bandeau et
      // déposerait la moitié des cibles derrière lui.
      //
      // Et il est instantané : le défilement doux de `base.css` dure plus
      // longtemps que le surlignage, l'élément arriverait à l'écran une fois
      // éteint.
      const zone = montrable.getBoundingClientRect();
      const bande = window.innerHeight - panneau.getBoundingClientRect().height;
      if (zone.top < 8 || zone.bottom > bande - 8) {
        const decalage = window.scrollY + zone.top + zone.height / 2 - bande / 2;
        window.scrollTo({ top: Math.max(0, decalage), behavior: 'instant' });
      }
    }

    await attendre(TEMPS_INSPECTION);
    for (const cible of cibles) cible.classList.remove(CLASSE_INSPECTE);
  }

  function ligneDeFichier(fichier: string): void {
    liste.append(element('li', 'tests__fichier', fichier));
    liste.scrollTop = liste.scrollHeight;
  }

  interface LigneDeTest {
    racine: HTMLLIElement;
    marque: HTMLSpanElement;
    temps: HTMLSpanElement;
  }

  /**
   * La ligne est d'abord posée en attente, puis complétée par son verdict.
   *
   * Ses trois cellules existent dès le départ : une ligne écrite en texte
   * brut puis reconstruite tomberait toute entière dans la première colonne
   * de la grille, le temps d'un test.
   */
  function ligneDeTest(nom: string): LigneDeTest {
    const racine = element('li', 'tests__ligne tests__ligne--attente');
    const marque = element('span', 'tests__marque', '·');
    const temps = element('span', 'tests__temps');
    racine.append(marque, element('span', 'tests__nom', nom), temps);
    liste.append(racine);
    liste.scrollTop = liste.scrollHeight;
    return { racine, marque, temps };
  }

  function completer(ligne: LigneDeTest, constat: Constat, duree: number): void {
    const { racine, marque, temps } = ligne;
    racine.className = `tests__ligne ${constat.reussi ? 'tests__ligne--ok' : 'tests__ligne--ko'}`;
    marque.textContent = constat.reussi ? '✓' : '✗';
    temps.textContent = `${nombre(duree, 2)} ms`;

    // Une réussite se résume à son constat ; un échec doit montrer l'écart.
    racine.append(
      element(
        'p',
        'tests__detail',
        constat.reussi ? constat.recu : `attendu : ${constat.attendu} · reçu : ${constat.recu}`,
      ),
    );

    if (constat.note) racine.append(element('p', 'tests__note', constat.note));

    if (constat.correction) {
      const { libelle, appliquer } = constat.correction;
      const bouton = element('button', 'tests__correctif', libelle);
      bouton.type = 'button';
      bouton.addEventListener('click', () => {
        bouton.disabled = true;
        // Le rapport se retire d'abord : le correctif reprend la page pour
        // lui seul, et n'a pas à composer avec un bandeau resté ouvert.
        fermer();
        void appliquer();
      });
      racine.append(bouton);
    }

    liste.scrollTop = liste.scrollHeight;
  }

  async function executerTout(): Promise<void> {
    let reussis = 0;
    let echoues = 0;
    const debutTotal = performance.now();

    for (const suite of SUITES) {
      if (interrompu) return;
      ligneDeFichier(suite.fichier);

      for (const test of suite.tests) {
        if (interrompu) return;
        const enCours = ligneDeTest(test.nom);

        const debut = performance.now();
        let constat: Constat;
        try {
          constat = test.executer();
        } catch (erreur) {
          constat = constater(false, 'un test qui s’exécute', String(erreur));
        }
        const duree = performance.now() - debut;

        await inspecter(constat.cibles ?? []);
        if (interrompu) return;

        completer(enCours, constat, duree);
        if (constat.reussi) reussis += 1;
        else echoues += 1;

        await attendre(TEMPS_ENTRE_TESTS);
      }
    }

    if (interrompu) return;
    const total = performance.now() - debutTotal;
    bilan.className = `tests__bilan ${echoues === 0 ? 'tests__bilan--ok' : 'tests__bilan--ko'}`;
    bilan.textContent = `${reussis} passés · ${echoues} échoué${echoues > 1 ? 's' : ''} · ${nombre(total)} ms`;
    // Le bilan prend sa place en bas du bandeau et rogne d'autant la liste :
    // sans ce rappel, la dernière ligne se retrouve masquée juste après
    // avoir été écrite.
    liste.scrollTop = liste.scrollHeight;
  }

  panneau.focus();
  void executerTout();
}
