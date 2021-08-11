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
document.getElementById("add-layer-submit").addEventListener('click', event => {
    active_menu = document.getElementById("add-layer-menu").querySelector('input[type="radio"]:checked')
    switch (active_menu.getAttribute('target')){
        case 'add-ref-layer':
            addRefLayerToMap()
            break
        case 'add-obs-layer':
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
 * Action de cliquer sur "btn-add-ref-layer"
 * pour charger la liste des couche de référence
 */
document.getElementById('btn-add-ref-layer').addEventListener('click', event => {
    buildAddRefLayerContent()
})

/**
 * Ajoute une couch de référence à la carte
 */
var addRefLayerToMap = function(){
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
        document.getElementById('loading-spinner').style.display = 'none'
        //console.log(data)
    })
    .catch(error => {
        document.getElementById('loading-spinner').style.display = 'none'

        default_message = "Erreur lors de la récupération de la liste des couches de référence"
        apiCallErrorCatcher(error, default_message)


        
        /*//console.log(error)
        //showAlert("Erreur lors de la récupération de la couche de référence")
        if (error.status == 403){
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
 * Gestion du formulaire de recherche de données d'observation
 */

/**
 * Récupération de la liste des groupes taxonomiques 
 * et remplissage du select
 */
const l_grp_tax = [
    {
      label: "New York",
      value: 'NY',
    },
    {
      label: "Washington",
      value: "WA",
    },
    {
      label: "California",
      value: "CA",
    },
    {
      label: "New Jersey",
      value: 'NJ',
    },
    {
      label: "North Carolina",
      value: "NC",
    },
    {
      label: "TEST",
      value: "TST",
    },
]

var select_pure_grp_tax = new SelectPure("#form-add-obs-layer-select-grp-tax", {
    /*placeholder: "Groupe taxonomique",*/ // Probleme, le placholder ne s'efface pas quand il y a des valeur...
    options: l_grp_tax,
    multiple: true,
    icon: "bi bi-x",
    inlineIcon: false,
    onChange: values => {
        document.getElementById("form-add-obs-layer-grp-tax-value").value = JSON.stringify(values)
    }
});

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
 * Récupération de la liste des status 
 * et remplissage du select
 */
 const l_statut = [
    {
      label: "Liste rouge - VU",
      value: 'lr-vu',
    },
    {
      label: "Liste rouge - EN",
      value: "lr-en",
    },
    {
      label: "Liste rouge - CR",
      value: "lr-cr",
    },
]

var select_pure_grp_tax = new SelectPure("#form-add-obs-layer-select-statut", {
    /*placeholder: "Groupe taxonomique",*/ // Probleme, le placholder ne s'efface pas quand il y a des valeur...
    options: l_statut,
    multiple: true,
    icon: "bi bi-x",
    inlineIcon: false,
    onChange: values => {
        document.getElementById("form-add-obs-layer-statut-value").value = JSON.stringify(values)
    }
});

/**
 * Récupération de la liste des communes 
 * et remplissage du select
 */
 const l_commune = [
    {
      label: "Luz-Saint-Sauveur",
      value: 'lr-vu',
    },
    {
      label: "Cauterets",
      value: "lr-en",
    },
    {
      label: "Arrens-Marsous",
      value: "lr-cr",
    },
]

var select_pure_grp_tax = new SelectPure("#form-add-obs-layer-select-commune", {
    options: l_commune,
    multiple: true,
    icon: "bi bi-x",
    inlineIcon: false,
    onChange: values => {
        document.getElementById("form-add-obs-layer-commune-value").value = JSON.stringify(values)
    }
});

/**
 * Récupération de la liste des type de restitution 
 * et remplissage du select
 */
 const l_restitutions = [
    {
      label: "Richesse taxonomique",
      value: 'rt',
    },
    {
      label: "Pression d'observation",
      value: "po",
    },
    {
      label: "Répartition",
      value: "re",
    },
]

var select_pure_grp_tax = new SelectPure("#form-add-obs-layer-select-restitution", {
    options: l_restitutions,
    multiple: false,
    icon: "bi bi-x",
    inlineIcon: false,
    onChange: values => {
        document.getElementById("form-add-obs-layer-restitution-value").value = JSON.stringify(values)
    }
});

/**
 * Récupération de la liste des echelles 
 * et remplissage du select
 */
 const l_echelles = [
    {
      label: "Maille 5km",
      value: 'm5',
    },
    {
      label: "Maille 2km",
      value: "m2",
    },
    {
      label: "Maille 1km",
      value: "m1",
    },
    {
      label: "Maille 500m",
      value: "m500",
    },
    {
      label: "Maille 100m",
      value: "m100",
    },
    {
      label: "Données brutes",
      value: "brut",
    },
]

var select_pure_grp_tax = new SelectPure("#form-add-obs-layer-select-echelle", {
    options: l_echelles,
    multiple: false,
    icon: "bi bi-x",
    inlineIcon: false,
    onChange: values => {
        document.getElementById("form-add-obs-layer-echelle-value").value = JSON.stringify(values)
    }
});