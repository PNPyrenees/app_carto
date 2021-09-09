//import '../lib/node_modules/select-pure/dist/index.js';
//import 'select-pure'
/**
 * Chargement du content correspondant au
 * menu actif à l'ouverture du modal
 */
document.getElementById("add-layer-modal").addEventListener('show.bs.modal', event => {
    active_menu = document.getElementById("add-layer-menu").querySelector('input[type="radio"]:checked')
    switch (active_menu.getAttribute('target')){
        case 'add-ref-layer':
            buildAddRefLayerContent()
            break
        case 'add-obs-layer':
            buildAddObsLayerForm()
            break
        case 'add-my-layer':
        case 'add-shared-layer':
        case 'add-new-layer':
        case 'add-imported-layer':
    }
})

/**
 * Gestion de l'action à réalisé après un click 
 * sur le bouton d'ajout d'une couche
 */
const layer_submit_button = document.getElementById("add-layer-submit")


layer_submit_button.addEventListener('click', event => {
    active_menu = document.getElementById("add-layer-menu").querySelector('input[type="radio"]:checked')
    switch (active_menu.getAttribute('target')){
        case 'add-ref-layer':
            addRefLayerToMap()
            break
        case 'add-obs-layer':
            addObsLayerForm()
            break
        case 'add-my-layer':
        case 'add-shared-layer':
        case 'add-new-layer':
        case 'add-imported-layer':
    }
})

/**
 * Fonctions permettant de récupérer la liste
 * des couches de référence disponible
 */
var getRefLayerList = function(){
    return fetch(APP_URL + "/api/layer/get_layers_list", {
        method: "GET",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin"
    })
    .then(res => {
        if (res.status != 200){
            throw res/*.json();*/
        } else {
            return res.json()
        }
    })
    .catch(error => {
        default_message = "Erreur lors de la récupération de la liste des couches de référence"
        apiCallErrorCatcher(error, default_message)
        /*if (error.status == 403){
            // Ici, le token n'est plus valide côté serveur
            // Donc on ferme le modal courant et on ouvre le modal d'authentification
            // On retarde l'action car le modal doit être  
            // totallement ouvert pour pouvoir être fermé
            setTimeout(function(){
                addLayerModal.hide()
                forceOpenLoginModal()
            }, 500)  
        }

        // Gestion de l'affichage du message d'erreur
        err = error.json()
        err.then(err => { 
            if (err.message != undefined){
                message = err.message
                showAlert(message)    
            } else {
                showAlert("Erreur lors de la récupération de la liste des couches de référence")
            }
        })*/
    })
}

/**
 * Construction du contenu du div "add-ref-layer-content"
 */
var buildAddRefLayerContent = function(){
    getRefLayerList().then(layer_list => {
        //Si getRefLayerList ne retourne rien alors on ne va pas plus loin
        if (!layer_list){
            return
        }

        var accordion_add_ref_layer_bloc = document.getElementById('accordion-add-ref-layer')

        //On réinitialise l'accordéon
        accordion_add_ref_layer_bloc.innerHTML = ""

        var i = 0
        layer_list.forEach(layer_group => {
            // Récupération du prototype
            let accordion_prototype = accordion_add_ref_layer_bloc.getAttribute('data-prototype')

            // Création des identifiants d'objet
            let accordion_add_ref_layer_heading_id = "accordion-add-ref-layer-heading-" + i
            let accordion_add_ref_layer_collapse_id = "accordion-add-ref-collapse-heading-" + i

            // On remplace les valeurs par défaut
            accordion_prototype = accordion_prototype.replace(/__GROUP_NAME__/g, layer_group.layer_group)
            accordion_prototype = accordion_prototype.replace(/__ACCORDION_HEADER_ID__/g, accordion_add_ref_layer_heading_id)
            accordion_prototype = accordion_prototype.replace(/__COLLAPSE_ID__/g, accordion_add_ref_layer_collapse_id)
            
            // Passage du prototype string vers element html
            template = document.createElement('template')
            template.innerHTML = accordion_prototype

            // On ajoute chaque couche du groupe
            layer_group.l_layers.forEach(layer => {
                var li = document.createElement('li');
                li.setAttribute('class','modal-ref-layer-item');
                /*li.classList.add("li-ref_layer")*/
                li.setAttribute('layer-id',layer.layer_id);

                li.appendChild(document.createTextNode(layer.layer_label))
                template.content.querySelector(".modal-ref-layer-list").appendChild(li)

                // on active la coloration si on sur le "li"
                li.addEventListener('click', (event) =>{
                    // On comence par désactiver tous les autres
                    let all_modal_ref_layer_item = document.getElementsByClassName('modal-ref-layer-item')
                    for (var i = 0; i < all_modal_ref_layer_item.length; i++) {
                        all_modal_ref_layer_item[i].classList.remove('active')
                    }
                    // uis on acitve l'élément cliqué
                    event.currentTarget.classList.add('active')
                })
            })

            accordion_add_ref_layer_bloc.appendChild(template.content)

            // On passe au groupe suivant
            i++
        })
    })
    let accordion_prototype = document.getElementById('accordion-add-ref-layer').getAttribute('data-prototype')    
}

