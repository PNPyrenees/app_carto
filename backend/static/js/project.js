/**
 * Création d'un projet
 */


/* Gestion de l'ouverturen de la fenêtre modal de création d'un nouveau projet */
/* Fonction d'initialisation du formulaire de sauvegarde d'un nouveu projet */
document.getElementById("save-as-new-project-modal").addEventListener('show.bs.modal', function () {
    document.getElementById("save-as-new-project-modal").querySelector("#project-name-input").value = ""
})

/**
 * Gestion du formulaire de création d'un projet 
 */
const save_as_new_project_form = document.getElementById("save-as-new-project-form")
save_as_new_project_form.addEventListener("submit", function (event) {

    event.preventDefault()
    if (!save_as_new_project_form.checkValidity()) {
        event.stopPropagation()
    } else {
        var project_name = save_as_new_project_form.querySelector("#project-name-input").value

        var projet_content = buildJsonProject()
        //console.log(projet_content)

        var postdata = {
            "project_name": project_name,
            "project_content": projet_content
        }

        createProjectToDatabase(postdata)
    }
})

/**
 * Gestion de l'action du clic pour la sauvegarde d'un projet existant
 */
const save_project_form = document.getElementById("btn-project-update")
save_project_form.addEventListener("click", function (event) {


    var project_id = document.getElementById("current_project_id").value

    var projet_content = buildJsonProject()
    //console.log(projet_content)

    var projectdata = {
        "project_id": project_id,
        "project_content": projet_content
    }

    updateProjectInDatabase(projectdata)
})

/**
 * Fonction assurant la création du json traduisant l'état d'un projet
 */
