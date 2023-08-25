/*----------------------------------------------------*/
/*------------ Initialisation de la carte ------------*/
/*----------------------------------------------------*/
/**
 * Style par défaut
 */
const selectedStyles = function (feature, resolution) {

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
            })
        }),
        'Polygon': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: hilgth_color,
                lineDash: [],
                width: hilgth_strok_width,
            }),
        }),
        'GeometryCollection': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: hilgth_color,
                width: hilgth_strok_width,
            }),
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
            })
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
    text: true
})

/**
 * Création de l'objet "map"
 */
map = new ol.Map({
    layers: [],
    target: 'map',
    view: new ol.View({
        projection: 'EPSG:3857',
        center: ol.proj.transform(CENTER, 'EPSG:4326', 'EPSG:3857'),
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
    var basemap_layer
    switch (basemap.type) {
        case "Tile":
            basemap_layer = new ol.layer.Tile({
                opacity: 1,
                visible: parseInt(basemap.isDefault),
                isEditing: false,
                isBasemap: true,
                description_layer: { "layer_attribution": basemap.attributions },
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

            break
        case "XYZ":
            basemap_layer = new ol.layer.Tile({
                opacity: 1,
                visible: parseInt(basemap.isDefault),
                isEditing: false,
                isBasemap: true,
                description_layer: { "layer_attribution": basemap.attributions },
                source: new ol.source.XYZ({
                    attributions: basemap.attributions,
                    url: basemap.url,
                    projection: "EPSG:3857",
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: [-20037508, 20037508],
                        resolutions: resolutions,
                        matrixIds: matrixIds
                    }),
                    wrapX: true,
                    crossOrigin: "anonymous"
                })
            })

            break
    }

    map.addLayer(basemap_layer)

    let div_item = document.createElement('div')
    div_item.setAttribute('class', 'dropdown-item')
    div_item.setAttribute('layer-uid', ol.util.getUid(basemap_layer))
    div_item.appendChild(document.createTextNode(basemap.name))
    div_item.setAttribute('onclick', 'showBasemap(' + ol.util.getUid(basemap_layer) + ')')

    document.getElementById("basemap-dropdown-content").appendChild(div_item)
})

//Ajout de la couche de séléction à la carte
map.addLayer(selectedVectorLayer)

/**
 * Gestion du changement de fond de carte
 */
showBasemap = function (layer_uid) {
    map.getLayers().forEach(layer => {
        if (layer.get("isBasemap") == true) {
            layer.setVisible(false)
            if (ol.util.getUid(layer) == layer_uid) {
                layer.setVisible(true)
            }
        }
    });
}

/**
 * Fonction vidant la couche de sélection 
 */
clearSelectedSource = function () {
    selectedVectorSource.clear()
}

/**
 * Gestion de l'affichage des coordonnées correspondant 
 * à la position de la souris
 */
map.on('pointermove', function (evt) {
    var coords = ol.proj.toLonLat(evt.coordinate);

    document.getElementById('bloc-coords').innerHTML = coords[1].toFixed(8) + " ; " + coords[0].toFixed(8);
});

/*----------------------------------------------------*/
/*------ Gestion des styles appliqués aux couches-----*/
/*----------------------------------------------------*/
/**
 * Retourne une couleur aléatoire en rgba
 */
var random_color = function (opacity) {
    var o = Math.round, r = Math.random, s = 255
    let red = o(r() * s)
    let green = o(r() * s)
    let blue = o(r() * s)
    let color_rgba = 'rgba(' + red + ',' + green + ',' + blue + ',' + opacity + ')'
    let color_rgb = 'rgb(' + red + ',' + green + ',' + blue + ')'
    //return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + opacity + ')'
    return { color_rgba, color_rgb }
}

/**
 * Style par défaut
 */
const getDefaultStyle = function () {

    // Création des couleurs aléatoires
    let { color_rgba, color_rgb } = random_color(0.5)

    return function (feature, resolution) {


        if (feature.visible == false) {
            return null
        }

        const styles = {
            'Point': new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: null,
                    stroke: new ol.style.Stroke({
                        color: color_rgb,
                        width: 2
                    }),
                })
            }),
            'LineString': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: color_rgb,
                    width: 5,
                }),
            }),
            'MultiLineString': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: color_rgb,
                    width: 5,
                }),
            }),
            'MultiPoint': new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: null,
                    stroke: new ol.style.Stroke({
                        color: color_rgb,
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
                    color: color_rgba,
                }),
            }),
            'Polygon': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 1)',
                    lineDash: [],
                    width: 1,
                }),
                fill: new ol.style.Fill({
                    color: color_rgba,
                }),
            }),
            'GeometryCollection': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 1)',
                    width: 2,
                }),
                fill: new ol.style.Fill({
                    color: color_rgba,
                }),
                image: new ol.style.Circle({
                    radius: 10,
                    fill: null,
                    stroke: new ol.style.Stroke({
                        color: color_rgba,
                    }),
                }),
            }),
            'Circle': new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 1)',
                    width: 2,
                }),
                fill: new ol.style.Fill({
                    color: color_rgba,
                }),
            }),
        }

        return styles[feature.getGeometry().getType()];
    }
};

/**
 * Construction de l'étiquette
 */
const getFeatureLabel = function (feature_label, feature, resolution) {
    // Pas d'étiquette si ce n'est pas définit dans la json
    if (!feature_label) {
        return null
    }

    // Si il n'ya a pas de valeur dans l'attribut utilisé pour le label on s'arrète
    if (!feature.get(feature_label.text)) {
        return null
    }

    // Gestion du texte en fonctione du niveau de zoom (ou plus exactemnt la résolution)
    var text = ''
    max_resolution = 180
    if (feature_label.max_resolution) {
        max_resolution = feature_label.max_resolution
    }
    // Découpage de la chaine de caractère 
    if (resolution <= max_resolution) {
        // gestion différente si la valeur est un numérique ou une chaine de caractère
        let tmp_label_value = feature.get(feature_label.text)
        switch (typeof tmp_label_value) {
            case 'string':
                text = stringDivider(tmp_label_value, 16, '\n')
                break
            case 'number':
                text = tmp_label_value.toString()
                break
            case 'boolean':
                if (tmp_label_value == true) {
                    text = 'OUI'
                } else {
                    text = 'NON'
                }
        }
    }

    // Construction du font
    var weight = 'Normal'
    if (feature_label.weight) {
        weight = feature_label.weight
    }

    var size = 14
    if (feature_label.size) {
        size = feature_label.size
    }

    var font = weight + ' ' + size + 'px/1 Arial'

    // Construction de la couleur du texte
    var text_color = "rgba(0,0,0,1)"
    if (feature_label.color) {
        text_color = feature_label.color
    }
    var fill = new ol.style.Fill({ color: text_color })

    // Récupération du fond de l'étiquette
    var background_color = "rgba(255,255,255,0.7)"
    if (feature_label.background_color) {
        background_color = feature_label.background_color
    }

    background = new ol.style.Fill({ color: background_color })

    // Définition du placement du text
    var placement, baseline, align, offsetX, offsetY
    switch (feature.getGeometry().getType()) {
        case 'Polygon':
        case 'MultiPolygon':
        case 'LineString':
        case 'MultiLineString':
            placement = 'point'
            baseline = 'middle'
            align = 'center'
            offsetX = 0
            offsetY = 0
            break
        case 'Point':
        case 'MultiPoint':
            placement = 'point'
            baseline = 'bottom'
            align = 'start'
            offsetX = 4
            offsetY = -4
            break
    }

    return new ol.style.Text({
        text: text,
        font: font,
        fill: fill,
        placement: placement,
        textBaseline: baseline,
        textAlign: align,
        offsetX: offsetX,
        offsetY: offsetY,
        backgroundFill: background,
        overflow: true,
    })

}

/**
 * Construction d'un style openlayers à partir d'un json
 */
