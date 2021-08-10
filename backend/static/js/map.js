/**
 * Style par défaut
 */        
const selectedStyles = function(feature, resolution) {

    let hilgth_color = "#ff0000"
    let hilgth_strok_width = "5"

    let styles = {
        'Point': new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: null,
                stroke: new ol.style.Stroke({
                    color: hilgth_color,
                    width: hilgth_strok_width
                }),
            })
        }),
        'LineString': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: hilgth_color,
                width: hilgth_strok_width,
            }),
        }),
        'MultiLineString': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: hilgth_color,
                width: hilgth_strok_width,
            }),
        }),
        'MultiPoint': new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: null,
                stroke: new ol.style.Stroke({
                    color: hilgth_color,
                    width: hilgth_strok_width
                }),
            })
        }),
        'MultiPolygon': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: hilgth_color,
                width: hilgth_strok_width,
            })/*,
            fill: new ol.style.Fill({
                color: fill_color,
            }),*/
        }),
        'Polygon': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: hilgth_color,
                lineDash: [],
                width: hilgth_strok_width,
            }),
            /*fill: new ol.style.Fill({
                color: fill_color,
            }),*/
        }),
        'GeometryCollection': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: hilgth_color,
                width: hilgth_strok_width,
            }),
            /*fill: new ol.style.Fill({
                color: fill_color,
            }),*/
            image: new ol.style.Circle({
                radius: 10,
                fill: null,
                stroke: new ol.style.Stroke({
                    color: hilgth_color,
                }),
            }),
        }),
        'Circle': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: hilgth_color,
                width: hilgth_strok_width,
            })/*,
            fill: new ol.style.Fill({
                color: fill_color,
            }),*/
        }),
    }
    return styles[feature.getGeometry().getType()]
}
/**
     * Création d'une couche dédié aux objets sélectionnés
     */
 let selectedVectorSource = new ol.source.Vector()
 let selectedVectorLayer = new ol.layer.Vector({
     source: selectedVectorSource,
     style: selectedStyles,
     zIndex: 999,
 })

/**
 * Initialisation de la carte
 */
map = new ol.Map({
    layers: [],
    target: 'map',
    view: new ol.View({
        projection: 'EPSG:3857',
        center: ol.proj.transform(CENTER, 'EPSG:4326','EPSG:3857'),
        zoom: ZOOM_LEVEL,
        maxZoom: 18,
    }),
});


/**
 * Déclaration des fonds de cartes 
 */
const projection = new ol.proj.get("EPSG:3857");
const projectionExtent = projection.getExtent();
const maxResolution = ol.extent.getWidth(projectionExtent) / 256;
const resolutions = [];
const matrixIds = [];
for (let i = 0; i < 20; i++) {
    matrixIds[i] = i.toString();
    resolutions[i] = maxResolution / Math.pow(2, i);
}

BASEMAPS.forEach(basemap => {
    let basemap_layer = new ol.layer.Tile({
        opacity: 1,
        visible: parseInt(basemap.isDefault),
        isBasemap: true,
        source: new ol.source.WMTS({
            attributions: basemap.attribution,
            url: basemap.url,
            layer: basemap.layer,
            matrixSet: "PM",
            format: basemap.format,
            projection: "EPSG:3857",
            tileGrid: new ol.tilegrid.WMTS({
                origin: [-20037508, 20037508],
                resolutions: resolutions,
                matrixIds: matrixIds
            }),
            style: "normal",
            wrapX: true
        })
    })

    map.addLayer(basemap_layer)

    let div_item = document.createElement('div')
    div_item.setAttribute('class','dropdown-item')
    div_item.setAttribute('layer-uid', ol.util.getUid(basemap_layer))
    div_item.appendChild(document.createTextNode(basemap.name))
    div_item.setAttribute('onclick','showBasemap(' + ol.util.getUid(basemap_layer) + ')')
    
    document.getElementById("basemap-dropdown-content").appendChild(div_item)
})

//Ajout de la couche de séléction à la carte
map.addLayer(selectedVectorLayer)


/**
 * Gestion du changement de fond de carte
 */
