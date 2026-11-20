// Affichage : le ticket (DOM), sa version texte pour Discord et les mini-courbes « Sur 8 ans ».
import { CONFIG } from "./config.js";
import { serie } from "./ticket.js";
import { el, montant } from "./base/format.js";

const SVG = "http://www.w3.org/2000/svg";
const habitants = (n) => `${n.toLocaleString("fr-FR")} hab.`;
const signe = (pct) => (pct > 0 ? `+${pct}` : `${pct}`);

/** « MAIRIE DE CLERMONT-FERRAND », « MAIRIE D'ISSOIRE », « MAIRIE DU MANS »… */
export function enseigne(nom) {
  const n = nom.toUpperCase();
  if (/^LE /.test(n)) return `MAIRIE DU ${n.slice(3)}`;
  if (/^LES /.test(n)) return `MAIRIE DES ${n.slice(4)}`;
  return /^[AEIOUYHÀÂÉÈÊÎÔŒ]/.test(n) ? `MAIRIE D'${n}` : `MAIRIE DE ${n}`;
}

/** « ▲ +12 % » / « ▼ -14 % » par rapport à la médiane des communes de même taille. */
function badgeEcart(ecart) {
  if (ecart == null) return el("span", { class: "ecart" });
  const notable = Math.abs(ecart) >= CONFIG.ecartNotablePct;
  return el(
    "span",
    { class: `ecart${notable ? " notable" : ""}`, title: "Par rapport à la médiane des communes de même taille" },
    `${ecart > 0 ? "▲" : ecart < 0 ? "▼" : "="} ${signe(ecart)} %`,
  );
}

function ligneTicket({ libelle, aide, montant: m, ecart }) {
  return el("li", { class: "ligne", title: aide }, el("span", { class: "libelle" }, libelle), el("span", { class: "montant" }, montant(m)), badgeEcart(ecart));
}

function sectionTicket(s, libelleTotal) {
  return [
    el("h3", {}, s.titre),
    el("ul", { class: "lignes" }, s.lignes.map(ligneTicket)),
    el("div", { class: "pointilles" }),
    el("div", { class: "ligne total" }, el("span", { class: "libelle" }, libelleTotal), el("span", { class: "montant" }, montant(s.total)), badgeEcart(s.ecart)),
  ];
}

/** Code-barres décoratif, tiré du code INSEE (même commune = même code-barres). */
function codeBarres(insee) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 120 30");
  svg.setAttribute("class", "code-barres");
  svg.setAttribute("aria-hidden", "true");
  let x = 0;
  const chiffres = [...`${insee}${insee}`].map((c) => (parseInt(c, 36) % 4) + 1);
  for (const [i, largeur] of chiffres.entries()) {
    const barre = document.createElementNS(SVG, "rect");
    Object.entries({ x, y: 0, width: largeur, height: 30 }).forEach(([k, v]) => barre.setAttribute(k, v));
    x += largeur + ((i * 7) % 3) + 1;
    svg.append(barre);
  }
  svg.setAttribute("viewBox", `0 0 ${x} 30`);
  return svg;
}

/** Remplit l'élément `article` avec le ticket. */
export function afficherTicket(article, t) {
  const rendu = t.rendu >= 0 ? `La ville a mis ${montant(t.rendu)} de côté` : `La ville a puisé ${montant(-t.rendu)} dans ses réserves`;
  // replaceChildren n'aplatit pas les tableaux : on aplatit, et on retire les éléments absents (null, false).
  const contenu = [
    el("header", { class: "tete" }, el("p", { class: "enseigne" }, enseigne(t.commune.nom)), el("p", {}, `Comptes ${t.annee} · ${habitants(t.population)}`), el("p", { class: "pour" }, "TICKET POUR 1 HABITANT")),
    el("div", { class: "trait" }),
    sectionTicket(t.depenses, "TOTAL DÉPENSÉ"),
    el("div", { class: "trait" }),
    sectionTicket(t.recettes, "TOTAL ENCAISSÉ"),
    el("div", { class: "trait" }),
    el("div", { class: "ligne total" }, el("span", { class: "libelle" }, "RENDU"), el("span", { class: "montant" }, montant(t.rendu)), el("span", { class: "ecart" })),
    el("p", { class: "note" }, `(${rendu})`),
    el("div", { class: "ligne total" }, el("span", { class: "libelle" }, "ARDOISE (dette)"), el("span", { class: "montant" }, montant(t.dette.montant)), badgeEcart(t.dette.ecart)),
    el(
      "p",
      { class: "note" },
      t.anneesDesendettement == null ? "(épargne nulle : la ville ne peut pas rembourser avec ses économies)" : `(remboursable en ${t.anneesDesendettement.toLocaleString("fr-FR")} ans d'économies)`,
    ),
    el("div", { class: "trait" }),
    t.nombreComparees &&
      el("p", { class: "note comparaison" }, `▲▼ : écart avec la médiane des ${t.nombreComparees} communes de ${CONFIG.tranches[t.tranche]}`),
    codeBarres(t.commune.insee),
    el("p", { class: "merci" }, "MERCI DE VOTRE VISITE"),
    el("p", { class: "note" }, `INSEE ${t.commune.insee} · budget principal · source OFGL`),
  ];
  article.replaceChildren(...contenu.flat().filter(Boolean));
}

