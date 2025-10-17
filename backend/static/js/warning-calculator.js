// Gestion de l'affichage des boutons d'éditions
document.getElementById("btn-challenge-calculator").addEventListener("click", event => {
    //if (checkToken() === false) {
    if (role === null) {
        // Utilisateur non connecté => on ouvre le modal de connexion
        loginModal.show()
    } else {

        // On active ou non le bouton en fonction de son état actuel
        if (event.currentTarget.classList.contains("btn-active")) {
            event.currentTarget.classList.remove("btn-active")
        } else {
            event.currentTarget.classList.add("btn-active")

            //On ajoute la couche dans le layerbar
            //if (event.currentTarget.classList.contains("btn-active")){
            map.getLayers().forEach(layer => {
                //if (layer.get("isCalculatorLayer") == true )
                if (layer.get("layerType") == "warningCalculatorLayer") {
                    // Seulement si elle n'est pas déjà dans le layerbar 
                    if (layerIsInLayerBar(ol.util.getUid(layer)) == false) {
                        addLayerInLayerBar(layer)
                    } else {
                        /* Ici, on simule un clic sur la couche associée à la calculette des enjeux pour l'activer dans le layerBar */
                        let lis = document.getElementById("layer_list").querySelectorAll("li")
                        let res = false
                        lis.forEach(li => {
                            if (li.getAttribute("layer-uid") == ol.util.getUid(layer)) {
                                li.querySelector(".layer-name").click()
                            }
                        })
                    }
                }
            })
        }

        // On déclare la couche warning_calculator comme étant en édition
        editionLayerManagement(warning_calculator_layer)
    }
})

/**
 * Activation de l'édition carto sur la couche associée à la calculette des enjeux
 */
document.getElementById("btn-challenge-calculator-edit-feature").addEventListener("click", event => {
    // Si l'édition drawing est en cours alors on désactive les intéraction
    if (event.currentTarget.classList.contains("btn-active")) {
        // Ici, on veut desactiver l'édition
        disableLayerDrawing()

        unHighlightAllToolsBtn()
    } else {
        // Ici, on veut activer l'édition et la modification
        enableLayerDrawing(warning_calculator_layer, "Polygon")
        enableLayerModify(warning_calculator_layer)

        // Highlight du boutton associé
        highlightToolBtn(event.currentTarget)
    }
})

/**
 * Gestion du clique sur le bouton de suppression d'un feature
 */
document.getElementById("btn-challenge-calculator-remove-feature").addEventListener("click", event => {
    // Si le bouton est déjà actif, on le désactive
    if (event.currentTarget.classList.contains("btn-active")) {
        // On désactive le select pour la suppression en 
        // remettant la fonction d'interrogation des données
        map.on('singleclick', singleClickForFeatureInfo)
        map.un('singleclick', singleClickForRemovingFeature)

        unHighlightAllToolsBtn()

    } else {
        // On désactive l'édition
        disableLayerDrawing()

        // Highlight du boutton associé
        highlightToolBtn(event.currentTarget)

        // On change la fonction à éxécuter lors d'un clic sur la carte
        map.un('singleclick', singleClickForFeatureInfo)
        map.on('singleclick', singleClickForRemovingFeature)
    }
})

/**
 * Lancement du calcul d'enjeux
 */
const challenge_calculator_execute_button = document.getElementById("btn-challenge-calculator-execute")

challenge_calculator_execute_button.addEventListener("click", event => {
    var writer = new ol.format.GeoJSON();
    var geojson_txt = writer.writeFeatures(warning_calculator_source.getFeatures())

    getWarningCalculatorData(geojson_txt)
})

/**
 * Appel API pour le calcul des enjeux
 */
