/**
 * On déclare la projection EPSG:2154
 */

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

var scale_line = new ol.control.ScaleLine({
    units: "metric",
    bar: false,
    /*steps: 2,*/
    text: true,
    /*minWidth: 140,*/
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
    controls: ol.control.defaults().extend([scale_line]),
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
        isEditing: false,
        isBasemap: true,
        description_layer: {"layer_attribution": basemap.attributions},
        source: new ol.source.WMTS({
            attributions: basemap.attributions,
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
            wrapX: true,
            crossOrigin: "anonymous"
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
    //console.log("getStyleFromJson")  
    //console.log(JSON.stringify(json_styles))
    // On retourne une fonction interprétable par openLayers
    return function (feature, resolution) {
        // Pas de style si le feature est déclaré comme non visible (=filtré)
        if (feature.visible == false){
            return null
        }

        var feature_style = {}
        //var feature_style 

        /*'MultiPoint': new ol.style.Style({
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
        }),*/

        var polygon_style
        var line_style
        var point_style
        var icon_style
        // On boucle sur les types de géométrie
        json_styles.forEach(json_geom_style => {
            switch (json_geom_style.style_type) {
                case 'Polygon':
                    // On bloucle dur les filtres
                    json_geom_style.styles.forEach(style => {
                        //Si la condition du style est respecté
                        if(eval(buildFilter(style.filter))){
                            //On retourne le style
                            //feature_style = [new ol.style.Style({
                            polygon_style = [new ol.style.Style({
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
                            //feature_style = [new ol.style.Style({
                            point_style = [new ol.style.Style({
                                image: new ol.style.Circle({
                                    radius: 5,
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
                            //feature_style = [new ol.style.Style({
                            line_style = [new ol.style.Style({
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
                            //feature_style = [new ol.style.Style({
                            icon_style = [new ol.style.Style({
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

        if (polygon_style){
            feature_style['Polygon'] = polygon_style
            feature_style['MultiPolygon'] = polygon_style
        }

        if (line_style){
            feature_style['LineString'] = line_style
            feature_style['MultiLineString'] = line_style
        }

        if (point_style){
            feature_style['Point'] = point_style
            feature_style['MultiPoint'] = point_style
        }

        // Si le style icon est définit alors on écrase le 
        // style attribué aux points (et multipoints)
        if (icon_style){
            feature_style['Point'] = icon_style
            feature_style['MultiPoint'] = icon_style
        }

        // Si on a pas récupéré de style depuis 
        // le json alors on attribut le style par défaut 
        // pour l'objet courant
        if (feature_style){
            //return feature_style
            return feature_style[feature.getGeometry().getType()];
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
    //console.log(json_style)
    if (json_style) {
        return getStyleFromJson(json_style)
    } else {
        return getDefaultStyle()
    }
}

/**
 * Fonction ajoutant une couche à la carte
 */
var addGeojsonLayer = function(data, additional_data = null){

    geojson = data.geojson_layer

    let layer_default_style = data.desc_layer.layer_default_style

    // Création d'un stryle json par défaut s'il n'y en a pas déjà un
    if (! layer_default_style){
        // Création des couleurs aléatoires
        let fill_color = random_rgba(0.5)
        let stroke_color = random_rgba(1)

        // On récupère analyse les feature our connaitre les différentes géométrye
        var has_polygon = false
        var has_Line = false
        var has_point = false
        geojson.features.forEach(feature => {
            if (feature.geometry){
                if (feature.geometry.type == "Polygon" || feature.geometry.type == "MultiPolygon"){
                    has_polygon = true
                }
                else if (feature.geometry.type == "LineString" || feature.geometry.type == "MultiLineString"){
                    has_Line = true
                }
                else if (feature.geometry.type == "Point" || feature.geometry.type == "MultiPoint"){
                    has_point = true
                }
            }
        })

        layer_default_style = []
        if (has_polygon){
            tmp_style = {
                "style_type": "Polygon",
                "styles": [{
                    "fill_color": fill_color,
                    "stroke_color": "rgba(0,0,0,1)",
                    "stroke_width": 1,
                    "stroke_linedash": [],
                    "filter" : null
                }]
            }
            layer_default_style.push(tmp_style)
        }
        if (has_Line){
            tmp_style = {
                "style_type": "Line",
                "styles": [{
                    "stroke_color": stroke_color,
                    "stroke_width": 1,
                    "stroke_linedash": [],
                    "filter" : null
                }]
            }
            layer_default_style.push(tmp_style)
        }
        if (has_point){
            tmp_style = {
                "style_type": "Point",
                "styles": [{
                    "fill_color": fill_color,
                    "stroke_color": "rgba(0,0,0,1)",
                    "stroke_width": 1,
                    "stroke_linedash": [],
                    "filter" : null
                }]
            }
            layer_default_style.push(tmp_style)
        }
    }

    // Récupération de la fonction devant attribuer le style
    var style = buildStyle(layer_default_style)

    // Ajoute les données du geoJson dans un ol.source 
    let vectorSource = new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(geojson),
        attributions: data.desc_layer.layer_attribution
    })

    // On initialise tout les feature comme visible
    vectorSource["visible"] = true
    
    zindex = map.getLayers().getLength() + 1

    // Création du layer
    let vectorLayer = new ol.layer.Vector({
        layer_name: data.desc_layer.layer_label,
        source: vectorSource,
        isEditing: false,
        style: style,
        zIndex: zindex,
        json_style: layer_default_style,
        additional_data: additional_data,
        description_layer: data.desc_layer
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

    // Construction de la légende de la couche
    json_style = vectorLayer.get('json_style')
    if (json_style){
        buildLegendForLayer(layer_uid, json_style)
        //console.log(json_style)
    }
    //console.log(vectorLayer.get('additional_data'))
}

buildLegendForLayer = function(layer_uid, json_style){

    // Récupération de l'objet associé à la légende de la couche layer_uid
    layer_legend = document.getElementById("layer-legend-"+layer_uid)
    // On vide le contenu de la légende actuelle
    layer_legend.innerHTML = ""

    legends = []
    json_style.forEach(tmp_json_style => {
        geom_type = tmp_json_style.style_type

        
        tmp_json_style.styles.forEach(style => {
            // Création de la ligne
            legend_row = document.createElement("div")
            legend_row.classList.add("legend-row")

            // Création de la colonne recevant le symbol graphique
            legend_col_symbol = document.createElement("div")
            legend_col_symbol.classList.add("legend-col-symbol")
            legend_col_symbol.classList.add("m-auto")
            legend_col_symbol.classList.add("mb-auto")
            legend_col_symbol.classList.add("d-flex")
            legend_col_symbol.classList.add("justify-content-center")

            // Création du symbol
            div_symbol = document.createElement("div")            

            switch (geom_type){
                case 'Polygon':
                    div_symbol.classList.add("legend-poly")
                    div_symbol.style.borderColor = style.stroke_color
                    div_symbol.style.borderWidth = style.stroke_width + "px"
                    div_symbol.style.background = style.fill_color
                    
                    if (style.stroke_linedash) {
                        div_symbol.style.broderStyle = "dashed"
                    }
                    break
                case 'Line':
                    div_symbol.classList.add("legend-line")
                    div_symbol.style.borderColor = style.stroke_color
                    div_symbol.style.borderWidth = style.stroke_width + "px"
                    
                    if (style.stroke_linedash) {
                        div_symbol.style.broderStyle = "dashed"
                    }
                    break
                case 'Point':
                    div_symbol.classList.add("legend-point")
                    div_symbol.style.borderColor = style.stroke_color
                    div_symbol.style.borderWidth = style.stroke_width + "px"
                    div_symbol.style.background = style.fill_color
                    
                    if (style.stroke_linedash) {
                        div_symbol.style.broderStyle = "dashed"
                    }
                    break
                case 'Icon':
                    svgImage = document.createElement("img")
                    svgImage.setAttribute("src", style.icon_svg_path)
                    svgImage.style.fill = style.icon_color
                    svgImage.setAttribute("width", "30px")
                    svgImage.setAttribute("height", "30px")

                    // On utilise svgInject pour transformer la balise img en balise svg 
                    // et ainsi pouvoir attribuer la couleur à l'icône
                    SVGInject(svgImage, {
                        afterInject: function(img, svg){
                            svg.querySelector("path").style.fill = style.icon_color
                        }
                    })
                    
                    div_symbol.append(svgImage)
                    
                    break
            }

            // Création du label associé au style
            legend_col_label = document.createElement("div")
            legend_col_label.classList.add("legend-col-label")
            legend_col_label.classList.add("mt-auto")
            legend_col_label.classList.add("mb-auto")
            
            if (style.style_name) {
                legend_col_label.innerHTML = style.style_name
            } /*else {
                legend_col_label.innerHTML = ""
            }*/

            // Assemblage des divs
            legend_col_symbol.append(div_symbol)
            legend_row.append(legend_col_symbol)
            legend_row.append(legend_col_label)

            legends.push(legend_row)
        })        
    })

    legends.forEach(legend => {
            // On ajoute le style à la liste
            layer_legend.append(legend)
    })

    // Création du slider pour l'opacité
    let slider = document.createElement("input")
    slider.classList.add("slider")
    slider.setAttribute("type", "range")
    slider.setAttribute("min", "0")
    slider.setAttribute("max", "1")
    slider.setAttribute("step", "0.1")
    slider.setAttribute("oninput", "setLayerOpacity(" + layer_uid + ", this.value)")
    slider.setAttribute("draggable", "true")
    slider.setAttribute("ondragstart", "event.preventDefault(); event.stopPropagation();")

    layer_legend.append(slider)
    
}

var layerIsInLegend = function(layer_uid){
    if (document.getElementById("layer_list").querySelector("li[layer-uid='"+ layer_uid +"']")){
        return true
    }
    else {
        return false
    }
}

/**
 * Affiche ou maque la légende
 */
toggleLegend = function(layer_uid){
    document.getElementById("layer-legend-"+layer_uid).classList.toggle("hide")
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
        //Cas particulier de la couche warning qui ne doit pas être supprimer
        if (layer.get("isCalculatorLayer") == true){
            // On rend invisible la couche
            layer.setVisible(false)
            // Et on supprime les objets qu'elle contient
            layer.getSource().clear()
        } else {
            // Cas classique, on supprime la couche de la carte
            map.removeLayer(layer)
        }
        
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
    nav_element.innerHTML = layer_name

    //Création de la croix pour fermer la table attributaire 
    btn_close = document.createElement("button")
    btn_close.classList.add("btn-close")
    btn_close.classList.add("btn-close-attribute-table")
    btn_close.setAttribute("type", "button")
    btn_close.addEventListener("click", event=> {
        event.stopPropagation()

        let nav_element = event.currentTarget.parentNode
        let target_table = nav_element.getAttribute("target")

        let nav_is_active = nav_element.classList.contains("active")

        document.getElementById(target_table).remove()

        let nav_attribute_table = nav_element.parentNode
        
        nav_element.remove()

        // Si la table attributaire était afficher, il faut en afficher une autre (la première !)
        if (nav_is_active){
            let first_attribute_table = nav_attribute_table.querySelectorAll(".nav-layer-item")[0]
            console.log(first_attribute_table)
            if (first_attribute_table){
                activeAttributeTable(first_attribute_table)
            }
        }
    })
    nav_element.append(btn_close)


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

                        console.log("here i am")
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
 * Fonction d'interrogation des données affichant les donnéess 
 * attributaires des entités présentes sous le clic
 */
var singleClickForFeatureInfo = function(event){
    // Si on est en édition, on ne fait rien
    /*is_editing_active = false
    map.getInteractions().forEach(interaction => {
        if (interaction instanceof ol.interaction.Draw) {
            is_editing_active = true
        }
    })
    if (is_editing_active) return;*/

    // On commence par vider tous les feature dans
    // la couche de sélection
    clearSelectedSource()

    // Variable permettant de savoir si on passe à une autre couche
    var previous_layer = null

    // Création de l'objet recevant la desription des feature
    var ul_layer_list = document.createElement("ul")
    ul_layer_list.classList.add("layer-list")

    let has_feature = false
    var entity_index = 1
    var nb_entity = 0
    // On boucle sur les entités présent sous le clic
    map.forEachFeatureAtPixel(event.pixel, function(feature, layer) {
        has_feature = true
        let layer_uid = ol.util.getUid(layer)
        let feature_uid = ol.util.getUid(feature)

        // on s'assure de ne pas être sur un feature de la couche de sélection
        // ou de la couche "calculator_layer"
        if (layer_uid == ol.util.getUid(selectedVectorLayer) || layer_uid == ol.util.getUid(warning_calculator_layer)){
            return
        }



        // Dans ce cas, on veut highlight tous les features cliqués
        // sans zommer dessus
        highlightFeature(layer_uid, feature_uid, false, false)

        // Construction de l'arborescence des feature cliqué
        // Si c'est une nouvelle couche, on créé l'élément .layer-item
        if (layer_uid != previous_layer){
            entity_index = 1
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
        //span_feature_item.innerHTML = "entité #"+feature_uid
        span_feature_item.innerHTML = "Objet #" + entity_index

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
        entity_index ++
        nb_entity++
    })

    document.getElementById("bloc-clicked-features-attributes-content").innerHTML = ""
    document.getElementById("bloc-clicked-features-attributes-content").append(ul_layer_list)

    // S'il n'y a qu'une seule entité, et déploie la fiche info
    if (nb_entity == 1){
        document.getElementById("bloc-clicked-features-attributes-content").querySelector(".feature-item .clickable").click()
    }

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
}

/**
 * Fonction de suppression des données lors d'un clic
 */
var singleClickForRemovingFeature = function(event){

    map.forEachFeatureAtPixel(event.pixel, function(feature, layer) {
        if (layer.get("isEditing") == true){
            layer.getSource().removeFeature(feature)

            // On controle s'il reste des feature dans la couche
            if (layer.getSource().getFeatures().length == 0){
                // Auquel cas, on désactive les bouton de suppression 
                document.getElementById("btn-chanllenge-calculator-remove-feature").classList.add("disabled")
                // et d'éxécution du calcul
                document.getElementById("btn-chanllenge-calculator-execute").classList.add("disabled")

                // On change la fonction à éxécuter lors d'un clic sur la carte
                map.un('singleclick', singleClickForRemovingFeature)
                map.on('singleclick', singleClickForFeatureInfo)
            }

        }

    })

    
}

/**
 * Activation de l'action par défaut lors d'un clique sur la carte
 * (interrogation des données)
 */
map.on('singleclick', singleClickForFeatureInfo)

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

/**
 * Couche de dessin pour la calculette des enjeux
 */
var warning_calculator_style = [{
    "style_type": "Polygon",
    "styles": [{
        "style_name": "Périmètre de la zone d'étude",
		"fill_color": "rgba(255, 255, 255, 0.4)",
		"stroke_color": "rgba(0,153,255,1)",
		"stroke_width": 4,
		"stroke_linedash": [],
		"filter" : null
    }]
}]

var warning_calculator_source = new ol.source.Vector();
var warning_calculator_layer = new ol.layer.Vector({
    layer_name: "Périmètre(s) de la zone d'étude",
    isEditing: false,
    isCalculatorLayer: true,
    source: warning_calculator_source,
    /*zIndex: 9999,*/
    style: buildStyle(warning_calculator_style),
    json_style: warning_calculator_style,
});

map.addLayer(warning_calculator_layer)

/**
 * Fonction permettant de déclarer l'édition sur une couche
 */
declareEditionForLayer = function (layer){
    if (layer.get("isEditing")){
        /**
         * TODO avoir une moulinette ui contrôle si des 
         * objets des autres couches n'ont pas été sauvegardé
        */

        layer.set("isEditing", false)
    } else {
        // On désactive l'édition sur toutes les couches
        map.getLayers().forEach(tmp_layer => {
            tmp_layer.set("isEditing", false)
        })
        // On déclare l'édition sur la couche layer
        layer.set("isEditing", true)
    }
}
/**
 * Activation de l'édition de la couche
 */
var enableLayerDrawing = function(layer, geomType){
    // On désactive les intéraction en cours
    disableLayerDrawing()

    // On désactive l'interaction singleclick
    map.un('singleclick', singleClickForFeatureInfo)

    // Récupérationde la source
    source = layer.getSource()

    // Création des intéraction pour la source
    draw_interaction = new ol.interaction.Draw({
        source: source,
        type: geomType,
    })

    // Gestion du drawEnd
    draw_interaction.on('drawend', function(evt){
        //if (layer.get("layer_name") == "calculator_layer"){
        if (layer.get("isCalculatorLayer")){
            // Ici, on est sur la couche de numérisation pour la calculette des enjeux
            // Activation des boutons de suppression d'un feature
            document.getElementById("btn-chanllenge-calculator-remove-feature").classList.remove("disabled")
            // Activation du bouton de lancement du calcul
            document.getElementById("btn-chanllenge-calculator-execute").classList.remove("disabled")

            // On affiche la couche dans la alégende si ce n'est pas déjà le cas
            if (! layerIsInLegend(ol.util.getUid(warning_calculator_layer))){
                addLayerInLayerBar(warning_calculator_layer)
            }
            // On s'assure que la couche est visible
            warning_calculator_layer.setVisible(true)
            // ainsi que le checkbox associé dans le layerBar est coché
            //document.getElementById("layer_list").querySelector("li[layer-uid='"+ ol.util.getUid(warning_calculator_layer) +"']").querySelector("input[type='checkbox']").checked = true
            document.querySelector("li[layer-uid='"+ ol.util.getUid(warning_calculator_layer) +"'] input[type='checkbox']").checked = true
        }
    })
    
    snap_interaction = new ol.interaction.Snap({
        source: source,
    })
    
    modify_interaction = new ol.interaction.Modify({
        source: source
    })

    // Ajout des intéractions à la carte
    draw_interaction.setActive(true)
    map.addInteraction(draw_interaction)
    map.addInteraction(snap_interaction)
    map.addInteraction(modify_interaction)

    //layer.set("isEditing", true)
}

/**
 *  Désactivation de l'édition de la couche
 */
 var disableLayerDrawing = function(){
    // On réactive l'interaction singleclick
    map.on('singleclick', singleClickForFeatureInfo)

    map.getInteractions().forEach(interaction => {
        if (interaction instanceof ol.interaction.Draw){
            map.removeInteraction(interaction)
        }
        if (interaction instanceof ol.interaction.Snap){
            map.removeInteraction(interaction)
        }
        if (interaction instanceof ol.interaction.Modify){
            map.removeInteraction(interaction)
        }
    })
} 

/**
 * Controle si une source a des features
 */
var layerHasFeature = function (layer){
    if (layer.getSource().getFeatures()){
        return true
    } else {
        return false 
    }
}

/**
 * Recherche d'un lieux dit et zoom sur la carte
 */
document.getElementById("search-toponyme-input").addEventListener("keyup", event => {
    if (controller !== undefined) {
        // Cancel the previous request
        controller.abort();
    }

    if ("AbortController" in window) {
        controller = new AbortController;
        signal = controller.signal;
    }

    //On vide le bloc affichant le résultat de la recherche
    document.getElementById("toponyme-autocomplete").innerHTML = ""

    var search_name = event.target.value

    document.getElementById("toponyme-autocomplete-spinner").style.display = "block"

    if (search_name.length >= 3) {
        getAutocompleteToponyme(search_name).then(toponymes_list => {
            console.log(toponymes_list)
            document.getElementById("toponyme-autocomplete").classList.remove("hide")

            if (toponymes_list.geojson_layer.features){                
                //Création des élément HTML de la liste des résultats
                toponymes_list.geojson_layer.features.forEach(toponyme => {

                    toponyme_nom = toponyme.properties.toponyme_nom

                    if (toponyme.properties.type && toponyme.properties.precision_geo){
                        toponyme_nom += ' (' + toponyme.properties.toponyme_type + ' - ' + toponyme.properties.toponyme_precision_geo + ')'
                    } else if (toponyme.properties.toponyme_type){
                        toponyme_nom += ' (' + toponyme.properties.toponyme_type + ')'
                    } else if (toponyme.properties.toponyme_precision_geo) {
                        toponyme_nom += ' (' + toponyme.properties.toponyme_precision_geo + ')'
                    }


                    var div = document.createElement('div')
                    div.classList.add("toponyme-autocomplete-option")
                    div.setAttribute("coordinates", '[' + toponyme.geometry.coordinates + ']')


                    div.innerHTML = toponyme_nom

                    // On ajoute un listener lors d'un clique sur un des éléments
                    // qui zoom sur les coordonnée associé à l'élément
                    div.addEventListener('click', (event) =>{
                        // On masque la liste des propositions
                        document.getElementById("toponyme-autocomplete").classList.add("hide")

                        let coordinates = JSON.parse(event.currentTarget.getAttribute("coordinates"))
                        map.getView().fit(coordinates, {maxZoom: 16})

                        document.getElementById("search-toponyme-input").value = event.currentTarget.innerHTML
                    })

                    document.getElementById("toponyme-autocomplete").append(div)
                })
                //On affiche le div recevant le réseultat de la recherche
                document.getElementById("toponyme-autocomplete").style.display = "block"
            }
            // On arrête le spinner
            document.getElementById("toponyme-autocomplete-spinner").style.display = "none"
        })
    } else {
        // On arrête le spinner s'il y a moins de 3 caractères
        document.getElementById("toponyme-autocomplete-spinner").style.display = "none"

        document.getElementById("toponyme-autocomplete").classList.add("hide")
    }
})

/**
 * Appel API pour l'autocomplétion du lieux-dits
 */
var getAutocompleteToponyme = function (search_name){
    return fetch(APP_URL + "/api/toponyme_autocomplete?search_name=" + search_name + "&limit=20", {
        method: "GET",
        signal: signal,
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin"
    })
    .then(res => {
        if (res.status != 200){
            throw res
        } else {
            return res.json()
        }
    })
    .catch(error => {
        default_message = "Erreur lors de l'autocompétion du taxon"

        console.log(error)
        //apiCallErrorCatcher(error, default_message)
    })
}

/**
 * Gestion de l'opacité
 */
var setLayerOpacity = function(layer_uid, opacity){
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid){
            //console.log(opacity)
            layer.setOpacity(parseFloat(opacity))
        }
    })
}