/** Version texte du ticket, à coller sur Discord (bloc de code, police à chasse fixe). */
export function texteTicket(t) {
  const L = 38;
  const ligne = (g, d) => `${g}${" ".repeat(Math.max(1, L - g.length - d.length))}${d}`;
  const centre = (s) => `${" ".repeat(Math.max(0, Math.floor((L - s.length) / 2)))}${s}`;
  const trait = "-".repeat(L);
  const m = (x) => montant(x).replace(/\s/g, " ");
  const lignes = [
    centre(enseigne(t.commune.nom).slice(0, L)),
    centre(`Comptes ${t.annee} · pour 1 habitant`),
    trait,
    "DÉPENSES",
    ...t.depenses.lignes.map((l) => ligne(l.libelle.slice(0, 26), m(l.montant))),
    ligne("TOTAL DÉPENSÉ", m(t.depenses.total)),
    trait,
    "PAYÉ PAR",
    ...t.recettes.lignes.map((l) => ligne(l.libelle.slice(0, 26), m(l.montant))),
    ligne("TOTAL ENCAISSÉ", m(t.recettes.total)),
    trait,
    ligne("RENDU", m(t.rendu)),
    ligne("ARDOISE (dette)", m(t.dette.montant)),
    trait,
    centre("MERCI DE VOTRE VISITE"),
  ];
  return `\`\`\`\n${lignes.join("\n")}\n\`\`\``;
}

/** Mini-courbe d'une série de valeurs. */
function courbe(points) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 100 30");
  svg.setAttribute("class", "courbe");
  svg.setAttribute("aria-hidden", "true");
  const valeurs = points.map((p) => p.valeur);
  const [min, max] = [Math.min(...valeurs), Math.max(...valeurs)];
  const y = (v) => (max > min ? 27 - ((v - min) / (max - min)) * 24 : 15);
  const x = (i) => (points.length > 1 ? (i / (points.length - 1)) * 96 + 2 : 50);
  const trace = document.createElementNS(SVG, "polyline");
  trace.setAttribute("points", points.map((p, i) => `${x(i)},${y(p.valeur)}`).join(" "));
  const dernier = document.createElementNS(SVG, "circle");
  Object.entries({ cx: x(points.length - 1), cy: y(valeurs.at(-1)), r: 2.2 }).forEach(([k, v]) => dernier.setAttribute(k, v));
  svg.append(trace, dernier);
  return svg;
}

/** Tableau « Sur 8 ans » : une ligne par poste suivi, avec courbe, première et dernière valeur, évolution. */
export function afficherEvolution(tableau, commune, libelles) {
  tableau.replaceChildren(
    ...CONFIG.evolution.map((agregat) => {
      const points = serie(commune, agregat);
      if (points.length < 2) return null;
      const [premier, dernier] = [points[0], points.at(-1)];
      const pct = Math.abs(premier.valeur) >= 0.5 ? Math.round((100 * (dernier.valeur - premier.valeur)) / Math.abs(premier.valeur)) : null;
      return el(
        "tr",
        {},
        el("th", { scope: "row" }, libelles[agregat] ?? agregat),
        el("td", {}, courbe(points)),
        el("td", { class: "nombre" }, `${montant(Math.round(premier.valeur))}`, el("small", {}, ` en ${premier.annee}`)),
        el("td", { class: "nombre" }, `${montant(Math.round(dernier.valeur))}`, el("small", {}, ` en ${dernier.annee}`)),
        el("td", { class: "nombre evolution" }, pct == null ? "" : `${signe(pct)} %`),
      );
    }).filter(Boolean),
  );
}