showBasemap = function(layer_uid){
    map.getLayers().forEach(layer => {
        if (layer.get("isBasemap") == true){
            layer.setVisible(false)
            if (ol.util.getUid(layer) == layer_uid){
                layer.setVisible(true)
            }
        }
    });
}

/**
 * Retourne une couleur aléatoire en rgba
 */
var random_rgba = function (opacity) {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + opacity + ')';
}

/**
 * Style par défaut
 */
const getDefaultStyle = function(){

    // Création des couleurs aléatoires
    let fill_color = random_rgba(0.5)
    let stroke_color = random_rgba(1)

    return function (feature, resolution) {  
        
        
        if (feature.visible == false){
            return null
        }

        const styles = {
            'Point': new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: null,
                    stroke: new ol.style.Stroke({
                        color: stroke_color,
                        width: 2
                    }),
                })
            }),
            'LineString': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: stroke_color,
                    width: 2,
                }),
            }),
            'MultiLineString': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: stroke_color,
                    width: 2,
                }),
            }),
            'MultiPoint': new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: null,
                    stroke: new ol.style.Stroke({
                        color: stroke_color,
                        width: 2
                    }),
                })
            }),
            'MultiPolygon': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 1)',
                    width: 1,
                }),
                fill: new ol.style.Fill({
                    color: fill_color,
                }),
            }),
            'Polygon': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 1)',
                    lineDash: [],
                    width: 1,
                }),
                fill: new ol.style.Fill({
                    color: fill_color,
                }),
            }),
            'GeometryCollection': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 1)',
                    width: 2,
                }),
                fill: new ol.style.Fill({
                    color: fill_color,
                }),
                image: new ol.style.Circle({
                    radius: 10,
                    fill: null,
                    stroke: new ol.style.Stroke({
                        color: fill_color,
                    }),
                }),
            }),
            'Circle': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 1)',
                    width: 2,
                }),
                fill: new ol.style.Fill({
                    color: fill_color,
                }),
            }),
        }

        return styles[feature.getGeometry().getType()];
    }
};

/**
 * Construction d'un style openlayers à partir d'un json
 */
const getStyleFromJson = function(json_styles){
  
// On retourne une fonction interprétable par openLayers
return function (feature, resolution) {

    var feature_style

    // On boucle sur les types de géométrie
    json_styles.forEach(json_geom_style => {

    switch (json_geom_style.style_type) {
        case 'Polygon':
            // On bloucle dur les filtres
            json_geom_style.styles.forEach(style => {
                //Si la condition du style est respecté
                if(eval(buildFilter(style.filter))){
                    //On retourne le style
                    feature_style = [new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: style.stroke_color,
                            lineDash: style.stroke_linedash,
                            width: style.stroke_width,
                        }),
                        fill: new ol.style.Fill({
                            color: style.fill_color,
                        }),
                    })]
                }
            })
            break
        case 'Point':
            json_geom_style.styles.forEach(style => {
                //Si la condition du style est respecté
                if(eval(buildFilter(style.filter))){
                    //On retourne le style
                    feature_style = [new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: style.radius,
                            fill: new ol.style.Fill({
                                color: style.fill_color,
                            }),
                            stroke: new ol.style.Stroke({
                                color: style.stroke_color, 
                                lineDash: style.stroke_linedash,
                                width: style.stroke_width
                            }),
                        })
                    })]
                }
            })
            break
        case 'Line':
            json_geom_style.styles.forEach(style => {
                //Si la condition du style est respecté
                if(eval(buildFilter(style.filter))){
                    //On retourne le style
                    feature_style = [new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: style.stroke_color, 
                            lineDash: style.stroke_linedash,
                            width: style.stroke_width
                        })
                    })]
                }
            })
            break
        case 'Icon':
            json_geom_style.styles.forEach(style => {
                //Si la condition du style est respecté
                if(eval(buildFilter(style.filter))){
                    //On retourne le style
                    feature_style = [new ol.style.Style({
                        image: new ol.style.Icon({
                            src: style.icon_svg_path, 
                            color:  style.icon_color,
                            scale: style.icon_scale,
                            opacity: style.icon_opacity
                        })
                    })]
                }
            })
            break
        }
    })

    // Si on a pas récupéré de style depuis 
    // le json alors on attribut le style par défaut 
    // pour l'objet courant
    if (feature_style){
        return feature_style
    } else {
        return getDefaultStyle()
    }
  }
};

