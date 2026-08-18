# Piste FR — prototype déployable

Classement d'athlétisme français construit avec Vite + React + Tailwind.
Reprend fidèlement tout ce qui a été développé et testé dans l'artifact
Claude (tours de course, classement calculé sur données réelles,
déduplication des athlètes, saisie de temps structurée, calendrier des
compétitions), mais organisé en vrais fichiers pour pouvoir être testé et
déployé en dehors de Claude.ai.

## Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée (en général `http://localhost:5173`).

## Build de production

```bash
npm run build
npm run preview   # pour tester le build localement
```

## Arborescence

```
src/
  main.jsx                 point d'entrée
  index.css                variables CSS (couleurs, polices) + styles globaux
  App.jsx                  état global de l'app, chargement/sauvegarde, routage entre pages

  data/
    disciplines.js         liste des épreuves (100m → 400m haies)
    competitions.js        niveaux de compétition (tags), statuts, compétitions de départ
    seed.js                données réelles de démarrage (Championnats de France 2026, Albi)

  lib/
    storage.js              *** couche de persistance — voir plus bas ***
    supabaseClient.js        client Supabase (URL + clé depuis .env)
    auth.jsx                 contexte d'authentification (session, rôle, login/logout)
    time.js                 formatage/parsing des temps (standard + notation à apostrophes)
    rounds.js                séries / demi-finales / finales
    athletes.js              normalisation des noms, déduplication (Levenshtein)
    parsing.js                analyse de tableaux collés (+ OCR en pause, non branché)
    ranking.js                classement calculé, historique athlète, statut de saisie
    util.js                   utilitaires génériques (uid)

  components/
    Header.jsx                 nav Classement / Calendrier / Admin + recherche + connexion
    AthleteSearch.jsx           recherche d'athlète globale (dans le header)
    LoginPanel.jsx               connexion / inscription / déconnexion
    ClassementPage.jsx          page d'accueil : hero, filtres, classement paginé
    CalendarTab.jsx             liste des compétitions, filtres, ajout (éditeurs)
    CompetitionEditorPage.jsx   page d'une compétition : filtre discipline/sexe + tours
    RoundPicker.jsx              sélecteur finale/demi/série
    ResultBlockForm.jsx          formulaire de saisie (manuelle + collage de texte)
    ResultsTable.jsx              tableau d'affichage des résultats d'un tour
    NameField.jsx / TimeField.jsx / WindField.jsx   champs de saisie structurés
    AthleteProfilePanel.jsx       fiche athlète (records + historique)
    AdminPage.jsx                 statistiques + gestion des comptes éditeurs

supabase/
  schema.sql                 script SQL à exécuter une fois dans Supabase (tables + RLS)
```

## Stockage des données, auth et droits — Supabase