const getStyleFromJson = function (json_styles) {
    // On retourne une fonction interprétable par openLayers
    return function (feature, resolution) {
        // Pas de style si le feature est déclaré comme non visible (=filtré)
        if (feature.visible == false) {
            return null
        }

        var feature_style = {}

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
                        //if(eval(buildFilter(style.filter))){
                        if (style.expression == null || eval(style.expression)) {
                            //On retourne le style
                            polygon_style = [new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: style.stroke_color,
                                    lineDash: style.stroke_linedash,
                                    width: style.stroke_width,
                                }),
                                fill: new ol.style.Fill({
                                    color: style.fill_color,
                                }),
                                text: getFeatureLabel(style.feature_label, feature, resolution),
                            })]
                        }
                    })
                    break
                case 'Point':
                    json_geom_style.styles.forEach(style => {


                        //console.log(style.expression.replace('"', ''))

                        //console.log(buildFilter(style.filter))

                        //console.log(style.expression)
                        //Si la condition du style est respecté
                        //if(eval(buildFilter(style.filter))){
                        if (style.expression == null || eval(style.expression)) {
                            //On retourne le style
                            point_style = [new ol.style.Style({
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
                                }),
                                text: getFeatureLabel(style.feature_label, feature, resolution),
                            })]
                        }
                    })
                    break
                case 'Line':
                    json_geom_style.styles.forEach(style => {
                        //Si la condition du style est respecté
                        //if(eval(buildFilter(style.filter))){
                        if (style.expression == null || eval(style.expression)) {
                            //On retourne le style
                            line_style = [new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: style.stroke_color,
                                    lineDash: style.stroke_linedash,
                                    width: style.stroke_width
                                }),
                                text: getFeatureLabel(style.feature_label, feature, resolution),
                            })]
                        }
                    })
                    break
                case 'Icon':
                    json_geom_style.styles.forEach(style => {
                        //Si la condition du style est respecté
                        //if(eval(buildFilter(style.filter))){
                        if (style.expression == null || eval(style.expression)) {
                            //On retourne le style
                            icon_style = [new ol.style.Style({
                                image: new ol.style.Icon({
                                    src: style.icon_svg_path,
                                    color: style.icon_color,
                                    scale: style.icon_scale,
                                    opacity: style.icon_opacity
                                }),
                                text: getFeatureLabel(style.feature_label, feature, resolution),
                            })]
                        }
                    })
                    break
            }
        })

        if (polygon_style) {
            feature_style['Polygon'] = polygon_style
            feature_style['MultiPolygon'] = polygon_style
        }

        if (line_style) {
            feature_style['LineString'] = line_style
            feature_style['MultiLineString'] = line_style
        }

        if (point_style) {
            feature_style['Point'] = point_style
            feature_style['MultiPoint'] = point_style
        }

        // Si le style icon est définit alors on écrase le 
        // style attribué aux points (et multipoints)
        if (icon_style) {
            feature_style['Point'] = icon_style
            feature_style['MultiPoint'] = icon_style
        }

        // Si on a pas récupéré de style depuis 
        // le json alors on attribut le style par défaut 
        // pour l'objet courant
        if (feature_style) {
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
var buildStyle = function (json_style) {
    if (json_style) {
        return getStyleFromJson(json_style)
    } else {
        return getDefaultStyle()
    }
}

/**
 * Gestion du highlight d'un feature
 */
highlightFeature = function (layer_uid, feature_uid, zoomOn = true, showOne = true) {
    // On vide la couche de sélection seulement si on veut
    // highligth un seul feature
    if (showOne) {
        clearSelectedSource()
    }
    //On recherche le feature 
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            layer.getSource().getFeatures().forEach(feature => {
                if (ol.util.getUid(feature) == feature_uid) {
                    feature["orginalLayerUid"] = layer_uid
                    //On ajoute le feature à la source
                    selectedVectorSource.addFeature(feature.clone())

                    // On s'assure d'appliquer le style au niveau du feature
                    // car si le feature à déjà un style, le style attribué 
                    // au vectorSource ne le remplace pas
                    selectedVectorSource.getFeatures().forEach(feature => {
                        feature.setStyle(selectedStyles(feature))
                    })
                    //On zoom sur l'extent de la source
                    if (zoomOn) {
                        map.getView().fit(selectedVectorSource.getExtent(), map.getSize())
                    }
                }
            })
        }
    })
}

/**
 * Gestion de l'opacité
 */
var setLayerOpacity = function (layer_uid, opacity) {
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            layer.setOpacity(parseFloat(opacity))
        }
    })
}