var getWarningCalculatorData = async geojson_txt => {
    // On désactive l'édition
    disableLayerDrawing()
    document.getElementById("btn-challenge-calculator-edit-feature").classList.remove("btn-active")
    document.getElementById("btn-challenge-calculator-remove-feature").classList.remove("btn-active")

    // On change la fonction à éxécuter lors d'un clic sur la carte
    map.on('singleclick', singleClickForFeatureInfo)
    map.un('singleclick', singleClickForRemovingFeature)


    // Affichage du spinner
    document.getElementById("warning-calculator-spinner").classList.remove("hide")
    document.getElementById("icon-challenge-calculator-execute").classList.add("hide")

    //désactivation du bouton pour na pas lancer deux fois le calcul
    challenge_calculator_execute_button.disabled = true

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
            document.getElementById("icon-challenge-calculator-execute").classList.remove("hide")

            //Réactivation du bouton
            challenge_calculator_execute_button.disabled = false

            if (res.status != 200) {
                // En envoi l"erreur dans le catch
                throw res;
            } else {
                return res.json()
            }
        })
        .then(data => {
            //for (const layer in data) {
            data.forEach(layer => {
                //console.log(layer)
                additional_data = { "formdata": "", }
                if (layer.desc_layer.layer_id) {
                    addGeojsonLayer(layer, "warningCalculatorResultLayer", additional_data)
                } else {
                    // S'il n'y a pas d'identifiant base de données de la couche alors on est sur 
                    // le résultat de l'intersection avec les données d'àbservation
                    addGeojsonLayer(layer, "warningCalculatorObsResultLayer", additional_data)
                }
            });
            //}

            return true
        })
        .catch(error => {
            if (typeof error == "string") {
                apiCallErrorCatcher("error", error)
            } else {
                default_message = "Erreur lors de la récupération de la couche de donénes d'observation"
                apiCallErrorCatcher("error", default_message)

                /*error.then(err => {
                    default_message = "Erreur lors de la récupération de la couche de donénes d'observation"
                    apiCallErrorCatcher(error, default_message)
                })*/
            }
        })
}

/**
 * Gestion de l'affichage de la fenêtre modal d'information sur la calcuette
 */
document.getElementById("btn-challenge-calculator-info").addEventListener("click", event => {
    document.getElementById("challenge-calculator-layer-list").innerHTML = ''
    // Récupération de la liste des couches à enjeux et des statuts utilisé
    getWarningCalculatorLayers().then(result => {
        result.layers.forEach(layer => {
            let li = document.createElement("li")
            li.innerHTML = layer.layer_label
            document.getElementById("challenge-calculator-layer-list").appendChild(li)

        })

        result.status.forEach(status => {
            let li = document.createElement("li")
            li.innerHTML = status.group_status_label + ' (' + status.group_status_description + ')'
            document.getElementById("challenge-calculator-status-list").appendChild(li)
        })

        //Ouverture de la fenêtre modal
        challengeCalculatorInfoModal.show()
    })

})

/**
 * Fonctions permettant de récupérer la liste
 * des couches utilisées pour le calcul des enjeux
 */
