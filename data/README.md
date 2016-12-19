# anfh-ge-api-temp :: data

Gère le schéma et les données du système.

Une série de tâche gulp de création d'index et d'indexation de documents dans Elasticsearch

## Prérequis

- npm

## Install

Gulp

```sh
npm install --global gulp-cli
```

Dépendances

```sh
cd src
npm install
```

## Exécution

Préciser la machine hébergeant Elasticsearch si nécessaire (défaut: `localhost`).
Utiliser `set` plutôt que `export` sous *Microsoft Windows*.

```sh
export DB_PORT_9300_TCP_ADDR=localhost
```

Préciser le port d'écoute de Elasticsearch si nécessaire (défaut: `9200`).
Utiliser `set` plutôt que `export` sous *Microsoft Windows*.

```sh
export DB_PORT_9200_TCP_PORT=9200
```

Exécute séquentiellement toutes les tâches

```sh
gulp
```

Exécute une tâche spécifique

```sh
gulp tache_a_executer
```

Liste des tâches majeures

1. `recover_par_1_0`
  - Crée l'index `par_1_0` de mapping 1.0,
  - réalise la reprise des données,
  - crée l'alias `par` vers l'index `par_1_0`.

2. `from_par_1_0_to_1_1`
  - Crée l'index `par_1_1` de mapping 1.1,
  - migre les données de l'index `par_1_0` vers l'index `par_1_1`,
  - supprime l'alias `par` vers l'index `par_1_0`,
  - crée l'alias `par` vers l'index `par_1_1`.
3. `delete_par_1_0`
  - Supprime l'index `par_1_0`.
4. `recover_anfh_1_0`
  - Crée l'index `anfh_1_0` de mapping 1.0,
  - réalise la reprise des données,
  - crée l'alias `anfh` vers l'index `anfh_1_0`.
5. `update_1_par_1_1`
  - Transforme la durée des modules exprimées en jours/heures/minutes en durées exprimées en heures/minutes,
6. `update_2_par_1_1`
  - Ajoute la "délégation" `NAT` *Siège*
  - Recopie les actions nationales des régions dans *Siège*