/*----------------------------------------------------*/
/*--------Gestion de la recherche de toponyme---------*/
/*----------------------------------------------------*/
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
            document.getElementById("toponyme-autocomplete").classList.remove("hide")

            if (toponymes_list.geojson_layer.features) {
                //Création des élément HTML de la liste des résultats
                toponymes_list.geojson_layer.features.forEach(toponyme => {

                    toponyme_nom = toponyme.properties.toponyme_nom

                    if (toponyme.properties.toponyme_type && toponyme.properties.toponyme_precision_geo) {
                        toponyme_nom += ' (' + toponyme.properties.toponyme_type + ' - ' + toponyme.properties.toponyme_precision_geo + ')'
                    } else if (toponyme.properties.toponyme_type) {
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
                    div.addEventListener('click', (event) => {
                        // On masque la liste des propositions
                        document.getElementById("toponyme-autocomplete").classList.add("hide")

                        let coordinates = JSON.parse(event.currentTarget.getAttribute("coordinates"))
                        map.getView().fit(coordinates, { maxZoom: 16 })

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
var getAutocompleteToponyme = function (search_name) {
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
            if (res.status != 200) {
                throw res
            } else {
                return res.json()
            }
        })
        .catch(error => {
            default_message = "Erreur lors de l'autocompétion du taxon"
        })
}

/*----------------------------------------------------*/
/*-----Gestion de l'ajout d'une couche à la carte-----*/
/*----------------------------------------------------*/
/**
 * Fonction ajoutant une couche GeoJSON à la carte
 */
var addGeojsonLayer = function (data, additional_data = null) {

    geojson = data.geojson_layer

    let layer_default_style = data.desc_layer.layer_default_style

    // Création des couleurs aléatoires
    var { color_rgba, color_rgb } = random_color(0.5)

    // Création d'un stryle json par défaut s'il n'y en a pas déjà un
    if (!layer_default_style) {
        // On récupère analyse les features pour connaitre les différentes géométrie
        var has_polygon = false
        var has_Line = false
        var has_point = false
        if (geojson.features) {
            geojson.features.forEach(feature => {
                if (feature.geometry) {
                    if (feature.geometry.type == "Polygon" || feature.geometry.type == "MultiPolygon") {
                        has_polygon = true
                    }
                    else if (feature.geometry.type == "LineString" || feature.geometry.type == "MultiLineString") {
                        has_Line = true
                    }
                    else if (feature.geometry.type == "Point" || feature.geometry.type == "MultiPoint") {
                        has_point = true
                    }
                }
            })
        }

        // Cas ou la couche est vide, il faut récupérer les géométries autorisés
        if (data.desc_layer.layer_allowed_geometry) {
            if (data.desc_layer.layer_allowed_geometry.includes('Polygon')) {
                has_polygon = true
            }
            if (data.desc_layer.layer_allowed_geometry.includes('LineString')) {
                has_Line = true
            }
            if (data.desc_layer.layer_allowed_geometry.includes('Point')) {
                has_point = true
            }
        }

        layer_default_style = []
        if (has_polygon) {
            tmp_style = {
                "style_type": "Polygon",
                "styles": [{
                    "fill_color": color_rgba,
                    "stroke_color": "rgba(0,0,0,1)",
                    "stroke_width": 1,
                    "stroke_linedash": [],
                    "filter": null
                }]
            }
            layer_default_style.push(tmp_style)
        }
        if (has_Line) {
            tmp_style = {
                "style_type": "Line",
                "styles": [{
                    "stroke_color": color_rgb,
                    "stroke_width": 5,
                    "stroke_linedash": [],
                    "filter": null
                }]
            }
            layer_default_style.push(tmp_style)
        }
        if (has_point) {
            tmp_style = {
                "style_type": "Point",
                "styles": [{
                    "fill_color": color_rgba,
                    "stroke_color": "rgba(0,0,0,1)",
                    "stroke_width": 1,
                    "stroke_linedash": [],
                    "radius": 5,
                    "filter": null
                }]
            }
            layer_default_style.push(tmp_style)
        }
    }

    // Récupération de la fonction devant attribuer le style
    var style = buildStyle(layer_default_style)

    // Ajoute les données du geoJson dans un ol.source 
    var vectorSource = new ol.source.Vector({
        attributions: data.desc_layer.layer_attribution
    })
    if (geojson.features) {
        // On surcharge le vectorSource si la couche appelée possède des données
        vectorSource = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(geojson),
            attributions: data.desc_layer.layer_attribution
        })
    }

    // On initialise tout les feature comme visible
    vectorSource["visible"] = true

    zindex = map.getLayers().getLength() + 1

    var layerType = "refLayerReadOnly"
    if (data.desc_layer.layer_is_editable == true) {
        layerType = "editableLayer"
    }

    // Création du layer
    let vectorLayer = new ol.layer.Vector({
        layer_name: data.desc_layer.layer_label,
        source: vectorSource,
        layerType: layerType,
        isEditable: data.desc_layer.layer_is_editable,
        isEditing: false,
        isCalculatorLayer: false,
        style: style,
        zIndex: zindex,
        json_style: layer_default_style,
        additional_data: additional_data,
        description_layer: data.desc_layer,
        allowed_geometry: data.desc_layer.layer_allowed_geometry
    })

    // Ajout du layer sur la carte
    map.addLayer(vectorLayer)

    // Ajout du layer dans le layerBar
    addLayerInLayerBar(vectorLayer)
}

var refreshLayer = function (layer_id) {
    return fetch(APP_URL + "/api/ref_layer/" + layer_id, {
        method: "GET",
        signal: signal,
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        credentials: "same-origin"
    })
        .then(res => {
            if (res.status != 200) {
                throw res;
            } else {
                return res.json()
            }
        }).then(data => {
            // On actualise les données de la couche modifié.
            // Si elle est ouverte plusieurs fois, chaque instance est actualisé
            map.getLayers().forEach(layer => {
                if (layer.get("description_layer")) {
                    if (layer.get("description_layer").layer_id == layer_id) {
                        layer.getSource().clear()


                        // On s'assure que la couche de retour n'est pas vide
                        if (data.geojson_layer.features) {
                            layer.getSource().addFeatures(new ol.format.GeoJSON().readFeatures(data.geojson_layer))
                        }
                    }
                }
            })
        })
        .catch(error => {
            default_message = "Erreur lors du rafraichissement de la couche de données"

            console.error(error)
            apiCallErrorCatcher("error", default_message)
        })


}

/**
 * Fonction ajoutant la couche dans le layerBar
 */
var addLayerInLayerBar = function (vectorLayer) {
    let prototype = document.getElementById("layer_list").getAttribute('data-prototype')

    layer_uid = ol.util.getUid(vectorLayer) //- 1 

    layer_name = vectorLayer.get('layer_name')

    prototype = prototype.replace(/__LAYER_UID__/g, layer_uid)
    prototype = prototype.replace(/__LAYER_NAME__/g, layer_name)

    // On active la fontion dédition si la couche est éditable
    if (vectorLayer.get('isEditable') == true) {
        prototype = prototype.replace(/__EDIT_IS_DISABLED__/g, '')
    } else {
        prototype = prototype.replace(/__EDIT_IS_DISABLED__/g, 'disabled')
    }


    template = document.createElement('template')
    template.innerHTML = prototype

    //On active les eventListener
    template.content.querySelector(".checkbox-layer").addEventListener("click", event => {
        let layer_uid = event.target.closest("li").getAttribute("layer-uid")

        map.getLayers().forEach(layer => {
            if (ol.util.getUid(layer) == layer_uid) {
                layer.setVisible(!layer.getVisible())
            }
        });
    })

    template.content.querySelector(".layer-name").addEventListener("click", event => {
        // Récupération de l'uid de la couche cliqué
        let layer_uid = event.target.closest("li").getAttribute("layer-uid")

        setSelectedLayerInLayerbar(layer_uid)
    })


    document.getElementById("layer_list").prepend(template.content)

    // Construction de la légende de la couche
    json_style = vectorLayer.get('json_style')
    if (json_style) {
        buildLegendForLayer(layer_uid, json_style)
    }

    // On définit la couche ajouté comme couche selectionnée
    setSelectedLayerInLayerbar(layer_uid)
}

/**
 * Fonction créant la légende associé à la couche
 */
buildLegendForLayer = function (layer_uid, json_style) {

    // Récupération de l'objet associé à la légende de la couche layer_uid
    layer_legend = document.getElementById("layer-legend-" + layer_uid)
    // On vide le contenu de la légende actuelle
    layer_legend.innerHTML = ""

    // récupération de la liste des géométrie contenu dans la couche
    l_geomType = []
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            layer.getSource().getFeatures().forEach(feature => {
                if (feature.getGeometry()) {
                    if (!l_geomType.includes(feature.getGeometry().getType())) {
                        l_geomType.push(feature.getGeometry().getType())
                    }
                }
            })
        }
    })

    // Surcharge de la valeur LineString par Line et les types "multi" par les type "simple" 
    // pour qu'ils puissent être reconnus avec le type de géométrie déclaré dans le json_style
    var index = l_geomType.indexOf('LineString');
    if (index !== -1) {
        l_geomType[index] = 'Line';
    }
    var index = l_geomType.indexOf('MultiPoint');
    if (index !== -1) {
        if (l_geomType.includes('Point')) {
            // Si 'Point' est déjà déclaré on supprime la valeur 'MultiPoint' de la liste
            l_geomType.splice(index, 1);
        } else {
            // Sinon on remplace la valeur 'MultiPoint' par 'Point'
            l_geomType[index] = 'Point';
        }

    }
    var index = l_geomType.indexOf('MultiLineString');
    if (index !== -1) {
        if (l_geomType.includes('Line')) {
            // Si 'Line' est déjà déclaré on supprime la valeur 'MultiLineString' de la liste
            l_geomType.splice(index, 1);
        } else {
            // Sinon on remplace la valeur 'MultiLineString' par 'Line'
            l_geomType[index] = 'Line';
        }
    }
    var index = l_geomType.indexOf('MultiPolygon');
    if (index !== -1) {
        if (l_geomType.includes('Polygon')) {
            // Si 'Polygon' est déjà déclaré on supprime la valeur 'MultiPolygon' de la liste
            l_geomType.splice(index, 1);
        } else {
            // Sinon on remplace la valeur 'MultiPolygon' par 'Polygon'
            l_geomType[index] = 'Polygon';
        }
    }

    legends = []
    json_style.forEach(tmp_json_style => {
        geom_type = tmp_json_style.style_type

        if (l_geomType.includes(geom_type)) {

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

                switch (geom_type) {
                    case 'Polygon':
                        div_symbol.classList.add("legend-poly")
                        div_symbol.style.borderColor = style.stroke_color
                        div_symbol.style.borderWidth = style.stroke_width + "px"
                        div_symbol.style.background = style.fill_color

                        if (style.stroke_linedash.length > 0) {
                            div_symbol.style.borderStyle = "dashed"
                        }
                        break
                    case 'Line':
                        div_symbol.classList.add("legend-line")
                        div_symbol.style.borderTopColor = style.stroke_color
                        div_symbol.style.borderTopWidth = style.stroke_width + "px"

                        if (style.stroke_linedash.length > 0) {
                            div_symbol.style.borderTopStyle = "dashed"
                        }
                        break
                    case 'Point':
                        div_symbol.classList.add("legend-point")
                        div_symbol.style.borderColor = style.stroke_color
                        div_symbol.style.borderWidth = style.stroke_width + "px"
                        div_symbol.style.background = style.fill_color

                        if (style.stroke_linedash.length > 0) {
                            div_symbol.style.borderStyle = "dashed"
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
                            afterInject: function (img, svg) {
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
                }

                // Assemblage des divs
                legend_col_symbol.append(div_symbol)
                legend_row.append(legend_col_symbol)
                legend_row.append(legend_col_label)

                legends.push(legend_row)
            })
        }
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

/**
 * Affiche ou maque la légende
 */
toggleLegend = function (layer_uid) {
    document.getElementById("layer-legend-" + layer_uid).classList.toggle("hide")
}

/**
 * Converti un operateur en string en véritable opérateur
 */
/* function compare(left_term, operator, right_term) {
    switch (operator) {
        case '>':   return left_term > right_term
        case '<':   return left_term < right_term
        case '>=':  return left_term >= right_term
        case '<=':  return left_term <= right_term
        case '==':  return left_term == right_term
        case '=':   return left_term == right_term
        case '!=':  return left_term != right_term
        case 'IN':  return right_term.includes(left_term)
        case 'NOT IN':  return !right_term.includes(left_term)
        case 'LIKE': 
            if (String(right_term).startsWith('%') && String(right_term).endsWith('%')){
                return right_term.replace('%', '').includes(left_term)
            }   
            if (String(right_term).startsWith('%')){
                return String(left_term).endsWith(right_term.replace('%', ''))
            }   
            if (String(right_term).endsWith('%')){
                return String(left_term).startsWith(right_term.replace('%', ''))
            }
        case 'IS NULL': return left_term == null
        case 'IS NOT NULL': return left_term != null
        default: throw "Opérateur de comparaison incorrect"
    }
}*/

/**
 * Fonction récursive permettant de transformer les filtres json
 * en filtre javascript/openlayers
 */
/* function buildFilter(filter, str_filter="", logic_operator=""){
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
        throw "Erreur lors de la création du style : opération incorrect";
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
}*/

/*----------------------------------------------------*/
/*-----------Gestion de l'ordre des couches-----------*/
/*----------------------------------------------------*/
/**
 * Fonction changeant l'ordre des couche sur la carte 
 * en fonction de l'ordre des couche dans le layerBar
 */
var changeLayerOrder = function () {
    items = document.getElementById("layer_list").getElementsByTagName("li")
    for (var i = 0; i < items.length; ++i) {
        nb_layers = map.getLayers().getLength()
        layer_uid = items[i].getAttribute("layer-uid")
        new_index = nb_layers - i

        map.getLayers().forEach(layer => {
            if (ol.util.getUid(layer) == layer_uid) {
                layer.setZIndex(new_index)
            }
        });
    }
}

/*----------------------------------------------------*/
/*------Gestion de la suppression d'une couches------*/
/*----------------------------------------------------*/
/**
 * Suppression d'une couche sur la carte
 */
removeLayer = function (layer_uid) {

    //On recherche la couche
    var layer = null
    map.getLayers().forEach(tmp_layer => {
        current_layer_uid = ol.util.getUid(tmp_layer)
        if (current_layer_uid == layer_uid) {
            layer = tmp_layer
            return
        }
    })

    // puis on la supprime
    if (layer) {
        //Cas particulier de la couche warning qui ne doit pas être supprimé
        if (layer.get("layerType") == "warningCalculatorLayer") {
            // On rend invisible la couche
            layer.setVisible(false)
            // on s'assure de désactiver l'édition
            layer.set("isEditing", false)
            // Et on supprime les objets qu'elle contient
            layer.getSource().clear()

            // On desactive le bouton associé à la calculette des enjeux si ce n'est pas déjà le cas
            document.getElementById("btn-challenge-calculator").classList.remove("btn-active")
        } else {
            // Cas classique, on supprime la couche de la carte
            map.removeLayer(layer)
        }

        // Si la couche supprimé est la couche active alors on s'assure que l'édition est désactivé
        if (document.querySelector("#layer_list li[layer-uid='" + layer_uid + "']").classList.contains("layer-is-selected")) {
            disableLayerDrawing()

            // On masque les éventuelle boite à outil ouverte
            if (layer.get("layerType") == "warningCalculatorLayer") {
                document.getElementById("challenge-calculator-group-edit-btn").classList.add("hide")
            } else {
                document.getElementById("drawing-layer-group-edit-btn").classList.add("hide")
            }
        }

        // On supprime la couche du layer bar
        document.querySelector("#layer_list li[layer-uid='" + layer_uid + "']").remove()

        // On efface la table attributaire si elle est ouverte
        tab_id = "layer-data-table-" + current_layer_uid
        if (document.querySelector(".nav-layer-item[target=" + tab_id + "]")) {
            document.getElementById(tab_id).remove()
            document.querySelector(".nav-layer-item[target=" + tab_id + "]").remove()
        }

        // On efface le ou les features de la couche qui sont dans selectedVectorSource
        selectedVectorSource.getFeatures().forEach(feature => {
            if (feature.orginalLayerUid == layer_uid) {
                selectedVectorSource.removeFeature(feature)
            }
        })

        // On supprime les entré de cette couche dans 
        // le fenêtre d'affichage des données attributaire
        // (celle qui s'ouvre quand on clique sur la carte)
        deleteDataInInfobulleForlayer(layer_uid)
        /*attr_data = document.getElementById("bloc-clicked-features-attributes").querySelector(".layer-item[layer-uid=\"" + layer_uid + "\"]")
        if (attr_data) {
            attr_data.remove()

            // S'il n'y a plus de données dans le bloc attributaire, on le ferme
            if (attr_data = document.getElementById("bloc-clicked-features-attributes").querySelector(".layer-item") == null) {
                hideBlockClickedFeaturesAttributes()
            }
        }*/
    }
}

/**
 * Fonction effaçant les données affiché dans 
 * l'infobulle pour une couche spécifié
 */
var deleteDataInInfobulleForlayer = function (layer_uid) {
    attr_data = document.getElementById("bloc-clicked-features-attributes").querySelector(".layer-item[layer-uid=\"" + layer_uid + "\"]")
    if (attr_data) {
        attr_data.remove()

        // S'il n'y a plus de données dans le bloc attributaire, on le ferme
        if (attr_data = document.getElementById("bloc-clicked-features-attributes").querySelector(".layer-item") == null) {
            hideBlockClickedFeaturesAttributes()
        }
    }
}

/*----------------------------------------------------*/
/*----------Gestion de la table attributaire----------*/
/*----------------------------------------------------*/
/**
 * Affichage de la table attributaire
 * Seul les entités répondant aux filtres doivent être affichées
 */
var table
getFullDataTable = function (layer_uid) {
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
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

            document.getElementById("attribute-data-container").classList.remove("hide")
            document.getElementsByClassName("ol-scale-line")[0].style.bottom = "33%"
            document.getElementsByClassName("ol-attribution")[0].style.bottom = "33%"
        }
    })
}

