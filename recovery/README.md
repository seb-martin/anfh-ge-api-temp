# Reprise de données

Transforme un fichier d'export d'offres de formation extrait du site ANFH.fr (< 2016) en un fichier "bulk" elasticsearch.

## Prérequis

Node JS (`node`) et son gestionnaire de package (`npm`) doivent être installés.

## Générer le fichier bulk

- Le fichier d'export analysé : `./export-supersoniks/export_formations.xml`
- Le fichier bulk généré : `./es-bulk/action.json

Installer les packages Node JS

```sh
npm install
```

Générer le fichier bulk

```sh
node index.js
```
