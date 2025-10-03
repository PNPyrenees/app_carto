// Appel du formulaire associé à la couche et ouverture du modal
var getFeatureFrom = function (layer_id) {
    // On affiche le spinner global
    document.getElementById("global-spinner").classList.remove("hide")

    return fetch(APP_URL + "/api/get_feature_form_for_layer/" + layer_id, {
        method: "GET",
        signal: signal,
        credentials: "same-origin"
    })
        .then(res => {
            // on masque le spinner global
            document.getElementById("global-spinner").classList.add("hide")
            if (res.status != 200) {
                throw res
            } else {
                //return res.json()
                return (res.text())
            }
        })
        .then(html => {
            // On insère le formlulaire
            document.getElementById("feature-edit-modal").querySelector(".modal-content").innerHTML = html
            // et on ouvre la fenetre modale
            featureEditModal.show()
        })
        .catch(error => {
            console.warn("Erreur lors de la récupération du formulaire d'édition d'un objet", error)
            apiCallErrorCatcher(error, "Erreur lors de la récupération du formulaire d'édition d'un objet")
        })
}

showConfirmAbortEditFeature = function () {
    if (document.getElementById("feature-form-mode").value == "insert") {
        document.getElementById("valid-feature-form-abort").classList.remove("hide")
    } else {
        featureEditModal.hide()
    }
}

hideConfirmAbortEditFeature = function () {
    document.getElementById("valid-feature-form-abort").classList.add("hide")
}

var abortEditFeature = function () {
    layer_uid = document.getElementById("feature-form-layer-uid").value
    feature_uid = document.getElementById("feature-form-feature-uid").value

    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            layer.getSource().getFeatures().forEach(feature => {
                if (ol.util.getUid(feature) == feature_uid) {
                    layer.getSource().removeFeature(feature)
                }

            })
        }
    })

    featureEditModal.hide()
}

/**
 * Récupère les données du formulaire
 * Réalise les contrôles de conformité 
 * structure les données en Json et l'associe au feature
 */