var buildJsonProject = function () {
    /* Récupération de l'extent de la carte */
    var map_extent = map.getView().calculateExtent()


    var basemap // Fond de carte utilisé
    var projectLayers = [] // Liste des couche ouverte
    var tmp_layer_info
    var layer_name // Nom attribué à la couche
    var database_layer_id // Identifiant de la couche dans la base de données (pour les couche de référence et les couches d'importées)
    var layer_features // Objet existant dans la couche (si ocuche de dessin ou d'alerte)
    var layer_type // Type de couche (couche de référence, couoche importée, de dessin, calcullette des enjeux ...)
    var layer_json_style // Style affecté à la couche de données
    var layer_index // Index indiquant la posistion de la couiche dans la pile des couches
    var layer_is_visible // Indique si la couche est affiché ou non
    var formdata // Filtre appliqué à une couche de données d'observation
    var attribute_data_sort // Indique la colonne de utilisé pour trier la table attributaire et le sens
    var attribute_data_filter = [] // Filtre apliqué sur la table attributaire
    var attribute_data_is_open // Indique si la table attributaire est ouverte
    var attribute_data_is_active // Indique si la table attributaire est celle qui est affiché


    var currentViewContainWarningLayerResult = false
    var currentViewContainWarningLayer = false
    map.getLayers().forEach(layer => {

        // On ré-initialise les variables spécifiques
        database_layer_id = null
        layer_features = null
        formdata = null
        layer_type = null
        layer_json_style = null
        layer_index = null
        layer_is_visible = null
        formdata = null
        attribute_data_sort = null
        attribute_data_filter = []
        attribute_data_is_open = false
        attribute_data_is_active = false



        /* Récupération du nom de la couche utilisé comme fond de carte */
        if (layer.get("layerType") == 'basemap' && layer.get("visible") == true) {
            basemap = layer.get("basemapName")
        }

        /* Récupération de la liste des couches ouverte et leur configuration */
        if (layer.get("isBasemap") != true) {

            if (["refLayerReadOnly", "refLayerEditable", "warningCalculatorLayer", "warningCalculatorResultLayer", "warningCalculatorObsResultLayer", "drawingLayer", "obsLayer", "importedLayer"].includes(layer.get("layerType"))) {

                layer_name = layer.get("layer_name")
                layer_type = layer.get("layerType")
                layer_json_style = layer.get("json_style")
                layer_index = layer.getZIndex()
                layer_is_visible = layer.getVisible()

                // Couche issue de la base de données -> récupération de l'identifiant interne
                if (["refLayerReadOnly", "refLayerEditable", "importedLayer", "warningCalculatorResultLayer"].includes(layer_type)) {
                    database_layer_id = layer.get("databaseLayerId")
                }

                /* par défaut la couche warningCalculatorLayer existe, il faut donc contrôler qu'elle contient un objet */
                if (layer_type == "warningCalculatorLayer" && layer.getSource().getFeatures().length > 0) {
                    layer_features = JSON.parse(new ol.format.GeoJSON().writeFeatures(layer.getSource().getFeatures()))
                    currentViewContainWarningLayer = true
                }

                // Couche de dessin -> on récupère la géométrie des objets saisies
                if (layer_type == "drawingLayer") {
                    layer_features = JSON.parse(new ol.format.GeoJSON().writeFeatures(layer.getSource().getFeatures()))
                }

                // Couche de données résultat de l'intérrogation des données d'observaiton
                // -> on ajoute les filtres du formulaire utilisé
                if (layer_type == "obsLayer") {
                    formdata = layer.get("additional_data")["formdata"]
                }

                if (layer_type == 'warningCalculatorResultLayer' || layer_type == 'warningCalculatorObsResultLayer') {
                    currentViewContainWarningLayerResult = true
                }

                // Récupération des informations relatives à l'état de la table attributaire
                var attribute_table = document.getElementById("layer-data-table-" + ol.util.getUid(layer))
                if (attribute_table) {
                    attribute_data_is_open = true
                }

                // Est-ce la table attributaire active ?
                nav_object = document.getElementById("nav-attribute-table").querySelector(".nav-layer-item[target='layer-data-table-" + ol.util.getUid(layer) + "']")
                if (nav_object) {
                    if (nav_object.classList.contains("active")) {
                        attribute_data_is_active = true
                    }
                }

                // Si la table attributaire est ouverte
                if (attribute_data_is_open) {
                    var cols = attribute_table.querySelectorAll(".tabulator-col")

                    for (i = 0; i < cols.length; i++) {
                        // On regarde si un filtre est appliqué sur une colonne
                        if (cols[i].querySelector("input[type='search']").value) {
                            // Et on l'ajoute dans la définition du projet
                            tmp_filter = {
                                "column_name": cols[i].getAttribute("tabulator-field"),
                                "value": cols[i].querySelector("input[type='search']").value
                            }
                            attribute_data_filter.push(tmp_filter)
                        }

                        // Et s'il y a un tri d'appliqué
                        var sorting_column, sorting_direction
                        if (cols[i].getAttribute("aria-sort") != 'none') {
                            sorting_column = cols[i].getAttribute("tabulator-field")
                            if (cols[i].getAttribute("aria-sort") == 'descending') {
                                sorting_direction = 'desc'
                            } else {
                                sorting_direction = 'asc'
                            }

                            attribute_data_sort = {
                                "sorting_column": sorting_column,
                                "sorting_direction": sorting_direction
                            }
                        }
                    }
                }

                // On s'assure de ne pas sauvegarder la couche de périmètre d'enjeux si elle est vide
                if (!(layer_type == "warningCalculatorLayer" && layer_features == null)) {

                    tmp_layer_info = {
                        "layer_type": layer_type,
                        "layer_name": layer_name,
                        "layer_database_id": database_layer_id,
                        "layer_json_style": layer_json_style,
                        "layer_index": layer_index,
                        "layer_is_visible": layer_is_visible,
                        "layer_features": layer_features,
                        "formdata": formdata,
                        "attribute_data_is_open": attribute_data_is_open,
                        "attribute_data_is_active": attribute_data_is_active,
                        "attribute_data_sort": attribute_data_sort,
                        "attribute_data_filter": attribute_data_filter
                    }
                    projectLayers.push(tmp_layer_info)
                }
            }
        }
    })

    // On est dans un cas ou il y a des couches résultant dd'un calcul d'enjeux mais le périmètre n'existe plus
    if (currentViewContainWarningLayerResult == true && currentViewContainWarningLayer == false) {
        showAlert("Vous affichez des couches résultant d'un calcul d'enjeux alors aque le périmètre utilisé initialement n'existe plus. <b>Ces couches ne pourront pas être sauvegardé !</b> ")
    }

    var json_project = {
        "map_extent": map_extent,
        "basemap": basemap,
        "layers": projectLayers
    }

    return json_project
}

/**
 * Fonction permetant d'envoyer le projet au serveur pour enregistrement en base de données
 */
var createProjectToDatabase = function (postdata) {

    // On affiche le spinner global
    document.getElementById("global-spinner").classList.remove("hide")

    return fetch(APP_URL + "/api/project/create", {
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

            // On affiche le nom du projet dans la barre d'en-tête
            document.getElementById("project-name-in-title").innerHTML = " - " + data["project_name"]

            // On inscrtit l'identifiant du projet
            document.getElementById("current_project_id").value = data["project_id"]
            document.getElementById("current_project_name").value = data["project_name"]

            // On masque le spinner global
            document.getElementById("global-spinner").classList.add("hide")

            saveAsNewProjectModal.hide()

            return data
        })
        .catch(error => {
            document.getElementById("global-spinner").classList.add("hide")
            apiCallErrorCatcher("erreur", "Erreur lors de la sauvegarde du projet")
        })
}

