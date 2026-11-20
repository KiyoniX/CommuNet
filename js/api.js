// Lecture des comptes des communes (OFGL), directement depuis le navigateur.
import { CONFIG } from "./config.js";
import { requeteJson } from "./base/reseau.js";

const BUDGET = "type_de_budget='Budget principal'"; // les budgets annexes (parkings, eau…) ne sont pas comptés

const dejaLues = new Map(); // insee → comptes de la commune
const medianesLues = new Map(); // "année|tranche" → médianes

function url(chemin, parametres) {
  const u = new URL(`${CONFIG.api}/${chemin}`);
  u.search = new URLSearchParams(parametres);
  return u;
}

/** Le code INSEE ne contient que des chiffres et lettres (2A, 2B pour la Corse) : rien d'autre n'entre dans la requête. */
const inseeSur = (insee) => {
  if (!/^[0-9AB]{5}$/i.test(insee)) throw new Error(`Code INSEE invalide : ${insee}`);
  return insee.toUpperCase();
};

/**
 * Comptes d'une commune, toutes années, en une requête (export sans pagination).
 * @returns {Promise<{ insee, nom, annees: { [annee]: { population, tranche, postes: { [agregat]: €/hab } } } } | null>}
 */
export async function chargerCommune(insee, signal) {
  const code = inseeSur(insee);
  if (dejaLues.has(code)) return dejaLues.get(code);
  const lignes = await requeteJson(
    url("exports/json", { where: `insee='${code}' and ${BUDGET}`, select: "exer,com_name,agregat,euros_par_habitant,ptot,tranche_population" }),
    { signal, ecartMs: CONFIG.reseau.ecartComptesMs },
  );
  const commune = organiser(code, lignes);
  dejaLues.set(code, commune);
  return commune;
}

/** Lignes de l'export → comptes rangés par année. Exportée pour les tests. */
export function organiser(insee, lignes) {
  if (!lignes.length) return null;
  const annees = {};
  let nom = "";
  let derniere = "";
  for (const l of lignes) {
    const annee = l.exer.slice(0, 4);
    annees[annee] ??= { population: l.ptot, tranche: l.tranche_population, postes: {} };
    annees[annee].postes[l.agregat] = l.euros_par_habitant;
    if (annee >= derniere) [derniere, nom] = [annee, l.com_name]; // nom le plus récent (communes renommées ou fusionnées)
  }
  return { insee, nom, annees };
}

/**
 * Médiane de chaque poste (en €/habitant) pour les communes d'une tranche de population, une année donnée.
 * La médiane plutôt que la moyenne : Paris pèse 2 millions d'habitants dans la tranche des plus de 100 000.
 * @returns {Promise<{ [agregat]: { mediane, communes } }>}
 */
export async function chargerMedianes(annee, tranche, signal) {
  const cle = `${annee}|${tranche}`;
  if (medianesLues.has(cle)) return medianesLues.get(cle);
  const { results } = await requeteJson(
    url("records", {
      where: `exer=date'${Number(annee)}' and ${BUDGET} and tranche_population='${Number(tranche)}'`,
      select: "agregat,median(euros_par_habitant) as mediane,count(*) as communes",
      group_by: "agregat",
      limit: 100,
    }),
    { signal, ecartMs: CONFIG.reseau.ecartComptesMs },
  );
  const medianes = Object.fromEntries(results.map((r) => [r.agregat, { mediane: r.mediane, communes: r.communes }]));
  medianesLues.set(cle, medianes);
  return medianes;
}
