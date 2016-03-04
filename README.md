
# ANFH Gesform Evolution API Temporaire

Le site institutionnel de l'ANFH, [ANFH.fr](http://www.anfh.fr) est prévu pour afficher les Plans d'Actions Régionaux issus de [Gesform Evolution](http://gesform.anfh.fr) (GE).
Pour ce faire, ANFH.fr exploite une API que GE doit exposer.

La mise en production de ANFH.fr est cependant prévue avant celle du déploiement du lot 6.1 de Gesform Evolution (lot comprenant la gestion des plans d'action et l'API correspondante).

L'API temporaire est un système permettant de fournir temporairement l'API des Plans d'Actions Régionaux au site ANFH.fr.
Il est composé de

- une interface applicative présentant les ressources Région Formation, Axe Formation et Action Formation décritent dans le document [Gesform Evolution - API v1](https://docs.google.com/document/d/1mGhBQKpE_jTKBTFomEtEWp3L7fZFS5dYFgcQWklF6lk/edit?usp=sharing).
- une interface utilisateur permettant la saisie des axes et actions de formation constituant les plans d'accès régionaux.
- une interface de gestion facilitant l'administration
- un système de gestion des sauvegardes

![Grande Image](https://docs.google.com/drawings/d/1onNFcb48k0se2HZ8gixBZAmRFtIPicQ6yFP3nTkTjHA/pub?w=960&h=720)

## Prérequis

Le système est distribué sous la forme d'images [Docker](https://www.docker.com/).
`Docker Engine` est utilisé pour exécuter les containers.
`Docker Compose` est utilisé pour composer l'exécution des différents containers du système.

- [Install Docker Engine](https://docs.docker.com/engine/installation/)
- [Install Docker Compose](https://docs.docker.com/compose/install/)

**Consulter la page [Installation Prérequis Centos 7](https://github.com/seb-martin/anfh-ge-api-temp/wiki/Installation-Pr%C3%A9requis-Centos-7)**

![Stack](https://docs.google.com/drawings/d/1xRADlH5Yt5OSGaYKf5wEVhjSMrGvlMHQJ8lbqzwaMYE/pub?w=960&h=720)

## Installation

Cloner la branche `master` du référentiel GitHub du projet.

```sh
git clone --branch master https://github.com/seb-martin/anfh-ge-api-temp.git
cd anfh-ge-api-temp
```

Tirer les images Docker "de base" et construire les images du système.

```sh
docker-compose build
```

## Configuration par défaut

### Ports d'écoute

- L'UI écoute sur le port 8080
- L'API écoute sur le port 8081
- Elasticsearch écoute sur les ports 9200 et 9300
- Kibana écoute sur le port 5601

### Volumes de stockage

- Les données de Elasticsearch sont situées dans le répertoire `/data` de la machine hôte.
- Les référentiels de sauvegardes de Elasticsearch sont situées dans le répertoire `/backups` de la machine hôte.

> Idéalement, le répertoire des référentiels (par défaut `/backups`) devrait être le répertoire partagé
d'un serveur de sauvegarde distant monté sur la machine hôte.


## Personnaliser la configuration

Par défaut, *Docker Compose* lit deux fichiers, `docker-compose.yml` et `docker-compose.override.yml`.
`docker-compose.yml` contient la configuration de base.
`docker-compose.override.yml` contient la configuration par défaut décrite dans la section *Configuration par défaut*.

Il est possible d'utiliser une configuration alternative (prod, recette, ...).
Le fichier `docker-compose.sample.yml` est un exemple de configuration alternative.

L'option `-f` permet d'indiquer à *Docker Compose* la configuration alternative à utiliser.
Par exemple :

```sh
docker-compose -f docker-compose.yml -f docker-compose.sample.yml up -d
```

## Exécution, Arrêt

Exécuter les containers du système en mode *détaché*.

```sh
docker-compose up -d
```

Lister les containers en cours d'exécution.

```sh
docker-compose ps
```

Suivre les logs du système.

```sh
docker-compose logs
```

Stopper les containers du système.

```sh
docker-compose stop
```


## Mise à jour

Récupérer les dernières modifications.

```sh
cd anfh-ge-api-temp
git pull
```

Reconstruire les images `Docker` du projet.

```sh
docker-compose build
```

Détruire et exécuter les nouveaux containers du système.

```sh
docker-compose down
docker-compose up -d
```

## Peuplement

Dans cette section, `<index name>` fait référence à un nom d'index (ie de base de données).
Le choix de ce nom est arbitraire (`par_1`, `par_v1`, ...) mais ne doit pas être `par`.

`par` est utilisé comme nom d'alias pour l'index qui va être créé.
L'utilisation d'un alias laisse l'opportunité de réindexer les données
sans mettre à jour les applications.
Voir [Reindexing Your Data](https://www.elastic.co/guide/en/elasticsearch/guide/current/reindex.html)
et [Index Aliases and Zero Downtime](https://www.elastic.co/guide/en/elasticsearch/guide/current/index-aliases.html) sur ce sujet.

Supprimer les données existantes.

Créer le mapping.

```sh
curl -X PUT http://localhost:9200/<index name>?pretty -d @db/init/par/par-mappings.json
```

Peupler les régions de formation. Utilise l'alias `par`.

```sh
curl -s -XPOST http://localhost:9200/par/_bulk --data-binary "@db/init/par/regions.json"
```

Peupler les actions de formation. Utilise l'alias `par`.

```sh
curl -s -XPOST http://localhost:9200/par/_bulk --data-binary "@recovery/es-bulk/actions.json"
```

## Sauvegarde et restauration

### Référentiel de sauvegardes


Créer un référentiel de sauvegarde `par_backup`.

```sh
curl -XPUT 'http://localhost:9200/_snapshot/par_backup' -d '{
    "type": "fs",
    "settings": {
        "location": "par_backup",
        "compress": true
    }
}'
```

Supprimer le référentiel `par_backup`.

```sh
curl -XDELETE 'http://localhost:9200/_snapshot/par_backup'
```


### Instantanés (*Snapshots*)

Créer un instantané.

```sh
curl -XPUT 'http://localhost:9200/_snapshot/par_backup/PAR-YYYY-MM-DD-snap?pretty&wait_for_completion=true' -d '{
  "indices": ["par"],
  "ignore_unavailable": true,
  "include_global_state": false
}'
```

Lister les instantanés ; infos concernant un instantané.

```sh
curl -XGET 'http://localhost:9200/_snapshot/par_backup/_all?pretty'
curl -XGET 'http://localhost:9200/_snapshot/par_backup/PAR-YYYY-*-snap?pretty'
curl -XGET 'http://localhost:9200/_snapshot/par_backup/PAR-YYYY-MM-DD-snap?pretty'
```

Restaurer un instantané.

```sh
curl -XPOST 'http://localhost:9200/_snapshot/par_backup/PAR-YYYY-MM-DD-snap/_restore?pretty'
```

Supprimer un instantané.

```sh
curl -XDELETE 'http://localhost:9200/_snapshot/par_backup/PAR-YYYY-MM-DD-snap?pretty'
```


# Machine Virtuelle

Pour le développement, une machine virtuelle (VM) [Vagrant](https://www.vagrantup.com/), testée avec [Virtual Box](https://www.virtualbox.org/), est disponible.



Installer le plugin `vagrant-vbguest`.
Ce plugin permet d'installer automatiquement les *VirtualBox Guest Additions* de la machine hôte sur le système invité (ie la VM).
Plus d'infos sur le [repo GitHub du plugin](https://github.com/dotless-de/vagrant-vbguest).

```sh
vagrant plugin install vagrant-vbguest
```


Installer le plugin `vagrant-docker-compose`.
Ce plugin permet de provisionner la VM avec Docker Compose.
Plus d'infos sur le [repo GitHub du plugin](https://github.com/leighmcculloch/vagrant-docker-compose).

```sh
vagrant plugin install vagrant-docker-compose
```

Lancer la VM.

```sh
vagrant up
```

Se connecter à la VM avec SSH.

```sh
vagrant ssh
```

- L'UI écoute sur le port 8080
- L'API écoute sur le port 8081
- Elasticsearch écoute sur les ports 9200 et 9300
- SSH écoute sur le port 2222
