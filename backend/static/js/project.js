/* Gestion du formulaire de création d'un projet */
const save_as_new_project_form = document.getElementById("save-as-new-project-form")

save_as_new_project_form.addEventListener("submit", function (event) {

    event.preventDefault()
    if (!save_as_new_project_form.checkValidity()) {
        event.stopPropagation()
    } else {
        var project_name = save_as_new_project_form.querySelector("#project-name-input").value

        var projet_content = buildJsonProject()
        console.log(projet_content)

        var postdata = {
            "project_name": project_name,
            "project_content": projet_content
        }

        createProjectToDatabase(postdata)
    }
})

var buildJsonProject = function () {
    /* Récupération de l'extent de la carte */
    var map_extent = map.getView().calculateExtent()


    var basemap
    var projectLayers = []
    var tmp_layer_info
    var layer_name
    var database_layer_id
    var layer_type
    var layer_json_style
    var layer_index
    var is_visible
    var formdata

    var layer_features
    map.getLayers().forEach(layer => {
        /* Récupération du nom de la couche utilisé comme fond de carte */
        if (layer.get("isBasemap") == true && layer.get("visible") == true) {
            basemap = layer.get("basemapName")
        }

        /* Récupération de la liste des couches ouverte et leur configuration */
        if (layer.get("isBasemap") != true) {

            if (["refLayerReadOnly", "refLayerEditable", "warningCalculatorLayer", "warningCalculatorResultLayer", "warningCalculatorObsResultLayer", "drawingLayer", "obsLayer", "importedLayer"].includes(layer.get("layerType"))) {

                layer_name = layer.get("layer_name")
                layer_type = layer.get("layerType")
                layer_json_style = layer.get("json_style")
                layer_index = layer.getZIndex()
                is_visible = layer.getVisible()

                if (["refLayerReadOnly", "refLayerEditable", "importedLayer", "warningCalculatorResultLayer"].includes(layer_type)) {
                    database_layer_id = layer.get("databaseLayerId")
                }

                /* par défaut la couche warningCalculatorLayer existe, il faut donc contrôler qu'elle contient un objet */
                if (layer_type == "warningCalculatorLayer" && layer.getSource().getFeatures().length > 0) {
                    layer_features = JSON.parse(new ol.format.GeoJSON().writeFeatures(layer.getSource().getFeatures()))
                }

                if (layer_type == "drawingLayer") {
                    layer_features = JSON.parse(new ol.format.GeoJSON().writeFeatures(layer.getSource().getFeatures()))
                }

                if (layer_type == "obsLayer") {
                    formdata = layer.get("formdata")
                }

                if (!(layer_type == "warningCalculatorLayer" && layer_features == null)) {

                    tmp_layer_info = {
                        "layer_type": layer_type,
                        "layer_name": layer_name,
                        "layer_database_id": database_layer_id,
                        "layer_json_style": layer_json_style,
                        "layer_index": layer_index,
                        "layer_is_visible": is_visible,
                        "layer_features": layer_features,
                        "formdata": formdata
                    }
                    projectLayers.push(tmp_layer_info)
                }
            }
        }
    })

    var json_project = {
        "map_extent": map_extent,
        "basemap": basemap,
        "layers": projectLayers
    }

    return json_project
}

var createProjectToDatabase = function (postdata) {


    // On affiche le spinner global
    document.getElementById("global-spinner").classList.remove("hide")

    fetch(APP_URL + "/api/project/create", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(postdata)
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
            // On masque le spinner global
            document.getElementById("global-spinner").classList.add("hide")
            saveAsNewProjectModal.hide()
        })
        .catch(error => {
            document.getElementById("global-spinner").classList.add("hide")
            apiCallErrorCatcher("erreur", "Erreur lors de la sauvegarde du projet")
        })
}