/**
 * Si le json style existe alors on construit la symbologie
 * sinon on retourne le style par défaut pour la couche
 */
var buildStyle = function(json_style){
    if (json_style) {
        return getStyleFromJson(json_style)
    } else {
        return getDefaultStyle()
    }
}

/**
 * Fonction ajoutant une couche à la carte
 */
var addGeojsonLayer = function(data){

    geojson = data.geojson_layer

    let layer_default_style = data.desc_layer.layer_default_style
    // Récupération de la fonction devant attribuer le style
    /*var style = buildStyle(data.desc_layer.layer_default_style)    */
    var style = buildStyle(layer_default_style)

    // Ajoute les données du geoJson dans un ol.source 
    let vectorSource = new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(geojson),
    })

    // On initialise tout les feature comme visible
    vectorSource["visible"] = true
    
    zindex = map.getLayers().getLength() + 1

    // Création du layer
    let vectorLayer = new ol.layer.Vector({
        layer_name: data.desc_layer.layer_label,
        source: vectorSource,
        style: style,
        zIndex: zindex,
        json_style: layer_default_style,
    })

    // Ajout du layer sur la carte
    map.addLayer(vectorLayer)

    // Ajout du layer dans le layerBar
    addLayerInLayerBar(vectorLayer)
}

/**
 * Fonction ajoutant la couche dans le layerBar
 */
var addLayerInLayerBar = function(vectorLayer){
    let prototype = document.getElementById("layer_list").getAttribute('data-prototype')
    
    layer_uid = ol.util.getUid(vectorLayer) //- 1 

    layer_name = vectorLayer.get('layer_name')

    prototype = prototype.replace(/__LAYER_UID__/g, layer_uid)
    prototype = prototype.replace(/__LAYER_NAME__/g, layer_name)
    
    template = document.createElement('template')
    template.innerHTML = prototype

    //On active les eventListener
    template.content.querySelector(".checkbox-layer").addEventListener("click", event => {
        let layer_uid = event.target.closest("li").getAttribute("layer-uid")

        map.getLayers().forEach(layer => {
            if (ol.util.getUid(layer) == layer_uid){
            layer.setVisible(!layer.getVisible())
            }
        });
    })

    document.getElementById("layer_list").prepend(template.content)
}

/**
 * Fonction changeant l'ordre des couche sur la carte 
 * en fonction de l'ordre des couche dans le layerBar
 */
var changeLayerOrder = function(){
    items = document.getElementById("layer_list").getElementsByTagName("li")
    for (var i = 0; i < items.length; ++i) {
        nb_layers = map.getLayers().getLength()
        //console.log("nb_layers = " + nb_layers)
        layer_uid = items[i].getAttribute("layer-uid")
        new_index = nb_layers - i

        map.getLayers().forEach(layer => {
            if (ol.util.getUid(layer) == layer_uid){
                layer.setZIndex(new_index)
            }
        });
    }
}

/**
 * Converti un operateur en string en véritable opérateur
 */
function compare(left_term, operator, right_term) {
    switch (operator) {
        case '>':   return left_term > right_term
        case '<':   return left_term < right_term
        case '>=':  return left_term >= right_term
        case '<=':  return left_term <= right_term
        case '==':  return left_term == right_term
        case '!=':  return left_term != right_term
        //case '===': return left_term === right_term
        //case '!==': return left_term !== right_term
        case 'IN':  return right_term.includes(left_term)
        case 'NOT IN':  return !right_term.includes(left_term)
        case 'LIKE': return right_term.includes(left_term)
        default: throw "Opérateur de comparaison incorrect"
    }
}

/**
 * Fonction récursive permettant de transformer les filtres json
 * en filtre javascript/openlayers
 */
