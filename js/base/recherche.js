// Champ de recherche de commune avec suggestions (clavier : flèches, Entrée, Échap).
// Éléments attendus dans index.html : #recherche (formulaire), #recherche-texte, #suggestions.
// Réglages lus dans config.js : CONFIG.reseau.attenteSaisieMs.
import { CONFIG } from "../config.js";
import { rechercherLieux } from "./geocodage.js";
import { el } from "./format.js";

const $ = (id) => document.getElementById(id);

/**
 * @param surChoix({ insee, nom }) commune choisie
 * @param surErreur(message)
 */
export function brancherRechercheCommune({ surChoix, surErreur }) {
  const formulaire = $("recherche");
  const champ = $("recherche-texte");
  const liste = $("suggestions");

  let lieux = []; // suggestions affichées
  let pourTexte = ""; // texte auquel correspondent ces suggestions
  let actif = -1; // suggestion choisie au clavier
  let minuterie = null;
  let controleur = null;

  async function chercher(texte) {
    controleur?.abort();
    controleur = new AbortController();
    try {
      lieux = (await rechercherLieux(texte, controleur.signal, { type: "municipality" })).filter((l) => l.insee);
      pourTexte = texte;
      actif = -1;
      afficher();
    } catch (erreur) {
      if (erreur.name !== "AbortError") surErreur("Recherche de commune indisponible pour le moment.");
    }
  }

  function afficher() {
    liste.replaceChildren(
      ...lieux.map((lieu, i) =>
        el(
          "li",
          {
            role: "option",
            "aria-selected": String(i === actif),
            // mousedown plutôt que click : passe avant la perte de focus du champ
            onmousedown: (e) => {
              e.preventDefault();
              choisir(lieu);
            },
          },
          el("strong", {}, lieu.nom),
          el("small", {}, lieu.contexte),
        ),
      ),
    );
    liste.hidden = lieux.length === 0;
  }

  function fermer() {
    liste.hidden = true;
    actif = -1;
  }

  function choisir(lieu) {
    fermer();
    champ.value = "";
    champ.blur();
    surChoix({ insee: lieu.insee, nom: lieu.nom });
  }

  champ.addEventListener("input", () => {
    clearTimeout(minuterie);
    const texte = champ.value.trim();
    if (texte.length < 3) return fermer(); // l'API demande au moins 3 caractères
    minuterie = setTimeout(() => chercher(texte), CONFIG.reseau.attenteSaisieMs);
  });

  champ.addEventListener("keydown", (e) => {
    if (liste.hidden || !lieux.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const pas = e.key === "ArrowDown" ? 1 : -1;
      actif = (actif + pas + lieux.length) % lieux.length;
      afficher();
    } else if (e.key === "Escape") {
      fermer();
    }
  });

  champ.addEventListener("blur", fermer);

  formulaire.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texte = champ.value.trim();
    if (texte.length < 3) return;
    clearTimeout(minuterie);
    if (texte !== pourTexte) await chercher(texte);
    if (lieux.length) choisir(lieux[Math.max(actif, 0)]);
    else surErreur(`Aucune commune trouvée pour « ${texte} ».`);
  });
}
