// Variable permettant d'indiquer à l'application 
// que des objets en cours d'édition n'ont pas été sauvagerdé
var has_feature_not_save = false

document.getElementById("btn-test_form").addEventListener("click", event => {
    getFeatureFrom(127)
})

// Appel du formulaire associé à la couche et ouverture du modal
var getFeatureFrom = function (layer_uid){
    return fetch(APP_URL + "/api/get_feature_form_for_layer/" + layer_uid, {
        method: "GET",
        signal: signal,
        /*headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },*/
        credentials: "same-origin"
    })
    .then(res => {
        if (res.status != 200) {
            throw res
        } else {
            //return res.json()
            return(res.text())
        }
    })
    .then (html => {
        // On insère le formlulaire
        document.getElementById("feature-edit-modal").querySelector(".modal-content").innerHTML = html

        // et on ouvre la fenetre modale
        featureEditModal.show()
    })
    .catch(error => {
        console.warn("Erreur lors de la récupération du formulaire d'édition d'un objet", feature_form_error)
    })
}

/*showConfirmAbortEditFeature = function(){
    document.getElementById("valid-feature-form-abort").classList.remove("hide")
}*/

/*hideConfirmAbortEditFeature = function(){
    document.getElementById("valid-feature-form-abort").classList.add("hide")
}*/

var abortEditFeature = function(){
    layer_uid = document.getElementById("feature-form-layer-uid").value
    feature_uid = document.getElementById("feature-form-feature-uid").value

    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            layer.getSource().getFeatures().forEach(feature => {
                if (ol.util.getUid(feature) == feature_uid){
                    layer.getSource().removeFeature(feature)
                }

            })
        }
    })
} 

/**
 * Récupère les données du formulaire
 * Réalise les contrôle de conformité 
 * structure les données en Json et l'associe au feature
 */
var writeFeatureProperties = function(){

    // On vide l'espace d'annotation des erreurs
    document.getElementById("feature-form-error").innerHTML = ""
    document.getElementById("feature-form-error").classList.add("hide")

    layer_uid = document.getElementById("feature-form-layer-uid").value
    feature_uid = document.getElementById("feature-form-feature-uid").value

    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid) {
            layer.getSource().getFeatures().forEach(feature => {
                if (ol.util.getUid(feature) == feature_uid){
                    
                    var properties = {}
                    var feature_form_error = {}
                    tmp_elements = document.getElementsByClassName("feature_form_element")//.forEach(form_element => {
                    for (var i = 0; i < tmp_elements.length; i++) {
                        var form_element =  tmp_elements[i]

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


                        if (propertie_type == "boolean"){
                            if (document.getElementById("feature-form-" + propertie_name + "-true").checked){
                                propertie_value  = true    
                            }
                            if (document.getElementById("feature-form-" + propertie_name + "-false").checked){
                                propertie_value  = false    
                            } 
                        } else if (propertie_type == "select"){
                            propertie_value = document.getElementById("feature-form-" + propertie_name).querySelector("select").value
                        } else {
                            propertie_value = document.getElementById("feature-form-" + propertie_name).value
                            
                            if (propertie_value.length == 0){
                                propertie_value = null
                            }
                            
                        }
                        
                        /*console.log("propertie_name : " + propertie_name)
                        console.log("propertie_type : " + propertie_type)
                        console.log("placeholder : " + placeholder)
                        console.log("isNullable : " + isNullable)
                        console.log("propertie_value : " + propertie_value)*/

                        //Controle de la contrainte not null
                        if (! isNullable){
                            if (! propertie_value){
                                if (! placeholder){
                                    feature_form_error[propertie_name] = "Champ obligatoire<br>"
                                }
                            }
                        }

                        // Contrôle du type de données
                        if (propertie_value){
                            switch (propertie_type){
                                case "geometry":
                                    break

                                case "integer":
                                    // On convertie la valeur en nombre
                                    propertie_value = Number(propertie_value)

                                    if (! propertie_value || ! Number.isInteger(propertie_value)){
                                        if (feature_form_error[propertie_name]){
                                            feature_form_error[propertie_name] += "La valeur renseignée n'est pas un nombre entier"
                                        } else {
                                            feature_form_error[propertie_name] = "La valeur renseignée n'est pas un nombre entier"
                                        }
                                    }
                                    break

                                case "float":
                                    // On convertie la valeur en nombre
                                    propertie_value = Number(propertie_value)

                                    if (! propertie_value){
                                        if (feature_form_error[propertie_name]){
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
                                    if (propertie_value != true && propertie_value != false){
                                        if (feature_form_error[propertie_name]){
                                            feature_form_error[propertie_name] += "La valeur renseignée n'est pas un booléen"
                                        } else {
                                            feature_form_error[propertie_name] = "La valeur renseignée n'est pas un booléen"
                                        }
                                    }
                                    break

                                case "date":
                                    if (! isValidDate(propertie_value)){
                                        if (feature_form_error[propertie_name]){
                                            feature_form_error[propertie_name] += "La valeur renseignée n'est pas une date"
                                        } else {
                                            feature_form_error[propertie_name] = "La valeur renseignée n'est pas une date"
                                        }
                                    }
                                    break

                                case "select":
                                    break
                            }
                        }

                        // Controle des contraintes
                        if (constraint){
                            tmp_constraint = constraint.replaceAll(propertie_name, propertie_value)

                            tmp_constraint = tmp_constraint.replaceAll('AND', '&&').replaceAll('OR', '||').replaceAll('NOT', '!')

                            if (! eval(tmp_constraint)) {
                                if (feature_form_error[propertie_name]){
                                    feature_form_error[propertie_name] += "contrainte non respecté : " + constraint
                                } else {
                                    feature_form_error[propertie_name] = "contrainte non respecté : " + constraint
                                }
                            }
                        }
                        
                        // Pour les champs sans valeur, on recupère le placeholder si renseigné
                        if (! propertie_value){
                            if (placeholder){
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

                        has_feature_not_save = true
                        featureEditModal.hide()
                    }                    
                }
            })
        }
    })
}

// Alimente le formulaire de feature avec les valeurs que le feature possède
var populateFormFromFeature = function(feature){
    // Récupération des données attributaire associé au feature
    var properties = feature.getProperties()

    for (var propertie_name in properties) {
        if (propertie_name != 'geometry'){
            // récupération du type de données
            var propertie_type = document.getElementById("feature-form-" + propertie_name).getAttribute("propertie_type")

            if (propertie_type == 'boolean'){
                if (properties[propertie_name] == true || properties[propertie_name] == false){
                    document.getElementById("feature-form-" + propertie_name + "-" + properties[propertie_name]).checked = true
                }
            } else if (propertie_type == 'select') {
                document.getElementById("feature-form-" + propertie_name).querySelector("select").value = properties[propertie_name]
            } else {
                if (! String(properties[propertie_name]).startsWith('nextval(') ){ // Cas particulier pour les champs auto-incrémenté
                    document.getElementById("feature-form-" + propertie_name).value = properties[propertie_name]
                }
            }        
        }
    }
}