function buildFilter(filter, str_filter="", logic_operator=""){
    // S'il n'y a pas de filtre
    if (!filter){
        // on retourne 1==1
        return "compare(1, \"==\", 1)"
    }

    if (logic_operator == "and") {
        str_filter = str_filter + " && "
    }

    if (logic_operator == "or") {
        str_filter = str_filter + " || "
    }

    str_filter = str_filter + " ( "

    switch (typeof filter.right_term){
        case "number":
        case "boolean":
        str_filter = str_filter + "compare(feature.get('" + filter.left_term + "'),\"" + filter.operator + "\"," + filter.right_term + ")"
        break;
        case "string":
        str_filter = str_filter + "compare(feature.get('" + filter.left_term + "'),\"" + filter.operator + "\",\"" + filter.right_term + "\")"
        break;
        default:
        throw "Création du style : Type de donnée incorrect lors de la création du filtre";
    }

    if (filter.and.length > 0){
        filter.and.forEach(and_filter => {
            str_filter = buildFilter(and_filter, str_filter, "and") 
        })
    }

    if (filter.or.length > 0){
        filter.or.forEach(or_filter => {
            str_filter = buildFilter(or_filter, str_filter, "or") 
        })
    }

    str_filter = str_filter + ")"

    return str_filter
}


/**
 * Suppression d'une couche sur la carte
 */
removeLayer = function(layer_uid){

    //On recherche la couche
    var layer = null
    map.getLayers().forEach(tmp_layer => {
        current_layer_uid = ol.util.getUid(tmp_layer)
        if (current_layer_uid == layer_uid){
            layer = tmp_layer
            return
        }
    })

    // puis on la supprime
    if (layer){
        map.removeLayer(layer)
        document.querySelector("#layer_list li[layer-uid='" + layer_uid + "']").remove()
        
        // On efface la table attributaire s'il est ouvert
        tab_id = "layer-data-table-" + current_layer_uid
        if (document.querySelector(".nav-layer-item[target=" + tab_id + "]")){               
            document.getElementById(tab_id).remove()
            document.querySelector(".nav-layer-item[target=" + tab_id + "]").remove()
        }

        // On efface le ou les features de la couche qui sont dans selectedVectorSource
        selectedVectorSource.getFeatures().forEach(feature => {
            //console.log(feature)
            if (feature.orginalLayerUid == layer_uid){
                selectedVectorSource.removeFeature(feature)
            }
        })

        // On supprime les entré de cette couche dans 
        // le fenêtre d'affichage des données attributaire
        // (celle qui s'ouvre quand on clique sur la carte)
        attr_data = document.getElementById("bloc-clicked-features-attributes").querySelector(".layer-item[layer-uid=\"" + layer_uid + "\"]")
        if (attr_data){
            attr_data.remove()

            // S'il n'y a plus de données dans le bloc attributaire, on le ferme
            if (attr_data = document.getElementById("bloc-clicked-features-attributes").querySelector(".layer-item") == null){
                hideBlockClickedFeaturesAttributes()
            }
                
        }
    }
}

/**
 * Affichage de la table attributaire
 * Seul les entités répondant aux filtres doivent être affichées
 */
var table
getFullDataTable = function(layer_uid){
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid){
            //console.log(layer.getSource().getKeys())
            var first_iteration = true
            data = []
            layer.getSource().getFeatures().forEach(feature => {

                //Récupération de l'uid du feature
                feature_uid = ol.util.getUid(feature)

                feature_data = feature.getProperties()
                
                // On ajoute l'uid dans le json
                feature_data["ol_uid"] = feature_uid

                // On retire la colonne géométrique
                delete feature_data.geometry

                data.push(feature_data)
            })

            layer_name = layer.get("layer_name")
            createAttributeTable(layer_name, layer_uid, data)
        }
    })
}

/**
 * Créer la table attributaire html
 */
