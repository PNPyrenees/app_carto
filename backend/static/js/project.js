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
            console.log('HERE I AM !!!')
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

    // et on vide la liste des projets
    var my_project_list = document.getElementById("my-projects-list")
    my_project_list.innerHTML = ''

    getMyProjectList().then(myProjectListJson => {

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

    console.log("-----------------------")
    console.log("récupération des couches")
    console.log("-----------------------")

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

            for (const projectLayer of project["project_content"]["layers"]) {
                switch (projectLayer["layer_type"]) {
                    case "refLayerReadOnly":
                        console.log("Recupération de la couche : " + projectLayer["layer_name"])

                        // Récupération de la couche
                        layer = await callApiForRefLayer(projectLayer["layer_database_id"])

                        // Application du style enregistré
                        layer.setStyle(buildStyle(projectLayer["layer_json_style"]));
                        layer.set("json_style", projectLayer["layer_json_style"])
                        layer.getSource().getFeatures().forEach(feature => {
                            feature.setStyle(buildStyle(projectLayer["layer_json_style"]))
                        })

                        // Attribution du nom enregistré
                        layer.set("layer_name", projectLayer["layer_name"])
                        console.log("Couche : " + layer.get("layer_name") + " récupéré")
                        document.getElementById("layer_list").querySelector("li[layer-uid='" + ol.util.getUid(layer) + "'").querySelector(".layer-name").innerHTML = projectLayer["layer_name"]

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
            }

            selectProjectModal.hide()
            document.getElementById('open-project-loading-spinner').style.display = 'none'
        })
    }


}

var resetMapContent = function () {

    // On retire les couche de la carte
    console.log("Seconde liste des couches : ")
    map.getLayers().forEach(function (layer) {
        if (layer) {

            var layer_uid = ol.util.getUid(layer)

            var layer_type = layer.get("layerType")

            if (layer_type && ['refLayerReadOnly', 'warningCalculatorLayer', 'warningCalculatorResultLayer', 'warningCalculatorObsResultLayer', 'drawingLayer', 'obsLayer', 'importedLayer'].includes(layer_type)) {
                // puis on la supprime
                if (layer) {
                    //Cas particulier de la couche warning qui ne doit pas être supprimé
                    if (layer_type == "warningCalculatorLayer") {
                        // On rend invisible la couche
                        layer.setVisible(false)
                        // on s'assure de désactiver l'édition
                        layer.set("isEditing", false)
                        // Et on supprime les objets qu'elle contient
                        layer.getSource().clear()

                        // On desactive le bouton associé à la calculette des enjeux si ce n'est pas déjà le cas
                        document.getElementById("btn-challenge-calculator").classList.remove("btn-active")
                    } else {
                        // Cas classique, on supprime la couche de la carte
                        setTimeout(() => map.removeLayer(layer), 500);
                    }

                    // Si la couche supprimé est la couche active alors on s'assure que l'édition est désactivé
                    if (document.querySelector("#layer_list li[layer-uid='" + layer_uid + "']")) {
                        if (document.querySelector("#layer_list li[layer-uid='" + layer_uid + "']").classList.contains("layer-is-selected")) {
                            disableLayerDrawing()

                            // On masque les éventuelle boite à outil ouverte
                            if (layer.get("layerType") == "warningCalculatorLayer") {
                                document.getElementById("challenge-calculator-group-edit-btn").classList.add("hide")
                            } else {
                                document.getElementById("drawing-layer-group-edit-btn").classList.add("hide")
                            }
                        }

                        // On supprime la couche du layer bar
                        document.querySelector("#layer_list li[layer-uid='" + layer_uid + "']").remove()
                    }

                    // On efface la table attributaire si elle est ouverte
                    tab_id = "layer-data-table-" + layer_uid
                    if (document.querySelector(".nav-layer-item[target=" + tab_id + "]")) {
                        document.getElementById(tab_id).remove()
                        document.querySelector(".nav-layer-item[target=" + tab_id + "]").remove()
                    }

                    // On efface le ou les features de la couche qui sont dans selectedVectorSource
                    selectedVectorSource.getFeatures().forEach(feature => {
                        if (feature.orginalLayerUid == layer_uid) {
                            selectedVectorSource.removeFeature(feature)
                        }
                    })

                    // On supprime les entré de cette couche dans 
                    // le fenêtre d'affichage des données attributaire
                    // (celle qui s'ouvre quand on clique sur la carte)
                    deleteDataInInfobulleForlayer(layer_uid)
                }
            }
        }
    });
    console.log("Fin seconde liste des couches ! ")

    // On vide la barre de couche
    document.getElementById("layer_list").innerHTML = ''

    // On ferme toute les boites à outil
    document.getElementById("challenge-calculator-group-edit-btn").classList.add('hide')
    document.getElementById("drawing-layer-group-edit-btn").classList.add('hide')
    document.getElementById("measure-group-btn").classList.add('hide')

    // On ré-initialise les interactions carto
    map.un('singleclick', singleClickForRemovingFeature)
    map.un('singleclick', openFormFeatureDataEdit)
    map.un('singleclick', singleClickForFeatureInfo)
    map.on('singleclick', singleClickForFeatureInfo)

    // On ferme l'infobulle
    document.getElementById("bloc-clicked-features-attributes-content").innerHTML = ''
    document.getElementById("bloc-clicked-features-attributes").classList.remove('show')


    // On ferme les tables attributaires
    document.getElementById("layer-data-table").innerHTML = ''
    document.getElementById("nav-attribute-table").innerHTML = ''
    document.getElementById("attribute-data-container").classList.add('hide')
    if (document.getElementsByClassName("nav-layer-item").length == 0) {
        document.getElementById("attribute-data-container").classList.add("hide")
        document.getElementsByClassName("ol-scale-line")[0].style.bottom = "8px"
        document.getElementsByClassName("ol-attribution")[0].style.bottom = ".5em"

    }


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

    console.log("basemap : " + basemapName)
    document.getElementById("basemap-dropdown-content").querySelectorAll(".dropdown-item").forEach(basemapItem => {
        if (basemapItem.innerHTML == basemapName) {
            basemapItem.click()
        }
    })
}

var applyProjectExtent = function (extent) {
    map.getView().fit(extent)
}