/**
 * Mise à jour de la table attributaire html si elle est ouverte
 */
var refreshDataTable = function (layer_uid) {
    // Récupération du layer_uid
    /*var layer_uid
    map.getLayers().forEach(layer => {
        if (layer.get("description_layer")) {
            if (layer.get("description_layer").layer_id == layer_id) {
                layer_uid = ol.util.getUid(layer)
            }
        }
    })*/

    if (document.getElementById("layer-data-table-" + layer_uid)) {
        // Récupération du nav-data-table actif
        var active_nav_data_table
        var all_nav_data_table = document.getElementsByClassName("nav-layer-item")
        for (var i = 0; i < all_nav_data_table.length; i++) {
            if (all_nav_data_table[i].classList.contains("active")) {
                active_nav_data_table = all_nav_data_table[i]
            }
        }

        // On vide l'élément contenant la table attributaire
        document.getElementById("layer-data-table-" + layer_uid).remove()
        // on créé la nouvelle table attributaire
        getFullDataTable(layer_uid)

        // On réactive l'affichage de la table attributaire précédemment affiché
        inactiveAllAttributeTables()
        activeAttributeTable(active_nav_data_table)
    }
}

/**
 * Créer la table attributaire html
 */
createAttributeTable = function (layer_name, layer_uid, data) {

    tab_id = "layer-data-table-" + layer_uid

    // on masque toutes les tables attributaires
    inactiveAllAttributeTables()

    // On controle si le tableau existe (cas demande d'affichage d'une table attributaire déjà créé)
    if (document.querySelector(".nav-layer-item[target=" + tab_id + "]")) {
        let target = document.querySelector(".nav-layer-item[target=" + tab_id + "]").getAttribute("target")
        // Dans le cas d'un refresh, la table a été supprimé donc on s'assure qu'elle existe avant de vouloir l'afficher
        if (document.getElementById(target)) {
            // et on l'affiche que le tableau concerné
            activeAttributeTable(document.querySelector(".nav-layer-item[target=" + tab_id + "]"))
            return
        }
    }

    // Création d'un élément HTML recevant le tableau
    tab_element = document.createElement("div")
    tab_element.classList.add("layer-data-table")
    tab_element.id = tab_id
    tab_element.setAttribute("layer-uid", layer_uid)
    document.getElementById("data-block").append(tab_element)


    //Création du tableau
    table = new Tabulator("#" + tab_id, {

        height: "100%",
        layout: "fitData",
        selectable: 1,
        data: data,
        autoColumns: true,
        movableColumns: true,
        formatter: "html",
        resizeColumns: true,
        tooltips: true,

        autoColumnsDefinitions: function (definitions) {
            //Ajout d'un champ filtre dans l'en-tête de chaque colonne            
            definitions.forEach((column) => {
                column.headerFilter = true

                // On déclare les colonne comme étant de l'HTML
                // Permet d'avoir des liens dans le tableau
                column.formatter = "html"

                // On masque la colonne feature_uid
                if (column.field == "ol_uid") {
                    column["visible"] = false
                }
            });

            return definitions;
        },
    });
    table["layeruid"] = layer_uid

    // Action lors de la sélection d'un ligne
    table.on("rowSelected", function (row) {
        //On récupère l'uid de la couche et du feature associé à la ligne cliqué
        let layer_uid = row.getTable().layeruid
        let feature_uid = row.getData().ol_uid
        // On ferme la fenetre affichant les données attributaire lors d'un clic sur la carte
        hideBlockClickedFeaturesAttributes()
        //On highlight le feature
        highlightFeature(layer_uid, feature_uid)
    })

    // Action lors de la désélection d'un ligne
    table.on("rowDeselected", function (row) {
        ///On vide la couche de sélection
        clearSelectedSource()
    })

    // Action lorsqu'on filtre les données du tableau
    // N'affiche que les objets géographiques répondant positivement au filtre
    table.on("dataFiltered", function (filters, rows) {
        setTimeout(function () {
            table = rows[0].getTable()
            let layer_uid = table.layeruid

            let l_feature_uid = []
            rows.forEach(row => {
                l_feature_uid.push(row.getData().ol_uid)
            })

            filterFeature(layer_uid, l_feature_uid)
        }, 500);
    })

    // On désative l'affichage des autres atableau attributaire
    // inactiveAllAttributeTables()

    // Ajout d'un onglet associé au tableau
    // On controle que le "nav_element" n'existe pas déjà (cas du "refresh" de la table attributaire)

    if (!document.querySelector(".nav-layer-item[target='" + tab_id + "']")) {
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
        btn_close.addEventListener("click", event => {
            event.stopPropagation()

            let nav_element = event.currentTarget.parentNode
            let target_table = nav_element.getAttribute("target")

            let nav_is_active = nav_element.classList.contains("active")

            document.getElementById(target_table).remove()

            let nav_attribute_table = nav_element.parentNode

            nav_element.remove()

            // Si la table attributaire était afficher, il faut en afficher une autre (la première !)
            if (nav_is_active) {
                let first_attribute_table = nav_attribute_table.querySelectorAll(".nav-layer-item")[0]
                if (first_attribute_table) {
                    activeAttributeTable(first_attribute_table)
                }
            }

            // S'il n'y a plus d etable attributaire, on masque le bloc
            if (document.getElementsByClassName("nav-layer-item").length == 0) {
                document.getElementById("attribute-data-container").classList.add("hide")
                document.getElementsByClassName("ol-scale-line")[0].style.bottom = "8px"
                document.getElementsByClassName("ol-attribution")[0].style.bottom = ".5em"

            }
        })
        nav_element.append(btn_close)

        document.getElementById("nav-attribute-table").append(nav_element)

        // On active l'écouteur si il y a un click 
        nav_element.addEventListener("click", clickNavAttributeTableEvent)
    }
}

/**
 * Filtre les features 
 */
filterFeature = function (layer_uid, l_feature_uid) {
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            source = layer.getSource()
            if (source instanceof ol.source.Vector) {
                source.getFeatures().forEach(feature => {
                    if (l_feature_uid.includes(ol.util.getUid(feature))) {
                        feature["visible"] = true
                    } else {
                        feature["visible"] = false
                    }
                    source.dispatchEvent('change');
                })
            }
        }
    })
}

/**
 * Gestion du changement de table attributaire
 */
clickNavAttributeTableEvent = function () {
    // On désactive tout
    inactiveAllAttributeTables()

    // On active que le tableau attributaire séléctionné
    activeAttributeTable(this)
}

activeAttributeTable = function (nav_item) {
    // On ajoute la class active au nav_item
    nav_item.classList.add("active")
    // On afficher le tableau associé
    target = nav_item.getAttribute("target")
    document.getElementById(target).style.display = "block"
}

inactiveAllAttributeTables = function () {
    // On retire la class ".active"
    items = document.getElementsByClassName("nav-layer-item")
    for (var i = 0; i < items.length; i++) {
        items[i].classList.remove("active")
    }

    //On masque le tableau visible
    tables = document.getElementsByClassName("layer-data-table")
    for (var i = 0; i < tables.length; i++) {
        tables[i].style.display = "none"
    }
}

/*----------------------------------------------------*/
/*------------Gestion du clic sur la carte------------*/
/*----------------------------------------------------*/
/**
 * Fonction d'interrogation des données affichant les donnéess 
 * attributaires des entités présentes sous le clic
 */