var writeFeatureProperties = function () {

    // On vide l'espace d'annotation des erreurs
    document.getElementById("feature-form-error").innerHTML = ""
    document.getElementById("feature-form-error").classList.add("hide")

    layer_uid = document.getElementById("feature-form-layer-uid").value
    feature_uid = document.getElementById("feature-form-feature-uid").value

    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            layer.getSource().getFeatures().forEach(feature => {
                if (ol.util.getUid(feature) == feature_uid) {

                    var properties = {}
                    var feature_form_error = {}
                    tmp_elements = document.getElementsByClassName("feature_form_element")//.forEach(form_element => {
                    for (var i = 0; i < tmp_elements.length; i++) {
                        var form_element = tmp_elements[i]

                        // Récupération du nom du champ
                        var propertie_name = form_element.getAttribute("feature_form_column_name")

                        // Récupération du type de champ
                        var propertie_type = document.getElementById("feature-form-" + propertie_name).getAttribute("propertie_type")

                        // Récupération du placeholder 
                        var placeholder = document.getElementById("feature-form-" + propertie_name).getAttribute("placeholder")

                        // Récupération de l'obligation de renseignement 
                        var isNullable = document.getElementById("feature-form-" + propertie_name).getAttribute("is_nullable") === 'true'

                        // Récupération de la contrainte
                        var constraint = document.getElementById("feature-form-" + propertie_name).getAttribute("constraint")

                        // Récupération de la valeur saisie
                        var propertie_value = null


                        if (propertie_type == "boolean") {
                            if (document.getElementById("feature-form-" + propertie_name + "-true").checked) {
                                propertie_value = true
                            }
                            if (document.getElementById("feature-form-" + propertie_name + "-false").checked) {
                                propertie_value = false
                            }
                        } else if (propertie_type == "select") {
                            propertie_value = document.getElementById("feature-form-" + propertie_name).querySelector("select").value
                        } else if (propertie_type == "select-multiple") {

                            selectElement = document.getElementById("feature-form-" + propertie_name).querySelector("select")

                            selectedValues = Array.from(selectElement.selectedOptions).map(option => option.value)

                            propertie_value = null
                            if (selectedValues.length > 0) {
                                //propertie_value = JSON.stringify(selectedValues)
                                propertie_value = selectedValues
                            }
                        } else {
                            propertie_value = document.getElementById("feature-form-" + propertie_name).value

                            if (propertie_value.length == 0) {
                                propertie_value = null
                            }

                        }

                        //Controle de la contrainte not null
                        if (!isNullable) {
                            if (!propertie_value) {
                                if (!placeholder) {
                                    feature_form_error[propertie_name] = "Champ obligatoire<br>"
                                }
                            }
                        }

                        // Contrôle du type de données
                        if (propertie_value) {
                            switch (propertie_type) {
                                case "geometry":
                                    break

                                case "integer":
                                    // On convertie la valeur en nombre
                                    propertie_value = Number(propertie_value)

                                    if ((propertie_value != 0 && !propertie_value) || !Number.isInteger(propertie_value)) {
                                        if (feature_form_error[propertie_name]) {
                                            feature_form_error[propertie_name] += "La valeur renseignée n'est pas un nombre entier"
                                        } else {
                                            feature_form_error[propertie_name] = "La valeur renseignée n'est pas un nombre entier"
                                        }
                                    }
                                    break

                                case "float":
                                    // On convertie la valeur en nombre
                                    propertie_value = Number(propertie_value)

                                    if (!propertie_value) {
                                        if (feature_form_error[propertie_name]) {
                                            feature_form_error[propertie_name] += "La valeur renseignée n'est pas un nombre"
                                        } else {
                                            feature_form_error[propertie_name] = "La valeur renseignée n'est pas un nombre"
                                        }
                                    }
                                    break

                                case "varchar":
                                    break

                                case "text":
                                    break

                                case "boolean":
                                    if (propertie_value != true && propertie_value != false) {
                                        if (feature_form_error[propertie_name]) {
                                            feature_form_error[propertie_name] += "La valeur renseignée n'est pas un booléen"
                                        } else {
                                            feature_form_error[propertie_name] = "La valeur renseignée n'est pas un booléen"
                                        }
                                    }
                                    break

                                case "date":
                                    if (!isValidDate(propertie_value)) {
                                        if (feature_form_error[propertie_name]) {
                                            feature_form_error[propertie_name] += "La valeur renseignée n'est pas une date"
                                        } else {
                                            feature_form_error[propertie_name] = "La valeur renseignée n'est pas une date"
                                        }
                                    }
                                    break

                                case "uuid":
                                    var uuid_regexp = new RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
                                    if (uuid_regexp.test(propertie_value) == false) {
                                        if (feature_form_error[propertie_name]) {
                                            feature_form_error[propertie_name] += "La valeur renseignée n'est pas un UUID"
                                        } else {
                                            feature_form_error[propertie_name] = "La valeur renseignée n'est pas un UUID"
                                        }
                                    }
                                    break

                                case "select":
                                    break

                                case "media":
                                    break
                            }
                        }

                        // Controle des contraintes
                        if (constraint) {
                            tmp_constraint = constraint.replaceAll(propertie_name, propertie_value)

                            tmp_constraint = tmp_constraint.replaceAll('AND', '&&').replaceAll('OR', '||').replaceAll('NOT', '!')

                            if (!eval(tmp_constraint)) {
                                if (feature_form_error[propertie_name]) {
                                    feature_form_error[propertie_name] += "contrainte non respecté : " + constraint
                                } else {
                                    feature_form_error[propertie_name] = "contrainte non respecté : " + constraint
                                }
                            }
                        }

                        // Pour les champs sans valeur, on recupère le placeholder si renseigné
                        if (!propertie_value) {
                            if (placeholder) {
                                propertie_value = placeholder
                            }
                        }

                        properties[propertie_name] = propertie_value
                    }

                    if (JSON.stringify(feature_form_error) != '{}') {
                        // Affichage des erreurs
                        errorHtmlTable = simpleJsonToHtmlTable(feature_form_error)
                        errorHtmlTable.classList.add("error-table")
                        errorHtmlTable.classList.add("text-center")
                        document.getElementById("feature-form-error").appendChild(errorHtmlTable)
                        document.getElementById("feature-form-error").classList.remove("hide")
                    } else {
                        feature.setProperties(properties)

                        // Ecriture en base de données
                        var layer_id = layer.get("description_layer").layer_id
                        var mode = document.getElementById("feature-form-mode").value
                        writeFeaturesInDatabase(layer_id, feature, mode)

                        featureEditModal.hide()

                    }
                }
            })
        }
    })
}

// Alimente le formulaire de feature avec les valeurs que le feature possède
var populateFormFromFeature = function (feature) {
    // Récupération des données attributaire associé au feature
    var properties = feature.getProperties()

    for (var propertie_name in properties) {
        if (propertie_name != 'geometry') {
            // récupération du type de données
            var propertie_type = document.getElementById("feature-form-" + propertie_name).getAttribute("propertie_type")

            if (propertie_type == 'boolean') {
                if (properties[propertie_name] == true || properties[propertie_name] == false) {
                    document.getElementById("feature-form-" + propertie_name + "-" + properties[propertie_name]).checked = true
                }
            } else if (propertie_type == 'select') {
                document.getElementById("feature-form-" + propertie_name).querySelector("select").value = properties[propertie_name]
            } else if (propertie_type == 'select-multiple') {
                select = document.getElementById("feature-form-" + propertie_name).querySelector("select")

                for (const option of select.options) {
                    option.selected = properties[propertie_name].includes(option.value)
                }
            } else if (propertie_type == 'media') {

                // Controle de l'existance d'une valeur
                var tmp_element = document.createElement('html')
                tmp_element.innerHTML = properties[propertie_name]
                if (tmp_element.getElementsByTagName('a').length > 0) {
                    // ici, il y a un nom de fichier renseigné, alors on adapte les champs du formulaire
                    filename = tmp_element.getElementsByTagName('a')[0].innerHTML

                    document.getElementById("feature-form-" + propertie_name).value = filename

                    // On affiche le div contenant l'input text avec le nom du fichnier
                    document.getElementById("feature-form-" + propertie_name + "-div").classList.remove("hide")

                    // On masque l'input file associé
                    document.getElementById("feature-form-" + propertie_name + "-file-input").style.display = "none"
                }

            } else {
                if (!String(properties[propertie_name]).startsWith('nextval(')) { // Cas particulier pour les champs auto-incrémenté
                    document.getElementById("feature-form-" + propertie_name).value = properties[propertie_name]
                }
            }
        }
    }

    // Récupération de la géométrie
    var format = new ol.format.WKT()
    var tmp_elements = document.getElementsByClassName("feature_form_element")
    for (var i = 0; i < tmp_elements.length; i++) {
        if (tmp_elements[i].querySelector("input[propertie_type='geometry'")) {
            tmp_elements[i].querySelector("input[propertie_type='geometry'").value = format.writeFeature(feature)
        }

    }
}

