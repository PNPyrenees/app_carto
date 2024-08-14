/**
 * Création d'un projet
 */


/* Gestion de l'ouverturen de la fenêtre modal de création d'un nouveau projet */
/* Fonction d'initialisation du formulaire de sauvegarde d'un nouveu projet */
document.getElementById("save-as-new-project-modal").addEventListener('show.bs.modal', function () {
    document.getElementById("save-as-new-project-modal").querySelector("#project-name-input").value = ""
})


/*var openSaveAsNewProjectModal = function () {
    initSaveAsNewProjectForm()
}*/

/* Fonction d'initialisation du formulaire de sauvegarde d'un nouveu projet */
/*var initSaveAsNewProjectForm = function () {
    document.getElementById("save-as-new-project-modal").querySelector("#project-name-input").value = ""
}*/

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
        if (layer.get("layerType") == 'basemap' && layer.get("visible") == true) {
            //console.log('HERE I AM !!!')
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

                // On ré-initialise les variables spécifiques
                database_layer_id = null
                layer_features = null
                formdata = null

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
                    formdata = layer.get("additional_data")["formdata"]
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

/**
 * Ouverture d'un projet existant
 */

/* Gestion de l'ouverturen de la fenêtre modal de sélection d'un projet */
/* Fonction d'initialisation de la liste des projets */
document.getElementById("select-project-modal").addEventListener('show.bs.modal', function () {
    //document.getElementById("my-projects-list").innerHTML = ""
    buildMyprojectList()
})

/**
 * Fonctions permettant de récupérer la liste
 * des cprojet de l'utilisateur
 */
var getMyProjectList = function () {
    return fetch(APP_URL + "/api/project/my_projects", {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        credentials: "same-origin"
    })
        .then(res => {
            if (res.status != 200) {
                throw res/*.json();*/
            } else {
                return res.json()
            }
        })
        .catch(error => {
            default_message = "Erreur lors de la récupération de la liste des projets"
            apiCallErrorCatcher(error, default_message)
        })
}

/* Mise en forme de la liste des projets de l'utilisateur courrant */
var buildMyprojectList = function () {

    // On affiche le spinner
    document.getElementById("modal-my-projects-list-spinner").classList.remove("hide")

    getMyProjectList().then(myProjectListJson => {
        // On vide la liste des projets
        var my_project_list = document.getElementById("my-projects-list")
        my_project_list.innerHTML = ''


        var my_project_list = document.getElementById("my-projects-list")

        /* Mise en forme de la liste des couches importées */
        myProjectListJson.forEach(project => {

            var li = document.createElement('li');
            li.setAttribute('class', 'modal-my-project-item');
            li.setAttribute('project-id', project.project_id);

            var row = document.createElement('div');
            row.classList.add("row")

            var col1 = document.createElement('div');
            col1.classList.add("col-9")

            // Gestion du nom de la couche
            var div_my_project_name = document.createElement('div');
            div_my_project_name.innerHTML = project.project_name
            col1.appendChild(div_my_project_name)

            // Gestion des date (import / dernier accès)
            var div_my_project_date = document.createElement('div');
            div_my_project_date.classList.add("my-project-date")

            var creation_date = new Date(project.project_creation_date)
            var last_modif = new Date(project.project_update_date)

            div_my_project_date.innerHTML = "Date de création : " + creation_date.toLocaleString('fr-FR') + " | " + "Dernière modification : " + last_modif.toLocaleString('fr-FR')
            col1.appendChild(div_my_project_date)

            // Création de l'élément de suppression d'une couche importée
            col2 = document.createElement('div');
            col2.classList.add("text-end")

            var i = document.createElement('i');
            i.classList.add("bi")
            i.classList.add("bi-trash-fill")
            i.classList.add("delete-my-project")
            i.setAttribute("title", "Supprimer le projet")

            i.addEventListener('click', (event) => {
                event.currentTarget.closest("li").querySelector(".confirm-delete-my-project-div").classList.remove("hide")
                event.currentTarget.classList.add("hide")
            })

            // Gestion de la confirmation de suppression
            var div_confirm_delete = document.createElement('div');
            div_confirm_delete.classList.add("hide", "div-confirm-delete-my-project", "confirm-delete-my-project-div")
            div_confirm_delete.innerHTML = "Etes-vous sûr ?"

            var div_btn = document.createElement('div');
            // Boutton de confirmation de suppression
            var btn_confirm_delete = document.createElement('button');
            btn_confirm_delete.innerHTML = 'Oui'
            btn_confirm_delete.classList.add("btn", "btn-danger", "me-1", "btn-confirm-delete-my-project")

            // Spinner indiquant la suppression en cours
            var div_spinner = document.createElement('div')
            div_spinner.classList.add("spinner-grow", "spinner-grow-sm", "hide", "delete-my-project-spinner")
            btn_confirm_delete.prepend(div_spinner)

            div_btn.append(btn_confirm_delete)

            btn_confirm_delete.addEventListener('click', (event) => {
                var li = event.currentTarget.closest("li")
                let my_project_id = li.getAttribute("project-id")

                // On désactive le boutton
                var btn_confirm_delete = li.querySelector(".btn-confirm-delete-my-project")
                btn_confirm_delete.disabled = true

                // On active le spinner 
                btn_confirm_delete.querySelector(".delete-my-project-spinner").classList.remove("hide")

                // Appel API pour suppression de la données
                fetch(APP_URL + "/api/project/" + my_project_id, {
                    method: 'DELETE',
                }).then(res => {
                    if (res.status != 200) {
                        // En envoi l"erreur dans le catch
                        throw res;
                    } else {
                        li.remove()
                    }
                }).catch(error => {
                    default_message = "Erreur lors de la supression du projet"
                    apiCallErrorCatcher(default_message, default_message)
                })
            })

            // Boutton d'annulation de suppression
            var btn_cancel_delete = document.createElement('button');
            btn_cancel_delete.innerHTML = 'Annuler'
            btn_cancel_delete.classList.add("btn", "btn-warning", "btn-cancel-delete-my-project")
            div_btn.append(btn_cancel_delete)

            btn_cancel_delete.addEventListener('click', (event) => {
                event.currentTarget.closest("div.div-confirm-delete-my-project").classList.add("hide")
                event.currentTarget.closest("li").querySelector(".delete-my-project").classList.remove("hide")
            })

            div_confirm_delete.append(div_btn)

            col2.appendChild(i)
            col2.appendChild(div_confirm_delete)

            col2.classList.add("col-3")

            // Ajout du bloc
            row.appendChild(col1)
            row.appendChild(col2)
            li.appendChild(row)

            // On masque le spinner 
            document.getElementById("modal-my-projects-list-spinner").classList.add("hide")

            // Et on affiche la liste des projets mise en forme
            my_project_list.appendChild(li)

            // on active la coloration si on sur le "li"
            li.addEventListener('click', (event) => {
                // On comence par désactiver tous les autres
                let all_modal_my_project_item = document.getElementsByClassName('modal-my-project-item')
                for (var i = 0; i < all_modal_my_project_item.length; i++) {
                    all_modal_my_project_item[i].classList.remove('active')
                }
                // puis on active l'élément cliqué
                event.currentTarget.classList.add('active')
            })
        })
    })
}


/**
 * Fonction récupérant un projet et reconstruisant la carte
 */
var openProject = function () {

    resetMapContent()

    //console.log("-----------------------")
    //console.log("récupération des couches")
    //console.log("-----------------------")

    document.getElementById('open-project-loading-spinner').style.display = 'inline-block'
    // Récupération de l'dentifiant du projet
    var targetProjectType = document.getElementById("select-project-menu").querySelector('input[name="btn-projects"]:checked').getAttribute("target")

    var projectItem = document.getElementById(targetProjectType).querySelector(".modal-my-project-item.active")

    if (projectItem) {

        var project_id = projectItem.getAttribute("project-id")

        // Application de la configuration du projet
        getProject(project_id).then(async function (project) {

            console.log(project)


            //Récupération du fond de carte
            applyProjectBasemap(project["project_content"]["basemap"])

            // récupérationn de l'extent de la carte
            applyProjectExtent(project["project_content"]["map_extent"])

            // Récupération des couches de données
            //console.log(project["project_content"]["layers"])
            project["project_content"]["layers"].sort((a, b) => a.layer_index - b.layer_index);
            //console.log(project["project_content"]["layers"])

            var projectOpeningError = []

            for (const projectLayer of project["project_content"]["layers"]) {

                try {

                    switch (projectLayer["layer_type"]) {
                        case "refLayerReadOnly":
                        case "refLayerEditable":
                            //console.log("Recupération de la couche : " + projectLayer["layer_name"])

                            // Récupération de la couche
                            layer = await callApiForRefLayer(projectLayer["layer_database_id"])

                            // Application du style enregistré
                            layer.setStyle(buildStyle(projectLayer["layer_json_style"]))
                            layer.set("json_style", projectLayer["layer_json_style"])
                            layer.getSource().getFeatures().forEach(feature => {
                                feature.setStyle(buildStyle(projectLayer["layer_json_style"]))
                            })

                            // Attribution du nom enregistré
                            layer.set("layer_name", projectLayer["layer_name"])
                            document.getElementById("layer_list").querySelector("li[layer-uid='" + ol.util.getUid(layer) + "'").querySelector(".layer-name").innerHTML = projectLayer["layer_name"]

                            // Affichage ou non de la couche
                            layer.setVisible(projectLayer["layer_is_visible"])

                            break
                        case "warningCalculatorLayer":
                            map.getLayers().forEach(layer => {
                                if (layer.get("layerType") == "warningCalculatorLayer") {
                                    // On ajoute les périmètre de la calulette enregistré dans la couche appropriée
                                    layer.getSource().addFeatures(new ol.format.GeoJSON().readFeatures(projectLayer["layer_features"]))

                                    // Application du style enregistré
                                    layer.setStyle(buildStyle(projectLayer["layer_json_style"]))
                                    layer.set("json_style", projectLayer["layer_json_style"])
                                    layer.getSource().getFeatures().forEach(feature => {
                                        feature.setStyle(buildStyle(projectLayer["layer_json_style"]))
                                    })

                                    // On l'ajoute au layerbar
                                    addLayerInLayerBar(layer)

                                    // Attribution du nom enregistré
                                    layer.set("layer_name", projectLayer["layer_name"])
                                    document.getElementById("layer_list").querySelector("li[layer-uid='" + ol.util.getUid(layer) + "'").querySelector(".layer-name").innerHTML = projectLayer["layer_name"]


                                    // Affichage ou non de la couche
                                    layer.setVisible(projectLayer["layer_is_visible"])
                                }
                            })



                            // Rafrichissement du résultat du calcul des enjeux
                            var writer = new ol.format.GeoJSON();
                            var geojson_txt = writer.writeFeatures(warning_calculator_source.getFeatures())
                            await getWarningCalculatorData(geojson_txt)


                            break
                        case "warningCalculatorResultLayer":
                            // recalculé lors de l'ouverture du périmètre d'enjeux
                            break
                        case "warningCalculatorObsResultLayer":
                            // recalculé lors de l'ouverture du périmètre d'enjeux
                            break
                        case "drawingLayer":
                            // On créé la couche
                            layer = addDrawingLayerOnMap(projectLayer["layer_name"], false)

                            // On ajoute les données
                            layer.getSource().addFeatures(new ol.format.GeoJSON().readFeatures(projectLayer["layer_features"]))

                            // On applique le style
                            layer.setStyle(buildStyle(projectLayer["layer_json_style"]))
                            layer.set("json_style", projectLayer["layer_json_style"])
                            layer.getSource().getFeatures().forEach(feature => {
                                feature.setStyle(buildStyle(projectLayer["layer_json_style"]))
                            })

                            // Affichage ou non de la couche
                            layer.setVisible(projectLayer["layer_is_visible"])

                            break
                        case "obsLayer":
                            // Récupération des données d'observation
                            layer = await getObsLayerGeojson(projectLayer["formdata"])

                            layer.setStyle(buildStyle(projectLayer["layer_json_style"]))
                            layer.set("json_style", projectLayer["layer_json_style"])
                            layer.getSource().getFeatures().forEach(feature => {
                                feature.setStyle(buildStyle(projectLayer["layer_json_style"]))
                            })

                            // Attribution du nom enregistré
                            layer.set("layer_name", projectLayer["layer_name"])
                            document.getElementById("layer_list").querySelector("li[layer-uid='" + ol.util.getUid(layer) + "'").querySelector(".layer-name").innerHTML = projectLayer["layer_name"]

                            // Affichage ou non de la couche
                            layer.setVisible(projectLayer["layer_is_visible"])

                            break
                        case "importedLayer":

                            layer = await addImportedLayerToMap(projectLayer["layer_database_id"])

                            // Application du style enregistré
                            layer.setStyle(buildStyle(projectLayer["layer_json_style"]))
                            layer.set("json_style", projectLayer["layer_json_style"])
                            layer.getSource().getFeatures().forEach(feature => {
                                feature.setStyle(buildStyle(projectLayer["layer_json_style"]))
                            })

                            // Attribution du nom enregistré
                            layer.set("layer_name", projectLayer["layer_name"])
                            document.getElementById("layer_list").querySelector("li[layer-uid='" + ol.util.getUid(layer) + "'").querySelector(".layer-name").innerHTML = projectLayer["layer_name"]

                            // Affichage ou non de la couche
                            layer.setVisible(projectLayer["layer_is_visible"])

                            break
                    }
                } catch (error) {
                    projectOpeningError.push("Problème lors de la récupération de la couche <b>" + projectLayer["layer_name"] + "</b>")
                }
            }

            selectProjectModal.hide()
            document.getElementById('open-project-loading-spinner').style.display = 'none'

            // Gestion de l'affichage des erreurs
            if (projectOpeningError.length > 0) {
                showAlert(projectOpeningError.join('<br />'))
            }
        })
    }


}

var resetMapContent = function () {
    // On retire les couche de la carte
    map.getLayers().forEach(function (layer) {
        var layer_uid = ol.util.getUid(layer)
        removeLayer(layer_uid)
    });
}

/*var openProjectReflayer = async function (layer) {

    switch (layer["layer_type"]) {
        case "refLayerReadOnly":
            await callApiForRefLayer(layer["layer_database_id"])
            break
        case "refLayerEditable":
            break
        case "warningCalculatorLayer":
            break
        case "warningCalculatorResultLayer":
            break
        case "warningCalculatorObsResultLayer":
            break
        case "drawingLayer":
            break
        case "obsLayer":
            break
        case "importedLayer":
            break
    }
}*/

/**
 * Fonctions permettant de récupérer la liste
 * des projets de l'utilisateur
 */
var getProject = function (project_id) {
    return fetch(APP_URL + "/api/project/" + project_id, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        credentials: "same-origin"
    })
        .then(res => {
            if (res.status != 200) {
                throw res/*.json();*/
            } else {
                return res.json()
            }
        })
        .catch(error => {
            default_message = "Erreur lors de la récupération du projet"
            apiCallErrorCatcher(error, default_message)
        })
}

/**
 * Fonction recherchant et changeant le fond de carte en fonction du nom passé en paramètre
 */
var applyProjectBasemap = function (basemapName) {

    //console.log("basemap : " + basemapName)
    document.getElementById("basemap-dropdown-content").querySelectorAll(".dropdown-item").forEach(basemapItem => {
        if (basemapItem.innerHTML == basemapName) {
            basemapItem.click()
        }
    })
}

var applyProjectExtent = function (extent) {
    map.getView().fit(extent)
}