createAttributeTable = function(layer_name, layer_uid, data){

    tab_id = "layer-data-table-" + layer_uid //+ '-' + date_id

    //On controle si le tableau existe
    if (document.querySelector(".nav-layer-item[target=" + tab_id + "]")){
        // Si c'est le cas, on masque tout
        inactiveAllAttributeTables()
        // et on l'affiche que le tableau concerné
        activeAttributeTable(document.querySelector(".nav-layer-item[target=" + tab_id + "]"))
        return
    }

    // Création d'un élément HTML recevant le tableau
    tab_element = document.createElement("div")
    tab_element.classList.add("layer-data-table")
    tab_element.id = tab_id
    document.getElementById("data-block").append(tab_element)

  
    //Création du tableau
    //table = new Tabulator("#layer-data-table", {
    table = new Tabulator("#" + tab_id, {
        height:"100%",
        /*layout:"fitColumns",*/
        layout: "fitData",
        /*layoutColumnsOnNewData:true,*/
        selectable: 1,
        /*selectablePersistence:false,*/
        data: data,
        autoColumns:true,
        movableColumns:true,
        /*responsiveLayout: true,*/
        resizeColumns: true,
        tooltips: true,
        autoColumnsDefinitions:function(definitions){
            //Ajout d'un champ filtre dans l'en-tête de chaque colonne            
            definitions.forEach((column) => {
                column.headerFilter = true; 
                // On masque la colonne feature_uid
                if (column.field == "ol_uid"){
                    column["visible"] = false
                }
                //console.log(column)
            });
    
            return definitions;
        },
        // Action lors de la sélection d'un ligne
        rowSelected:function(row){
            //On récupère l'uid de la couche et du feature associé à la ligne cliqué
            //let layer_uid = table.layeruid
            let layer_uid = row.getTable().layeruid
            let feature_uid = row.getData().ol_uid
            // On ferme la fenetre affichant les données attributaire lors d'un clic sur la carte
            hideBlockClickedFeaturesAttributes()
            //On highlight le feature
            highlightFeature(layer_uid, feature_uid)
            
        },
        // Action lors de la désélection d'un ligne
        rowDeselected:function(row){
            //On vide la couche de sélection
            clearSelectedSource()
        },
        dataFiltered:function(filters, rows){
            //On met un timeout sinon la requête est joué immédiatement au chagement 
            //des données et on n'a pas le temps de récupérer le layer_uid
            setTimeout(function(){ 
                table = rows[0].getTable()
                let layer_uid = table.layeruid
                
                let l_feature_uid = []
                rows.forEach(row => {
                    l_feature_uid.push(row.getData().ol_uid)
                })

                filterFeature(layer_uid, l_feature_uid)
            }, 500);
        },
    });
    table["layeruid"] = layer_uid

    // On désative l'affichage des autres atableau attributaire
    inactiveAllAttributeTables()

    // Ajout d'un onglet associé au tableau
    nav_element = document.createElement("div")
    nav_element.setAttribute("target", tab_id)
    nav_element.classList.add("nav-layer-item")
    nav_element.classList.add("active")
    nav_element.innerHTML =layer_name
    document.getElementById("nav-attribute-table").append(nav_element)

    // On active l'écouteur si il y a un click 
    nav_element.addEventListener("click", clickNavAttributeTableEvent)
}

/**
 * Gestion du highlight d'un feature
 */
highlightFeature = function(layer_uid, feature_uid, zoomOn=true, showOne=true){
    // On vide la couche de sélection seulement si on veut
    // highligth un seul feature
    if(showOne){
        clearSelectedSource()
    }
    //On recherche le feature 
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            layer.getSource().getFeatures().forEach(feature => { 
                if (ol.util.getUid(feature) == feature_uid){
                    feature["orginalLayerUid"]=layer_uid
                    //On ajoute le feature à la source
                    selectedVectorSource.addFeature(feature)
                    //On zoom sur l'extent de la source
                    if (zoomOn){
                        map.getView().fit(selectedVectorSource.getExtent(), map.getSize())
                    }
                }
            })
        }
    })
}

/**
 * Fonction vidant la couche de sélection 
 */
clearSelectedSource = function(){
    selectedVectorSource.clear()
}

/**
 * Filtre les features 
 */
filterFeature = function(layer_uid, l_feature_uid){
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            source = layer.getSource()
            if (source instanceof ol.source.Vector){
                source.getFeatures().forEach(feature => { 
                    if (l_feature_uid.includes(ol.util.getUid(feature))){
                        feature["visible"] = true
                    } else {
                        //console.log(layer)
                        //feature.setStyle(buildStyle(layer.jsonStyle))
                        feature["visible"] = false
                    }
                    source.dispatchEvent('change');
                    //console.log(feature)
                })
            }
        }
    })
}

/**
 * Gestion du changement de table attributaire
 */
clickNavAttributeTableEvent = function(){
    // On désactive tout
    inactiveAllAttributeTables()

    // On active que le tableau attributaire séléctionné
    activeAttributeTable(this)
}

