import { test } from "node:test";
import assert from "node:assert/strict";
import { organiser } from "../js/api.js";
import { construireTicket, derniereAnnee, serie } from "../js/ticket.js";

// Comptes 2025 de Clermont-Ferrand (budget principal, €/habitant), tels que publiés par l'OFGL.
const POSTES_2025 = {
  "Frais de personnel": 684.5486611070808,
  "Achats et charges externes": 185.16832839714877,
  "Dépenses d'intervention": 173.55618245469248,
  "Charges financières": 21.585847415325023,
  "Autres dépenses de fonctionnement": 47.075779129589755,
  "Dépenses d'équipement": 229.23115060798264,
  "Subventions d'équipement versées": 32.79575383857678,
  "Autres dépenses d'investissement": 12.471810304091154,
  "Remboursements d'emprunts hors GAD": 103.69563929690983,
  "Dépenses totales": 1490.1291525513975,
  "Impôts locaux": 767.2573893019015,
  "Autres impôts et taxes": 67.69278800141097,
  "Concours de l'Etat": 272.2288606398626,
  "Subventions reçues et participations": 77.92322254094815,
  "Ventes de biens et services": 86.77013563969625,
  "Autres recettes de fonctionnement": 28.193535750178235,
  "Recettes d'investissement hors emprunts": 28.79079819768254,
  "Emprunts hors GAD": 51.27857025909977,
  "Recettes totales": 1380.1353003307797,
  "Encours de dette": 875.1303833585134,
  "Epargne brute": 188.1311333701606,
};

const lignes = (annee, postes, nom = "Clermont-Ferrand") =>
  Object.entries(postes).map(([agregat, euros_par_habitant]) => ({
    exer: `${annee}-01-01T00:00:00+00:00`,
    com_name: nom,
    agregat,
    euros_par_habitant,
    ptot: 150251,
    tranche_population: "10",
  }));

const commune = organiser("63113", [
  ...lignes("2024", { "Impôts locaux": 740, "Dépenses totales": 1400 }, "Clermont-Fd"),
  ...lignes("2025", POSTES_2025),
]);

test("organiser : comptes rangés par année, nom le plus récent", () => {
  assert.equal(commune.nom, "Clermont-Ferrand");
  assert.deepEqual(Object.keys(commune.annees).sort(), ["2024", "2025"]);
  assert.equal(commune.annees["2025"].population, 150251);
  assert.equal(derniereAnnee(commune), "2025");
  assert.equal(organiser("00000", []), null);
});

test("construireTicket : les lignes retombent sur les totaux officiels, sans ligne « Divers »", () => {
  const t = construireTicket(commune, "2025");
  assert.equal(t.depenses.total, 1490.13);
  assert.equal(t.recettes.total, 1380.14);
  assert.ok(!t.depenses.lignes.some((l) => l.libelle === "Divers"));
  assert.ok(!t.recettes.lignes.some((l) => l.libelle === "Divers"));
  const somme = t.depenses.lignes.reduce((s, l) => s + l.montant, 0);
  assert.ok(Math.abs(somme - t.depenses.total) < 0.05, `somme des lignes : ${somme}`);
});

test("construireTicket : rendu négatif (réserves entamées), dette et désendettement", () => {
  const t = construireTicket(commune, "2025");
  assert.equal(t.rendu, -109.99);
  assert.equal(t.dette.montant, 875.13);
  assert.equal(t.anneesDesendettement, 4.7);
});

test("construireTicket : écart avec la médiane des communes de même taille", () => {
  const t = construireTicket(commune, "2025", { "Impôts locaux": { mediane: 918.75, communes: 42 }, "Dépenses totales": { mediane: 1838.55, communes: 42 } });
  const impots = t.recettes.lignes.find((l) => l.agregat === "Impôts locaux");
  assert.equal(impots.ecart, -16);
  assert.equal(t.depenses.ecart, -19);
  assert.equal(t.nombreComparees, 42);
});

test("construireTicket : une ligne « Divers » fait l'appoint quand des postes manquent", () => {
  const partielle = organiser("12345", lignes("2025", { "Frais de personnel": 300, "Dépenses totales": 500, "Recettes totales": 520, "Impôts locaux": 400 }));
  const t = construireTicket(partielle, "2025");
  assert.deepEqual(t.depenses.lignes.map((l) => [l.libelle, l.montant]), [["Salaires des agents", 300], ["Divers", 200]]);
  assert.equal(t.anneesDesendettement, null); // pas d'épargne brute connue
  assert.equal(construireTicket(partielle, "2019"), null);
});

test("serie : valeurs d'un poste, de la plus ancienne année à la plus récente", () => {
  assert.deepEqual(serie(commune, "Impôts locaux").map((p) => p.annee), ["2024", "2025"]);
});

test("enseigne : élision et articles", async () => {
  // rendu.js importe des fonctions de navigateur seulement à l'exécution : l'import marche dans Node.
  const { enseigne } = await import("../js/rendu.js");
  assert.equal(enseigne("Clermont-Ferrand"), "MAIRIE DE CLERMONT-FERRAND");
  assert.equal(enseigne("Issoire"), "MAIRIE D'ISSOIRE");
  assert.equal(enseigne("Le Mans"), "MAIRIE DU MANS");
  assert.equal(enseigne("Les Martres-de-Veyre"), "MAIRIE DES MARTRES-DE-VEYRE");
});