var singleClickForFeatureInfo = function (event) {

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
    map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
        has_feature = true
        let layer_uid = ol.util.getUid(layer)
        let feature_uid = ol.util.getUid(feature)

        // on s'assure de ne pas être sur un feature de la couche de sélection
        // ou de la couche "calculator_layer"
        if (layer_uid == ol.util.getUid(selectedVectorLayer) || layer_uid == ol.util.getUid(warning_calculator_layer)) {
            return
        }

        // Dans ce cas, on veut highlight tous les features cliqués
        // sans zommer dessus
        highlightFeature(layer_uid, feature_uid, false, false)

        // Construction de l'arborescence des feature cliqué
        // Si c'est une nouvelle couche, on créé l'élément .layer-item
        if (layer_uid != previous_layer) {
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
        span_feature_item.innerHTML = "Objet #" + entity_index

        li_feature_item.append(span_feature_item)

        // On ajoute la loupe pour zommer su l'entité
        var i_zoom_to_feature = document.createElement("i")
        i_zoom_to_feature.classList.add("bi")
        i_zoom_to_feature.classList.add("bi-search")
        i_zoom_to_feature.classList.add("zoom-to-feature")
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
        for (var key in properties) {
            let value = properties[key]

            // On n'affiche pas la géométrie
            if (key != "geometry") {

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

        if (layer_uid != previous_layer) {
            ul_layer_list.append(li_layer_item)
        }

        // On conserve le nom de la couche courante
        previous_layer = layer_uid
        entity_index++
        nb_entity++
    })

    document.getElementById("bloc-clicked-features-attributes-content").innerHTML = ""
    document.getElementById("bloc-clicked-features-attributes-content").append(ul_layer_list)

    // S'il n'y a qu'une seule entité, et déploie la fiche info
    if (nb_entity == 1) {
        document.getElementById("bloc-clicked-features-attributes-content").querySelector(".feature-item .clickable").click()
    }

    //On active les tooltip
    let tooltipTriggerList = [].slice.call(document.querySelectorAll('.zoom-to-feature[toggle-tooltip="tooltip"]'))
    let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })

    if (has_feature) {
        if (document.getElementById("bloc-clicked-features-attributes").classList.contains("hide")) {
            document.getElementById("bloc-clicked-features-attributes").classList.remove("hide")
            document.getElementById("bloc-clicked-features-attributes").classList.add("show")
        }
    } else {
        hideBlockClickedFeaturesAttributes()
    }
}

/**
 * Gestion de l'affichage de la sous-liste des features dans bloc-clicked-features-attributes
 */
showFeaturesList = function (element) {

    let feature_list = element.parentNode.querySelectorAll('.feature-list')

    if (feature_list[0].classList.contains("hide")) {
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
showPropertiesList = function (element) {

    let properties_list = element.parentNode.querySelectorAll('.properties-list')

    if (properties_list[0].classList.contains("hide")) {
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
zoomToFeature = function (element) {
    // Récupération de l'uid du layer
    layer_uid = element.closest(".layer-item").getAttribute("layer-uid")
    //récupération de l'uid du feature
    feature_uid = element.parentNode.getAttribute("featureUid")

    //Recherche du feature et zoom sur l'extent de l'objet
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            source = layer.getSource()
            if (source instanceof ol.source.Vector) {
                source.getFeatures().forEach(feature => {
                    if (ol.util.getUid(feature) == feature_uid) {
                        map.getView().fit(feature.getGeometry().getExtent(), map.getSize())
                    }
                })
            }
        }
    })
}

hideBlockClickedFeaturesAttributes = function () {
    document.getElementById("bloc-clicked-features-attributes").classList.add("hide")
    document.getElementById("bloc-clicked-features-attributes").classList.remove("show")

    clearSelectedSource()
}

document.getElementById("close-bloc-clicked-features-attributes-btn").addEventListener("click", hideBlockClickedFeaturesAttributes)

/**
 * Fonction de suppression des données lors d'un clic
 */
var singleClickForRemovingFeature = function (event) {

    map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {

        // Récupération de l'uid de la couche en cours d'édition
        active_layer_editing_uid = document.getElementById("drawing-layer-group-edit-btn").getAttribute("layer_uid")

        // On s'assure que l'objet cliqué est bien celui de la couche en cours d'edition
        if (ol.util.getUid(layer) == active_layer_editing_uid) {
            layer_uid = active_layer_editing_uid
            feature_uid = ol.util.getUid(feature)

            highlightFeature(layer_uid, feature_uid, false, true)

            // On passe les uid dans la fenêtre modal de confirmation
            document.getElementById("confirm-delete-feature-modal-layer-uid").value = layer_uid
            document.getElementById("confirm-delete-feature-modal-feature-uid").value = feature_uid

            // Ouverture du modal de confirmation
            confirmDeleteFeatureModal.show()
        }
    })
}

// Action de cliquer sur la confirmation de la suppression
document.getElementById("confirm-delete-feature-submit").addEventListener("click", event => {
    layer_uid = document.getElementById("confirm-delete-feature-modal-layer-uid").value
    feature_uid = document.getElementById("confirm-delete-feature-modal-feature-uid").value

    confirmRemoveFeature(layer_uid, feature_uid)
})

/**
 * Fonction supprimant un feature sur un layer
 */
var confirmRemoveFeature = function (layer_uid, feature_uid) {

    var layer
    map.getLayers().forEach(tmp_layer => {
        if (ol.util.getUid(tmp_layer) == layer_uid) {
            layer = tmp_layer
        }
    })

    var feature
    layer.getSource().getFeatures().forEach(tmp_feature => {
        if (ol.util.getUid(tmp_feature) == feature_uid) {
            feature = tmp_feature
        }
    })

    layer_id = layer.get("description_layer").layer_id


    // On sassure s'être sur la couche active en édition
    if (ol.util.getUid(layer) == layer_uid) {
        // On s'assure d'être sur une couche en édition            
        if (layer.get("isEditing") == true) {

            // Si on est sur une couche éditable il va falloir supprimer en base 
            if (layer.get("layerType") == "editableLayer") {
                writeFeaturesInDatabase(layer_id, feature, "delete").then(res => {
                    layer.getSource().removeFeature(feature)
                })
            } else {
                layer.getSource().removeFeature(feature)
            }

            // Reconstruction de la légende
            buildLegendForLayer(layer_uid, layer.get('json_style'))

            // On controle s'il reste des feature dans la couche
            if (layer.getSource().getFeatures().length == 0) {
                if (layer.get("layerType") == "warningCalculatorLayer") {
                    // Auquel cas, on désactive les bouton de suppression 
                    document.getElementById("btn-challenge-calculator-remove-feature").classList.add("disabled")
                    // et d'éxécution du calcul
                    document.getElementById("btn-challenge-calculator-execute").classList.add("disabled")
                }

                if (["editableLayer", "drawingLayer"].includes(layer.get("layerType"))) {
                    // Auquel cas, on désactive les bouton de suppression 
                    document.getElementById("btn-drawing-layer-remove-feature").classList.add("disabled")
                }

                // On change la fonction à éxécuter lors d'un clic sur la carte
                map.un('singleclick', singleClickForRemovingFeature)
                map.on('singleclick', singleClickForFeatureInfo)
            }
        }
        confirmDeleteFeatureModal.hide()
        clearSelectedSource()
    }
}

/**
 * Annulation de la suppression d'un objet
 */
document.getElementById("confirm-delete-feature-abort").addEventListener("click", event => {
    clearSelectedSource()
    confirmDeleteFeatureModal.hide()
})

/**
 * Fonction spécifique aux données d'observation permettant 
 * de récupérer des informations complémentaires 
 */
var getMoreObsInfo = function (event, field_id, id) {
    // Récupération du layer_uid
    var parent = event.target.closest("[layer-uid]")
    layer_uid = parent.getAttribute("layer-uid")

    var filters
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            filters = layer.get("additional_data").formdata
        }
    })

    var body = {
        filters: filters,
        data_id_type: field_id,
        data_id: id
    }

    document.getElementById("obs-more-info-modal-loading").classList.remove("hide")
    obs_more_info_table.clearFilter();
    obs_more_info_table.clearData();
    obsMoreInfoModal.show()

    fetch(APP_URL + "/api/layer/get_obs_object_detail", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(body)
    })
        .then(res => {
            if (res.status != 200) {
                // En envoi l"erreur dans le catch
                throw res;
            } else {
                return res.json()
            }
        })
        .then(data => {

            //console.log(data)
            buildMoreObsInfo(data)
            document.getElementById("obs-more-info-modal-loading").classList.add("hide")
        })
        .catch(error => {
            obsMoreInfoModal.hide()
            apiCallErrorCatcher("erreur", "Erreur lors de la récupération des informations complémentaires")
        })
}

var obs_more_info_table = new Tabulator("#obs-more-info-table", {
    height: "100%",
    data: [],
    layout: "fitData",
    pagination: "local",
    paginationSize: 20,
    tooltips: true,
    columns: [
        { title: "Règne", field: "regne", headerFilter: "input" },
        { title: "groupe taxnomique", field: "group2_inpn", headerFilter: "input" },
        { title: "Nom scientifique", field: "nom_scientifique", headerFilter: "input", width: 275 },
        { title: "Nom vernaculaire", field: "nom_vern", width: 200, headerFilter: "input", width: 160 },
        { title: "Nb obs", field: "nb_obs", headerFilter: "input" },
        { title: "Première obs", field: "first_obs", headerFilter: "input" },
        { title: "Dernière obs", field: "last_obs", headerFilter: "input" },
        { title: "Observateurs", field: "observateurs", width: 200, headerFilter: "input" },
        { title: "Statut", field: "status", width: 200, headerFilter: "input" },
    ]
})