/**
 * Action de cliquer sur les boutons de selection 
 * du type de couche
 */
/* btn-add-ref-layer */
document.getElementById('btn-add-ref-layer').addEventListener('click', event => {
    buildAddRefLayerContent()
})
/* btn-add-ref-layer */
document.getElementById('btn-add-obs-layer').addEventListener('click', event => {
    buildAddObsLayerForm()
})

/**
 * Ajoute une couch de référence à la carte
 */
var addRefLayerToMap = function(){
    layer_submit_button.disabled = true
    document.getElementById('loading-spinner').style.display = 'inline-block'

    let active_layer = document.querySelector('.modal-ref-layer-item.active')
    let ref_layer_id = active_layer.getAttribute('layer-id')

    fetch(APP_URL + "/api/ref_layer/" + ref_layer_id, {
        method: "GET",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin"
    })
    .then(res => {
        //console.log(res)
        if (res.status != 200){
            throw res;
        } else {
            return res.json()
        }
    }).then(data => {
        addGeojsonLayer(data)
        addLayerModal.hide()
        layer_submit_button.disabled = false
        document.getElementById('loading-spinner').style.display = 'none'
        //console.log(data.desc_layer)
    })
    .catch(error => {
        console.log(error)
        layer_submit_button.disabled = false
        document.getElementById('loading-spinner').style.display = 'none'

        default_message = "Erreur lors de la récupération de la liste des couches de référence"
        apiCallErrorCatcher(error, default_message)
    })
}

/**
 * Gestion du formulaire de recherche de données d'observation
 *//**
 * Appel API pour récupérer la liste des groupe taxonomique
 */
var getRegneList = function(){
    return fetch(APP_URL + "/api/layer/get_regne_list", {
        method: "GET",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin"
    })
    .then(res => {
        if (res.status != 200){
            throw res
        } else {
            return res.json()
        }
    })
    .catch(error => {
        default_message = "Erreur lors de la récupération de la liste des regnes"
        apiCallErrorCatcher(error, default_message)
    })
}

/**
 * Appel API pour récupérer la liste des groupe taxonomique
 */
var getGroupTaxoList = function(){
    return fetch(APP_URL + "/api/layer/get_group_taxo_list", {
        method: "GET",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin"
    })
    .then(res => {
        if (res.status != 200){
            throw res
        } else {
            return res.json()
        }
    })
    .catch(error => {
        default_message = "Erreur lors de la récupération de la liste des groupes taxonomiques"
        apiCallErrorCatcher(error, default_message)
    })
}

/**
 * Appel API pour la récupération de la liste des status
 */
var getStatutList = function(){
    return fetch(APP_URL + "/api/layer/get_statut_list", {
        method: "GET",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin"
    })
    .then(res => {
        if (res.status != 200){
            throw res
        } else {
            return res.json()
        }
    })
    .catch(error => {
        default_message = "Erreur lors de la récupération de la liste des statuts"
        apiCallErrorCatcher(error, default_message)
    })
}

/**
 * Appel API pour la récupération de la liste des communes
 */
