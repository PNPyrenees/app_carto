<div>
<img align="left" src="https://user-images.githubusercontent.com/85548796/134670189-3518e579-cdba-4630-b35d-b902fd402df8.png" alt="drawing" width="150"/>
<img align="right" src="https://user-images.githubusercontent.com/85548796/134628003-895ecb51-fab1-4993-9cb9-53c3ea52d58b.png" alt="drawing" width="150"/>
</div>

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
AppCarto s'appui donc sur deux bases de données:
- la base dédiée à l'application
- la base de données hebergeant les couches SIG (appelé dans la suite la **base de données "data"**)

#### Représentation de la base de données applicative

![image](https://user-images.githubusercontent.com/85548796/134653814-140cad56-b3ab-403b-9090-d94560bef9bf.png)

Les tables grisées sont une projection dans le cadre des développements à venir. Elle seront potentiellement amenées à évoluer.

# Installation et configuration

## Installation de la base de donées

La base de données applicative a été installé sur un **PostgreSQL 12** en suivant les actions suivantes :
- Installer PostgreSQL (sur le serveur applicatif ou tout autre serveur).
- Créer un rôle qui sera administrateur de cette base de données.
- Se connecter à la base de données avec ce role
- Exécuter le contenu du fichier d'installation de la base de données [install/install_db.sql](https://github.com/PNPyrenees/app_carto/blob/dev/install/install_db.sql)

## Installation de l'applicatif

L'installation d'AppCarto a été réalisé sur un **ubuntu server 20.04**
Vous trouverez la préocédure d'installation dans le fichier [doc/installation](https://github.com/PNPyrenees/app_carto/blob/dev/doc/installation)

## Finalisation de l'installation et alimentation de la base de données applicative
Il est nécessaire de peupler quelques tables afin que l'application puisse fonctionner :

### Echelle de restitution des données d'observation

#### app_carto.bib_mesh_scale
Permet d'activer des échelles de restitution des données d'observations.
Par défaut seul sont activé les maille de 2km, 1km, 500m, 250m, 100m

Il est possible d'ajouter des echelles de restitution en ajoutant des lignes dans cette table.

Description de la table :

Nom du champ  | description
------------- | -------------
mesh_scale_id  | Clés primaire auto-incrémenté
mesh_scale_label  | Nom de l'echelle de restitution
active | Booléen permetant d'activer ou non la restitution à une certaine echelle

#### app_carto.bib_mesh 
Cette table contient les objets géographiques correspondant aux différentes échelles de restitution. A minima, il faudra insérer les données pour les echelles activées dans **app_carto.bib_mesh_scale**

Description de la table :
Nom du champ  | description
------------- | -------------
mesh_id  | Clés primaire auto-incrémentée
mesh_scale_id  | Clés étrangère permettant d'associer une géométrie à une echelle de restitution
geom | Géométrie de l'objet

### référentiel commune
Alimenter la table app_cato.bib_commune avec les communes de votre territoire

Description de la table :
Nom du champ  | description
------------- | -------------
insee_com  | Clés primaire reprenant le code insee de la commune
nom_com | Nom de la commune

### Statuts des espèces
Par défaut, un certain nombre de status (et de regrouppement de statut) sont déclaré. Il est possible d'en ajouté en éditant les table suivantes :
- app_carto.bib_group_status

Nom du champ  | description
------------- | -------------
group_status_id  | Clés primaire auto-incrémentée
group_status_label | Nom textuelle du regrouppement de status
group_status_description | Description de ce qui est contenu dans le groupe de status
group_status_is_warning | Booléen permettant d'inclure les espèces ayant un statut associé à ce groupe dans le calcul des enjeux
active| Booléen permettant d'activer ou non un groupe de statut

- app_carto.bib_status_type

Nom du champ  | description
------------- | -------------
status_type_id | Clés primaire auto-incrémentée
statut_type_label | Nom textuel du statut
group_statut_id | Clés étrangère identifiant à quel group est associé le statut
active | Booléen permettant d'activer ou non un statut

### Intégration des données d'observations
Il faut alimenter l'ensemble des tables suivantes à partir des données d'observation (issue de la synthèse de [GeoNature](https://github.com/PnX-SI/GeoNature) ou d'ailleur):
- app_carto.t_observations : table des observations

Nom du champ  | description
------------- | -------------
obs_id | identifiant unique de l'observation (favoriser l'identifiant dans la base de onnées source)
obs_uuid | identifiant unique de la données dans le SINP
cd_ref | code de référence taxon dans taxref
group_2_inpn | Regrouppement vernaculaire issue de taxref 
date_min | date de début d'observation
date_max | date de fin d'observation
altitude_min | altitude minimale d'observation
altitude_max | altitude maximal d'obervation
nom_cite | nom de l'espèce tel que cité par l'observateur
nom_valide | nom retenu de l'espèce dans taxref
nom_vern | nom vernaculaire de lespèce dans taxref
regne | regne auquel le taxon apparatient issue de taxref
geom | objet géométrique associé à l'observation

- app_carto.cor_observation_commune : lien entre une observation et les communes

Nom du champ  | description
------------- | -------------
obs_id | identifiant de l'observation dans app_carto.t_observations
insee_com | identifiant de la commune dans app_carto.bib_commune

- app_carto.cor_observation_mesh : lien entre l'observation et les echelle de restitution 

Nom du champ  | description
------------- | -------------
obs_id | identifiant de l'observation dans app_carto.t_observations
mesh_id | identifiant de la maille  dans app_carto.bib_mesh

-app_carto.cor_observation_status : status de l'espèce relatif à l'observation (= une espèce protégée **uniquement** dans les Pyrénées-Atlantiques ne doit pas être identifié comme protégée si elle est observée dans les hautes-Pyrénées)

Nom du champ  | description
------------- | -------------
obs_id | identifiant de l'observation dans app_carto.t_observations
status_type_id | identifiant du status dans app_carto.bib_statut_type

### Intégration des toponymes
La table bib_toponyme doit être alimenter avec les toponymes de votre territoire afin de permettre à l'utilisateur de réaliser la recherche d'un lieux dit.

Description de la table :
Nom du champ  | description
------------- | -------------
toponyme_id | Clés primaire auto-incrémentée
toponyme_nom | Toponyme textuel
toponyme_type | Précision sur le type de toponyme (Lac, Pic, Auberge...)
toponyme_precision_geo | Précision de localisation textuelle permettant de différencier des homonymes (ex| Vallée d'Aspe)
geom| Géométrie de l'objet

## Ajouter une couche de données

La déclaration d'une couche de données doit se faire en base de données en ajoutant une ligne à la table app_carto.t_layers.
Déscription des champs:
Nom du champ  | description
------------- | -------------
layer_id | clés primaire auto-incrémenté
layer_schema_name | nom du schéma dans la base de données "data"
layer_table_name | Nom de la table de données dans la base de données "data"
layer_group | Nom permettant de regroupper les couche sur l'interface (TODO | sortir ce champ dans une table dédiée aux "groupes de couche" dans la base applicative)
layer_label | Alias du nom de la couche qui sera affiché dans l'application
layer_is_default | (ce champ est our l'instant sans effet)
layer_default_style | définition du style par défaut à appliquer à la couche en format JSON 
layer_is_warning | Booléen indiquant que la couche doit être prise en compte dans le calcul des enjeux
layer_attribution | identification du producteur de la données (copyright)
layer_columns | liste (varchar[]) des champs à intérroger (champs se retrouvant dans le "select"). **Attention** renseigner "\*" ne fonctionne pas, si on veut tous les champ de la couche, il faut tous les renseigner.
layer_geom_column | nom du champ stockant la géométrie (geom, the_geom ...)

### Définition du style d'une couche
Les styles respectent une syntaxe JSON spécifique et fonction de la géométrie des objets.


```
Polygon :
	- style_name = Nom du style qui sera repris dans la légende (optionnel)
	- fill_color = Couleur de remplissage 
		ex : rgba(201,241,196,0.5)
	- stroke_color = Couleur de la bordure 
		ex : rgba(201,241,196,0.5)
	- stroke_width = Epaisseur de la bordure (en pixel)
		ex : 3
	- stroke_linedash = Bordure en pointillé 
		ex1 : [] - pas de pointillé; 
		ex2 : [4] - longueur du pointillé et de l'espacement de 4 pixels
		ex3 : [4,8] - longueur du pointillé de 4 pixel et logueur de l'espacement de 8 pixel
```

```
Line :
	- style_name = Nom du style qui sera repris dans la légende (optionnel)
	- stroke_color = Couleur du trait
		ex : rgba(201,241,196,0.5)
	- stroke_width = Epaisseur du trait (en pixel)
		ex : 3
	- stroke_linedash = Trait en pointillé 
		ex1 : [] - pas de pointillé; 
		ex2 : [4] - longueur du pointillé et de l'espacement de 4 pixels
		ex3 : [4,8] - longueur du pointillé de 4 pixel et logueur de l'espacement de 8 pixel
```

```
Point : 
	- style_name = Nom du style qui sera repris dans la légende (optionnel)
	- fill_color = Couleur de remplissage
			ex : rgba(201,241,196,0.5)
	- stroke_color = Couleur de la bordure
		ex : rgba(201,241,196,0.5)
	- stroke_width = Epaisseur de la bordure (en pixel)
		ex : 3
	- stroke_linedash =  = Bordure en pointillé 
		ex1 : [] - pas de pointillé; 
		ex2 : [4] - longueur du pointillé et de l'espacement de 4 pixels
		ex3 : [4,8] - longueur du pointillé de 4 pixel et logueur de l'espacement de 8 pixel
	- radius = Rayon du point (en pixel)
		ex : 5
```

```
Icon :
	- style_name = Nom du style qui sera repris dans la légende (optionnel)
	- icon_svg_path = Chemin vers le SVG (dans static)
		ex : static/images/svg/<nom_svg>.svg 
		Les icones doivent être en svg et placé dans backend/static/images/svg/ 
		Il est possible des les classer par sous-dossier, dans ce cas, adapter le chemin
	- icon_color = Couleur de l'image
		ex : #ff0000 ou rgba(255,0,0,1)
		La couleur est en réalité une teinte qui s'applique sur le SVG. 
		S'il est noir, icon_color n'aura aucun impacte sur le rendu.
	- icon_scale = Coeficient permetant d'agrandir ou réduire la taille du svg
		ex1 : 0.04 (réduit la taille)
		ex2 : 2 (augmente la taille)
	- icon_opacity = Opacité de l'icone sur la carte
		ex : 0.8
```
Dans le cas d'un style de type "icon", le fichier SVG associé devra être placé dans le dossier backend/static/images/svg/

#### Exemple de style simple :

```json
/**
 * Remplissage simple de polygone
 */
[{
    "style_type": "Polygon",
    "styles": [{
        "style_name": "nomDuStyle",
	"fill_color": "rgba(145,82,45,0.5)",
	"stroke_color": "rgba(0,0,0,1)",
	"stroke_width": 1,
	"stroke_linedash": [],
	"filter" : null
    }]
}]
```

```json
/**
 * Syle simple pour un point 
 */
[{
    "style_type": "Point",
    "styles": [{
        "style_name": "nomDuStyle",
	"fill_color": "rgba(145,82,45,0.5)",
	"stroke_color": "rgba(0,0,0,1)",
	"stroke_width": 1,
	"stroke_linedash": [],
        "radius": 5,
	"filter" : null
    }]
}]
```

```json
/**
 * Style simple pour une ligne
 */
[{
    "style_type": "Line",
    "styles": [{
        "style_name": "nomDuStyle",
	"stroke_color": "rgba(0,0,0,1)",
	"stroke_width": 1,
	"stroke_linedash": [],
	"filter" : null
    }]
}]
```

```json
/**
 * Exemple pour la couche "refuge"
 * utilisant une icone
[{
    "style_type": "Icon",
    "styles": [{
        "style_name": "nomDuStyle",
        "icon_svg_path": "static/images/svg/accommodation/accommodation_shelter2.svg",
        "icon_color": "rgba(0,0,0,1)",
        "icon_scale": 0.04,
        "icon_opacity": 1
    }]
}]
```


#### Exemple de style conditionnel :
```json
/**
 * Style Conditionnel
 * Distinguant zone coeur et aire d'adhésion
 */
[{
    "style_type": "Polygon",
    "styles": [{
        "style_name": "Zone Coeur",
	"fill_color": "rgba(2,125,13,0.5)",
	"stroke_color": "rgba(2,125,13,1)",
	"stroke_width": 3,
	"stroke_linedash": [],
	"filter" : {
		"left_term": "id_local",
        	"operator": "==",
        	"right_term": "ZC_PNP",
        	"and": [],
        	"or": []
      	}
    },{
        "style_name": "Aire d'adhésion",
        "fill_color": "rgba(201,241,196,0.5)",
	"stroke_color": "rgba(201,241,196,1)",
	"stroke_width": 3,
	"stroke_linedash": [],
	"filter" : {
		"left_term": "id_local",
        	"operator": "==",
        	"right_term": "AA_PNP",
        	"and": [],
        	"or": []
      	}
    }]
}]
```

```json
/**
 * Style conditionnel complexe : ((A == "test") OR ((B == true) AND (C == 1)))
 */
[{
    "style_type": "Polygon",
    "styles": [{
        "style_name": "nomDuStyle",
        "fill_color": "rgba(255,0,0,0.5)",
        "stroke_color": "rgba(255,255,0,0.5)",
        "stroke_width": 2,
        "stroke_linedash": [],
        "filter" : {
            "left_term": "A",
            "operator": "==",
            "right_term": "test",
            "and": [],
            "or": [{
                "left_term": "B",
                "operator": "==",
                "right_term": true,
                "and": [{
                    "left_term": "C",
                    "operator": "==",
                    "right_term": 1,
                    "and": [],
                    "or": []
                }],
                "or": []
            }]
        }
    }]
}]
```

#### Exemple de style dans le cas d'une couche ayant plusieur type de géométrie :
```json
[{
    "style_type": "Polygon",
    "styles": [{
        "style_name": "nomDuStyle",
	"fill_color": "rgba(145,82,45,0.5)",
	"stroke_color": "rgba(0,0,0,1)",
	"stroke_width": 1,
	"stroke_linedash": [],
	"filter" : null
    }]
},{
    "style_type": "Line",
    "styles": [{
        "style_name": "nomDuStyle",
	"stroke_color": "rgba(0,0,0,1)",
	"stroke_width": 1,
	"stroke_linedash": [],
	"filter" : null
    }]
}]
```



