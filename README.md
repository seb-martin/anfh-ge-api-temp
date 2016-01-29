
# ANFH Gesform Evolution API Temporaire

Le site institutionnel de l'ANFH, [ANFH.fr](http://www.anfh.fr) est prévu pour afficher les Plans d'Actions Régionaux issus de [Gesform Evolution](http://gesform.anfh.fr) (GE).
Pour ce faire, ANFH.fr exploite une API que GE doit exposer.

La mise en production de ANFH.fr est cependant prévue avant celle du déploiement du lot 6.1 de Gesform Evolution (lot comprenant la gestion des plans d'action et l'API correspondante).

L'API temporaire est un système permettant de fournir temporairement l'API des Plans d'Actions Régionaux au site ANFH.fr.
Il est composé de

- une application présentant les ressources Région Formation, Axe Formation et Action Formation décritent dans le document [Gesform Evolution - API v1](https://docs.google.com/document/d/1mGhBQKpE_jTKBTFomEtEWp3L7fZFS5dYFgcQWklF6lk/edit?usp=sharing).
- une application présentant une interface utilisateur permettant la saisie des axes et actions de formation.


## Prérequis

Le système est distribué sous la forme d'images [Docker](https://www.docker.com/).
`Docker Engine` est utilisé pour exécuter les containers.
`Docker Compose` est utilisé pour composer l'exécution des différents containers du système.

- [Install Docker Engine](https://docs.docker.com/engine/installation/)
- [Install Docker Compose](https://docs.docker.com/compose/install/)


## Installation

Cloner le projet.

```sh
git clone https://github.com/seb-martin/anfh-ge-api-temp.git
cd anfh-ge-api-temp
```

Tirer les images Docker "de base", construire les images du projet et exécuter les containers du système.

```sh
docker-compose up -d
```

## Interfaces

- L'API écoute sur le port 80
- L'UI écoute sur le port 81
- Elasticsearch écoute sur les ports 9200 et 9300

## Stockage

Les données de Elasticsearch sont situées dans le répertoire `/data` de la machine hôte.

## Peuplement

Créer le mapping.

```sh
curl -X PUT http://localhost:9200/par?pretty -d @db/init/par/par-mappings.json
```

Peupler les régions de formation.

```sh
curl -X POST http://localhost:9200/par/_bulk -d @db/init/par/regions.json
```

# Machine Virtuelle

Pour le développement, une machine virtuelle (VM) [Vagrant](https://www.vagrantup.com/), testée avec [Virtual Box](https://www.virtualbox.org/), est disponible.


Installer le plugin `vagrant-docker-compose`

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

- L'API écoute sur le port 8080
- L'UI écoute sur le port 8081
- Elasticsearch écoute sur les ports 9200 et 9300
- SSH écoute sur le port 2222