var getWarningCalculatorLayers = function () {

    document.getElementById("challenge-calculator-info-spinner").classList.remove("hide")
    document.getElementById("icon-challenge-calculator-info").classList.add("hide")

    return fetch(APP_URL + "/api/warning_calculator/get_layers_list", {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        credentials: "same-origin"
    })
        .then(res => {
            document.getElementById("challenge-calculator-info-spinner").classList.add("hide")
            document.getElementById("icon-challenge-calculator-info").classList.remove("hide")
            if (res.status != 200) {
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

/**
 * Clic sur le bouton d'import d'une couche comme périmètre de calcul d'enjeux
 */
document.getElementById("btn-challenge-calculator-upload").addEventListener("click", event => warningCalculatorOpenImportLayerModal())

/**
 * Ouverture de la fenêtre modal pour l'import de périmètre 
 * pour le calcul des enjeux
 */
var warningCalculatorOpenImportLayerModal = function () {
    document.getElementById("upload-challenge-calculator-layer-loading-spinner").classList.add("hide")

    // Initialisation du formualire d'import
    document.getElementById("form-upload-challenge-calculator-layer-select-format").value = ""
    document.getElementById("form-upload-challenge-calculator-layer-files").value = ""
    document.getElementById("form-upload-challenge-calculator-layer-file-list").innerHTML = ""
    document.getElementById("form-group-upload-challenge-calculator-layer-select-layer-if-multiple").classList.add("hide")
    document.getElementById("form-upload-challenge-calculator-layer-select-layer-if-multiple").value = ""

    uploadChallengeCalculatorlayerModal.show()
}

/**
 * Amélioration apparence input type=files
 */
document.getElementById("form-upload-challenge-calculator-layer-files-btn").onclick = function () {
    document.getElementById("form-upload-challenge-calculator-layer-files").click()
}

/**
 * Lister le nom des fichiers sélectionnés
 */
document.getElementById("form-upload-challenge-calculator-layer-files").onchange = function (e) {
    var divfilelist = document.getElementById("form-upload-challenge-calculator-layer-file-list")
    divfilelist.innerHTML = ''
    for (var i = 0; i < this.files.length; i++) {
        var li = document.createElement('li')
        li.innerHTML = this.files[i].name
        divfilelist.appendChild(li)
    }
}

// EventListener sur le bouton de validation d'import d'un périmètre pour la calculette des enjeux
document.getElementById("upload-challenge-calculator-layer-submit").addEventListener("click", event => uploadChallengeCalculatorLayer())

/**
 * Upload d'un périmètre de calcul d'enjeux
 */
var uploadChallengeCalculatorLayer = function () {
    document.getElementById("upload-challenge-calculator-layer-loading-spinner").classList.remove("hide")
    //Contrôle du bon renseignement du formulaire
    if (checkChallengeCalculatorLayerForm()) {
        // envois des données du formulaire à l'API
        (translateChallengeCalculatorLayerToGeoJson()).then(data => {
            // Récupération des la données en geojson
            //console.log(data)
            var features = new ol.format.GeoJSON().readFeatures(data)

            features.forEach(feature => {
                if (["Polygon", "MultiPolygon"].includes(feature.getGeometry().getType())) {
                    warning_calculator_source.addFeature(feature)
                }
            })

            if (warning_calculator_source.getFeatures().length > 0) {
                document.getElementById("btn-challenge-calculator-execute").classList.remove("disabled")
                document.getElementById("btn-challenge-calculator-remove-feature").classList.remove("disabled")
            }

            document.getElementById("upload-challenge-calculator-layer-loading-spinner").classList.add("hide")
            uploadChallengeCalculatorlayerModal.hide()
        })
    } else {
        document.getElementById("upload-challenge-calculator-layer-loading-spinner").classList.add("hide")
        document.getElementById("add-layer-submit").disabled = false
        document.getElementById('loading-spinner').style.display = 'none'
    }
}

var checkChallengeCalculatorLayerForm = function () {
    var form = document.getElementById("form-upload-challenge-calculator-layer")

    var formIsValid = true

    form_field = form.querySelector("#form-upload-challenge-calculator-layer-select-format")
    form_field.parentNode.querySelector("label").style.color = "#000"
    if (!checkRequired(form_field.value)) {
        form_field.parentNode.querySelector("label").style.color = "#f00"
        formIsValid = false
    }

    form_field = form.querySelector("#form-upload-challenge-calculator-layer-files")
    form_field.parentNode.querySelector("label").style.color = "#000"
    if (!checkRequired(form_field.value)) {
        form_field.parentNode.querySelector("label").style.color = "#f00"
        formIsValid = false
    }

    return formIsValid
}

/**
 * Sérialisation des données du formulaire d'import 
 * de couche de calcul d'enjeux
 */
var buildUploadChallengeCalculatorLayerFormData = function () {

    var formdata = new FormData()

    // Récupration du format
    formdata.append("format", document.getElementById("form-upload-challenge-calculator-layer-select-format").value)

    // Récupération des fichiers
    for (var i = 0; i < document.getElementById("form-upload-challenge-calculator-layer-files").files.length; i++) {
        formdata.append("files[]", document.getElementById("form-upload-challenge-calculator-layer-files").files[i])
    }

    formdata.append("layer_in_file", document.getElementById("form-upload-challenge-calculator-layer-select-layer-if-multiple").value)

    return formdata
}

/**
 * upload des fichiers pour récupérer les données en GeoJson
 */
var translateChallengeCalculatorLayerToGeoJson = function () {
    var formdata = buildUploadChallengeCalculatorLayerFormData()

    return fetch(APP_URL + "/api/translate_to_geojson", {
        method: "POST",
        signal: signal,
        credentials: "same-origin",
        body: formdata
    })
        .then(res => {
            if (res.status == 400) {
                res.json().then(err => {
                    //console.log(JSON.stringify(err.message[0]))
                    apiCallErrorCatcher("error", JSON.stringify(err.message[0]))
                })
            } else if (res.status != 200) {
                // En envoi l"erreur dans le catch
                throw res;
            } else {
                return res.json()
            }
        }).catch(error => {
            console.log("Erreur lors de l'import du périmètre pour le calcul des enjeux !!!")
            console.log(error)

            layer_submit_button.disabled = false
            document.getElementById('loading-spinner').style.display = 'none'
        })
}

/**
 * Gestion de l'alerte en fonction du format de fichier
 * Et gestion du filtre sur les extension au niveau de  l'input "files"
 */
document.getElementById("form-upload-challenge-calculator-layer-select-format").onchange = function (e) {
    // On récupère la valeur sélectionné
    selectedFormat = e.currentTarget.value
    sourceId = "upload-challenge-calculator-layer"

    selectGeoFileFormat(sourceId, selectedFormat)
}

document.getElementById('form-upload-challenge-calculator-layer-files').addEventListener('change', e => {
    listLayerInMultiLayerFile(e.target.files[0], "upload-challenge-calculator-layer")
})