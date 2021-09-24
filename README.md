![image](https://user-images.githubusercontent.com/85548796/134628003-895ecb51-fab1-4993-9cb9-53c3ea52d58b.png)


# Qu'est ce que AppCarto
AppCarto est une application web destinée à diffuser des données SIG.
Le développement a été initié par le [Parc national des Pyrénées](http://www.pyrenees-parcnational.fr) pour répondre à son besoin de partager en interne et à destination des agents les données de son système d'information géographique.
L'objectif, à terme, est d'en faire une mini application SIG en ligne permettant notamment la création et le partage de couche de données et d'y implémenter des fonctions spatiales élémentaires (intersection / fusion ....).

AppCarto peut être vu comme une application sattelite de [GeoNature](https://github.com/PnX-SI/GeoNature) car elle s'appui sur l'API de [GeoNature](https://github.com/PnX-SI/GeoNature) pour l'authentification des utilisateurs (centralisation des comptes) et la recherche de taxon dans le référentiel TaxRef. 
Un pont doit également être configuré pour permettre d'alimenter AppCarto avec les données d'observations.
Pour les autres données, AppCarto a été pensé pour s'intégrer dans un système d'information déjà existant favorisant la centralisation des données. Les données géographiques restent ou elles sont, à partir du moment ou elles sont dans une base de données postgis. L'administrateur d'AppCarto n'a qu'à déclarer les couches pour les rendre disponible dans l'application.

AppCarto est une plateforme web développée principalement en python et en javascript et se basant sur les librairies suivantes:
- [Flask](https://flask.palletsprojects.com/en/2.0.x/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [Marshmallow](https://marshmallow.readthedocs.io/en/stable/)
- [OpenLayers](https://openlayers.org/)
- [Bootstrap](https://getbootstrap.com/)
- [html2canvas](https://github.com/niklasvh/html2canvas)
- [jsPDF](https://artskydj.github.io/jsPDF/docs/index.html)
- [select-pure](https://www.cssscript.com/multi-select-autocomplete-selectpure/)
- [svg-inject](https://github.com/iconfu/svg-inject)
- [tabulator](http://tabulator.info/)

### Présentation des fonctionnalités
L'objectif d'AppCarto est d'être une application SIG minimaliste.
Au stade d'avancement actuel, l'application offre la possibilité à l'utilisateur :
- d'afficher des couches de données (possibilité de changer l'ordre des couches et le niveau de transparence)
- d'interroger les données d'observation naturaliste (données [GeoNature](https://github.com/PnX-SI/GeoNature))
- d'exporter la table attributaire d'une couche en CSV
- de filtrer les entité d'une couche de données à partir de la table attributaire
- de lancer des calculs d'enjeux sur un périmètre spécifique
- d'exporter des cartes en PDF

L'administrateur de l'application à quant à lui :
- de configurer les fonds de carte affichable (flux WMTS)
- de déclarer une couche (= ajouter une couche) :
  - définition du style par défaut (optionnel)
  - définir la liste des champs devant être accessible
  - définir si c'est une couche à enjeux
- de définir les classes (seuil et couleur) associées aux données d'observations
  
Les objectifs à terme seraient d'offrir la possibilité à l'utilisateur :
- de pouvoir modifier le style d'une couche
- de créer de nouvelle couche de données
- de configurer des projets qu'il pourra réouvrir plus tard
- de lui permettre de partager des couches de données et des projets à d'autres utilisateurs (en lecture ou écriture)
- et pourquoi pas intégrer petit-à-petit des fonctions de traitment spatial (intersection / fusion ...)
- ...
Et d'offirir une interface d'aministration pour l'ajout des couches de données.

### Base de données
App_carto s'appui donc sur deux bases de données:
- la base dédiée à l'application
- la base de données hebergeant les couches SIG (appelé dans la suite la **base de données "data"**)

#### Représentation de la base de données applicative

![image](https://user-images.githubusercontent.com/85548796/134653814-140cad56-b3ab-403b-9090-d94560bef9bf.png)

Les tables grisées sont une projection dans le cadre des développements à venir. Elle seront potentiellement amenées à évoluer.

# Installation

## Installation de la base de donées

La base de données applicative a été installé sur un **PostgreSQL 12** en suivant les actions suivantes :
- Installer PostgreSQL (sur le serveur applicatif ou tout autre serveur).
- Créer un rôle qui sera administrateur de cette base de données.
- Se connecter à la base de données avec ce role
- Exécuter le contenu du fichier d'installation de la base de données [install/install_db.sql](https://github.com/PNPyrenees/app_carto/blob/dev/install/install_db.sql)

## Installation de l'applicatif

L'installation d'AppCarto a été réalisé sur un **ubuntu server 20.04**
Vous trouverez la préocédure d'installation dans le fichier [doc/installation](https://github.com/PNPyrenees/app_carto/blob/dev/doc/installation)

## Finalisation de l'installation
Il est nécessaire de peupler quelques tables afin que l'application puisse fonctionner :

### Echelle de restitution des données d'observation

#### app_carto.bib_mesh_scale
Permet d'activer des échelles de restitution des données d'observations.
Par défaut seul sont activé les maille de 2km, 1km, 500m, 250m, 100m

Il est possible d'ajouter des echelles de restitution en ajoutant des lignes dans cette table.

Description de la table :
```
mesh_scale_id : clés primaire auto-incrémenté
mesh_scale_label : nom de l'echelle de restitution
active: booléen permetant d'activer ou non la restitution à une certaine echelle
```

#### app_carto.bib_mesh 
Cette table contient les objets géographiques correspondant aux différentes échelles de restitution. A minima, il faudra insérer les données pour les echelles activées dans **app_carto.bib_mesh_scale**

Description de la table :
```
mesh_id : Clés primaire auto-incrémentée
mesh_scale_id : Clés étrangère permettant d'associer une géométrie à une echelle de restitution
geom: Géométrie de l'objet
```

### référentiel commune
Alimenter la table app_cato.bib_commune avec les communes de votre territoire

Description de la table :
```
insee_com : clés primaire reprenant le code insee de la commune
nom_com : Nom de la commune
```

### Statuts des espèces
Par défaut, un certain nombre de status (et de regrouppement de statut) sont déclaré. Il est possible d'en ajouté en éditant les table suivantes :
- app_carto.bib_group_status
```
group_status_id : Clés primaire auto-incrémentée
group_status_label : Nom textuelle du regrouppement de status
group_status_description : Description de ce qui est contenu dans le groupe de status
group_status_is_warning : Booléen permettant d'inclure les espèces ayant un statut associé à ce groupe dans le calcul des enjeux
active : Booléen permettant d'activer ou non un groupe de statut
```

- app_carto.bib_status_type
```
status_type_id : Clés primaire auto-incrémentée
statut_type_label : Nom textuel du statut
group_statut_id : Clés étrangère identifiant à quel group est associé le statut
active : Booléen permettant d'activer ou non un statut
```

### Intégration des données d'observations
Il faut alimenter l'ensemble des tables suivantes à partir des données d'observation (issue de la synthèse de [GeoNature](https://github.com/PnX-SI/GeoNature) ou d'ailleur):
- app_carto.t_observations : table des observations
```
obs_id : identifiant unique de l'observation (favoriser l'identifiant dans la base de onnées source)
obs_uuid : identifiant unique de la données dans le SINP
cd_ref : code de référence taxon dans taxref
group_2_inpn : Regrouppement vernaculaire issue de taxref 
date_min : date de début d'observation
date_max : date de fin d'observation
altitude_min : altitude minimale d'observation
altitude_max : altitude maximal d'obervation
nom_cite : nom de l'espèce tel que cité par l'observateur
nom_valide : nom retenu de l'espèce dans taxref
nom_vern : nom vernaculaire de lespèce dans taxref
regne : regne auquel le taxon apparatient issue de taxref
geom : objet géométrique associé à l'observation
```

- app_carto.cor_observation_commune : lien entre une observation et les communes
```
obs_id : identifiant de l'observation dans app_carto.t_observations
insee_com : identifiant de la commune dans app_carto.bib_commune
```

- app_carto.cor_observation_mesh : lien entre l'observation et les echelle de restitution 
```
obs_id : identifiant de l'observation dans app_carto.t_observations
mesh_id : identifiant de la maille  dans app_carto.bib_mesh
```

-app_carto.cor_observation_status : status de l'espèce relatif à l'observation (= une espèce protégée **uniquement** dans les Pyrénées-Atlantiques ne doit pas être identifié comme protégée si elle est observée dans les hautes-Pyrénées)
```
obs_id: identifiant de l'observation dans app_carto.t_observations
status_type_id : identifiant du status dans app_carto.bib_statut_type
```

### Intégration des toponyme
La table bib_toponyme doit être alimenter avec les toponymes de votre territoire afin de permettre à l'utilisateur de réaliser la recherche d'un lieux dit.

Description de la table :
```
id : Clés primaire auto-incrémentée
mesh_scale_id : Clés étrangère permettant d'associer une géométrie à une echelle de restitution
geom: Géométrie de l'objet
```


# FAQ
## Comment ajouter une couche de données ?

La déclaration d'une couche de données doit se faire en base de données en ajoutant une ligne à la table app_carto.t_layers.
Déscription des champs:
```
layer_id : clés primaire auto-incrémenté
layer_schema_name : nom du schéma dans la base de données "data"
layer_table_name : Nom de la table de données dans la base de données "data"
layer_group : Nom permettant de regroupper les couche sur l'interface (TODO : sortir ce champ dans une table dédiée aux "groupes de couche" dans la base applicative)
layer_label : Alias du nom de la couche qui sera affiché dans l'application
layer_is_default : (ce champ est our l'instant sans effet)
layer_default_style : définition du style par défaut à appliquer à la couche en format JSON (voir [doc/exemple_json_style](https://github.com/PNPyrenees/app_carto/blob/dev/doc/Exemple_json_style)

```






