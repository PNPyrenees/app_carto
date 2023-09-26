var showLayerMetadata = function(layer_id) {
    // Activation du global-spinner
    document.getElementById("global-spinner").classList.remove("hide")
    
    getLayerMetadata(layer_id).then(metadata => {
        clearMetadonneesModal()

        populateMetadataModal(metadata)

        metadonneesModal.show()
        
        // Désactivation du global-spinner
        document.getElementById("global-spinner").classList.add("hide")
    })

}

var showLayerMetadataFromLayerUID = function(layer_uid){
    //On recherche la couche
    var layer = null
    map.getLayers().forEach(tmp_layer => {
        current_layer_uid = ol.util.getUid(tmp_layer)
        if (current_layer_uid == layer_uid) {
            layer = tmp_layer
            return
        }
    })

    showLayerMetadata(layer.get('description_layer').layer_id)
}

/**
 * Fonctions permettant de récupérer les métadonnées à travers l'API
 */
 var getLayerMetadata = function (layer_id) {
    return fetch(APP_URL + "/api/get_metadata_for_layer/"+layer_id, {
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
            // Désactivation du global-spinner
            document.getElementById("global-spinner").classList.add("hide")

            default_message = "Erreur lors de la récupération des métadonnées"
            apiCallErrorCatcher(error, default_message)
            console.log(error)
        })
}

var clearMetadonneesModal = function(){
    document.getElementById("metadonnees-modal-layer-label").innerHTML = ""
    document.getElementById("metadonnees-modal-abstract").innerHTML = ""
    document.getElementById("metadonnees-modal-genealogie").innerHTML = ""
    document.getElementById("metadonnees-modal-date-reference").innerHTML = ""
    document.getElementById("metadonnees-modal-contacts").querySelector("tbody").innerHTML = ""
    document.getElementById("metadonnees-modal-statut").innerHTML = ""
    document.getElementById("metadonnees-modal-metadata-link").querySelector("a").setAttribute("href", "#")
}

var populateMetadataModal = function(metadata){
    document.getElementById("metadonnees-modal-layer-label").innerHTML = metadata.layer_label
    document.getElementById("metadonnees-modal-abstract").innerHTML = metadata.md_abstract.replaceAll("\n", "<br>")
    document.getElementById("metadonnees-modal-genealogie").innerHTML = metadata.md_genealogie.replaceAll("\n", "<br>")
    document.getElementById("metadonnees-modal-date-reference").innerHTML = "Date de " + metadata.md_type_date + " : " + metadata.md_date
    document.getElementById("metadonnees-modal-statut").innerHTML = metadata.md_etat

    // Gestion de l'affichage des contacts
    metadata.l_contacts.forEach(contact => {
        var tr = document.createElement('tr')

        var td_contact_name = document.createElement('td')
        td_contact_name.innerHTML = contact.md_contact
        var td_contact_role = document.createElement('td')
        td_contact_role.innerHTML = contact.md_role_contact

        tr.appendChild(td_contact_name)
        tr.appendChild(td_contact_role)

        document.getElementById("metadonnees-modal-contacts").querySelector("tbody").appendChild(tr)
    })

    document.getElementById("metadonnees-modal-metadata-link").querySelector("a").setAttribute("href", metadata.md_link)

    
    
    

}