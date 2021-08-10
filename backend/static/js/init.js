window.addEventListener('load', (event) => {  
    /** 
     * On lance l'initialisation de la carte
     */
    //initMap()

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
// On ré-initialise le modal à la fermeture
/*var addLayerModalEl = document.getElementById("add-layer-modal")
addLayerModalEl.addEventListener('hidden.bs.modal', function (event) {
    document.querySelectorAll('.modal-div-content').forEach(div => {
        div.classList.remove("show")
    })
    document.getElementById("add-ref-layer").classList.add("show")

    let element = document.getElementById('btnradio1');
    let evt = new Event('change');
    element.dispatchEvent(evt);
})*/



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
  * Dans les modal
  * Gestion de l'affichage des div en fontion du "menu"
  */
let allCheckBox = document.querySelectorAll('.modal-btn-check')

allCheckBox.forEach(checkbox => { 
    checkbox.addEventListener('change', event => {
        if (event.target.checked) {
            document.querySelectorAll('.modal-div-content').forEach(div => {
                div.classList.remove("show")
            })
            let target = event.target.getAttribute("target")
            document.getElementById(target).classList.add("show")
        }
    })
})

/**
 * Gestion de l'affichage du bandeau d'alerte
 */
showAlert = function(message) {
    message_element = document.getElementById("alert-message")
    message_element.innerHTML = message

    alert_container = document.getElementById("alert-container")
    alert_container.classList.add("show")

    window.setTimeout(function() {
        alert_container.classList.remove("show")
    }, 3000);
}

/**
 * Gestion de l'affichage des dropdown
 */
// on affiche le dropdown en cliquant sur le bouton asscocié
var openDropdown = function(obj){

    obj.closest(".dropdown").querySelector(".dropdown-content").classList.toggle("show");
    obj.closest(".dropdown").querySelector(".dropdown-content").classList.toggle("hide");
}

// on ferme le dropdown quand on click en dehors
window.onclick = function(event) {
    if (!event.target.matches('.btn-dropdown')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
                openDropdown.classList.add('hide');
            }
        }
    }
}