var getCommuneList = function(){
    return fetch(APP_URL + "/api/layer/get_commune_list", {
        method: "GET",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin"
    })
    .then(res => {
        if (res.status != 200){
            throw res
        } else {
            return res.json()
        }
    })
    .catch(error => {
        default_message = "Erreur lors de la récupération de la liste des commune"
        apiCallErrorCatcher(error, default_message)
    })
}

/**
 * Appel API pour la récupération de la liste des echelles de restitution
 */
var getScaleList = function(){
    return fetch(APP_URL + "/api/layer/get_scale_list", {
        method: "GET",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin"
    })
    .then(res => {
        if (res.status != 200){
            throw res
        } else {
            return res.json()
        }
    })
    .catch(error => {
        default_message = "Erreur lors de la récupération de la liste des échelles de restitution"
        apiCallErrorCatcher(error, default_message)
    })
}

/**
 * Création de la liste des cases à cocher des groupes de statuts
 */
var getGroupStatusList = function(){
    return fetch(APP_URL + "/api/layer/get_group_statut_list", {
        method: "GET",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin"
    })
    .then(res => {
        if (res.status != 200){
            throw res
        } else {
            return res.json()
        }
    })
    .catch(error => {
        default_message = "Erreur lors de la récupération de la liste des groupe de statut"
        apiCallErrorCatcher(error, default_message)
    })
}

/**
 * Initialisation des liste déroulante
 */
var buildAddObsLayerForm = function(){
    // ré-initialisation du formulaire
    document.getElementById("selected-taxon").innerHTML = ""
    document.getElementById("form-add-obs-layer-infrataxon-checkbox").checked = false
    document.getElementById("form-add-obs-layer-regne-value").value = ""
    document.getElementById("form-add-obs-layer-grp-tax-value").value = ""
    document.getElementById("form-add-obs-layer-date-start").value = ""
    document.getElementById("form-add-obs-layer-date-end").value = ""
    document.getElementById("form-add-obs-layer-periode-start").value = ""
    document.getElementById("form-add-obs-layer-periode-end").value = ""
    document.getElementById("form-add-obs-layer-statut-value").value = ""
    let checkboxes = document.getElementById("form-group-status-checkboxes").querySelectorAll("input[type=checkbox]")
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false
    }
    document.getElementById("form-add-obs-layer-commune-value").value = ""
    document.getElementById("form-add-obs-layer-altitude-min").value = ""
    document.getElementById("form-add-obs-layer-altitude-max").value = ""
    document.getElementById("form-add-obs-layer-restitution-value").value = ""
    document.getElementById("form-add-obs-layer-scale-value").value = ""

    // Liste des statuts
    getStatutList().then(statut_list => {
        document.getElementById("form-add-obs-layer-select-statut").innerHTML = "";
        new SelectPure("#form-add-obs-layer-select-statut", {
            options: statut_list,
            multiple: true,
            icon: "bi bi-x",
            inlineIcon: false,
            onChange: values => {
                document.getElementById("form-add-obs-layer-statut-value").value = JSON.stringify(values)
            }
        });
    })

    // Liste des groupes taxonomiques
    getRegneList().then(regne_list => {
        document.getElementById("form-add-obs-layer-select-regne").innerHTML = "";
        new SelectPure("#form-add-obs-layer-select-regne", {
            options: regne_list,
            multiple: true,
            icon: "bi bi-x",
            inlineIcon: false,
            onChange: values => {
                document.getElementById("form-add-obs-layer-regne-value").value = JSON.stringify(values)
            }
        });
    })

    // Liste des groupes taxonomiques
    getGroupTaxoList().then(group_taxo_list => {
        document.getElementById("form-add-obs-layer-select-grp-tax").innerHTML = "";
        new SelectPure("#form-add-obs-layer-select-grp-tax", {
            options: group_taxo_list,
            multiple: true,
            icon: "bi bi-x",
            inlineIcon: false,
            onChange: values => {
                document.getElementById("form-add-obs-layer-grp-tax-value").value = JSON.stringify(values)
            }
        });
    })

    // Liste des communes
    getCommuneList().then(commune_list => {
        document.getElementById("form-add-obs-layer-select-commune").innerHTML = "";
        new SelectPure("#form-add-obs-layer-select-commune", {
            options: commune_list,
            multiple: true,
            icon: "bi bi-x",
            inlineIcon: false,
            onChange: values => {
                document.getElementById("form-add-obs-layer-commune-value").value = JSON.stringify(values)
            }
        });
    })

    // Liste des type de restitution
    const l_restitutions = [
        {
            label: "Nombre de taxons",
            value: "rt",
        },
        {
            label: "Nombre d'observation",
            value: "po",
        },
        {
            label: "Répartition",
            value: "re",
        },
    ]
    document.getElementById("form-add-obs-layer-select-restitution").innerHTML = "";
    new SelectPure("#form-add-obs-layer-select-restitution", {
        options: l_restitutions,
        multiple: false,
        icon: "bi bi-x",
        inlineIcon: false,
        onChange: values => {
            document.getElementById("form-add-obs-layer-restitution-value").value = String(values)
        }
    });

    // Liste des echelles de restitution
    getScaleList().then(commune_list => {
        document.getElementById("form-add-obs-layer-select-scale").innerHTML = "";
        new SelectPure("#form-add-obs-layer-select-scale", {
            options: commune_list,
            multiple: false,
            icon: "bi bi-x",
            inlineIcon: false,
            onChange: values => {
                document.getElementById("form-add-obs-layer-scale-value").value = JSON.stringify(values)
            }
        }); 
    })

    // Liste de checkbox des groupe de statuts
    getGroupStatusList().then(group_status_list => {

        document.getElementById("form-group-status-checkboxes").innerHTML = "";


        group_status_list.forEach(group_status => {

            var div = document.createElement("div")
            div.classList.add("form-group")

            var input = document.createElement("input")
            input.setAttribute("type", "checkbox")
            input.setAttribute("data-value", group_status.value)
            input.setAttribute("id", "form-add-obs-checkbox-group-statut-" + group_status.value)
            div.append(input)

            var label = document.createElement("label")
            label.setAttribute("for", "form-add-obs-checkbox-group-statut-" + group_status.value)
            label.setAttribute("toggle-tooltip", "tooltip")
            label.setAttribute("data-bs-placement", "right")
            label.setAttribute("data-bs-trigger", "hover")
            label.setAttribute("title", group_status.description)
            label.innerHTML= group_status.label
            div.append(label)

            document.getElementById("form-group-status-checkboxes").append(div)

            // Activation du tooltip
            new bootstrap.Tooltip(label)
            

        })

        
    })
}

