// Point d'entrée : état (commune, année), chargement et affichage.
import { CONFIG } from "./config.js";
import { chargerCommune, chargerMedianes } from "./api.js";
import { construireTicket, derniereAnnee } from "./ticket.js";
import { afficherEvolution, afficherTicket, texteTicket } from "./rendu.js";
import { creerChargeur } from "./base/chargeur.js";
import { el } from "./base/format.js";
import { creerMemoire, ecrireParametresPage, lireParametresPage } from "./base/memoire.js";
import { brancherRechercheCommune } from "./base/recherche.js";

const $ = (id) => document.getElementById(id);
const memoire = creerMemoire(CONFIG.site.cleMemoire);
const inseeValide = (x) => typeof x === "string" && /^[0-9AB]{5}$/i.test(x);
const MODES = ["habitant", "total"];

const etat = {
  ...etatInitial(), // insee, annee (null = la plus récente), mode (« habitant » ou « total »)
  commune: null, // comptes de la commune, toutes années
  ticket: null, // ticket affiché
};

const LIBELLES = Object.fromEntries(
  [...CONFIG.ticket.depenses.lignes, ...CONFIG.ticket.recettes.lignes].map((l) => [l.agregat, l.libelle]),
);
LIBELLES[CONFIG.ticket.dette] = "Dette (ardoise)";
LIBELLES[CONFIG.ticket.depenses.total] = "Total dépensé";

const chargeur = creerChargeur({
  charger: async (signal) => {
    const commune = await chargerCommune(etat.insee, signal);
    if (!commune) return { commune: null };
    const annee = commune.annees[etat.annee] ? etat.annee : derniereAnnee(commune);
    // Sans médianes, le ticket s'affiche quand même (sans comparaison).
    const medianes = await chargerMedianes(annee, commune.annees[annee].tranche, signal).catch(() => null);
    return { commune, annee, medianes };
  },
  surResultat: ({ commune, annee, medianes }) => {
    // Ex. : arrondissements de Paris, Lyon, Marseille (seule la commune entière a des comptes).
    if (!commune) return message("Pas de comptes publiés pour cette commune. Pour un arrondissement, cherche la ville entière.");
    Object.assign(etat, { commune, annee, ticket: construireTicket(commune, annee, medianes) });
    memoriser();
    afficher();
  },
  surMessage: message,
});

// ---------- État : adresse de la page et mémoire du navigateur ----------

/** Priorité : adresse de la page (#commune=63113&annee=2025), puis dernière visite, puis la commune par défaut. */
function etatInitial() {
  const p = lireParametresPage();
  const m = memoire.lire();
  const insee = [p.get("commune"), m.insee].find(inseeValide) ?? CONFIG.communeParDefaut.insee;
  const mode = [p.get("mode"), m.mode].find((x) => MODES.includes(x)) ?? "habitant";
  return { insee, annee: p.get("annee"), mode };
}

function memoriser() {
  ecrireParametresPage({ commune: etat.insee, annee: etat.annee, ...(etat.mode === "total" && { mode: "total" }) });
  memoire.ecrire({ insee: etat.insee, mode: etat.mode });
}

// ---------- Affichage ----------

function message(texte) {
  $("etat").textContent = texte;
  $("etat").hidden = !texte;
}

function afficher() {
  const { commune, ticket } = etat;
  message("");
  document.title = `${commune.nom} : le ticket de caisse de ta ville`;
  afficherTicket($("ticket"), ticket, etat.mode);
  afficherEvolution($("evolution"), commune, LIBELLES, etat.mode);
  const unite = etat.mode === "total" ? "pour toute la ville" : "par habitant";
  $("evolution-titre").textContent = `${commune.nom} sur ${Object.keys(commune.annees).length} ans (${unite})`;
  for (const b of document.querySelectorAll("[data-mode]")) b.setAttribute("aria-pressed", String(b.dataset.mode === etat.mode));

  const annees = Object.keys(commune.annees).sort().reverse();
  $("annee").replaceChildren(...annees.map((a) => el("option", { value: a }, a)));
  $("annee").value = etat.annee;
}

/** Copie un texte et le confirme sur le bouton pendant 2 secondes. */
async function copier(bouton, texte, confirmation) {
  try {
    await navigator.clipboard.writeText(texte);
    const avant = bouton.textContent;
    bouton.textContent = confirmation;
    setTimeout(() => (bouton.textContent = avant), 2000);
  } catch {
    message("Copie impossible : ton navigateur l'a refusée.");
  }
}

// ---------- Démarrage ----------

function demarrer() {
  $("lien-depot").href = CONFIG.site.depot;
  brancherRechercheCommune({
    surChoix: ({ insee }) => {
      Object.assign(etat, { insee, annee: null });
      chargeur.lancer();
    },
    surErreur: message,
  });
  $("annee").addEventListener("change", (e) => {
    etat.annee = e.target.value;
    chargeur.lancer(); // les comptes sont en cache : seules les médianes de l'année sont demandées
  });
  for (const b of document.querySelectorAll("[data-mode]")) {
    b.addEventListener("click", () => {
      etat.mode = b.dataset.mode;
      memoriser();
      if (etat.ticket) afficher(); // rien à recharger : seuls les montants affichés changent
    });
  }
  $("copier-texte").addEventListener("click", (e) => etat.ticket && copier(e.target, texteTicket(etat.ticket, etat.mode), "✓ Copié, colle-le sur Discord"));
  $("copier-lien").addEventListener("click", (e) => copier(e.target, location.href, "✓ Lien copié"));
  window.addEventListener("hashchange", () => {
    const p = lireParametresPage();
    etat.mode = MODES.includes(p.get("mode")) ? p.get("mode") : "habitant";
    if (inseeValide(p.get("commune")) && (p.get("commune") !== etat.insee || p.get("annee") !== etat.annee)) {
      Object.assign(etat, { insee: p.get("commune"), annee: p.get("annee") });
      chargeur.lancer();
    } else if (etat.ticket) afficher();
  });
  chargeur.lancer();
}

demarrer();