var buildMoreObsInfo = function (data) {
    obs_more_info_table.replaceData(data)
    obs_more_info_table.setSort([
        { column: "nom_scientifique", dir: "asc" },
        { column: "group2_inpn", dir: "asc" },
        { column: "regne", dir: "asc" },
    ])
}

/**
 * Activation de l'action par défaut lors d'un clique sur la carte
 * (interrogation des données)
 */
map.on('singleclick', singleClickForFeatureInfo);


/*----------------------------------------------------*/
/*------------Couche calculette des enjeux------------*/
/*----------------------------------------------------*/
/**
 * Déclaration de la couche de dessin 
 * pour la calculette des enjeux
 */
var warning_calculator_style = [{
    "style_type": "Polygon",
    "styles": [{
        "style_name": "Périmètre de la zone d'étude",
        "fill_color": "rgba(255, 255, 255, 0.4)",
        "stroke_color": "rgba(0,153,255,1)",
        "stroke_width": 4,
        "stroke_linedash": [],
        "filter": null
    }]
}]

var warning_calculator_source = new ol.source.Vector();
var warning_calculator_layer = new ol.layer.Vector({
    layer_name: "Périmètre(s) de la zone d'étude",
    layerType: "warningCalculatorLayer",
    isEditable: true,
    isEditing: false,
    isCalculatorLayer: true,
    source: warning_calculator_source,
    style: buildStyle(warning_calculator_style),
    json_style: warning_calculator_style,
});

map.addLayer(warning_calculator_layer)




/*----------------------------------------------------*/
/*---------Gestion de l'édition d'une couche----------*/
/*----------------------------------------------------*/
/**
 * Fonction permettant de déclarer l'édition sur une couche
 */
editionLayerManagement = function (layer) {
    let lis = document.getElementById("layer_list").querySelectorAll("li")

    lis.forEach(li => {
        if (li.getAttribute("layer-uid") == ol.util.getUid(layer)) {

            if (layer.get("isEditing")) {
                layer.set("isEditing", false)
                li.querySelector(".layer-edition-menu-item").innerHTML = "Editer"
                li.querySelector('.layer-name').style.fontStyle = 'normal'
            } else {
                layer.set("isEditing", true)
                li.querySelector(".layer-edition-menu-item").innerHTML = "Arréter l'édition"
                li.querySelector('.layer-name').style.fontStyle = 'italic'
            }
        }
    })

    numerisationToolbarShowManagement(ol.util.getUid(layer))
}

/**
 * Activation de l'édition de la couche
 */
var enableLayerDrawing = function (layer, geomType) {
    // On désactive les intéraction en cours
    disableLayerDrawing()

    // On désactive l'interaction singleclick
    map.un('singleclick', singleClickForFeatureInfo)
    map.un('singleclick', openFormFeatureDataEdit)

    // Récupérationde la source
    source = layer.getSource()

    // Création des intéraction pour la source
    var draw_interaction = new ol.interaction.Draw({
        source: source,
        type: geomType,
    })

    // Action au commencement de l'edition
    draw_interaction.on('drawstart', function (evt) {
        switch (layer.get("layerType")) {
            case "drawingLayer":
            case "editableLayer":
                document.getElementById("btn-drawing-layer-previous").classList.remove("disabled")
                break
        }
    })

    // Action lorsque l'édition est abandonnée
    draw_interaction.on('drawabort', function (evt) {
        if (layer.get("layerType") == "drawingLayer") {
            document.getElementById("btn-drawing-layer-previous").classList.add("disabled")
        }
    })

    // Action lorsque l'édition est terminée
    draw_interaction.on('drawend', function (evt) {
        if (layer.get("layerType") == "warningCalculatorLayer") {
            // Ici, on est sur la couche de numérisation pour la calculette des enjeux
            // Activation des boutons de suppression d'un feature
            document.getElementById("btn-challenge-calculator-remove-feature").classList.remove("disabled")

            // Activation du bouton de lancement du calcul
            document.getElementById("btn-challenge-calculator-execute").classList.remove("disabled")

            // On s'assure que la couche est visible
            warning_calculator_layer.setVisible(true)

            // ainsi que le checkbox associé dans le layerBar est coché
            document.querySelector("li[layer-uid='" + ol.util.getUid(warning_calculator_layer) + "'] input[type='checkbox']").checked = true
        }

        if (layer.get("layerType") == "drawingLayer") {
            document.getElementById("btn-drawing-layer-remove-feature").classList.remove("disabled")
            document.getElementById("btn-drawing-layer-previous").classList.add("disabled")

            // Reconstruction de la légende (après un timeout sinon l'objet n'est pas créé à temps)
            setTimeout(() => {
                buildLegendForLayer(ol.util.getUid(layer), layer.get('json_style'))
            }, 500)
        }

        if (layer.get("layerType") == "editableLayer") {
            // Reconstruction de la légende (après un timeout sinon l'objet n'est pas créé à temps)
            setTimeout(() => {
                buildLegendForLayer(ol.util.getUid(layer), layer.get('json_style'))
            }, 500)

            document.getElementById("btn-drawing-layer-remove-feature").classList.remove("disabled")
            document.getElementById("btn-drawing-layer-previous").classList.add("disabled")

            getFeatureFrom(layer.get('description_layer').layer_id).then(res => {
                // Attribution du layer_uid au formulaire
                document.getElementById("feature-form-layer-uid").value = ol.util.getUid(layer)
                // Attribution du feature_uid au formulaire
                document.getElementById("feature-form-feature-uid").value = ol.util.getUid(evt.feature)
                // On déclare le mode du formulaire en INSERT (utile au moment de l'écriture)
                document.getElementById("feature-form-mode").value = "insert"

                // Récupération de la géométrie
                var format = new ol.format.WKT()
                var tmp_elements = document.getElementsByClassName("feature_form_element")
                for (var i = 0; i < tmp_elements.length; i++) {
                    if (tmp_elements[i].querySelector("input[propertie_type='geometry'")) {
                        tmp_elements[i].querySelector("input[propertie_type='geometry'").value = format.writeFeature(evt.feature)
                    }

                }
            })
        }
    })

    // Ajout des intéractions à la carte
    draw_interaction.setActive(true)
    map.addInteraction(draw_interaction)
}

/**
 * Activation de l'accrochage des points
 */
var enableLayerSnapping = function (layer) {
    // Récupérationde la source
    source = layer.getSource()

    snap_interaction = new ol.interaction.Snap({
        source: source,
    })

    map.addInteraction(snap_interaction)
}

/**
 * Activation de la modification des objets
 */
var enableLayerModify = function (layer) {

    map.un('singleclick', singleClickForFeatureInfo)

    // Récupérationde la source
    source = layer.getSource()

    modify_interaction = new ol.interaction.Modify({
        source: source
    })

    modify_interaction.on('modifyend', function (event) {
        if (layer.get("layerType") == "editableLayer") {

            layer_id = layer.get("description_layer").layer_id

            geomColumnName = layer.get("description_layer").layer_geom_column


            var format = new ol.format.WKT()

            feature = event.features.forEach(feature => {
                feature.set(geomColumnName, format.writeFeature(feature))

                writeFeaturesInDatabase(layer_id, feature, "update")
            })
            // Ajouter la géom au properties de l'objet
            // Envoyer le feature en mode update
        }
    })

    map.addInteraction(modify_interaction)
}

/**
 *  Désactivation de l'édition de la couche
 */
var disableLayerDrawing = function () {
    // On réactive l'interaction singleclick
    map.on('singleclick', singleClickForFeatureInfo)
    map.un('singleclick', singleClickForRemovingFeature)

    // On désactive les intéraction type par type 
    // Pour contourner un bug avec l'interaction snap

    // on commence par les "Snap"
    map.getInteractions().forEach(interaction => {
        if (interaction instanceof ol.interaction.Snap) {
            map.removeInteraction(interaction)
        }
    })

    //Puis les "Modify"
    map.getInteractions().forEach(interaction => {
        if (interaction instanceof ol.interaction.Modify) {
            map.removeInteraction(interaction)
        }
    })

    // Et enfin les "Draw"
    map.getInteractions().forEach(interaction => {
        if (interaction instanceof ol.interaction.Draw) {
            map.removeInteraction(interaction)
        }
    })
}

/**
 * Activation de l'édition
 */
var enableLayerEdition = function (event, layer_uid) {

    if (event.currentTarget.classList.contains("disabled")) {
        return
    }

    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            editionLayerManagement(layer)
            // On force la sélection de la couche lorsqu'on active ou désactive l'édtion sur une couche
            setSelectedLayerInLayerbar(ol.util.getUid(layer))
        }
    })
}

/**
 * Gestion de la mise en forme la liste de couche en fonction
 * de la couche selectionnée (changement de la couleur de fond du li)
 */
var setSelectedLayerInLayerbar = function (layer_uid) {
    document.getElementById("layer_list").querySelectorAll('li').forEach(li => {
        if (li.getAttribute("layer-uid") == layer_uid) {
            li.classList.add('layer-is-selected')
        } else {
            li.classList.remove('layer-is-selected')
        }
    })
    // En fonction de la couche selectionné, il faut afficher 
    // ou non la boite d'édition associé
    numerisationToolbarShowManagement(layer_uid)
}

/**
 * Activation de fonction de click sur un feature 
 * pour éditer ces données attributaires
 */
document.getElementById("btn-drawing-layer-edit-feature-info").addEventListener("click", event => enableEditAttribute())