/**
 * Gestion / initialisation des champs date
 */
// Formatage de la date du jour pour l'input
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();
if(dd<10){
        dd='0'+dd
} 
if(mm<10){
    mm='0'+mm
}
today = yyyy + "-" + mm + "-" + dd

// On détermine la date max
document.getElementById("form-add-obs-layer-date-start").setAttribute("max", today )
document.getElementById("form-add-obs-layer-date-end").setAttribute("max", today)

// Lorsque date min change, on modifie la valeur mini de date-end
document.getElementById("form-add-obs-layer-date-start").addEventListener("change", event => {
    if (event.target.value){
        document.getElementById("form-add-obs-layer-date-start").style.color = "#000"
        document.getElementById("form-add-obs-layer-date-end").setAttribute("min", event.target.value)
    } else {
        document.getElementById("form-add-obs-layer-date-start").style.color = "#8e8e8e"
        document.getElementById("form-add-obs-layer-date-end").setAttribute("min", "")
    }
})

document.getElementById("form-add-obs-layer-date-end").addEventListener("change", event => {
    if (event.target.value){
        document.getElementById("form-add-obs-layer-date-end").style.color = "#000"
        document.getElementById("form-add-obs-layer-date-start").setAttribute("max", event.target.value)
    } else {
        document.getElementById("form-add-obs-layer-date-end").style.color = "#8e8e8e"
        document.getElementById("form-add-obs-layer-date-start").setAttribute("max", today)
    }
})

/**
 * Gestion du champ taxon
 * appel à l'API GeoNature pour autocomplétion
 */