/**
 * Fonction permetant d'envoyer le projet déjà existant 
 * au serveur pour enregistrement des modifications en base de données
 */
updateProjectInDatabase = function (postdata) {
    // On affiche le spinner global
    document.getElementById("global-spinner").classList.remove("hide")
    // PASSER L'ID du projet
    fetch(APP_URL + "/api/project/update_content", {
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
            // On masque le spinner global
            document.getElementById("global-spinner").classList.add("hide")
        })
        .catch(error => {
            document.getElementById("global-spinner").classList.add("hide")
            apiCallErrorCatcher("erreur", "Erreur lors de la sauvegarde du projet")
        })
}

/**
 * Ouverture d'un projet existant
 */

/**
 * Traitement de l'action du clique sur le bouton permettant l'affichage des projets
 */
document.getElementById("select-project-modal").addEventListener('show.bs.modal', function () {
    buildMyprojectList()
})

/**
 * Fonctions permettant de récupérer la liste
 * des projets de l'utilisateur
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

/**
 * Mise en forme de la liste des projets de l'utilisateur courrant 
 */
var buildMyprojectList = function () {

    // On affiche le spinner
    document.getElementById("modal-my-projects-list-spinner").classList.remove("hide")

    // On vide la liste des projets
    var my_project_list = document.getElementById("my-projects-list")
    my_project_list.innerHTML = ''

    // Récupération de la liste des projets et mide en forme
    getMyProjectList().then(myProjectListJson => {

        if (myProjectListJson.length != 0) {

            document.getElementById("my-project-submit").disabled = false

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
        } else {
            // Pas de projet trouvé ou arrète le spinner
            document.getElementById("modal-my-projects-list-spinner").classList.add("hide")
            document.getElementById("my-project-submit").disabled = true
        }
    })
}


/**
 * Fonction récupérant un projet et reconstruisant la carte
 */
var openProject = function () {

    resetMapContent()

    document.getElementById('open-project-loading-spinner').style.display = 'inline-block'
    document.getElementById("my-project-cancel").disabled = true
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
            project["project_content"]["layers"].sort((a, b) => a.layer_index - b.layer_index);

            var projectOpeningError = []
            var attribute_data_layer_opened

            for (const projectLayer of project["project_content"]["layers"]) {

                try {

                    switch (projectLayer["layer_type"]) {
                        case "refLayerReadOnly":
                        case "refLayerEditable":

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

                            break
                        case "warningCalculatorLayer":
                            var message = "Le projet contient un périmètre de calcul des enjeux. Les couches d'enjeux résultante vont être recalculées."
                            showWarning(message)

                            layer = warning_calculator_layer

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

                            // Rafrichissement du résultat du calcul des enjeux
                            var writer = new ol.format.GeoJSON();
                            var geojson_txt = writer.writeFeatures(warning_calculator_source.getFeatures())
                            await getWarningCalculatorData(geojson_txt)

                            // Par défaut on rend la couche visible, si elle 
                            // n'ai pas enregistré comme visible, c'est géré après
                            layer.setVisible(true)

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

                            break
                    }

                    // Affichage ou non de la couche
                    if (projectLayer["layer_is_visible"] == false) {
                        if (projectLayer["layer_type"] == 'warningCalculatorLayer') {
                            console.log("layer_is_visible : " + projectLayer["layer_is_visible"])
                            layer_li = document.querySelector(".layer_list_element[layer-uid='" + ol.util.getUid(warning_calculator_layer) + "']")
                            layer_li.querySelector(".checkbox-layer").checked = false
                            warning_calculator_layer.setVisible(false)
                        } else {
                            layer_li = document.querySelector(".layer_list_element[layer-uid='" + ol.util.getUid(layer) + "']")
                            layer_li.querySelector(".checkbox-layer").click()
                        }
                    }
                } catch (error) {
                    projectOpeningError.push("Problème lors de la récupération de la couche <b>" + projectLayer["layer_name"] + "</b>")
                    console.log(error)
                }

                // Gestion des tables attributaires
                if (projectLayer["attribute_data_is_open"]) {
                    var layer_uid = ol.util.getUid(layer)
                    // Construction de la table attributaire
                    await getFullDataTable(layer_uid)

                    table.on("tableBuilt", function () {
                        // Application des filtres
                        for (const filter of projectLayer["attribute_data_filter"]) {
                            html_column = document.getElementById("layer-data-table-" + layer_uid).querySelector(".tabulator-col[tabulator-field='" + filter["column_name"] + "']")
                            html_column_searcher = html_column.querySelector("input[type='search']")
                            html_column_searcher.value = filter["value"]

                            html_column_searcher.dispatchEvent(new KeyboardEvent("keyup"))
                        }

                        // Application du trie
                        if (projectLayer["attribute_data_sort"]) {
                            if (projectLayer["attribute_data_sort"]["sorting_column"]) {
                                sorting_column = projectLayer["attribute_data_sort"]["sorting_column"]
                                sorting_direction = projectLayer["attribute_data_sort"]["sorting_direction"]
                                table.setSort([
                                    { column: sorting_column, dir: sorting_direction },
                                ])
                            }
                        }
                    })
                }

                // Récupération de l'uid de la couche dont la tab le attributaire est active
                if (projectLayer["attribute_data_is_active"] == true) {
                    attribute_data_layer_opened = ol.util.getUid(layer)
                }

            }

            // On active la bonne table attributaire
            if (table) {
                table.on("tableBuilt", function () {
                    if (attribute_data_layer_opened) {
                        // Gestion de nav
                        var navs = document.querySelectorAll(".nav-layer-item")
                        for (i = 0; i < navs.length; i++) {
                            navs[i].classList.remove("active")
                            if (navs[i].getAttribute("layer_uid") == attribute_data_layer_opened) {
                                navs[i].classList.add("active")
                            }
                        }

                        // Gestion de la table HTML
                        var tables = document.querySelectorAll(".layer-data-table")
                        for (i = 0; i < tables.length; i++) {
                            tables[i].style.display = "none"
                            if (tables[i].getAttribute("layer-uid") == attribute_data_layer_opened) {
                                tables[i].style.display = "block"
                            }
                        }
                    }
                })
            }

            selectProjectModal.hide()
            document.getElementById('open-project-loading-spinner').style.display = 'none'
            document.getElementById("my-project-cancel").disabled = false

            // Gestion de l'affichage des erreurs
            if (projectOpeningError.length > 0) {
                showAlert(projectOpeningError.join('<br />'))
            }


            // On affiche le nom du projet dans la barre d'en-tête
            document.getElementById("project-name-in-title").innerHTML = " - " + project["project_name"]

            // On inscrtit l'identifiant du projet
            document.getElementById("current_project_id").value = project["project_id"]
            document.getElementById("current_project_name").value = project["project_name"]

            // On affiche le boutton d'édition du nom du projet
            document.getElementById("btn-open-modal-rename-project").classList.remove("hide")

            // On active le bouton de sauvegarde 
            document.getElementById("btn-project-update").disabled = false
        })
    } else {
        document.getElementById('open-project-loading-spinner').style.display = 'none'
        document.getElementById("my-project-cancel").disabled = false
    }
}

