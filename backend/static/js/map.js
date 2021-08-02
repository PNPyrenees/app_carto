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

addGeojsonLayer = function(data){
    const image = new ol.style.Circle({
        radius: 5,
        fill: null,
        stroke: new ol.style.Stroke({color: 'red', width: 1}),
    });


    const styles = {
        'Point': new ol.style.Style({
          image: image,
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
          image: image,
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
            color: 'rgba(0, 0, 255, 0.9)',
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
      };


    const styleFunction = function (feature) {
        return styles[feature.getGeometry().getType()];
    };


    geojson = data.geojson_layer


    let vectorSource = new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(geojson),
    });
    
    zindex = map.getLayers().getLength() + 1

    let vectorLayer = new ol.layer.Vector({
        layer_name: data.desc_layer.layer_label,
        source: vectorSource,
        style: styleFunction,
        zIndex: zindex,
    });

    map.addLayer(vectorLayer)

    addLayerInLayerBar(vectorLayer)
}

var addLayerInLayerBar = function(vectorLayer){
    let prototype = document.getElementById("layer_list").getAttribute('data-prototype')
    
    layer_uid = ol.util.getUid(vectorLayer) //- 1 
    //alert ("uid-1 = " + layer_uid)
    //alert ("uid-2 = " + ol.util.getUid(vectorLayer))
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

changeLayerOrder = function(){
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