// https://geonature.pyrenees-parcnational.fr/geonature/api/synthese/taxons_autocomplete?search_name=aquil%20ch&limit=20 
// GEONATURE_URL

// Fonction réalisant l'appel API pour l'auto complétion
var getAutocompleteTaxon = function(search_name){
    return fetch(GEONATURE_URL + "/geonature/api/synthese/taxons_autocomplete?search_name=" + search_name + "&limit=20", {
        method: "GET",
        signal: signal,
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin"
    })
    .then(res => {
        if (res.status != 200){
            throw res
        } else {
            return res.json()
        }
    })
    .catch(error => {
        default_message = "Erreur lors de l'autocompétion du taxon"

        console.log(error)
        //apiCallErrorCatcher(error, default_message)
    })
}

// Lancement de la recherche d'auto-complétion
document.getElementById("search-taxon-input").addEventListener("keyup", event => {
    
    //On vide le bloc affichant le résultat de la recherche
    document.getElementById("taxon-autocomplete").innerHTML = ""
    
    var search_name = event.target.value

    document.getElementById("taxon-autocomplete-spinner").style.display = "block"

    // On lance la recherche s'l y a plus de trois caractère de tapé
    if (search_name.length >= 3) {

        //controller.abort()
        getAutocompleteTaxon(search_name).then(taxon_list => {
            // On aliment le bloc d'affichage des résultat que s'il y a des résultat
            if (taxon_list){                
                //Création des élément HTML de la liste des résultats
                taxon_list.forEach(taxon => {
                    var div = document.createElement('div')
                    div.classList.add("taxon-autocomplete-option")
                    div.setAttribute("data-value", taxon.cd_nom)
                    div.setAttribute("lb-nom", taxon.lb_nom)
                    div.innerHTML = taxon.search_name

                    // On ajoute un listener lors d'un clique sur un des éléments
                    // qui ajoute le taxon cliqué dans la lsite des taxon sélectionné
                    div.addEventListener('click', (event) =>{
                        var li = document.createElement("li")
                        li.setAttribute("cdnom", event.target.getAttribute("data-value"))
                        
                        var i = document.createElement("i")
                        i.classList.add("bi")
                        i.classList.add("bi-trash")
                        i.setAttribute("title", "Retirer le taxon des filtres")
                        i.addEventListener("click", event => {
                            event.target.parentNode.remove()
                        })

                        li.append(i)

                        text = document.createTextNode(" "+event.target.getAttribute("lb-nom"));
                        li.append(text)

                        document.getElementById("selected-taxon").append(li)

                        document.getElementById("search-taxon-input").value = ""
                    })

                    document.getElementById("taxon-autocomplete").append(div)
                })
                //On affiche le div recevant le réseultat de la recherche
                document.getElementById("taxon-autocomplete").style.display = "block"
            }
            // On arrête le spinner
            document.getElementById("taxon-autocomplete-spinner").style.display = "none"
        })
    } else {
        // On arrête le spinner s'il y a moins de 3 caractères
        document.getElementById("taxon-autocomplete-spinner").style.display = "none"
    }
})

// Gestion de la fermeture de la liste des propositions de taxon
document.onclick = function(e){
    if(e.target.id !== 'taxon-autocomplete'){
      //element clicked wasn't the div; hide the div
      document.getElementById("taxon-autocomplete").style.display = 'none';
    }
};

/**
 * Fonction ajoutant une couche à partir des données d'observation
 * en fonction du paramétrage des filtres
 */

var addObsLayerForm = function (){
    //Vérification de la validité du formulaire
    if (checkFormAddObsLayerRequiredField()){
        formdata = buildObsLayerFormData()
        // On affiche le spinner
        layer_submit_button.disabled = true
        document.getElementById('loading-spinner').style.display = 'inline-block'
        
        getObsLayerGeojson(formdata).then(data => {
            //On masque le spinner
            layer_submit_button.disabled = false
            document.getElementById('loading-spinner').style.display = 'none'
        })
    }
}