activeAttributeTable = function(nav_item){
    // On ajoute la class active au nav_item
    nav_item.classList.add("active")
    // On afficher le tableau associé
    target = nav_item.getAttribute("target")
    document.getElementById(target).style.display="block"
}

inactiveAllAttributeTables = function(){
    // On retire la class ".active"
    items = document.getElementsByClassName("nav-layer-item")
    for (var i = 0; i < items.length; i++) {
        items[i].classList.remove("active")
    }

    //On masque le tableau visible
    tables = document.getElementsByClassName("layer-data-table")
    for (var i = 0; i < items.length; i++) {
        tables[i].style.display = "none"
    }
}

/* TEST */
tests = document.getElementsByClassName("nav-layer-item")
for (var i = 0; i < tests.length; i++) {
    tests[i].addEventListener("click", clickNavAttributeTableEvent)
}


/**
 * Action lors d'un clique sur la carte
 */
 map.on('singleclick', (event => {

    // On commence par vider tous les feature dans
    // la couche de sélection
    clearSelectedSource()

    // Variable permettant de savoir si on passe à une autre couche
    var previous_layer = null

    // Création de l'objet recevant la desription des feature
    var ul_layer_list = document.createElement("ul")
    ul_layer_list.classList.add("layer-list")

    let has_feature = false
    // On boucle sur les entités présent sous le clic
    map.forEachFeatureAtPixel(event.pixel, function(feature, layer) {
        has_feature = true
        let layer_uid = ol.util.getUid(layer)
        let feature_uid = ol.util.getUid(feature)

        //on s'assure de ne pas être sur un feature de la couche de sélection
        // ça arrive des fois...
        if (layer_uid == ol.util.getUid(selectedVectorLayer)){
            return
        }

        // Dans ce cas, on veut highlight tous les features cliqués
        // sans zommer dessus
        highlightFeature(layer_uid, feature_uid, false, false)

        // Construction de l'arborescence des feature cliqué
        // Si c'est une nouvelle couche, on créé l'élément .layer-item
        if (layer_uid != previous_layer){

            li_layer_item = document.createElement("li")
            li_layer_item.classList.add("layer-item")
            li_layer_item.setAttribute("layer-uid", layer_uid)

            //On créé l'objet span contenant le nom de la couche
            var span_layer_item = document.createElement("span")
            span_layer_item.classList.add("clickable")
            span_layer_item.setAttribute("onclick", "showFeaturesList(this)")
            span_layer_item.innerHTML = layer.get("layer_name")

            li_layer_item.append(span_layer_item)

            // On créer l'objet recevant la liste des features
            var ul_feature_list = document.createElement("ul")
            ul_feature_list.classList.add("feature-list")
            //ul_feature_list.classList.add("hide")

            li_layer_item.append(ul_feature_list)
        
        }

        //Création de l'objet feature-item
        var li_feature_item = document.createElement("li")
        li_feature_item.classList.add("feature-item")
        li_feature_item.setAttribute("featureUid", feature_uid)

        //On créé l'objet span contenant le nom du feature
        var span_feature_item = document.createElement("span")
        span_feature_item.classList.add("clickable")
        span_feature_item.setAttribute("onclick", "showPropertiesList(this)")
        span_feature_item.innerHTML = "entité #"+feature_uid

        li_feature_item.append(span_feature_item)

        // On ajoute la loupe pour zommer su l'entité
        var i_zoom_to_feature = document.createElement("i")
        i_zoom_to_feature.classList.add("bi")
        i_zoom_to_feature.classList.add("bi-search")
        i_zoom_to_feature.classList.add("zoom-to-feature")
        //i_zoom_to_feature.addEventListener("click", zoomToFeature(this))
        i_zoom_to_feature.setAttribute("onclick", "zoomToFeature(this)")
        // On ajoute un tooltip sur l'icone
        i_zoom_to_feature.setAttribute("toggle-tooltip", "tooltip")
        i_zoom_to_feature.setAttribute("data-bs-placement", "right")
        i_zoom_to_feature.setAttribute("data-bs-trigger", "hover")
        i_zoom_to_feature.setAttribute("title", "Zoomer sur l'entité")

        li_feature_item.append(i_zoom_to_feature)
        

        //On créé la liste recevant les propriétés du feature
        var ul_properties_list = document.createElement("ul")
        ul_properties_list.classList.add("properties-list")
        ul_properties_list.classList.add("hide")

        li_feature_item.append(ul_properties_list)

        //On peuple la liste des attributs
        var properties = feature.getProperties()
        for (var key in properties){
            let value = properties[key]

            // On n'affiche pas la géométrie
            if (key != "geometry"){
                
                var li_propertie_item = document.createElement("li")
                li_propertie_item.classList.add("propertie-item")

                // Ecriture du nom de l'attribut
                var div_propertie_name = document.createElement("div")
                div_propertie_name.classList.add("propertie-name")
                div_propertie_name.innerHTML = key + " :"

                li_propertie_item.append(div_propertie_name)

                // Ecriture de la valeur de l'attribut
                var div_propertie_value = document.createElement("div")
                div_propertie_value.classList.add("propertie-value")
                div_propertie_value.innerHTML = " " + value

                li_propertie_item.append(div_propertie_value)

                li_feature_item.querySelector(".properties-list").append(li_propertie_item)
            }
        }

        li_layer_item.querySelector(".feature-list").append(li_feature_item)

        if (layer_uid != previous_layer){
            ul_layer_list.append(li_layer_item)
        }

        // On conserve le nom de la couche courante
        previous_layer = layer_uid
    })

    //console.log(ul_layer_list)

    document.getElementById("bloc-clicked-features-attributes-content").innerHTML = ""
    document.getElementById("bloc-clicked-features-attributes-content").append(ul_layer_list)

    //On active les tooltip
    let tooltipTriggerList = [].slice.call(document.querySelectorAll('.zoom-to-feature[toggle-tooltip="tooltip"]'))
    let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })

    if (has_feature){
        if (document.getElementById("bloc-clicked-features-attributes").classList.contains("hide")){
            document.getElementById("bloc-clicked-features-attributes").classList.remove("hide")
            document.getElementById("bloc-clicked-features-attributes").classList.add("show")
        }
    } else {
        hideBlockClickedFeaturesAttributes()
    }
}));

