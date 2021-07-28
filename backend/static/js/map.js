function initMap() {
    console.log(CENTER)
    console.log(ZOOM_LEVEL)

    //const proj = new ol.proj()

    const map = new ol.Map({
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