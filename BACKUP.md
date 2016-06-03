# Sauvegarde et restauration

Lister les commandes de sauvegarde et restauration.

```sh
docker-compose -f docker-compose.yml -f docker-compose.admin.yml run admin
```

### Initialisation du référentiel des sauvegardes

Initialiser le référentiel de sauvegarde `par_repo`.

```sh
docker-compose -f docker-compose.yml -f docker-compose.admin.yml run admin backup-init
```

## Instantanés (*Snapshots*)

Créer un instantané.

```sh
docker-compose -f docker-compose.yml -f docker-compose.admin.yml run admin backup-snapshot --snapshot nom_snapshot
```

Lister les instantanés

```sh
docker-compose -f docker-compose.yml -f docker-compose.admin.yml run admin backup-list
```

```sh
docker-compose -f docker-compose.yml -f docker-compose.admin.yml run admin backup-list --filter nom_*
```

Restaurer un instantané.

```sh
docker-compose -f docker-compose.yml -f docker-compose.admin.yml run admin backup-restore --snapshot nom_snapshot
```

Supprimer un instantané.

```sh
docker-compose -f docker-compose.yml -f docker-compose.admin.yml run admin backup-delete --snapshot nom_snapshot
```

## Destruction du référentiel des sauvegardes

> Attention, cette opération détruira le  référentiel et tous les instantanés qu'il contient.

Détruire le référentiel `par_repo`.

```sh
docker-compose -f docker-compose.yml -f docker-compose.admin.yml run admin backup-detroy
```

```sh
docker-compose -f docker-compose.yml -f docker-compose.admin.yml run admin backup-detroy --force
```
