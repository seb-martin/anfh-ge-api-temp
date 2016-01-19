# Initialisation de la base de données

## Elasticsearch

> Elasticsearch is a distributed, open source search and analytics engine, designed for horizontal scalability, reliability, and easy management. It combines the speed of search with the power of analytics via a sophisticated, developer-friendly query language covering structured, unstructured, and time-series data.

- [Page d'accueil de Elasticsearch](https://www.elastic.co/fr/)

### Installation

Télécharger et décompresser la version `2.1.1` de Elasticsearch.

- [Téléchargement et instructions d'installation](https://www.elastic.co/downloads/elasticsearch)


### Configuration

La configuration de Elasticsearch s'effectue dans le fichier `config/elasticsearch.yml`.

- [Documentation ES sur les options de configuration](http://www.elastic.co/guide/en/elasticsearch/reference/current/setup-configuration.html)

#### CORS

- [CORS sur le W3C](http://www.w3.org/TR/cors/)
- [CORS sur Wikipedia](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
- [Documentation ES sur le paramétrage HTTP](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-http.html)

Pour accepter toutes les origines :

```yml
http.cors.enabled: true
http.cors.allow-origin: '*'
```

Pour n'accepter que les origines dans le domaine `anfh.fr`:

```yml
http.cors.enabled: true
http.cors.allow-origin: '*.anfh.fr'
```

### Démarrage

```sh
> bin/elasticsearch
```

### Test

```sh
> curl -X GET http://localhost:9200/
```


## Mapping

- [Documentation ES sur le mapping](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html)

### Index `par`

Supprimer toutes les données existantes :

```sh
> curl -X DELETE /par?pretty
```
```json
{
  "acknowledged": true
}
```

Le fichier `par/par-mappings.json` contient le mapping des types de l'index `par`.

```sh
> curl -X PUT /par?pretty -d @par/par-mappings.json
```
```json
{
  "acknowledged": true
}
```

## Données

### Index `par`

Insérer les données

```sh
> curl -X POST /par/_bulk -d @par/regions.json
```
```json
{
  "took": 121,
  "errors": false,
  "items": [
    {
      "index": {
        "_index": "par",
        "_type": "regions",
        "_id": "ALP",
        "_version": 1,
        "_shards": {
          "total": 2,
          "successful": 1,
          "failed": 0
        },
        "status": 201
      }
    },
    ...
  ]
}
```


```sh
> curl -X POST /par/_bulk -d @par/axes.json
```
```json
{
  "took": 178,
  "errors": false,
  "items": [
    {
      "index": {
        "_index": "par",
        "_type": "axes",
        "_id": "A",
        "_version": 1,
        "_shards": {
          "total": 2,
          "successful": 1,
          "failed": 0
        },
        "status": 201
      }
    },
    ...
  ]
}
```

```sh
> curl -X POST /par/_bulk -d @par/actions.json
```
```json
{
  "took": 193,
  "errors": false,
  "items": [
    {
      "create": {
        "_index": "par",
        "_type": "actions",
        "_id": "AVI4FcyXe6aS2w6dHD8h",
        "_version": 1,
        "_shards": {
          "total": 2,
          "successful": 1,
          "failed": 0
        },
        "status": 201
      }
    },
    ...
  ]
}
```


