// Tout ce qu'on peut vouloir changer se trouve ici.
// Les modules de js/base/ lisent aussi : reseau, geocodage.
export const CONFIG = {
  // Identité du site (le nom affiché et les couleurs sont dans index.html et css/style.css).
  site: {
    cleMemoire: "ticketcommune", // clé du stockage du navigateur : à changer dans un fork
    depot: "https://github.com/KiyoniX/TicketCommune", // lien « Code source » du pied de page
  },

  // Commune affichée à la première visite.
  communeParDefaut: { insee: "63113", nom: "Clermont-Ferrand" },

  // Lignes du ticket. `agregat` = nom exact du poste dans les comptes (OFGL) ; `aide` = explication au survol.
  // La somme des lignes d'une section doit retomber sur `total` : sinon une ligne « Divers » fait l'appoint.
  ticket: {
    depenses: {
      titre: "Ce que la ville a dépensé pour toi",
      total: "Dépenses totales",
      lignes: [
        { agregat: "Frais de personnel", libelle: "Salaires des agents", aide: "Rémunérations et charges de tout le personnel municipal." },
        { agregat: "Achats et charges externes", libelle: "Achats, énergie, services", aide: "Fournitures, électricité, chauffage, entretien, services achetés à des entreprises." },
        { agregat: "Dépenses d'intervention", libelle: "Aides et participations", aide: "Subventions aux associations, CCAS, participations obligatoires (pompiers…)." },
        { agregat: "Charges financières", libelle: "Intérêts de la dette", aide: "Intérêts payés aux banques sur les emprunts." },
        { agregat: "Autres dépenses de fonctionnement", libelle: "Autres frais", aide: "Le reste des dépenses courantes." },
        { agregat: "Dépenses d'équipement", libelle: "Travaux et équipements", aide: "Écoles, voirie, bâtiments, matériel : ce qui reste dans la durée." },
        { agregat: "Subventions d'équipement versées", libelle: "Aides aux travaux d'autres", aide: "Subventions d'investissement versées à d'autres organismes." },
        { agregat: "Autres dépenses d'investissement", libelle: "Autres investissements", aide: "Le reste des dépenses d'investissement." },
        { agregat: "Remboursements d'emprunts hors GAD", libelle: "Remboursement de la dette", aide: "Part du capital des emprunts remboursée cette année." },
      ],
    },
    recettes: {
      titre: "Payé par",
      total: "Recettes totales",
      lignes: [
        { agregat: "Impôts locaux", libelle: "Impôts locaux", aide: "Taxes foncières, taxe d'habitation sur les résidences secondaires…" },
        { agregat: "Autres impôts et taxes", libelle: "Autres taxes", aide: "Droits de mutation, taxe sur l'électricité, taxe de séjour…" },
        { agregat: "Concours de l'Etat", libelle: "Dotations de l'État", aide: "Argent versé par l'État, dont la dotation globale de fonctionnement." },
        { agregat: "Subventions reçues et participations", libelle: "Subventions reçues", aide: "Aides de la région, du département, de la CAF…" },
        { agregat: "Ventes de biens et services", libelle: "Ventes (cantine, piscine…)", aide: "Ce que paient les usagers des services municipaux." },
        { agregat: "Autres recettes de fonctionnement", libelle: "Autres recettes", aide: "Loyers, revenus divers." },
        { agregat: "Recettes d'investissement hors emprunts", libelle: "Aides aux travaux reçues", aide: "Remboursement de TVA (FCTVA), subventions d'investissement, ventes de biens." },
        { agregat: "Emprunts hors GAD", libelle: "Nouveaux emprunts", aide: "Argent emprunté cette année." },
      ],
    },
    dette: "Encours de dette",
    epargneBrute: "Epargne brute",
  },

  // Lignes suivies dans « Sur 8 ans ».
  evolution: ["Impôts locaux", "Frais de personnel", "Dépenses d'équipement", "Encours de dette", "Dépenses totales"],

  // Tranches de population des comptes (champ tranche_population) : comparaison avec les communes de même taille.
  tranches: {
    0: "moins de 100 habitants",
    1: "100 à 199 habitants",
    2: "200 à 499 habitants",
    3: "500 à 1 999 habitants",
    4: "2 000 à 3 499 habitants",
    5: "3 500 à 4 999 habitants",
    6: "5 000 à 9 999 habitants",
    7: "10 000 à 19 999 habitants",
    8: "20 000 à 49 999 habitants",
    9: "50 000 à 99 999 habitants",
    10: "100 000 habitants et plus",
  },
  ecartNotablePct: 25, // au-delà, l'écart avec la médiane est mis en avant

  // Tampon contre les limites des API.
  reseau: {
    attenteDeplacementMs: 0, // pas de zone à déplacer ici
    attenteSaisieMs: 300, // délai après la dernière frappe avant de chercher une commune
    ecartComptesMs: 150, // écart minimal entre deux requêtes à l'API des comptes
    ecartAdresseMs: 150, // écart minimal entre deux requêtes à l'API des adresses
    tentatives: 3, // essais en cas de réponse 429 (trop de requêtes)
  },

  // Comptes des communes 2018-2025, budget principal (OFGL, d'après les comptes de gestion de la DGFiP).
  api: "https://data.ofgl.fr/api/explore/v2.1/catalog/datasets/ofgl-base-communes",
  geocodage: "https://data.geopf.fr/geocodage", // API Adresse de l'IGN (Géoplateforme) : recherche des communes
};
