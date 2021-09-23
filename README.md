# app_carto
App_carto est une application web destinée à diffuser des données SIG initié par le [Parc national des Pyrénées](http://www.pyrenees-parcnational.fr) pour répondre à son besoin de partager en interne les données de son système d'information géographique.

### Présentation du projet
App_carto a été pensée pour s'intégrer dans un système d'information déjà existant. Les données géographiques restent ou elles sont, à partir du moment ou elles sont dans une base de données postgis. L'administrateur de l'application n'a qu'à déclarer les couches.
App_carto n n'embarque pas de système interne d'authentification. En effet, l'application s'appuie sur [GeoNature](https://github.com/PnX-SI/GeoNature) ce qui permet de centraliser les comptes utilisateurs en un point unique et évite la multiplication des ID/mot de passe.

App_carto est une plateforme web développée principalement en python et en javascript et se basant sur les librairies suivantes:
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
L'objectif d'App_carto est d'être une application SIG minimaliste.
A ce stade d'avancement, l'application offre la possibilité à l'utilisateur :
- d'afficher des couches de données (possibilité de changer l'ordre des couches et le niveau de transparence)
- d'interroger les données d'observations naturaliste
- d'exporter la table attributaire d'une couche en CSV
- de filtrer la une couche de données à partir de la table attributaire
- de lancer des calculs d'enjeux sur un périmètre spécifique
- d'exporter des cartes en PDF

L'administrateur de l'application à quant à lui :
- La possibilité de customiser les éléments graphique principaux
- de configurer les fonds de carte affichable (flux WMTS)
- d'ajouter une couche :
  - définition du style par défaut (optionnel)
  - définir la liste des champs devant être accessible
  - définir si c'est une couche à enjeux
- de définir les classes (seuil et couleur) associées aux données d'observations
  
Les objectifs à terme (il n'en manque pas) seraient d'offrir la possibilité à l'utilisateur :
-- de pouvoir modifier le style d'une couche
- de créer de nouvelle couche de données
- de configurer des projets qu'il pourra réouvrir plus tard
- de lui permettre de partager des couches de données et des projets à d'autres utilisateurs (en lecture ou écriture)
- et pourquoi pas intégrer petit-à-petit des fonctions de traitment spatial (intersection / fusion ...)
- ...

### Base de données
App_carto s'appuis sur deux base de données:
- la base dédié à l'application
- la base de données hebergeant les couches SIG

####Représentation du modèle de données

![image](https://user-images.githubusercontent.com/85548796/134531163-7d3bdcf1-7ee5-43ce-be2f-9c8a043f6f93.png)

Les tables grisés sont une projection dans le cadre des développement à venir. Elle seront potentiellement amené à changer.
