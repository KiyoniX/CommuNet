# TicketCommune

Le ticket de caisse de ta ville : les comptes officiels de n'importe quelle commune de France, présentés comme un ticket de caisse « pour 1 habitant ». Ce qu'elle a dépensé (salaires, achats, travaux, dette…), qui a payé (impôts locaux, État, usagers, emprunts), le « rendu » (ce qu'elle a mis de côté ou puisé dans ses réserves) et l'« ardoise » (sa dette).

**Site : https://kiyonix.github.io/TicketCommune/**

- Les données viennent de l'[OFGL](https://data.ofgl.fr/explore/dataset/ofgl-base-communes/) (Observatoire des finances et de la gestion publique locales), d'après les comptes de gestion de la DGFiP : budget principal de chaque commune, de 2018 à 2025, en euros par habitant.
- La page les lit **en direct depuis le navigateur**, en deux requêtes : les comptes de la commune (toutes les années d'un coup) et les médianes des communes de même taille.
- Chaque ligne est comparée (▲▼) à la **médiane** des communes de la même tranche de population. La médiane plutôt que la moyenne : Paris pèse 2 millions d'habitants dans la tranche des plus de 100 000.
- Les lignes de chaque section retombent sur les totaux officiels ; s'il manque des postes, une ligne « Divers » fait l'appoint.
- Deux modes : **par habitant** (les comptes divisés par toute la population, bébés compris) ou **total ville** (« 223,9 M€ », « 11,36 Md€ »). Les écarts ▲▼ restent calculés par habitant, la seule comparaison juste entre villes de tailles différentes.
- « Copier pour Discord » donne le ticket en texte à chasse fixe, prêt à coller. Le lien de la page (`#commune=63113&annee=2025&mode=total`) rouvre le même ticket.
- Un tableau « Sur 8 ans » montre l'évolution des impôts locaux, des salaires, des travaux, de la dette et du total.

Construit à partir de [ClimaBien](https://github.com/KiyoniX/ClimaBien), mais indépendant (et sans carte).

## Structure

Pas de framework ni d'étape de build : du HTML, du CSS et des modules JavaScript.

| Fichier | Rôle |
|---|---|
| `js/config.js` | **Tous les réglages** : identité, commune par défaut, **lignes du ticket** (poste officiel, libellé, explication), postes suivis sur 8 ans, tranches de population, tampon réseau |
| `js/api.js` | Lit les comptes d'une commune et les médianes de sa tranche (avec cache) |
| `js/ticket.js` | Logique pure : construit le ticket (sections, appoint « Divers », écarts, rendu, dette, désendettement) |
| `js/rendu.js` | Affiche le ticket, sa version texte pour Discord et le tableau « Sur 8 ans » |
| `js/main.js` | Point d'entrée : état (commune, année), adresse de la page, boutons |
| `js/base/` | Briques génériques : réseau, recherche de commune, formats, mémoire, chargement |
| `css/style.css` | Mise en page et **identité** (couleurs, polices) |
| `css/ticket.css` | Le ticket : papier, bords dentelés, colonnes alignées (toujours clair, même en thème sombre) |
| `logo.svg` | Logo, aussi utilisé comme icône d'onglet |
| `tests/` | Tests de la logique (`npm test`) |

## Modifier

**Changer une ligne du ticket** : la liste `ticket` de `js/config.js`. `agregat` doit être le nom exact d'un poste des comptes OFGL (par exemple `Frais de personnel`, `Dépenses d'équipement`) ; `libelle` est ce qui s'affiche, `aide` l'explication au survol.

**Changer les postes suivis sur 8 ans** : la liste `evolution` de `js/config.js`.

**Changer la commune de la première visite** : `communeParDefaut` dans `js/config.js` (code INSEE).

## Bon à savoir sur les données

- **Budget principal seulement** : les budgets annexes (parkings, eau, centre de congrès…) ne sont pas comptés.
- **L'intercommunalité n'est pas comptée** : dans les grandes villes, la métropole ou l'agglo gère souvent les transports, la voirie, l'eau ou les déchets.
- Les montants sont **par habitant** (population totale de l'INSEE) et en euros courants.
- Les arrondissements de Paris, Lyon et Marseille n'ont pas de comptes : seule la commune entière en a.
- « Remboursable en X ans » = encours de dette ÷ épargne brute (capacité de désendettement). Au-delà de 12 ans, c'est jugé préoccupant.

## Développer

Aucune dépendance à installer : il suffit de Node.js 20 ou plus récent (pour les tests) et de Python (pour le serveur local).

```sh
npm run local      # serveur local sur http://localhost:8000 (les modules JS ne marchent pas en ouvrant index.html directement)
npm test           # tests de la logique (ticket, totaux, écarts, appoint, élision), aussi lancés par GitHub Actions
```

## Mettre en ligne

GitHub → **Settings → Pages → Build and deployment** : *Deploy from a branch*, branche `main`, dossier `/ (root)`. Chaque push sur `main` met le site à jour en une minute environ.

## Forker

Un fork marche tel quel : active GitHub Pages sur ton dépôt et le site sera sur `https://<ton-pseudo>.github.io/<nom-du-dépôt>/`.

| Quoi | Où |
|---|---|
| Nom, slogan, description, couleur de la barre du navigateur | `index.html` : `<title>`, `<meta name="description">`, `<meta name="theme-color">`, `<h1>` et le slogan |
| Couleurs et polices | `css/style.css` (variables en haut) |
| Logo et icône d'onglet | `logo.svg` |
| Lien « Code source » et clé de stockage du navigateur | `site` dans `js/config.js` |

## Licence

Code sous licence MIT (voir `LICENSE`). Données : OFGL, [Licence Ouverte](https://www.etalab.gouv.fr/licence-ouverte-open-licence/). Communes : IGN Géoplateforme.