Le projet est branché sur [Supabase](https://supabase.com) : base Postgres
gratuite + authentification. Les données (compétitions/résultats/athlètes)
restent stockées comme avant sous forme de blobs JSON — juste hébergées sur
Supabase (table `app_data`) au lieu du `localStorage` du navigateur — via
le même fichier `src/lib/storage.js`, avec la même interface qu'avant.

**Sécurité** : le contrôle des droits (qui peut lire/écrire) est appliqué
par Supabase lui-même via des règles RLS (Row Level Security), pas par le
code JavaScript du site. Concrètement : tout le monde peut lire sans
compte, mais écrire nécessite un compte avec le rôle `editor` ou `admin` —
et cette vérification a lieu côté serveur, donc impossible à contourner en
trafiquant le code dans le navigateur.

### Mise en place (une seule fois)

1. **Exécuter le schéma SQL** : ouvre l'éditeur SQL de ton projet Supabase
   (SQL Editor → New query), colle le contenu de `supabase/schema.sql`,
   clique Run. Ça crée les tables (`app_data`, `profiles`, `editor_invites`)
   et toutes les règles de sécurité.
2. **Renseigner les clés** : le fichier `.env` est déjà rempli avec l'URL
   et la clé publique (`anon`) de ton projet. Si tu changes de projet
   Supabase, mets à jour `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
   (voir `.env.example` pour le format). Cette clé est *publique par
   conception* — ce n'est pas un secret, la sécurité vient des règles RLS,
   pas de cette clé. Ne jamais en revanche partager la clé `service_role`
   si tu la croises dans les réglages Supabase : elle contourne toutes les
   règles de sécurité.
3. **Devenir admin** : lance `npm run dev`, clique "Se connecter" → "Créer
   un compte" avec ton email. Puis, dans l'éditeur SQL Supabase, exécute
   (en remplaçant l'email) :
   ```sql
   insert into profiles (id, email, role)
   select id, email, 'admin' from auth.users where email = 'ton-email@exemple.com'
   on conflict (id) do update set role = 'admin';
   ```
   Tu es maintenant admin — l'onglet "Admin" apparaît dans le header.
4. Depuis la page Admin, tu peux ensuite inviter des éditeurs par email
   sans repasser par SQL : dès qu'une personne invitée crée un compte avec
   cet email, elle reçoit automatiquement le rôle prévu.

### Statistiques de visites

La page Admin affiche les compteurs de données (athlètes/compétitions/
résultats), calculés directement depuis les tables. Pour le nombre de
**visites**, plutôt que coder un système maison, il est recommandé de
brancher un outil dédié, gratuit et sans cookie : par exemple
[Umami](https://umami.is) (auto-hébergeable gratuitement, ou offre cloud
gratuite limitée) ou [Plausible](https://plausible.io). Ça consiste à
coller une balise `<script>` dans `index.html` et à consulter leur propre
tableau de bord — pas de développement supplémentaire nécessaire.

## Déploiement (gratuit)

1. Pousser ce dossier sur un dépôt GitHub.
2. Sur [Vercel](https://vercel.com) ou [Netlify](https://netlify.com) : "New Project" → importer le dépôt → c'est un projet Vite standard, la détection est automatique (`npm run build`, dossier `dist`).
3. Déploiement en quelques minutes, URL publique gratuite (ex. `piste-fr.vercel.app`).

À ce stade, le stockage reste `localStorage` : chaque visiteur a ses
propres données locales. Pour une vraie base partagée, l'étape suivante
est de brancher [Supabase](https://supabase.com) (Postgres gratuit jusqu'à
un certain volume) en réécrivant `src/lib/storage.js`.

## Fonctionnalités reprises du prototype

- Classement calculé à partir des vraies données saisies (plus de données fictives), avec pagination et taille de page réglable.
- Recherche d'athlète globale depuis le header.
- Tours de course : finale, demi-finales et séries numérotées, par discipline et par sexe.
- Déduplication des athlètes à la saisie (accents, majuscules, ordre nom/prénom, fautes de frappe).
- Temps saisis via champs structurés (jamais de texte libre) ; vent capturé pour les épreuves concernées.
- Saisie manuelle ligne par ligne, ou collage de texte copié depuis un site de résultats.
- Calendrier des compétitions avec statut (à saisir / en cours / saisi — ce dernier marqué manuellement), niveau (majeure/nationale/circuit/régionale) et suivi.
- Fiche athlète unifiée (records personnels + historique complet, cliquable vers chaque compétition).
- **Comptes et droits** : site public en lecture sans compte ; édition réservée aux comptes `editor`/`admin` (sécurisé côté base via RLS, pas côté client) ; page Admin pour inviter/révoquer des éditeurs et voir les statistiques.
- OCR (lecture d'image) : code conservé dans `src/lib/parsing.js` mais mis en pause côté interface — le collage de texte s'est avéré plus fiable dans l'environnement testé.

## Reste à faire (connu)

- Autres disciplines (sauts, lancers, épreuves combinées) — le modèle de données le permet, il "suffit" d'étendre `data/disciplines.js` et d'adapter `TimeField`/`ResultsTable` pour un type "distance"/"points" en plus du type "temps".
- Autres pays / classements internationaux.
- Ex-aequo : le classement les trie correctement mais leur donne des rangs séquentiels plutôt qu'un affichage "2 ex-aequo".
- Édition des métadonnées d'une compétition existante (nom/date/lieu) — seul l'ajout est possible pour l'instant.
- Historique des modifications (qui a modifié quoi) — utile une fois plusieurs éditeurs actifs.
- Migration éventuelle vers un schéma relationnel complet (tables séparées `athletes`/`competitions`/`results` plutôt que des blobs JSON) si le site grossit et a besoin de requêtes plus riches.
- Connecter un outil d'analytics (Umami/Plausible) pour les statistiques de visite — voir section ci-dessus.
