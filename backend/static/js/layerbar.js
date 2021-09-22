/**
 * Gestion du drag and drop dans la liste des couches
 */
let selected = null

// création de l'objet temporaire permettant
// de visualiser la zone de dépôt
let blank_obj = document.createElement('li');
blank_obj.id = "drag_and_drop_blank"

function dragOver(e) {
    console.log(e.target.tagName)
    if (e.target.classList.contains("btn") == false){ // Controunement bug déplacement sur bouton
        if (selected != e.target){
            if (isBefore(selected, e.target)) {
                e.target.parentNode.insertBefore(blank_obj, e.target)
            } else {
                e.target.parentNode.insertBefore(blank_obj, e.target.nextSibling)
            }
        } else {
            if (document.getElementById("drag_and_drop_blank")){
                document.getElementById("drag_and_drop_blank").remove()
            }
        }
    }
}

function dragEnd(e) {
    if (document.getElementById("drag_and_drop_blank")){
        if (isBefore(selected, e.target)) {
        e.target.parentNode.insertBefore(selected, blank_obj.target)
        } else {
        e.target.parentNode.insertBefore(selected, blank_obj.nextSibling)
        }
    }
    selected.style.opacity = 1
    
    if(document.getElementById("drag_and_drop_blank")){
        document.getElementById("drag_and_drop_blank").remove()
    }

    changeLayerOrder()

    selected = null
}

function dragStart(e) {
    if (e.currentTarget.tagName != "INPUT") {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', null)
        selected = e.target
        selected.style.opacity = 0.5
    }
}

function isBefore(el1, el2) {
  let cur
  if (el2.parentNode === el1.parentNode) {
    for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
      if (cur === el2) return true
    }
  }
  return false;
}

//e.currentTarget.tagName != "INPUT"

/**
 * Fonction ouvrant la fenêtre modal permettant 
 * de renseigner le nom de la couche
 */
var openRenameLayerModal = function(layer_uid){
    document.getElementById("rename-layer-modal").querySelector("#layer-uid").value = layer_uid

    current_layer_name = document.getElementById("layer_list").querySelector("li[layer-uid='" + layer_uid + "'").querySelector(".layer-name").innerHTML
    rename_form.querySelector("#layer-name-input").value = current_layer_name
    
    renameLayerModal.show()
}

/**
 * Validation du formulaire de renommage d'une couche
 */
const rename_form = document.getElementById("rename-layer-form")

rename_form.addEventListener("submit", function (event) {
 
    event.preventDefault()
    if (!rename_form.checkValidity()) {
        event.stopPropagation()
    } else {
        // on éxécute le renommage de la couche
        let layer_name = rename_form.querySelector("#layer-name-input").value
        let layer_uid = rename_form.querySelector("#layer-uid").value

        // On renome la couche côté opelayers
        map.getLayers().forEach(layer => {
            if (ol.util.getUid(layer) == layer_uid){
                layer.set("layer_name", layer_name)
            }
        })

        document.getElementById("layer_list").querySelector("li[layer-uid='" + layer_uid + "'").querySelector(".layer-name").innerHTML = layer_name


        renameLayerModal.hide()
         
    }
 
    rename_form.classList.add("was-validated")
 }, false)


/**
 * Fonction d'export de la table attributaire en CSV
 */
var layerToCSV = function(layer_uid){
    // Recherche de la couche
    map.getLayers().forEach(layer => {
        if (ol.util.getUid(layer) == layer_uid){
            features = []
            layer.getSource().getFeatures().forEach(feature => {
                // On retire le champ geometry (...tmp_feature reçoit tous les champ sauf geometry)
                let {geometry, ...tmp_feature} = feature.getProperties()
                features.push(tmp_feature)
            })

            json2csv(features, layer.get("layer_name"))
        }
    })
}