/**
 * Fonction permettant de ré-initialiser la carte
 * en retirant toutes les couches
 */
var resetMapContent = function () {
    // On retire les couche de la carte
    map.getLayers().forEach(function (layer) {
        var layer_uid = ol.util.getUid(layer)
        removeLayer(layer_uid)
    });
}


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

    document.getElementById("basemap-dropdown-content").querySelectorAll(".dropdown-item").forEach(basemapItem => {
        if (basemapItem.innerHTML == basemapName) {
            basemapItem.click()
        }
    })
}

/**
 * Fonciton permettant de centrer et zommer la carte en fonction d'une emprise
 */
var applyProjectExtent = function (extent) {
    map.getView().fit(extent)
}

/**
 * Gestion de la fenêtre modal pour renommer un projet
 */
document.getElementById("rename-project-modal").addEventListener('show.bs.modal', event => {
    var project_name = document.getElementById("current_project_name").value
    document.getElementById("rename-project-name-input").value = project_name
})

/**
 * Gestion de la validation du renommage du projet
 */
document.getElementById("rename-project-form").addEventListener("submit", function (event) {

    event.preventDefault()
    new_project_name = document.getElementById("rename-project-name-input").value
    project_id = document.getElementById("current_project_id").value

    updateProjectName(project_id, new_project_name).then(res => {
        document.getElementById("current_project_name").value = new_project_name
        document.getElementById("project-name-in-title").innerHTML = " - " + new_project_name

        renameProjectModal.hide()
    })
})

var updateProjectName = function (project_id, project_name) {

    // On affiche le spinner global
    document.getElementById("global-spinner").classList.remove("hide")

    return fetch(APP_URL + "/api/project/update_name", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
            "project_id": project_id,
            "project_name": project_name
        })
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
            // On masque le spinner global
            document.getElementById("global-spinner").classList.add("hide")
        })
        .catch(error => {
            document.getElementById("global-spinner").classList.add("hide")
            apiCallErrorCatcher("erreur", "Erreur lors du changement du nom du projet du projet")
        })
}