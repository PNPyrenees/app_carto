//import '../lib/node_modules/ol/ol.css';
//import Map from '../lib/node_modules/ol/Map';
console.log(BASEMAPS)

/**
 * Initialisation de la carte
 */
var map
initMap = function () {
    map = new ol.Map({
        layers: [],
        target: 'map',
        view: new ol.View({
            projection: 'EPSG:3857',
            center: ol.proj.transform(CENTER, 'EPSG:4326','EPSG:3857'),
            zoom: ZOOM_LEVEL,
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
}

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

var addGeojsonLayer = function(data){

    geojson = data.geojson_layer

    // Récupération de la fonction devant attribuer le style
    var style = buildStyle(data.desc_layer.layer_default_style)    

    // Ajoute les données du geoJson dans un ol.source 
    let vectorSource = new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(geojson),
    })
    
    zindex = map.getLayers().getLength() + 1

    // Création du layer
    let vectorLayer = new ol.layer.Vector({
        layer_name: data.desc_layer.layer_label,
        source: vectorSource,
        style: style,
        zIndex: zindex,
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


