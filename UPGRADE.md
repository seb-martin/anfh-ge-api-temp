# Peuplement

## Mettre à jour les images du système

Récupérer les dernières modifications.

```sh
cd /anfh-ge-api-temp
git pull
```

Reconstruire les images `Docker` du projet.

```sh
docker-compose -f docker-compose.yml -f docker-compose.admin.yml build
```

## Arrêter le système

```sh
docker-compose down
```

## Migration

Lancer le conteneur de base de données

```sh
docker-compose -f docker-compose.yml -f docker-compose.sample.yml up -d db
```

### Domaine du PAR 1.0 (Reprise de données)

- Crée l'index `par_1_0` de mapping 1.0,
- réalise la reprise des données,
- crée l'alias `par` vers l'index `par_1_0`.

```sh
docker-compose -f docker-compose.yml -f docker-compose.sample.yml -f docker-compose.admin.yml run data recover_par_1_0
```

### Domaine du PAR 1.1 (Migration depuis 1.0)

- Crée l'index `par_1_1` de mapping 1.1,
- migre les données de l'index `par_1_0` vers l'index `par_1_1`,
- supprime l'alias `par` vers l'index `par_1_0`,
- crée l'alias `par` vers l'index `par_1_1`.

```sh
docker-compose -f docker-compose.yml -f docker-compose.sample.yml -f docker-compose.admin.yml run data from_par_1_0_to_1_1
```

Supprime l'index `par_1_0`.


```sh
docker-compose -f docker-compose.yml -f docker-compose.sample.yml -f docker-compose.admin.yml run data delete_par_1_0
```

### Domaine ANFH 1.0 (Reprise de données)

- Crée l'index `anfh_1_0` de mapping 1.0,
- réalise la reprise des données,
- crée l'alias `anfh` vers l'index `anfh_1_0`.

```sh
docker-compose -f docker-compose.yml -f docker-compose.sample.yml -f docker-compose.admin.yml run data recover_anfh_1_0
```

### Mise à jour 1 des données du PAR 1.1 (Durées exprimées en heures et non en jours)

- Transforme la durée des modules exprimées en jours/heures/minutes en durées exprimées en heures/minutes,

```sh
docker-compose -f docker-compose.yml -f docker-compose.sample.yml -f docker-compose.admin.yml run data update_1_par_1_1
```

### Mise à jour 2 des données du PAR 1.1 (Ajout du siège aux délégations)

- Ajoute la "délégation" `NAT` *Siège*
- Recopie les actions nationales des régions dans *Siège*

```sh
docker-compose -f docker-compose.yml -f docker-compose.sample.yml -f docker-compose.admin.yml run data update_2_par_1_1
```

## Relancer le système.

```sh
docker-compose -f docker-compose.yml -f docker-compose.sample.yml up -d
```
