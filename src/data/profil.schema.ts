/**
 * Schéma du contenu du site.
 *
 * Il n'y a pas de logique métier ici, donc pas de tests unitaires : le seul
 * invariant qui compte est « le contenu est bien formé », et il est vérifié
 * au build. Une faute dans `profil.ts` fait échouer `npm run build` (et donc
 * la CI) au lieu de produire une page cassée en production.
 *
 * Zod est fourni par Astro (`astro/zod`) : aucune dépendance supplémentaire.
 */
import { z } from 'astro/zod';

/** Un mois, au format AAAA-MM. Comparable lexicographiquement, ce dont on se sert plus bas. */
const mois = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'format attendu : AAAA-MM');

/** Fin d'une période : un mois, ou `present` pour un poste en cours. */
const finDePeriode = z.union([mois, z.literal('present')]);

const experience = z
  .object({
    poste: z.string().min(1),
    organisation: z.string().min(1),
    lieu: z.string().min(1),
    debut: mois,
    fin: finDePeriode,
    /** Une phrase de cadrage : où, pour qui, sur quoi. */
    contexte: z.string().min(1),
    /** Ce qui a été fait, concrètement. Une ligne par fait. */
    faits: z.array(z.string().min(1)).min(1),
    stack: z.array(z.string().min(1)).min(1),
  })
  .refine((e) => e.fin === 'present' || e.fin >= e.debut, {
    message: 'la fin d’une expérience ne peut pas précéder son début',
    path: ['fin'],
  });

const formation = z.object({
  intitule: z.string().min(1),
  etablissement: z.string().min(1),
  annees: z.string().regex(/^\d{4}(–\d{4})?$/, 'format attendu : AAAA ou AAAA–AAAA'),
  mention: z.boolean().default(false),
});

const groupeDeCompetences = z.object({
  intitule: z.string().min(1),
  elements: z.array(z.string().min(1)).min(1),
});

const principe = z.object({
  titre: z.string().min(1),
  explication: z.string().min(1),
});

const lien = z.object({
  libelle: z.string().min(1),
  url: z.string().url(),
  /** Sert à choisir l'icône ; ajouter une valeur oblige à ajouter l'icône correspondante. */
  reseau: z.enum(['github', 'linkedin']),
});

export const profilSchema = z
  .object({
    identite: z.object({
      prenom: z.string().min(1),
      nom: z.string().min(1),
      titre: z.string().min(1),
      /** Deux phrases maximum : c'est la première chose lue, elle doit tenir dans un regard. */
      accroche: z.string().min(1),
      localisation: z.string().min(1),
      /** Description utilisée pour les métadonnées et les aperçus de partage. */
      description: z.string().min(1).max(160),
    }),
    principes: z.array(principe).min(1),
    parcours: z.array(experience).min(1),
    competences: z.array(groupeDeCompetences).min(1),
    formation: z.array(formation).min(1),
    langues: z.array(z.string().min(1)).min(1),
    interets: z.array(z.string().min(1)).min(1).optional(),
    liens: z.array(lien).min(1),
  })
  .superRefine((profil, ctx) => {
    // Le parcours est affiché tel quel, sans tri au rendu : on impose donc
    // l'ordre anti-chronologique à la source plutôt que de le corriger à
    // l'affichage. Une entrée insérée au mauvais endroit casse le build.
    profil.parcours.forEach((experience, index) => {
      const precedente = profil.parcours[index - 1];
      if (precedente && precedente.debut < experience.debut) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'le parcours doit être ordonné du plus récent au plus ancien',
          path: ['parcours', index, 'debut'],
        });
      }
    });

    const enCours = profil.parcours.filter((experience) => experience.fin === 'present');
    if (enCours.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'une seule expérience peut être en cours',
        path: ['parcours'],
      });
    }
  });

export type Profil = z.infer<typeof profilSchema>;
export type Experience = z.infer<typeof experience>;
export type Lien = z.infer<typeof lien>;
