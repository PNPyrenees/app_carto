// Gestion de l'affichage des boutons d'éditions
document.getElementById("btn-chanllenge-calculator").addEventListener("click", event => {
    if (checkToken() === false ){   
        // Utilisateur non connecté => on ouvre le modal de connexion
        loginModal.show()
    } else {


        
        event.currentTarget.classList.toggle("btn-active")

        //On ajoute la couche dans le layerbar
        if (event.currentTarget.classList.contains("btn-active")){
            map.getLayers().forEach(layer => {
                //if (layer.get("isCalculatorLayer") == true )
                if (layer.get("layerType") == "warningCalculatorLayer") {
                    // Seulement si elle n'est pas déjà dans le layerbar 
                    if (layerIsInLayerBar(ol.util.getUid(layer)) == false){
                        addLayerInLayerBar(layer)
                    } else {
                        /* Ici, on simule un clck sur la couche associé à la calculette des enjeux pour l'activer dans le layerBar */
                        let lis = document.getElementById("layer_list").querySelectorAll("li")
                        let res = false 
                        lis.forEach(li => {
                            if (li.getAttribute("layer-uid") == ol.util.getUid(layer)){
                                li.querySelector(".layer-name").click()
                            }
                        })
                    }
                }
            })

            // On déclare la couche warning_calculator comme étant en édition
            //editionLayerManagement(warning_calculator_layer)
        } /*else {
            // Ici, l'utilisateur à désactivé le boutton de la calculette des enjeux, on masque alors la toolbar associé
            document.getElementById("chanllenge-calculator-group-edit-btn").classList.add("hide")
            // On déclare la couche warning_calculator comme étant en édition
            //editionLayerManagement(warning_calculator_layer)
            
        }*/

        // On déclare la couche warning_calculator comme étant en édition
        editionLayerManagement(warning_calculator_layer)
        //toolbarShowManagement(ol.util.getUid(warning_calculator_layer))
    }
})

/**
 * Activation de l'édition carto sur la couche associée à la calculette des enjeux
 */
document.getElementById("btn-chanllenge-calculator-edit-feature").addEventListener("click", event => {
    // Si l'édition drawing est en cours alors on désactive les intéraction
    if (event.currentTarget.classList.contains("btn-active")){
        // Ici, on veut desactiver l'édition
        disableLayerDrawing()
    } else {
        // Ici, on veut activer l'édition et la modification
        enableLayerDrawing(warning_calculator_layer, "Polygon")
        enableLayerModify(warning_calculator_layer)

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
const chanllenge_calculator_execute_button = document.getElementById("btn-chanllenge-calculator-execute")

chanllenge_calculator_execute_button.addEventListener("click", event => {
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

    //désactivation du bouton pour na pas lancer deux fois le calcul
    chanllenge_calculator_execute_button.disabled = true
    
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

        //Réactivation du bouton
        chanllenge_calculator_execute_button.disabled = false

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

/**
 * Gestion de l'affichage de la fenêtre modal d'information sur la calcuette
 */
document.getElementById("btn-chanllenge-calculator-info").addEventListener("click", event => {
    document.getElementById("chanllenge-calculator-layer-list").innerHTML = ''
    // Récupération de la liste des couches à enjeux et des statuts utilisé
    getWarningCalculatorLayers().then(result => {
        result.layers.forEach(layer => {
            //console.log(layer)
            let li = document.createElement("li")
            li.innerHTML = layer.layer_label
            document.getElementById("chanllenge-calculator-layer-list").appendChild(li)

        })

        result.status.forEach(status => {
            let li = document.createElement("li")
            li.innerHTML = status.group_status_label + ' (' + status.group_status_description + ')'
            document.getElementById("chanllenge-calculator-status-list").appendChild(li)
        })


        //Ouverture de la fenêtre modal
        chanllengeCalculatorInfoModal.show()
    })
    
})

/**
 * Fonctions permettant de récupérer la liste
 * des couches utilisées pour le calcul des enjeux
 */
 var getWarningCalculatorLayers = function(){
    
    document.getElementById("chanllenge-calculator-info-spinner").classList.remove("hide")
    document.getElementById("icon-chanllenge-calculator-info").classList.add("hide")

    return fetch(APP_URL + "/api/warning_calculator/get_layers_list", {
        method: "GET",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin"
    })
    .then(res => {
        document.getElementById("chanllenge-calculator-info-spinner").classList.add("hide")
        document.getElementById("icon-chanllenge-calculator-info").classList.remove("hide")
        if (res.status != 200){
            throw res/*.json();*/
        } else {
            return res.json()
        }
    })
    .catch(error => {
        default_message = "Erreur lors de la récupération de la liste des couches utilisé par la calculette des enjeux"
        apiCallErrorCatcher(error, default_message)
    })
}