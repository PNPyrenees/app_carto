// Gestion de l'affichage des boutons d'éditions
document.getElementById("btn-chanllenge-calculator").addEventListener("click", event => {
    document.getElementById("chanllenge-calculator-group-edit-btn").classList.toggle("hide")
    event.currentTarget.classList.toggle("btn-open")
})




/**
 * Activation de l'édition carto
 */
document.getElementById("btn-chanllenge-calculator-edit-feature").addEventListener("click", event => {
    // Si l'édition drawing est en cours alors on désactive les intéraction
    if (event.currentTarget.classList.contains("drawing")){
        // Ici, on veut desactiver l'édition
        disableLayerEditing()

        if (layerHasFeature(warning_calculator_layer)){
            document.getElementById("btn-chanllenge-calculator-remove-feature").classList.remove("disabled")
            document.getElementById("btn-chanllenge-calculator-execute").classList.remove("disabled")
        }
    } else {
        // Ici, on veut activer l'édition
        enableLayerEditing(warning_calculator_layer)
    }

    event.currentTarget.classList.toggle("drawing")
})

document.getElementById("btn-chanllenge-calculator-remove-feature").addEventListener("click", event => {
    removeSelectedFeaturesInLayer(warning_calculator_layer)
})