var enableEditAttribute = function () {
    // On déselectionne tous les objets
    clearSelectedSource()

    var button = document.getElementById("btn-drawing-layer-edit-feature-info")

    if (button.classList.contains("btn-active")) {
        map.on('singleclick', singleClickForFeatureInfo)
        map.un('singleclick', openFormFeatureDataEdit)
        button.classList.remove("btn-active")

    } else {
        disableLayerDrawing()
        highlightToolBtn(button)

        map.un('singleclick', singleClickForFeatureInfo)
        map.on('singleclick', openFormFeatureDataEdit)
    }
}

/**
 * Gestion du click sur un feature 
 * Cas d'une couche éditable
 */
var openFormFeatureDataEdit = function (event) {
    // On commence par vider tous les feature dans
    // la couche de sélection
    clearSelectedSource()

    map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
        let layer_uid = ol.util.getUid(layer)
        let feature_uid = ol.util.getUid(feature)

        // on s'assure d'être sur une couche éditable
        current_editable_layer_uid = document.getElementById("layer_list").querySelector(".layer-is-selected").getAttribute("layer-uid")
        if (layer_uid == current_editable_layer_uid) {

            highlightFeature(layer_uid, feature_uid, false, false)

            getFeatureFrom(layer.get('description_layer').layer_id).then(res => {

                document.getElementById("feature-form-layer-uid").value = layer_uid
                document.getElementById("feature-form-feature-uid").value = feature_uid
                // On déclare le mode du formulaire en INSERT (utile au moment de l'écriture)
                document.getElementById("feature-form-mode").value = "update"

                populateFormFromFeature(feature)
            })
        }
    })
}

/**
 * Fonction assurant l'affichage de la bonne boite de 
 * bouton d'édition en fonction de la couche sélectionnée
 */
var numerisationToolbarShowManagement = function (layer_uid) {

    // On désactive les intractions (= draw)
    disableLayerDrawing()

    // Ainsi que les bouton d'édition actif
    unHighlightAllToolsBtn()

    // On desactive l'action de suppression sur un clic
    map.on('singleclick', singleClickForFeatureInfo)
    map.un('singleclick', singleClickForRemovingFeature)

    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            //On laisse activable ou non le bouton de suppression
            if (layer.getSource().getFeatures().length == 0) {
                document.getElementById("btn-drawing-layer-remove-feature").classList.add("disabled")
            } else {
                document.getElementById("btn-drawing-layer-remove-feature").classList.remove("disabled")
            }

            // si la couche sélectionnée est celle d'édition pour la calculette des enjeux
            // on affiche la boite à outils associée
            switch (layer.get("layerType")) {
                case "warningCalculatorLayer":
                    // on masque les bouton d'édition si ce ne sont pas ceux de la couche de calcul d'enjeux qui est actif
                    selected_layer_uid = document.getElementById("layer_list").querySelector(".layer-is-selected").getAttribute("layer-uid")
                    if (selected_layer_uid == ol.util.getUid(layer)) {
                        document.getElementById("drawing-layer-group-edit-btn").classList.add("hide")
                        document.getElementById("drawing-layer-group-edit-btn").removeAttribute("layer_uid")
                    }

                    // Si l'édition est active sur la couche
                    if (layer.get("isEditing")) {
                        //On desactive
                        document.getElementById("challenge-calculator-group-edit-btn").classList.remove("hide")
                        document.getElementById("btn-challenge-calculator").classList.add("btn-active")
                    } else {
                        // On active
                        document.getElementById("challenge-calculator-group-edit-btn").classList.add("hide")
                        document.getElementById("btn-challenge-calculator").classList.remove("btn-active")
                    }

                    break
                case "drawingLayer":
                case "editableLayer":
                    // Dans tous les cas, on masque les bouton d'édition pour la couche de la calculette des enjeux et de la couche éditable
                    document.getElementById("challenge-calculator-group-edit-btn").classList.add("hide")
                    // On masque par défaut le bouton d'édition des données attributaires
                    document.getElementById("btn-drawing-layer-edit-feature-info").classList.add("hide")
                    // On masque par défaut le bouton de sauvegarde des modifications
                    //document.getElementById("btn-drawing-layer-save-features").classList.add("hide")

                    // Si l'édition est activé sur la couche
                    if (layer.get("isEditing") == true) {
                        document.getElementById("drawing-layer-group-edit-btn").classList.remove("hide")
                        // On affecte l'identifiant de la couche à la boite de bouton
                        document.getElementById("drawing-layer-group-edit-btn").setAttribute("layer_uid", ol.util.getUid(layer))
                    } else {
                        document.getElementById("drawing-layer-group-edit-btn").classList.add("hide")
                        document.getElementById("drawing-layer-group-edit-btn").removeAttribute("layer_uid")
                    }

                    // Dans le cas d'une couche de données éditable (hors couche de dessin)
                    // on n'active que les boutton associé aux géométries autorisés
                    if (layer.get("layerType") == 'editableLayer') {
                        // Par défaut on désactive tous
                        document.getElementById("btn-drawing-layer-add-polygon").disabled = true
                        document.getElementById("btn-drawing-layer-add-linestring").disabled = true
                        document.getElementById("btn-drawing-layer-add-point").disabled = true
                        //document.getElementById("btn-drawing-layer-save-features").disabled = true

                        // Puis on réactive les bouton en fonction des géométries autorisées
                        if (layer.get("allowed_geometry").includes('Polygon')) {
                            document.getElementById("btn-drawing-layer-add-polygon").disabled = false
                        }
                        if (layer.get('allowed_geometry').includes('LineString')) {
                            document.getElementById("btn-drawing-layer-add-linestring").disabled = false
                        }
                        if (layer.get('allowed_geometry').includes('Point')) {
                            document.getElementById("btn-drawing-layer-add-point").disabled = false
                        }

                        // on active l'affichage du bouton d'édition des données attributaires
                        document.getElementById("btn-drawing-layer-edit-feature-info").classList.remove("hide")
                        // on active l'affichage du bouton de sauvegarde des modification
                        //document.getElementById("btn-drawing-layer-save-features").classList.remove("hide")
                    } else {
                        // Ici, on active tous les boutons
                        document.getElementById("btn-drawing-layer-add-polygon").disabled = false
                        document.getElementById("btn-drawing-layer-add-linestring").disabled = false
                        document.getElementById("btn-drawing-layer-add-point").disabled = false
                    }
                    break
                default:
                    document.getElementById("challenge-calculator-group-edit-btn").classList.add("hide")
                    document.getElementById("drawing-layer-group-edit-btn").classList.add("hide")
                    document.getElementById("drawing-layer-group-edit-btn").removeAttribute("layer_uid")
            }
        }
    })
}

/**
 * Fonction assurant le highlight du toolButton passé en paramètre
 */
var highlightToolBtn = function (button) {
    //unHigtlightAllDrawingLayerButton()
    unHighlightAllToolsBtn()
    button.classList.add("btn-active")
}

/**
 * Fonction retirant le highlight à tous les toolButton 
 */
function unHighlightAllToolsBtn() {
    document.getElementById("tools-btn-group").querySelectorAll(".btn-active").forEach(btn => {
        btn.classList.remove("btn-active")
    })
}

/**
 * Ecouteur sur le bouton associé aux différents types d'objets (poin/ligne/polygon...)
 */
const addfeature_buttons = document.querySelectorAll(".btn-drawing-layer-addfeature")
addfeature_buttons.forEach(addfeature_button => {
    addfeature_button.addEventListener('click', function (event) {
        // On déselectionne tous les objets
        clearSelectedSource()

        button = event.currentTarget

        if (button.classList.contains("btn-active")) {
            button.classList.remove("btn-active")
            disableLayerDrawing()
        } else {

            // Gestion du highligt du bouton cliqué
            //drawingLayerEditButtonHighlight(button)
            highlightToolBtn(button)

            // Récupération du type de geométrie demandé
            geom_type = button.getAttribute("geom-type")

            // Récupération de l'uid de la couche d'édition
            layer_uid = button.closest("#drawing-layer-group-edit-btn").getAttribute("layer_uid")

            map.getLayers().forEach(layer => {
                if (ol.util.getUid(layer) == layer_uid) {
                    enableLayerDrawing(layer, geom_type)
                    enableLayerSnapping(layer)
                }
            })
        }
    })
})

/**
 * Gestion du clique sur le bouton de suppression d'un feature d'une couche drawingLayer
 */
document.getElementById("btn-drawing-layer-remove-feature").addEventListener("click", event => {
    // On déselectionne tous les objets
    clearSelectedSource()

    button = event.currentTarget
    // Si le bouton est déjà actif, on le désactive
    if (button.classList.contains("btn-active")) {
        // On désactive le select pour la suppression en 
        // remettant la fonction d'interrogation des données
        map.on('singleclick', singleClickForFeatureInfo)
        map.un('singleclick', singleClickForRemovingFeature)

        unHighlightAllToolsBtn()

    } else {
        // On désactive l'édition
        disableLayerDrawing()

        // On change la fonction à éxécuter lors d'un clic sur la carte
        map.un('singleclick', singleClickForFeatureInfo)
        map.un('singleclick', openFormFeatureDataEdit)
        map.on('singleclick', singleClickForRemovingFeature)

        //drawingLayerEditButtonHighlight(button)
        highlightToolBtn(button)
    }

})

/**
 * Clic sur l'outil d'édition de point
 */
document.getElementById("btn-drawing-layer-modify").addEventListener("click", event => {
    // On déselectionne tous les objets
    clearSelectedSource()

    button = event.currentTarget

    disableLayerDrawing()

    if (button.classList.contains("btn-active")) {
        unHighlightAllToolsBtn()
    } else {

        highlightToolBtn(button)

        layer_uid = button.closest("#drawing-layer-group-edit-btn").getAttribute("layer_uid")

        map.getLayers().forEach(layer => {
            if (ol.util.getUid(layer) == layer_uid) {
                enableLayerModify(layer)
                enableLayerSnapping(layer)
            }
        })
    }
})

