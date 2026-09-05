/**
 * ═══════════════════════════════════════════════════════════════════════
 *  LE SEUL FICHIER À MODIFIER POUR METTRE LE SITE À JOUR.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Tout le contenu du site vit ici. Les composants ne font que le mettre en
 * forme : ils ne contiennent aucun texte.
 *
 * Le contenu est validé au chargement par `profilSchema`. Si une donnée est
 * mal formée — une date au mauvais format, un parcours désordonné, une
 * description de plus de 160 caractères — `npm run build` échoue avec le
 * chemin exact du champ fautif. Rien de cassé ne peut atteindre la
 * production.
 *
 * Volontairement absents de ce fichier, et donc du site : numéro de
 * téléphone, adresse postale, adresse e-mail. Une page publique est aspirée
 * par les robots ; le contact passe par les réseaux (voir `liens`).
 */
import { profilSchema } from './profil.schema';

export const profil = profilSchema.parse({
  identite: {
    prenom: 'Florian',
    nom: 'Pussacq',
    titre: 'Tech lead & développeur full stack',
    accroche:
      'Je fais du logiciel de service public et bancaire depuis 2014 : l’inscription à France Travail, les outils des conseillers de La Banque Postale, des applications grand public chez Orange. Beaucoup d’utilisateurs, beaucoup de contraintes réglementaires, et des applications dont la durée de vie se compte en années plutôt qu’en mois.',
    localisation: 'Bordeaux, France',
    description:
      'Tech lead et développeur full stack à Bordeaux. Java, Kotlin, Angular. TDD, architecture hexagonale, logiciel de service public.',
  },

  /**
   * Ce que tu défends techniquement. C'est le cœur d'une carte de visite de
   * développeur : la liste des frameworks, tout le monde l'a.
   */
  principes: [
    {
      titre: 'Les tests d’abord',
      explication:
        'J’écris les tests avant, la plupart du temps. Pas pour la couverture : pour pouvoir revenir sur le code six mois plus tard sans avoir peur. Sur un composant réglementaire qui bouge à chaque décret, c’est ce qui sépare une évolution d’une réécriture.',
    },
    {
      titre: 'Architecture hexagonale',
      explication:
        'Le métier au centre, la technique autour. J’ai vu assez de règles de gestion noyées dans un contrôleur HTTP ou au fond d’une requête SQL pour y tenir. Le framework change, la base change, le protocole change. Les règles restent, et ce sont elles qu’on doit pouvoir lire.',
    },
    {
      titre: 'Du code écrit pour être lu',
      explication:
        'On passe plus de temps à lire du code qu’à en écrire, et sur une application qui vit dix ans ce n’est même pas comparable. Donc des noms qui disent ce qu’ils font, des fonctions courtes, et pas de code malin. Le code malin, c’est toujours quelqu’un d’autre qui le paie.',
    },
    {
      titre: 'La qualité est collective',
      explication:
        'Revue de code, pair programming, accompagnement des nouveaux arrivants. Ce n’est pas du confort d’équipe : c’est ce qui fait qu’une pratique survit au départ de celui qui l’a installée. C’est l’essentiel de mon travail de tech lead, et de loin la partie la plus difficile.',
    },
    {
      titre: 'Livrer petit, livrer souvent',
      explication:
        'Un déploiement qui fait peur finit par être repoussé, et plus on le repousse, plus il fait peur. J’ai suivi assez de mises en production sensibles pour préférer les pipelines qui tournent tout seuls et les lots qu’on peut annuler.',
    },
    {
      titre: 'L’IA a changé ma vitesse, pas mes critères',
      explication:
        'Je code avec des assistants tous les jours, sur plusieurs modèles, et je ne reviendrais pas en arrière : sur de l’exploration, du refactoring ou de l’écriture de tests, le gain est réel et parfois spectaculaire. Ce qui n’a pas bougé, c’est ce que j’accepte de livrer. Je dois pouvoir relire, tester et expliquer en revue ce que je pousse, que je l’aie tapé ou non.',
    },
  ],

  /** Du plus récent au plus ancien — le build échoue si l'ordre est rompu. */
  parcours: [
    {
      poste: 'Développeur full stack, puis tech lead',
      organisation: 'France Travail',
      lieu: 'Pessac',
      debut: '2023-10',
      fin: 'present',
      contexte:
        'Nouveau parcours d’inscription des usagers à France Travail, dans le cadre de la Loi pour le plein emploi. Tech lead depuis janvier 2025.',
      faits: [
        'Conception et développement du parcours d’inscription pour les usagers en recherche d’emploi et les demandeurs de RSA.',
        'Finalisation, mise en production et suivi de l’inscription France Travail LPE.',
        'Ouverture d’un point d’entrée sur francetravail.io permettant à des partenaires — aujourd’hui la CCMSA — de demander l’inscription des demandeurs de RSA.',
        'Écrans d’enregistrement d’usager pour les agents des Missions locales.',
      ],
      stack: [
        'Java 17/21',
        'Kotlin',
        'Quarkus',
        'Spring Boot',
        'TypeScript',
        'Angular',
        'Next.js',
        'Redis',
        'Kubernetes',
        'Docker',
        'GitLab',
        'Grafana',
        'Kibana',
      ],
    },
    {
      poste: 'Développeur full stack',
      organisation: 'Zenika',
      lieu: 'Bordeaux',
      debut: '2021-10',
      fin: '2023-10',
      contexte:
        'En mission pour Pôle emploi, au sein de l’équipe Inscription et Actualisation des demandeurs d’emploi.',
      faits: [
        'Développement, maintenance et déploiement des composants permettant aux demandeurs d’emploi d’actualiser leur situation chaque mois.',
        'Évolutions réglementaires et maintenance du composant d’inscription.',
        'Migration de composants vers une architecture micro-services, et mise en place des pipelines de déploiement du développement jusqu’à la production.',
      ],
      stack: [
        'Java 11/17',
        'Kotlin',
        'Spring Boot',
        'Tapestry',
        'TypeScript',
        'Angular',
        'Redis',
        'MongoDB',
        'VMware Tanzu',
        'Docker',
        'Concourse',
        'Jenkins',
        'GitLab',
        'Kibana',
      ],
    },
    {
      poste: 'Développeur full stack, puis tech lead',
      organisation: 'La Banque Postale',
      lieu: 'Pessac',
      debut: '2018-11',
      fin: '2021-10',
      contexte:
        'Programme Cap Client 3.0, l’outil des conseillers en centres financiers et en bureaux de poste. Tech lead depuis juillet 2020.',
      faits: [
        'Référent technique du programme : études d’impact, cadrage des besoins métier, suivi des évolutions et des mises en production.',
        'Mise en place des pratiques de qualité de service et accompagnement des nouveaux arrivants.',
        'Ouverture de l’application aux utilisateurs des centres financiers et des bureaux de poste.',
        'Intégration applicative : configuration des environnements de recette, déploiements et suivi de production.',
      ],
      stack: [
        'Java 8',
        'Spring Boot',
        'TypeScript',
        'Angular',
        'HTML/CSS',
        'Maven',
        'JUnit',
        'SonarQube',
        'GitLab',
        'Jenkins',
        'Splunk',
      ],
    },
    {
      poste: 'Développeur full stack',
      organisation: 'Scalian',
      lieu: 'Le Haillan',
      debut: '2016-10',
      fin: '2018-10',
      contexte: 'En mission pour La Banque Postale, sur le programme Cap Client 3.0.',
      faits: [
        'Développement et maintenance de plusieurs composants applicatifs du programme.',
        'Développeur front Angular sur un projet interne à Scalian.',
      ],
      stack: [
        'Java 8',
        'Spring Boot',
        'TypeScript',
        'Angular',
        'HTML/CSS',
        'Maven',
        'JUnit',
        'SonarQube',
        'GitLab',
      ],
    },
    {
      poste: 'Développeur Java / Android — alternance',
      organisation: 'Orange',
      lieu: 'Pessac',
      debut: '2014-09',
      fin: '2016-09',
      contexte: 'Applications mobiles grand public et collecte de données de périphériques.',
      faits: [
        'Développement et maintenance des applications Android 118 712, Nos Sorties Voilà et Qui m’appelle ?.',
        'Conception et développement d’une API REST de collecte et de stockage des données de périphériques Orange.',
      ],
      stack: ['Java 8', 'Android', 'RxJava', 'Spring Boot', 'Couchbase', 'Jenkins', 'Git'],
    },
  ],

  competences: [
    {
      intitule: 'Langages & frameworks',
      elements: [
        'Java',
        'Kotlin',
        'Spring',
        'Spring Boot',
        'Spring Batch',
        'Quarkus',
        'TypeScript',
        'JavaScript',
        'Angular',
        'React',
        'Next.js',
        'Node.js',
        'Vue.js',
      ],
    },
    {
      intitule: 'Tests',
      elements: ['JUnit', 'AssertJ', 'Mockito', 'Playwright'],
    },
    {
      intitule: 'Plateforme & déploiement',
      elements: [
        'Kubernetes',
        'Docker',
        'GitLab CI',
        'Concourse',
        'Jenkins',
        'VMware Tanzu',
        'Grafana',
      ],
    },
    {
      intitule: 'Données',
      elements: ['Oracle', 'MongoDB', 'Couchbase', 'Redis'],
    },
    {
      // Uniquement les deux assistants utilisés au quotidien. Les autres ont
      // été essayés, ce qui n'est pas une compétence.
      intitule: 'Outillage',
      elements: [
        'IntelliJ IDEA',
        'VS Code',
        'Claude',
        'GitHub Copilot',
        'Maven',
        'Gradle',
        'Git',
        'SonarQube',
        'Kibana',
        'Splunk',
        'Jira',
      ],
    },
  ],

  formation: [
    {
      intitule: 'Master MIAGE',
      etablissement: 'Université de Bordeaux',
      annees: '2014–2016',
      mention: true,
    },
    {
      intitule: 'Licence 3 — informatique de gestion',
      etablissement: 'Université de Bordeaux',
      annees: '2013–2014',
      mention: true,
    },
    {
      intitule: 'DUT Informatique',
      etablissement: 'Université de Bordeaux',
      annees: '2010–2012',
    },
    {
      intitule: 'Baccalauréat scientifique',
      etablissement: 'Lycée Arnaut Daniel, Ribérac',
      annees: '2010',
      mention: true,
    },
  ],

  langues: ['Français — langue maternelle', 'Anglais — lu et écrit, niveau B2'],

  interets: ['Science-fiction', 'Voyage', 'Veille technologique'],

  // LinkedIn en premier : c'est le canal par lequel on écrit réellement.
  liens: [
    {
      libelle: 'LinkedIn',
      url: 'https://fr.linkedin.com/in/florian-pussacq',
      reseau: 'linkedin',
    },
    {
      libelle: 'GitHub',
      url: 'https://github.com/florian-pussacq',
      reseau: 'github',
    },
  ],
});
