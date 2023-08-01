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
        if (username) {
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

var pdfGeneratorModal = new bootstrap.Modal(document.getElementById("pdf-generator-modal"), {
    keyboard: false
})

var renameLayerModal = new bootstrap.Modal(document.getElementById("rename-layer-modal"), {
    keyboard: false
})

var chanllengeCalculatorInfoModal = new bootstrap.Modal(document.getElementById("chanllenge-calculator-info-modal"), {
    keyboard: false
})

var obsMoreInfoModal = new bootstrap.Modal(document.getElementById("obs-more-info-modal"), {
    keyboard: false
})

var styleLayerModal = new bootstrap.Modal(document.getElementById("style-layer-modal"), {
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
 * Fonction permettant de gérer les erreurs
 * lors des appel à l'API
 */
apiCallErrorCatcher = function (error, default_message = null) {
    if (error.status == 403) {
        // Ici, le token n'est plus valide côté serveur
        // Donc on ferme le modal courant et on ouvre le modal d'authentification
        // On retarde l'action car le modal doit être  
        // totallement ouvert pour pouvoir être fermé
        setTimeout(function () {
            addLayerModal.hide()
            forceOpenLoginModal()
        }, 1000)
    }

    // Gestion de l'affichage du message d'erreur
    if (typeof error == "string") {
        showAlert(default_message)
    } else {
        /*if (error.status == 500){
            showAlert(default_message)
        } else {*/
        err = error.json()
        err.then(err => {
            if (err.message != undefined) {
                message = err.message
                showAlert(message)
            } else {
                showAlert(default_message)
            }
        })
        //}
    }
}


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
showAlert = function (message) {
    message_element = document.getElementById("alert-message")
    message_element.innerHTML = message

    alert_container = document.getElementById("alert-container")
    alert_container.classList.add("show")

    window.setTimeout(function () {
        alert_container.classList.remove("show")
    }, 3000);
}

/**
 * Gestion de l'affichage des dropdown
 */
// on affiche le dropdown en cliquant sur le bouton asscocié
var openDropdown = function (obj) {

    obj.closest(".dropdown").querySelector(".dropdown-content").classList.toggle("show");
    obj.closest(".dropdown").querySelector(".dropdown-content").classList.toggle("hide");
}

// on ferme le dropdown quand on click en dehors
window.onclick = function (event) {
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

/**
 * Fonction globale de vérification des champ d'un formulaire
 */
// Contrôle que toutes les valeurs d'une liste sont bien dans le bon type (datatype)
/*checkListValue = function(listOfValue, dataType){
    var isValid = true
    listOfValue.forEach(value => {
        switch (dataType){
            case "integer":
                if (! Number.isInteger(value)){
                    isValid = false
                }
                break
            case "float":
                if (typeof value !="number"){
                    isValid = false
                }
                break
            case "string":
                if (typeof value != "string"){
                    isValid = false
                }
                break
            case "boolean":
                if (typeof value != "boolean"){
                    isValid = false
                }
                break
        }
    })
    return isValid
}

// Controle que la valeur min n'est pas supérieur à la valeur max
checkMinMax = function(minValue, maxValue){
    var isValid = true
    if (minValue > maxValue){
        isValid = false
    }
    return isValid
}
*/
// Controle que valeur est bien définit
checkRequired = function (value) {
    if (value) {
        return true
    } else {
        return false
    }

}

/**
 * Gestion de l'annulation d'un appel à l'API
 */
//const controller = new AbortController()
//const signal = controller.signal
var controller
var signal

/**
 * Gestion du clique sur un bouton devant faire apparaitre un sous-groupe de bouton
 */
/*var l_btn_toggle_sub_group = document.getElementsByClassName('toogle-sub-btn-group')
for (var i = 0; i < l_btn_toggle_sub_group.length; i++) {
    l_btn_toggle_sub_group[i].addEventListener("click", event => {
        let target = event.currentTarget.getAttribute("sub-btn-group-target")
        document.getElementById(target).classList.toggle("hide")
        event.currentTarget.classList.toggle("btn-open")
    });
}*/

var json2csv = function (json_data, csv_name) {
    // Construction du CSV
    const replacer = (key, value) => value === null ? '' : value
    const header = Object.keys(json_data[0])
    const csv = "data:text/csv;charset=utf-8," + [
        header.join(','), // header row first
        ...json_data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n')

    // Création d'un élément HTML fictif sur lequel on déclanche l'event click
    var encodedUri = encodeURI(csv)
    var link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", csv_name + ".csv")
    link.click();
}

/**
 * Foncton permettant de découpper une chaine 
 * de caractère pour un affichage HTML
 */
const stringDivider = function (str, width, spaceReplacer) {
    if (str.length > width) {
        let p = width;
        while (p > 0 && str[p] != ' ' && str[p] != '-') {
            p--;
        }
        if (p > 0) {
            let left;
            if (str.substring(p, p + 1) == '-') {
                left = str.substring(0, p + 1);
            } else {
                left = str.substring(0, p);
            }
            const right = str.substring(p + 1);
            return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
        }
    }
    return str;
}

/**
 * Fonction réalisant un arrondi à x décimals
 */
floatRound = function (value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

/**
 * Fonction permettant de générer un fichier et de lancer le téléchargement
 */
const download = function (filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}