var writeFeaturesInDatabase = function (layer_id, feature, mode) {

    // On affiche le spinner global
    document.getElementById("global-spinner").classList.remove("hide")

    var feature_data = JSON.stringify(feature.getProperties())

    if (mode == "insert") {
        url = "/api/add_features_for_layer/" + layer_id
    }
    if (mode == "update") {
        url = "/api/update_features_for_layer/" + layer_id
    }
    if (mode == "delete") {
        url = "/api/delete_features_for_layer/" + layer_id
    }

    return fetch(APP_URL + url, {
        method: "POST",
        signal: signal,
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: feature_data
    })
        .then(res => {
            // on masque le spinner global
            if (res.status != 200) {
                throw res
            } else {
                return (res.text())
            }
        })
        .then(data => {
            // On rafraichi la couche de  données
            refreshLayer(layer_id).then(res => {

                // Récupération du layer_uid
                var layer_uid
                map.getLayers().forEach(layer => {
                    if (layer.get("description_layer")) {
                        if (layer.get("description_layer").layer_id == layer_id) {
                            layer_uid = ol.util.getUid(layer)


                            deleteDataInInfobulleForlayer(layer_uid)
                            refreshDataTable(layer_uid)
                            // L'extinction du spinner est géré dans la fonction refreshDataTable !
                        }
                    }
                })
            })
        })
        .catch(error => {
            document.getElementById("global-spinner").classList.add("hide")
            apiCallErrorCatcher("error", "Erreur lors de l'enregistrement de la couche")
            console.warn("Erreur lors de l'enregistrement de la couche", error)
        })
}

// Envois de fichier vers le serveur
var sendFileToServer = async function (evt) {

    // Désactivation du boutton d'enregistrement
    document.getElementById("feature-form-submit").disabled = true
    document.getElementById(evt.id + "-spinner").style.display = "block"
    document.getElementById(evt.id).style.display = "none"

    // Activation du spinner d'upload

    // Préparation des données pour envoie au serveur
    const formData = new FormData();
    formData.append("file", evt.files[0]);

    // Envois du fichier au serveur
    fetch(APP_URL + "/api/upload_file", {
        method: "POST",
        credentials: "same-origin",
        files: evt.files[0],
        body: formData
    }).then(res => {
        if (res.status != 200) {
            throw res/*.json();*/
        } else {
            return (res.json())
        }
    }).then(res => {

        filename = res.filename

        // On renseigne le nom du fichier dans l'input text
        document.getElementById(evt.id.replace("-file-input", "")).value = filename
        // On affiche le div contenant l'input text avec le nom du fichnier
        document.getElementById(evt.id.replace("-file-input", "-div")).classList.remove("hide")

        // On réactive le boutton d'enregistrement
        document.getElementById("feature-form-submit").disabled = false

        // On masque le spinner d'upload
        document.getElementById(evt.id + "-spinner").style.display = "none"

        return filename
    }).catch(error => {
        default_message = "Erreur lors de l'envois du fichier'"
        apiCallErrorCatcher("error", default_message)
        console.log(error)

        // On réactive le boutton d'enregistrement
        document.getElementById("feature-form-submit").disabled = false

        // On masque le spinner
        document.getElementById(evt.id + "-spinner").style.display = "none"

        // On masque le div contenant l'input text avec le nom du fichnier
        document.getElementById(evt.id.replace("-file-input", "-div")).classList.add("hide")
        // On force le nom du fichier à null dans l'input text
        document.getElementById(evt.id.replace("-file-input", "")).value = ''

        // On ré-affiche le input de selection de fichier
        document.getElementById(evt.id).style.display = "block"
        document.getElementById(evt.id).value = ''
    })
}

// Gestion des champs lors de la suppression d'un fichier du formulaire
var featureEditRemoveFile = function (evt) {
    target = evt.getAttribute("target")

    // On retire le nom du fichier du input hidden
    document.getElementById(target).value = ''
    // On masque le div affichant le nom du fichier (et son boutton de suppression)
    document.getElementById(target + "-div").classList.add("hide")

    // On ré-affiche le input de selection de fichier
    document.getElementById(target + "-file-input").style.display = 'block'
    document.getElementById(target + "-file-input").value = ''
}
