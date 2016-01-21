
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





Vagrant
====


Installer le plugin `vagrant-docker-compose`

`$ vagrant plugin install vagrant-docker-compose`
