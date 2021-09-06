// Gestion de l'affichage des boutons d'éditions
document.getElementById("btn-chanllenge-calculator").addEventListener("click", event => {
    document.getElementById("chanllenge-calculator-group-edit-btn").classList.toggle("hide")
    event.currentTarget.classList.toggle("btn-active")

    // On déclare la couche warning_calculator comme étant en édition
    declareEditionForLayer(warning_calculator_layer)
})

/**
 * Activation de l'édition carto
 */
document.getElementById("btn-chanllenge-calculator-edit-feature").addEventListener("click", event => {
    // Si l'édition drawing est en cours alors on désactive les intéraction
    if (event.currentTarget.classList.contains("btn-active")){
        // Ici, on veut desactiver l'édition
        disableLayerDrawing()
    } else {
        // Ici, on veut activer l'édition
        enableLayerDrawing(warning_calculator_layer, "Polygon")

        // S'il est activé, on désactive le bouton de suppression
        document.getElementById("btn-chanllenge-calculator-remove-feature").classList.remove("btn-active")
    }

    event.currentTarget.classList.toggle("btn-active")
})

/**
 * Gestion du clique sur le bouton de suppression d'un feature
 */
document.getElementById("btn-chanllenge-calculator-remove-feature").addEventListener("click", event => {
    // Si le bouton est déjà actif, on le désactive
    if (event.currentTarget.classList.contains("btn-active")){
        // On désactive le select pour la suppression en 
        // remettant la fonction d'interrogation des données
        map.on('singleclick', singleClickForFeatureInfo)
        map.un('singleclick', singleClickForRemovingFeature)

    } else {
        // On désactive l'édition
        disableLayerDrawing()
        document.getElementById("btn-chanllenge-calculator-edit-feature").classList.remove("btn-active")

        // On change la fonction à éxécuter lors d'un clic sur la carte
        map.un('singleclick', singleClickForFeatureInfo)
        map.on('singleclick', singleClickForRemovingFeature)
    }

    event.currentTarget.classList.toggle("btn-active")

    //removeSelectedFeaturesInLayer(warning_calculator_layer)
})

/**
 * Lancement du calcul d'enjeux
 */
document.getElementById("btn-chanllenge-calculator-execute").addEventListener("click", event => {
    var writer = new ol.format.GeoJSON();
    var geojson_txt = writer.writeFeatures(warning_calculator_source.getFeatures())

    //console.log(geojson_txt)
    getWarningCalculatorData(geojson_txt)
})

/**
 * Appel API pour le calcul des enjeux
 */
 var getWarningCalculatorData = function(geojson_txt) {
    // On désactive l'édition
    disableLayerDrawing()
    document.getElementById("btn-chanllenge-calculator-edit-feature").classList.remove("btn-active")
    document.getElementById("btn-chanllenge-calculator-remove-feature").classList.remove("btn-active")

    // On change la fonction à éxécuter lors d'un clic sur la carte
    map.on('singleclick', singleClickForFeatureInfo)
    map.un('singleclick', singleClickForRemovingFeature)


    // Affichage du spinner
    document.getElementById("warning-calculator-spinner").classList.remove("hide")
    document.getElementById("icon-chanllenge-calculator-execute").classList.add("hide")
    
    return fetch(APP_URL + "/api/get_warning_calculator_data", {
        method: "POST",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin",
        body: geojson_txt
    })
    .then(res => {
        //Masquage du spinner
        document.getElementById("warning-calculator-spinner").classList.add("hide")
        document.getElementById("icon-chanllenge-calculator-execute").classList.remove("hide")

        if (res.status != 200){
            // En envoi l"erreur dans le catch
            throw res;
        } else {
            return res.json()
        }
    })
    .then(data => {
        //console.log(data)
        data.forEach(layer => {
            additional_data = {"formdata": "",}
            addGeojsonLayer(layer, additional_data)   
        });
    })
    .catch(error => {

        //console.log(error)
        if (typeof error == "string") {
            apiCallErrorCatcher(error, error)
        } else {
            error.then(err => { 
                default_message = "Erreur lors de la récupération de la couche de donénes d'observation"
                apiCallErrorCatcher(error, default_message)
            })
        }        
    })
}
