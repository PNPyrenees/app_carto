<div>
	<img align="left" src="https://user-images.githubusercontent.com/85548796/134670189-3518e579-cdba-4630-b35d-b902fd402df8.png" alt="drawing" height="60"/>
	<img align="right" src="https://user-images.githubusercontent.com/85548796/134628003-895ecb51-fab1-4993-9cb9-53c3ea52d58b.png" alt="drawing" height="60"/>
<div>

<br/>
<br/>
<br/>

# Qu'est ce que AppCarto 
AppCarto est une application web destinée à diffuser des données SIG.
Le développement a été initié par le [Parc national des Pyrénées](http://www.pyrenees-parcnational.fr) pour répondre à son besoin de partager en interne et à destination des agents les données de son système d'information géographique.

<div>
	<img src="https://user-images.githubusercontent.com/85548796/135807457-c3b8b12c-1ef3-4202-afe7-ab7dc2ecdaa2.png" alt="drawing" height="450"/>
</div>
	
L'objectif, à terme, est d'en faire une mini-application SIG en ligne permettant notamment la création et le partage de couches de données et d'y implémenter des fonctions spatiales élémentaires (intersection / fusion ....).

AppCarto peut être vu comme une application satellite de [GeoNature](https://github.com/PnX-SI/GeoNature) car elle s'appuie sur l'API de [GeoNature](https://github.com/PnX-SI/GeoNature) pour l'authentification des utilisateurs (centralisation des comptes) et la recherche de taxon dans le référentiel TaxRef. 
Un pont doit également être configuré pour permettre d'alimenter AppCarto avec les données d'observations.
	
Pour les autres données, AppCarto a été pensé pour s'intégrer dans un système d'information déjà existant favorisant la centralisation des données. Les données géographiques restent où elles sont, à partir du moment où elles sont dans une base de données postgis. L'administrateur d'AppCarto n'a qu'à déclarer les couches pour les rendre disponible dans l'application.

<div align="center">
	<img src="https://user-images.githubusercontent.com/85548796/134679821-fcd37ce0-6528-402b-952a-a7f97287ab92.png"/>
</div>

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
- [RainbowVis-JS](https://github.com/anomal/RainbowVis-JS)

### Présentation des fonctionnalités

Au stade d'avancement actuel, l'application offre la possibilité à l'utilisateur :
- d'afficher des couches de données (possibilité de changer l'ordre des couches et le niveau de transparence)
- d'interroger les données d'observation naturaliste (données [GeoNature](https://github.com/PnX-SI/GeoNature))
- d'exporter les données sous plusieurs format (KML, GeoJson, GPX, CSV)
- d'importer des données SIG (Tab, SHP, GeoPackage, GPX)
- de filtrer les entités d'une couche de données à partir de la table attributaire
- de lancer des calculs d'enjeux sur un périmètre spécifique
- d'exporter des cartes en PDF
- de créer des couches temporaire de dessins
- de modififer le style des couche (style simple ou analyse thématique)
- d'ajouter, modifier ou supprimer des objets sur des couches de référence déclarée comme éditable
- créer des projet qui conserve l'emprise carto, la liste des couches, les styles et les filtres appliqués
- de faire des mesures de longueur et de surface
- Afficher les métadonnées d'un catalogue GeoNetwork

L'administrateur de l'application a quant à lui la possibilité :
- de configurer les fonds de carte affichable (flux WMTS)
- de déclarer une couche de référence (= ajouter une couche) :
  - définition du style par défaut (optionnel)
  - définir la liste des champs devant être accessible
  - définir si c'est une couche à enjeux
- de définir les classes (seuil et couleur) associées aux données d'observations

### Base de données
AppCarto s'appuie donc sur deux bases de données:
- la base dédiée à l'application (*bdd_app*)
- la base de données hébergeant les couches SIG (*bdd_sig*)

#### Représentation de la base de données applicative (*bdd_app*)

![image](https://user-images.githubusercontent.com/85548796/134653814-140cad56-b3ab-403b-9090-d94560bef9bf.png)

Les tables grisées sont une projection dans le cadre des développements à venir. Elles seront certainement amenées à évoluer.

# Installation et configuration

## Installation de la base de données

La base de données applicative a été installé sur un **PostgreSQL 12** en suivant les actions suivantes :
- Installer PostgreSQL (sur le serveur applicatif ou tout autre serveur).
- Créer un rôle qui sera administrateur de cette base de données.
- Se connecter à la base de données avec ce rôle
- Exécuter le contenu du fichier d'installation de la base de données [install/install_db.sql](https://github.com/PNPyrenees/app_carto/blob/dev/install/install_db.sql)

## Installation de l'applicatif

L'installation d'AppCarto a été réalisée sur un **ubuntu server 20.04**
Vous trouverez la procédure d'installation dans le fichier [doc/installation](https://github.com/PNPyrenees/app_carto/blob/dev/doc/installation)

## Finalisation de l'installation et alimentation de la base de données applicative
Il est nécessaire de peupler quelques tables afin que l'application puisse fonctionner :

### Echelle de restitution des données d'observation

#### app_carto.bib_mesh_scale
Cette table permet d'activer des échelles de restitution des données d'observations.
Par défaut seules sont activées les mailles de 2km, 1km, 500m, 250m, 100mw

Il est possible d'ajouter d'autres échelles de restitution en ajoutant des lignes dans cette table.

Description de la table :

Nom du champ  | description
------------- | -------------
mesh_scale_id  | Clé primaire auto-incrémentée
mesh_scale_label  | Nom de l'échelle de restitution
active | Booléen permetant d'activer ou non la restitution à cette echelle

#### app_carto.bib_mesh 
Cette table contient les objets géographiques correspondant aux différentes échelles de restitution. A minima, il faudra insérer les données pour les échelles activées dans **app_carto.bib_mesh_scale**

Description de la table :
Nom du champ  | description
------------- | -------------
mesh_id  | Clé primaire auto-incrémentée
mesh_scale_id  | Clé étrangère permettant d'associer une géométrie à une échelle de restitution
geom | Géométrie de l'objet

### Référentiel commune
Alimenter la table app_cato.bib_commune avec les communes de votre territoire

Description de la table :
Nom du champ  | description
------------- | -------------
insee_com  | Clé primaire reprenant le code insee de la commune
nom_com | Nom de la commune

### Statuts des espèces
Par défaut, un certain nombre de statuts (et de regroupement de statut) sont déclarés. Il est possible d'en ajouter en éditant les tables suivantes :

#### app_carto.bib_group_status

Nom du champ  | description
------------- | -------------
group_status_id  | Clé primaire auto-incrémentée
group_status_label | Nom textuel du regroupement de statuts
group_status_description | Description de ce qui est contenu dans le groupe de statuts
group_status_is_warning | Booléen permettant d'inclure les espèces ayant un statut associé à ce groupe dans le calcul des enjeux
active| Booléen permettant d'activer ou non un groupe de statut

#### app_carto.bib_status_type

Nom du champ  | description
------------- | -------------
status_type_id | Clé primaire auto-incrémentée
statut_type_label | Nom textuel du statut
group_statut_id | Clé étrangère identifiant à quel groupe est associé le statut
active | Booléen permettant d'activer ou non un statut

### Les données d'observations
Il faut alimenter l'ensemble des tables suivantes à partir des données d'observation (issue de la synthèse de [GeoNature](https://github.com/PnX-SI/GeoNature) ou d'ailleur):
#### app_carto.t_observations 
Table des observations

Nom du champ  | description
------------- | -------------
obs_id | Identifiant unique de l'observation en favorisant l'identifiant dans la base de données source (ex : id_synthèse pour [GeoNature](https://github.com/PnX-SI/GeoNature) )
obs_uuid | Identifiant unique de la donnée dans le SINP
cd_ref | Code de référence taxon dans taxref
group_2_inpn | Regrouppement vernaculaire issue de taxref 
date_min | Date de début d'observation
date_max | Date de fin d'observation
altitude_min | Altitude minimale d'observation
altitude_max | Altitude maximal d'obervation
nom_cite | Nom de l'espèce tel que cité par l'observateur
nom_valide | Nom retenu de l'espèce dans taxref
nom_vern | Nom vernaculaire de lespèce dans taxref
regne | Regne auquel le taxon apparatient issue de taxref
geom | Objet géométrique associé à l'observation
observateurs | Liste des nom d'observateurs rattachés à l'observation
meta_last_action_date | Date de dernière modification de l'observation
last_action | Précise le type de la denière action (I : insertion / U : modification)

Les champs "meta_last_action_date" et "last_action" sont utile pour automatiser une synchronisation des données entre GeoNature et AppCarto

#### app_carto.cor_observation_commune 
Lien entre une observation et les communes

Nom du champ  | description
------------- | -------------
obs_id | Identifiant de l'observation dans app_carto.t_observations
insee_com | Identifiant de la commune dans app_carto.bib_commune

#### app_carto.cor_observation_mesh
Lien entre l'observation et les objets géographiques associés aux différentes échelles de restitution 

Nom du champ  | description
------------- | -------------
obs_id | Identifiant de l'observation dans app_carto.t_observations
mesh_id | Identifiant de la maille dans app_carto.bib_mesh

#### app_carto.cor_observation_status
Statut de l'espèce relatif à l'observation (= une espèce protégée **uniquement** dans les Pyrénées-Atlantiques ne doit pas être identifiée comme protégée si elle est observée dans les hautes-Pyrénées)

Nom du champ  | description
------------- | -------------
obs_id | Identifiant de l'observation dans app_carto.t_observations
status_type_id | Identifiant du statut dans app_carto.bib_statut_type

### Table des toponymes
La table **app_carto.bib_toponyme** doit être alimentée avec les toponymes de votre territoire afin de permettre à l'utilisateur de réaliser la recherche d'un lieu-dit (barre de recherche en haut à droite de la carte).

Description de la table :
Nom du champ  | description
------------- | -------------
toponyme_id | Clé primaire auto-incrémentée
toponyme_nom | Toponyme textuel
toponyme_type | Précision sur le type de toponyme (Lac, Pic, Auberge...)
toponyme_precision_geo | Précision de localisation textuelle permettant de différencier des homonymes (ex: Vallée d'Aspe)
geom| Géométrie de l'objet

## Déclarer une couche de données

### Présentation de la table app_carto.t_layers
La déclaration d'une couche de données doit se faire en base de données en ajoutant une ligne à la table **app_carto.t_layers**.

Déscription de la table:
Nom du champ  | description
------------- | -------------
layer_id | Clé primaire auto-incrémentée
layer_schema_name | Nom du schéma dans la base de données source (bdd_sig)
layer_table_name | Nom de la table de données dans la base de données source (bdd_sig)
layer_group | Nom permettant de regroupper les couches sur l'interface (TODO | sortir ce champ dans une table dédiée aux "groupes de couches" dans la base applicative)
layer_label | Alias du nom de la couche qui sera affiché dans l'application
layer_is_default | (ce champ est pour l'instant sans effet. L'idée est de définir des couche qui s'affiche par défaut à l'ouverture de l'application...)
layer_default_style | Définition du style par défaut à appliquer à la couche en format JSON 
layer_is_warning | Booléen indiquant que la couche doit être prise en compte dans le calcul des enjeux
layer_attribution | Identification du producteur de la données (copyright)
layer_columns | Liste (varchar[]) des champs à intérroger (champs se retrouvant dans le "select"). **Attention** renseigner "\*" ne fonctionne pas, si on veut tous les champs de la couche, il faut tous les renseigner.
layer_geom_column | Nom du champ stockant la géométrie dans la base de données source (bdd_sig) (ex : geom, the_geom ...)
layer_is_editable | Booléen permettant d'activer l'édition de la couche
layer_allowed_geometry | Liste (varchar[]) des géométrie accepté par la couche (permet d'activer le sbouton d'édition en fonction)
layer_metadata_uuid | UUID de la fiche métadonnées déclaré dans un catalogue du type GeoNetwork

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
		ex3 : [4,8] - longueur du pointillé de 4 pixel et longueur de l'espacement de 8 pixel
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
		ex3 : [4,8] - longueur du pointillé de 4 pixel et longueur de l'espacement de 8 pixel
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
		ex3 : [4,8] - longueur du pointillé de 4 pixel et longueur de l'espacement de 8 pixel
	- radius = Rayon du point (en pixel)
		ex : 5
```

```
Icon :
	- style_name = Nom du style qui sera repris dans la légende (optionnel)
	- icon_svg_path = Chemin vers le SVG (dans static)
		ex : static/images/svg/<nom_svg>.svg 
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
Dans le cas d'un style de type "icon", le fichier SVG associé devra être placé dans le dossier backend/static/images/svg/. Il est possible des les classer par sous-dossier, dans ce cas, adapter le chemin

```
Etiquette : 
    - text = Nom du champ devant être utilisé comme étiquette (obligatoire)
    - max_resolution = Permet de gérer la visibilité de l'étiquette en fonction du niveau de zoom (optionnel - par défaut : 180)
        ex : 150 (valeur permettant l'affichage des étiquettes pour une échelle correspondant à l'emprise du PNP)
    - weight = Style d'écriture de l'étiquette (optionnel - par défaut : 'Normal')
        ex 1 : Normal
        ex 2 : Bold (en gras)
    - size = Taille de la police (optionnel - par défaut : 12)
        ex : 14
    - color = Couleur du texte (optionnel - par défaut : 'rgba(0,0,0,1))
        ex : rgba(201,241,196,1)
    - background_color = Couleur de fond de l'étiquette (optoinnel - par défaut : 'rgba(255,255,255,0.7)')
        ex : rgba(255,255,255,0.7)
```

```
Expression :
Il est possible d'appliquer des filtres sur les valeur pour appliquer un style spécifique.
Pour celà, il faut ajouter un noeud "expression" dans la définition du style.

Le champ sur lequel s'applique la condition doit être écrit de la façon suivante (en remplaçant fieldName par le nom du champ) : feature.get('fieldName')

Ensuite, renseigné l'un des opérateur suivant :
    - > : supérieur
    - < : inférieur
    - >= : supérieur ou égal
    - <= : inférieur ou égal
    - == : egal
    - != : différent de
    - includes : Permet de controler si une valeur est contenu ou non dans une liste . exemple
        - ['value1', 'value2'].includes(feature.get('fieldName')) - (equivalent d'un IN en SQL)
        - !['value1', 'value2'].includes(feature.get('fieldName')) - (equivalent d'un NOT IN en SQL)
    - match : contenant une partie de la chaine de caractère (equivalent d'un LIKE en SQl). Cet opérateur s'appliquant à des chaine de caractère, il faut forcer le typage du champ. Exemple : 
        - String(feature.get('fieldName')).match(/TextToSearch/) : Retourne vrai si la chaine de caractère contient TextToSeach
        - String(feature.get('fieldName')).match(/^TextToSearch/) : Retourne vrai si la chaine de caractère commence par TextToSeach
        - String(feature.get('fieldName')).match(/TextToSearch$/) : Retourne vrai si la chaine de caractère fini par TextToSeach

En cas d'apostrophe dans la valeur, il y a deux possibilité : 
- Utiliser le caractère d'échappement \\ -> feature.get('fieldName') == 'text avec l\\'apostrophe'
- Soit remplacer les simples quotes entourant la chaine de caractère par \" -> feature.get('fieldName') == \"text avec l'apostrophe\"
```

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
	"stroke_linedash": []
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
        "radius": 5
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
        "stroke_linedash": []
    }]
}]
```

```json
/**
 * Exemple pour la couche de point affichant une 
 * icone à la place de l'objet géographique
 */
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
        "expression": "feature.get('id_local') == 'ZC_PNP'"
    },{
        "style_name": "Aire d'adhésion",
        "fill_color": "rgba(201,241,196,0.5)",
        "stroke_color": "rgba(201,241,196,1)",
        "stroke_width": 3,
        "stroke_linedash": [],
        "expression": "feature.get('id_local') == 'AA_PNP'"
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
        "expression": "feature.get('A') == 'test' || (feature.get('B') == true && feature.get('C') == 1)"
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
        "stroke_linedash": []
    }]
},{
    "style_type": "Line",
    "styles": [{
        "style_name": "nomDuStyle",
        "stroke_color": "rgba(0,0,0,1)",
        "stroke_width": 1,
        "stroke_linedash": []
    }]
}]
```

#### Exemple de style avec affichage des étiquettes :
```json
/**
 * Etiquette simple
 */
[{
    "styles": [{
        "radius": 5,
        "fill_color": "rgba(0,0,0,1)",
        "stroke_color": "rgba(0,0,0,1)",
        "stroke_width": 1,
        "stroke_linedash": [],
        "feature_label": {
            "text": "nom"
        }
    }],
    "style_type": "Point"
}]
```


```json
/**
 * Etiquette avec paramétrage avancé
 */
[{
    "styles": [{
        "radius": 5,
        "fill_color": "rgba(0,0,0,1)",
        "stroke_color": "rgba(0,0,0,1)",
        "stroke_width": 1,
        "stroke_linedash": [],
        "feature_label": {
            "text": "nom",
            "max_resolution": 180,
            "size": 14,
            "weight": "Bold",
            "color": "rgba(0,0,0,1)",
            "background_color": "rgba(255,255,255,0.7)"
        }
    }],
    "style_type": "Point"
}]
```

# Mise à jour

*Cette partie reste à consolider en fonction des avancements du projet. En effet, en l'état aucune mise à jour n'a été réalisée.*

## Mise à jour de la base de données
En fonction de la version de départ, il faudra exécuter les scripts SQL **update_db_to_vX.Y.sql** présent dans le dossier ./install .
	
## Mise à jour de l'application
Pour mettre à jour la partie applicative, il faut se placer dans le dossier de l'application et lancer la commande suivante :
```
$ git pull
$ sudo supervisorctl restart app_carto	
```
