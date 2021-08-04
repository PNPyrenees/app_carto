var map
initMap = function () {
    map = new ol.Map({
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
            }),
        ],
        target: 'map',
        view: new ol.View({
            projection: 'EPSG:3857',
            center: ol.proj.transform(CENTER, 'EPSG:4326','EPSG:3857'),
            zoom: ZOOM_LEVEL,
        }),
    });
}



/**
 * Style par défaut
 */
const getDefaultStyle = function (feature, resolution) {

  const image = new ol.style.Circle({
    radius: 5,
    fill: null,
    stroke: new ol.style.Stroke({color: 'red', width: 1}),
  });
  
  
  const styles = {
    'Point': new ol.style.Style({
      image: new ol.style.Circle({
        radius: 5,
        fill: null,
        stroke: new ol.style.Stroke({color: 'red', width: 1}),
      })
    }),
    'LineString': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'green',
        width: 1,
      }),
    }),
    'MultiLineString': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'green',
        width: 1,
      }),
    }),
    'MultiPoint': new ol.style.Style({
      image: new ol.style.Circle({
        radius: 5,
        fill: null,
        stroke: new ol.style.Stroke({color: 'red', width: 1}),
      })
    }),
    'MultiPolygon': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'yellow',
        width: 1,
      }),
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 0, 0.1)',
      }),
    }),
    'Polygon': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'blue',
        lineDash: [4],
        width: 3,
      }),
      fill: new ol.style.Fill({
        color: 'rgba(0, 0, 255, 0.1)',
      }),
    }),
    'GeometryCollection': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'magenta',
        width: 2,
      }),
      fill: new ol.style.Fill({
        color: 'magenta',
      }),
      image: new ol.style.Circle({
        radius: 10,
        fill: null,
        stroke: new ol.style.Stroke({
          color: 'magenta',
        }),
      }),
    }),
    'Circle': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'red',
        width: 2,
      }),
      fill: new ol.style.Fill({
        color: 'rgba(255,0,0,0.2)',
      }),
    }),
  }

  return styles[feature.getGeometry().getType()];
};

/**
 * Style construit à partir d'un json
 */
const getStyleFromJson = function(json_styles){
  
  // On retourne une fonction interprétable par openLayers
  return function (feature, resolution) {

    var feature_style

    // On boucle sur les types de géométrie
    json_styles.forEach(json_geom_style => {

      switch (json_geom_style.geom_type) {
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
      }
    })

    // Si on a pas récupéré de style depuis 
    // le json alors on attribut le style par défaut 
    // pour l'objet courant
    if (feature_style){
      return feature_style
    } else {
      return getDefaultStyle(feature, resolution)
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
    return getDefaultStyle
  }
}

var addGeojsonLayer = function(data){

    geojson = data.geojson_layer

    // Récupération de la fonction devant attribuer le style
    var style = buildStyle(data.desc_layer.layer_default_style)    

    // Ajoute les données du geoJson dans un ol.source 
    let vectorSource = new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(geojson),
    });
    
    zindex = map.getLayers().getLength() + 1

    // Création du layer
    let vectorLayer = new ol.layer.Vector({
        layer_name: data.desc_layer.layer_label,
        source: vectorSource,
        style: style,
        zIndex: zindex,
    });

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
    console.log("nb_layers = " + nb_layers)
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


