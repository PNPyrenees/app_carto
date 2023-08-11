/**
 * Gestion du drag and drop dans la liste des couches
 */
let selected = null

// création de l'objet temporaire permettant
// de visualiser la zone de dépôt
let blank_obj = document.createElement('li');
blank_obj.id = "drag_and_drop_blank"

function dragOver(e) {
    if (e.target.classList.contains("btn") == false) { // Controunement bug déplacement sur bouton
        if (selected != e.target) {
            if (isBefore(selected, e.target)) {
                e.target.parentNode.insertBefore(blank_obj, e.target)
            } else {
                e.target.parentNode.insertBefore(blank_obj, e.target.nextSibling)
            }
        } else {
            if (document.getElementById("drag_and_drop_blank")) {
                document.getElementById("drag_and_drop_blank").remove()
            }
        }
    }
}

function dragEnd(e) {
    if (document.getElementById("drag_and_drop_blank")) {
        if (isBefore(selected, e.target)) {
            e.target.parentNode.insertBefore(selected, blank_obj.target)
        } else {
            e.target.parentNode.insertBefore(selected, blank_obj.nextSibling)
        }
    }
    selected.style.opacity = 1

    if (document.getElementById("drag_and_drop_blank")) {
        document.getElementById("drag_and_drop_blank").remove()
    }

    changeLayerOrder()

    layer_name_elements = document.getElementById("layer_list").querySelectorAll(".layer-name")/*.style.pointerEvent = "initial"*/
    layer_name_elements.forEach(layer_name_element => {
        layer_name_element.style.pointerEvents = "initial"
    })

    selected = null
}

function dragStart(e) {
    if (e.currentTarget.tagName != "INPUT") {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', null)
        selected = e.target
        selected.style.opacity = 0.5

        layer_name_elements = document.getElementById("layer_list").querySelectorAll(".layer-name")/*.style.pointerEvent = "initial"*/
        layer_name_elements.forEach(layer_name_element => {
            layer_name_element.style.pointerEvents = "none"
        })
    }
}

function isBefore(el1, el2) {
    let cur
    if (el2.parentNode === el1.parentNode) {
        for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
            if (cur === el2) return true
        }
    }
    return false;
}

//e.currentTarget.tagName != "INPUT"

/**
 * Fonction ouvrant la fenêtre modal permettant 
 * de renseigner le nom de la couche
 */
var openRenameLayerModal = function (layer_uid) {
    document.getElementById("rename-layer-modal").querySelector("input[name='layer-uid']").value = layer_uid

    current_layer_name = document.getElementById("layer_list").querySelector("li[layer-uid='" + layer_uid + "'").querySelector(".layer-name").innerHTML
    rename_form.querySelector("#layer-name-input").value = current_layer_name

    renameLayerModal.show()
}

/**
 * Validation du formulaire de renommage d'une couche
 */
const rename_form = document.getElementById("rename-layer-form")

rename_form.addEventListener("submit", function (event) {

    event.preventDefault()
    if (!rename_form.checkValidity()) {
        event.stopPropagation()
    } else {
        // on éxécute le renommage de la couche
        let layer_name = rename_form.querySelector("#layer-name-input").value
        let layer_uid = rename_form.querySelector("input[name='layer-uid']").value

        // On renome la couche côté opelayers
        map.getLayers().forEach(layer => {
            if (ol.util.getUid(layer) == layer_uid) {
                layer.set("layer_name", layer_name)
            }
        })

        document.getElementById("layer_list").querySelector("li[layer-uid='" + layer_uid + "'").querySelector(".layer-name").innerHTML = layer_name


        renameLayerModal.hide()

    }

    rename_form.classList.add("was-validated")
}, false)


/**
 * Ouverture de la fenêtre modal de téléchargement des données
 */
var openExportModal = function (layer_uid) {
    document.getElementById("export-modal-layer-uid").value = layer_uid
    exportModal.show()
}

document.getElementById("export-submit").addEventListener("click", event => {
    layer_uid = document.getElementById("export-modal-layer-uid").value
    export_format = document.getElementById("export-modal-format-select").value
    exportLayer(layer_uid, export_format)
})

/**
 * Fonction gérant les exports
 */
var exportLayer = function (layer_uid, export_format) {
    switch (export_format) {
        case "csv":
            layerToCSV(layer_uid)
            break
        case "kml":
            layerToKML(layer_uid)
            break
        case "geoJson":
            layerToGeoJSON(layer_uid)
            break
    }
}
/*----------------------------------------------------*/
/*--------------------EXPORT CSV----------------------*/
/*----------------------------------------------------*/
var layerToCSV = function (layer_uid) {
    // Recherche de la couche
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            features = []
            layer.getSource().getFeatures().forEach(feature => {
                // On retire le champ geometry (...tmp_feature reçoit tous les champ sauf geometry)
                let { geometry, ...tmp_feature } = feature.getProperties()
                features.push(tmp_feature)
            })

            json2csv(features, layer.get("layer_name"))
        }
    })
}


/*----------------------------------------------------*/
/*------------------EXPORT GeoJson--------------------*/
/*----------------------------------------------------*/
var layerToGeoJSON = function (layer_uid) {
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            var writer = new ol.format.GeoJSON({ featureProjection: 'EPSG:2154' })

            var geojsonStr = new ol.format.GeoJSON().writeFeatures(layer.getSource().getFeatures(), {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });

            filename = layer.get('layer_name') + '.geojson'
            download(filename, geojsonStr)
        }
    })
}

/*----------------------------------------------------*/
/*--------------------EXPORT KML----------------------*/
/*----------------------------------------------------*/
var layerToKML = function (layer_uid) {
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            var writer = new ol.format.GeoJSON({ featureProjection: 'EPSG:4326' })

            var kmlStr = new ol.format.KML().writeFeatures(layer.getSource().getFeatures(), {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });

            filename = layer.get('layer_name') + '.kml'
            download(filename, kmlStr)
        }
    })
}

/**
 * Contrôle si une couche est déjà dans le layer bar
 */
var layerIsInLayerBar = function (layer_uid) {
    let lis = document.getElementById("layer_list").querySelectorAll("li")
    let res = false
    lis.forEach(li => {
        if (li.getAttribute("layer-uid") == layer_uid) {
            res = true
        }
    })

    return res
}

/**
 * Fonction ouvrant la fenêtre modal permettant 
 * de modifier le style de la couche
 */
var openStyleLayerModal = function (layer_uid) {

    initStyleForm(layer_uid)





    //document.getElementById("style-layer-modal").querySelector(".modal-body").innerHTML = JSON.stringify(json_style)

    //current_layer_name = document.getElementById("layer_list").querySelector("li[layer-uid='" + layer_uid + "'").querySelector(".layer-name").innerHTML
    //rename_form.querySelector("#layer-name-input").value = current_layer_name

    styleLayerModal.show()
}