var buildObsLayerFormData = function(){
    cd_nom_list = []
    document.getElementById("selected-taxon").querySelectorAll("li").forEach(li => {
        cd_nom_list.push(Number(li.getAttribute("cdnom")))
    })

    include_infra_taxon = document.getElementById("form-add-obs-layer-infrataxon-checkbox").checked

    regne_list = []
    if (document.getElementById("form-add-obs-layer-regne-value").value){
        regne_list = JSON.parse(document.getElementById("form-add-obs-layer-regne-value").value)
    }

    grp_taxon_list = []
    if (document.getElementById("form-add-obs-layer-grp-tax-value").value){
        grp_taxon_list = JSON.parse(document.getElementById("form-add-obs-layer-grp-tax-value").value)
    }

    date_min = document.getElementById("form-add-obs-layer-date-start").value
    date_max = document.getElementById("form-add-obs-layer-date-end").value

    periode_min = document.getElementById("form-add-obs-layer-periode-start").value
    periode_max = document.getElementById("form-add-obs-layer-periode-end").value

    status_list = []
    if (document.getElementById("form-add-obs-layer-statut-value").value){
        JSON.parse(document.getElementById("form-add-obs-layer-statut-value").value).forEach(status => {
            status_list.push(Number(status))
        })
    }

    grp_status_list = []
    document.getElementById("form-group-status-checkboxes").querySelectorAll("input").forEach(checkbox => {
        if (checkbox.checked){
            grp_status_list.push(Number(checkbox.getAttribute("data-value")))
        }
    })

    commune_list = []
    if (document.getElementById("form-add-obs-layer-commune-value").value){
        commune_list = JSON.parse(document.getElementById("form-add-obs-layer-commune-value").value)
    }
    
    altitude_min = Number(document.getElementById("form-add-obs-layer-altitude-min").value)
    altitude_max = Number(document.getElementById("form-add-obs-layer-altitude-max").value)
    
    restitution = String(document.getElementById("form-add-obs-layer-restitution-value").value)

    scale = Number(document.getElementById("form-add-obs-layer-scale-value").value)

    formdata = {
        "cd_nom_list": cd_nom_list,
        "include_infra_taxon" : include_infra_taxon,
        "regne_list": regne_list,
        "grp_taxon_list" : grp_taxon_list,
        "date_min": date_min,
        "date_max": date_max,
        "periode_min": periode_min,
        "periode_max": periode_max,
        "status_list": status_list,
        "grp_status_list": grp_status_list,
        "commune_list": commune_list,
        "altitude_min": altitude_min,
        "altitude_max": altitude_max,
        "restitution": restitution,
        "scale": scale
    }
    return formdata
}

var checkFormAddObsLayerRequiredField = function(){
    var form = document.getElementById("form-add-obs-layer")

    var formIsValid = true
    
    // Vérification que le ype de restitution est renseigné
    form_field = form.querySelector("#form-add-obs-layer-restitution-value")
    form_field.parentNode.querySelector("label").style.color = "#000"
    if (! checkRequired(form_field.value)){
        form_field.parentNode.querySelector("label").style.color = "#f00"
        formIsValid = false
    }

    // Vérification que l'echelle de restitution est renseigné
    form_field = form.querySelector("#form-add-obs-layer-scale-value")
    form_field.parentNode.querySelector("label").style.color = "#000"
    if (! checkRequired(form_field.value)){
        form_field.parentNode.querySelector("label").style.color = "#f00"
        formIsValid = false
    }

    return formIsValid
}

var getObsLayerGeojson = function(formdata) {
    return fetch(APP_URL + "/api/layer/get_obs_layer_data", {
        method: "POST",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin",
        body: JSON.stringify(formdata)
    })
    .then(res => {
        if (res.status != 200){
            // En envoi l"erreur dans le catch
            throw res;
        } else {
            return res.json()
        }
    })
    .then(data => {
        console.log(data)
        if (data.geojson_layer.features){
            additional_data = {"formdata": formdata,}
            addGeojsonLayer(data, additional_data)
            addLayerModal.hide()

            layer_submit_button.disabled = false
            document.getElementById('loading-spinner').style.display = 'none'
            //console.log(data)
        } else {
            throw "Aucune donnée trouvée";
        }
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