/**
 * Gestion de l'affichage de la sous-liste des features dans bloc-clicked-features-attributes
 */
showFeaturesList = function(element){

    let feature_list = element.parentNode.querySelectorAll('.feature-list')

    if(feature_list[0].classList.contains("hide")){
        feature_list[0].classList.remove("hide")
        feature_list[0].classList.add("show")
    } else {
        feature_list[0].classList.add("hide")
        feature_list[0].classList.remove("show")
    }
}

/**
 * Gestion de l'affichage de la sous-liste des properties dans bloc-clicked-features-attributes
 */
showPropertiesList = function(element){

    let properties_list = element.parentNode.querySelectorAll('.properties-list')

    if(properties_list[0].classList.contains("hide")){
        properties_list[0].classList.remove("hide")
        properties_list[0].classList.add("show")
    } else {
        properties_list[0].classList.add("hide")
        properties_list[0].classList.remove("show")
    }
}

/**
 * Zoom sur un feature depuis .bloc-clicked-features-attributes
 */
zoomToFeature = function(element){
    // Récupération de l'uid du layer
    layer_uid = element.closest(".layer-item").getAttribute("layer-uid")
    //récupération de l'uid du feature
    feature_uid = element.parentNode.getAttribute("featureUid")

    //Recherche du feature et zoom sur l'extent de l'objet
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            source = layer.getSource()
            if (source instanceof ol.source.Vector){
                source.getFeatures().forEach(feature => { 
                    if (ol.util.getUid(feature) == feature_uid){
                        map.getView().fit(feature.getGeometry().getExtent(), map.getSize())
                    }
                })
            }
        }
    })
}

hideBlockClickedFeaturesAttributes = function(){
    document.getElementById("bloc-clicked-features-attributes").classList.add("hide")
    document.getElementById("bloc-clicked-features-attributes").classList.remove("show")

    clearSelectedSource()
}

document.getElementById("close-bloc-clicked-features-attributes-btn").addEventListener("click", hideBlockClickedFeaturesAttributes)