window.addEventListener('load', (event) => {  
    /** 
     * On lance l'initialisation de la carte
     */
    initMap()

    /**
     * Si valide, contrôle l'existance d'un cookie à l'ouverture
     */
    if (checkToken() === true) {
        var username = getCookie('username')
        if(username){
            document.getElementById('btn-login').classList.remove("active")
                document.getElementById('icon-login').classList.remove("active")
                document.getElementById('btn-logout').classList.add("active")
                document.getElementById('icon-logout').classList.add("active")
                document.getElementById('username-label').innerHTML = username.replace(/"/g, '')
        }
    }
});


/**
 * Activation des fenêtres "modal"
 */
var loginModal = new bootstrap.Modal(document.getElementById("login-modal"), {
    keyboard: false
})

var addLayerModal = new bootstrap.Modal(document.getElementById("add-layer-modal"), {
    keyboard: false
})

/**
 * Activation des popup
 */
 var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
 var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
   return new bootstrap.Popover(popoverTriggerEl)
 })

/**
 * Activation des tooltips
 */
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[toggle-tooltip="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
})

 /**
  * Activation des bandeaux d'alerte
  */
/*var alertList = document.querySelectorAll('.alert')
alertList.forEach(function (alert) {
    new bootstrap.Alert(alert)
})*/
  