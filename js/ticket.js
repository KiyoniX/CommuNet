// Logique pure : construit le ticket d'une commune pour une année. Aucun accès au DOM (testée dans tests/ticket.test.js).
import { CONFIG } from "./config.js";

const arrondi = (x) => Math.round(x * 100) / 100;

/** Écart en % avec la médiane, ou null si la comparaison n'a pas de sens. */
function ecartPct(valeur, mediane) {
  if (mediane == null || Math.abs(mediane) < 0.5) return null;
  return Math.round((100 * (valeur - mediane)) / Math.abs(mediane));
}

/** Une ligne du ticket, comparée à la médiane des communes de même taille. */
function ligne(postes, medianes, { agregat, libelle, aide }) {
  const montant = arrondi(postes[agregat] ?? 0);
  const mediane = medianes?.[agregat]?.mediane ?? null;
  return { agregat, libelle, aide, montant, mediane, ecart: ecartPct(montant, mediane) };
}

/** Une section (dépenses ou recettes) ; « Divers » fait l'appoint si les lignes ne retombent pas sur le total. */
function section(postes, medianes, { titre, titreTotal = titre, total, lignes }) {
  const detail = lignes.map((l) => ligne(postes, medianes, l)).filter((l) => Math.abs(l.montant) >= 0.005);
  const totalOfficiel = arrondi(postes[total] ?? detail.reduce((s, l) => s + l.montant, 0));
  const appoint = arrondi(totalOfficiel - detail.reduce((s, l) => s + l.montant, 0));
  if (Math.abs(appoint) >= 0.5) detail.push({ agregat: null, libelle: "Divers", aide: "Postes non détaillés.", montant: appoint, mediane: null, ecart: null });
  const comparaison = ligne(postes, medianes, { agregat: total });
  return { titre, titreTotal, lignes: detail, total: totalOfficiel, mediane: comparaison.mediane, ecart: comparaison.ecart };
}

/**
 * @param commune  résultat de chargerCommune()
 * @param annee    "2025"…
 * @param medianes résultat de chargerMedianes() pour cette année et la tranche de la commune (ou null)
 * @returns {{ commune, annee, population, tranche, depenses, recettes, rendu, dette, anneesDesendettement }}
 */
export function construireTicket(commune, annee, medianes = null) {
  const compte = commune.annees[annee];
  if (!compte) return null;
  const { postes } = compte;
  const depenses = section(postes, medianes, CONFIG.ticket.depenses);
  const recettes = section(postes, medianes, CONFIG.ticket.recettes);
  const dette = ligne(postes, medianes, { agregat: CONFIG.ticket.dette, libelle: "Dette" });
  const epargne = postes[CONFIG.ticket.epargneBrute] ?? 0;

  return {
    commune: { insee: commune.insee, nom: commune.nom },
    annee,
    population: compte.population,
    tranche: compte.tranche,
    nombreComparees: medianes?.[CONFIG.ticket.depenses.total]?.communes ?? null,
    depenses,
    recettes,
    // Recettes – dépenses : positif = la ville a mis de côté, négatif = elle a puisé dans ses réserves.
    rendu: arrondi(recettes.total - depenses.total),
    dette,
    // Capacité de désendettement : années d'épargne brute pour rembourser toute la dette (null = épargne nulle ou négative).
    anneesDesendettement: epargne > 0 ? Math.round((10 * dette.montant) / epargne) / 10 : null,
  };
}

/** Valeurs d'un poste sur toutes les années disponibles, pour « Sur 8 ans ». */
export function serie(commune, agregat) {
  return Object.keys(commune.annees)
    .sort()
    .map((annee) => ({ annee, valeur: commune.annees[annee].postes[agregat] ?? null, population: commune.annees[annee].population }))
    .filter((p) => p.valeur != null);
}

/** Dernière année disponible pour une commune. */
export const derniereAnnee = (commune) => Object.keys(commune.annees).sort().at(-1);