/**
 * Clic sur le bouton d'annulation du denier point
 */
document.getElementById("btn-drawing-layer-previous").addEventListener("click", event => {

    map.getInteractions().forEach(interaction => {
        if (interaction instanceof ol.interaction.Draw) {
            interaction.removeLastPoint()
        }
    })
})

/**
 * Fonction supprimant un point si l'utilisateur appui sur la touche suppr
 */
document.addEventListener('keydown', function (e) {
    if (e.code == "Delete") {
        map.getInteractions().forEach(interaction => {
            if (interaction instanceof ol.interaction.Modify) {
                interaction.removePoint()
            }
        })
    }
}, false);

/*----------------------------------------------------*/
/*----------Création des couches de dessin------------*/
/*----------------------------------------------------*/
/**
 * Fonction permettant de créer le style par défaut d'une couhe de dessin
 */
var build_drawing_layer_style = function () {
    // Création des couleurs aléatoires
    let { color_rgba, color_rgb } = random_color(0.5)

    //console.log("color_rgba : " + color_rgba)
    //console.log("color_rgb : " + color_rgb)

    layer_default_style = []

    let tmp_polygon_style = {
        "style_type": "Polygon",
        "styles": [{
            "fill_color": color_rgba,
            "stroke_color": "rgba(0,0,0,1)",
            "stroke_width": 1,
            "stroke_linedash": [],
            "filter": null
        }]
    }
    layer_default_style.push(tmp_polygon_style)

    tmp_line_style = {
        "style_type": "Line",
        "styles": [{
            "stroke_color": color_rgb,
            "stroke_width": 5,
            "stroke_linedash": [],
            "filter": null
        }]
    }
    layer_default_style.push(tmp_line_style)

    tmp_point_style = {
        "style_type": "Point",
        "styles": [{
            "fill_color": color_rgba,
            "stroke_color": "rgba(0,0,0,1)",
            "stroke_width": 1,
            "stroke_linedash": [],
            "radius": 5,
            "filter": null
        }]
    }
    layer_default_style.push(tmp_point_style)

    return layer_default_style
}

/**
 * Fonction ajoutant une couche de dessin à la carte
 */
var addDrawingLayerOnMap = function (layer_name) {
    // On initialise tout les feature comme visible

    zindex = map.getLayers().getLength() + 1

    // Construction du style de la couche
    let json_style = build_drawing_layer_style()
    let style = buildStyle(json_style)

    // Mise par défaut des informations complémentaires de la couche
    let desc_layer = {
        "layer_default_style": null,
        "layer_label": layer_name,
        "layer_attribution": null
    }

    // Création du layer
    let vectorLayer = new ol.layer.Vector({
        layer_name: desc_layer.layer_label,
        source: new ol.source.Vector({
            attributions: desc_layer.layer_attribution,
            visible: true,
            projection: 'EPSG:3857',
        }),
        layerType: "drawingLayer",
        isEditable: true,
        isEditing: false,
        isCalculatorLayer: false,
        style: style,
        zIndex: zindex,
        json_style: json_style,
        additional_data: null,
        description_layer: desc_layer
    })

    map.addLayer(vectorLayer)

    addLayerInLayerBar(vectorLayer)

    // On active automatiquement l'édition
    layer_uid = ol.util.getUid(vectorLayer)
    document.getElementById("layer_list").querySelectorAll("li").forEach(li => {
        if (li.getAttribute("layer-uid") == layer_uid) {
            li.querySelector(".layer-edition-menu-item").click()
        }
    })
}

/**
 * NON UTILISEE
 * Controle si une source a des features
 */
/*var layerHasFeature = function (layer){
    if (layer.getSource().getFeatures()){
        return true
    } else {
        return false 
    }
}*/

/*var layerIsInLegend = function(layer_uid){
    if (document.getElementById("layer_list").querySelector("li[layer-uid='"+ layer_uid +"']")){
        return true
    }
    else {
        return false
    }
}*/

/*----------------------------------------------------*/
/*-----------Mesure de surface et longueur------------*/
/*----------------------------------------------------*/
/* inspiré de https://openlayers.org/en/latest/examples/measure.html */

const measureSource = new ol.source.Vector();

const measureVector = new ol.layer.Vector({
    source: measureSource,
});

map.addLayer(measureVector)

/**
 * Currently drawn feature.
 * @type {import("../src/ol/Feature.js").default}
 */
let sketch;

/**
 * The measure tooltip element.
 * @type {HTMLElement}
 */
let measureTooltipElement;

/**
 * Overlay to show the measurement.
 * @type {Overlay}
 */
let measureTooltip;

let measure;

/**
 * Format length output.
 * @param {LineString} line The line.
 * @return {string} The formatted length.
 */
const formatLength = function (line) {
    const length = ol.sphere.getLength(line);
    let output;
    if (length > 100) {
        output = Math.round((length / 1000) * 100) / 100 + ' ' + 'km';
    } else {
        output = Math.round(length * 100) / 100 + ' ' + 'm';
    }
    return output;
};

/**
 * Format area output.
 * @param {Polygon} polygon The polygon.
 * @return {string} Formatted area.
 */
const formatArea = function (polygon) {
    const area = ol.sphere.getArea(polygon);
    let output;
    if (area > 10000) {
        output = Math.round((area / 1000000) * 100) / 100 + ' ' + 'km²';
    } else {
        output = Math.round(area * 100) / 100 + ' ' + 'm²';
    }
    return output;
};

function addInteraction(type) {
    //const type = typeSelect.value == 'area' ? 'Polygon' : 'LineString';
    measure = new ol.interaction.Draw({
        source: measureSource,
        type: type,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)',
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 0, 0.5)',
                lineDash: [10, 10],
                width: 2,
            }),
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.7)',
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)',
                }),
            }),
        }),
    });
    map.addInteraction(measure);

    createMeasureTooltip();

    let listener;
    measure.on('drawstart', function (evt) {
        // set sketch
        sketch = evt.feature;

        /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
        let tooltipCoord = evt.coordinate;

        listener = sketch.getGeometry().on('change', function (evt) {
            const geom = evt.target;
            let output;
            if (geom instanceof ol.geom.Polygon) {
                output = formatArea(geom);
                tooltipCoord = geom.getInteriorPoint().getCoordinates();
            } else if (geom instanceof ol.geom.LineString) {
                output = formatLength(geom);
                tooltipCoord = geom.getLastCoordinate();
            }
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
        });
    });

    measure.on('drawend', function () {
        measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
        measureTooltip.setOffset([0, -7]);
        // unset sketch
        sketch = null;
        // unset tooltip so that a new one can be created
        measureTooltipElement = null;
        createMeasureTooltip();
        ol.Observable.unByKey(listener);
    });
}

/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center',
        stopEvent: false,
        insertFirst: false,
    });
    map.addOverlay(measureTooltip);
}

/*
 * Gestion de l'affichage des boutons d'outil de mesure
 */
document.getElementById("btn-measure").addEventListener("click", event => {
    if (checkToken() === false) {
        // Utilisateur non connecté => on ouvre le modal de connexion
        loginModal.show()
    } else {
        if (event.currentTarget.classList.contains("btn-active")) {
            // désactivation des outil de mesure //

            event.currentTarget.classList.remove("btn-active")
            document.getElementById("measure-group-btn").classList.add('hide')

            // Désactivation des bouttons de mesure
            document.getElementById("measure-group-btn").querySelectorAll('button').forEach(btn => {
                btn.classList.remove("btn-active")
            })

            // On vide la couche de mesure
            measureSource.clear()

            // Suppression des infobulle de mesure
            document.querySelectorAll(".ol-tooltip-static").forEach(tooltip => {
                tooltip.parentNode.remove()
            })

            // Suppression des overlays
            map.removeOverlay(measureTooltip)

            // On supprime l'interaction (cas ou l'objet de mesure n'est pas finalisé !)
            map.removeInteraction(measure);
        } else {
            // activation des outils de mesure //

            document.getElementById("measure-group-btn").classList.remove('hide')
            event.currentTarget.classList.add("btn-active")
        }
    }
})

/**
 * Click sur le bouton de calcul de surface
 */
document.getElementById("btn-measure-area").addEventListener("click", event => {
    if (event.currentTarget.classList.contains("btn-active")) {
        // On désactive s'il est actif //

        unHighlightAllToolsBtn()

        map.on('singleclick', singleClickForFeatureInfo)

        map.removeInteraction(measure);
    } else {
        // On active s'il est inactif //

        // Highlight du boutton associé
        highlightToolBtn(event.currentTarget)

        // et les interactions
        disableLayerDrawing()

        map.un('singleclick', singleClickForFeatureInfo)
        addInteraction('Polygon')
    }
})

/**
 * Click sur le bouton de calcul de longueur
 */
document.getElementById("btn-measure-length").addEventListener("click", event => {
    if (event.currentTarget.classList.contains("btn-active")) {
        // On désactive s'il est actif //

        unHighlightAllToolsBtn()

        map.on('singleclick', singleClickForFeatureInfo)

        map.removeInteraction(measure);
    } else {
        // On active s'il est inactif //

        // Highlight du boutton associé
        highlightToolBtn(event.currentTarget)

        // et les interactions
        disableLayerDrawing()

        map.un('singleclick', singleClickForFeatureInfo)
        addInteraction('LineString')
    }
})


