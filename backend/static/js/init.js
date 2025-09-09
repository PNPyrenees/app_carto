/* Variable globale contenant la description de l'utilisateur */
var role = null

window.addEventListener('load', (event) => {

    // A l'ouverture de la page, on s'assure de retirer l'identifiant du projet et 
    // on désactive le bouton d'enregistrement d'un projet
    document.getElementById("current_project_id").value = ""
    document.getElementById("btn-project-update").disabled = true
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

var challengeCalculatorInfoModal = new bootstrap.Modal(document.getElementById("challenge-calculator-info-modal"), {
    keyboard: false
})

var uploadChallengeCalculatorlayerModal = new bootstrap.Modal(document.getElementById("upload-challenge-calculator-layer-modal"), {
    keyboard: false
})

var obsMoreInfoModal = new bootstrap.Modal(document.getElementById("obs-more-info-modal"), {
    keyboard: false
})

var styleLayerModal = new bootstrap.Modal(document.getElementById("style-layer-modal"), {
    keyboard: false
})

var featureEditModal = new bootstrap.Modal(document.getElementById("feature-edit-modal"), {
    keyboard: false
})

var confirmDeleteFeatureModal = new bootstrap.Modal(document.getElementById("confirm-delete-feature-modal"), {
    keyboard: false
})

var exportModal = new bootstrap.Modal(document.getElementById("export-modal"), {
    keyboard: false
})

var metadonneesModal = new bootstrap.Modal(document.getElementById("metadonnees-modal"), {
    keyboard: false
})

var saveAsNewProjectModal = new bootstrap.Modal(document.getElementById("save-as-new-project-modal"), {
    keyboard: false
})

var selectProjectModal = new bootstrap.Modal(document.getElementById("select-project-modal"), {
    keyboard: false
})

var renameProjectModal = new bootstrap.Modal(document.getElementById("rename-project-modal"), {
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
    if (error.status == 401) {
        // Ici, le token n'est plus valide côté serveur
        // Donc on ferme le modal courant et on ouvre le modal d'authentification
        // On retarde l'action car le modal doit être  
        // totallement ouvert pour pouvoir être fermé
        setTimeout(function () {
            addLayerModal.hide()
            pdfGeneratorModal.hide()
            renameLayerModal.hide()
            challengeCalculatorInfoModal.hide()
            uploadChallengeCalculatorlayerModal.hide()
            obsMoreInfoModal.hide()
            styleLayerModal.hide()
            featureEditModal.hide()
            confirmDeleteFeatureModal.hide()
            exportModal.hide()
            metadonneesModal.hide()
            saveAsNewProjectModal.hide()
            selectProjectModal.hide()

            forceOpenLoginModal()
        }, 1000)
    }

    // Gestion de l'affichage du message d'erreur
    if (typeof error == "string") {
        showAlert(default_message)
    } else {
        err = error.json()
        err.then(err => {
            if (err.message != undefined) {
                message = err.message
                showAlert(message)
            } else {
                showAlert(default_message)
            }
        })
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
 * Dans le modal d'ajout de couche
 * Gestion de l'affichage des div en fontion du "menu"
 */
let allAddLayerModalCheckBox = document.getElementById("add-layer-modal").querySelectorAll('.modal-btn-check')

allAddLayerModalCheckBox.forEach(checkbox => {
    checkbox.addEventListener('change', event => {
        if (event.target.checked) {
            document.getElementById("add-layer-modal").querySelectorAll('.modal-div-content').forEach(div => {
                div.classList.remove("show")
            })
            let target = event.target.getAttribute("target")
            document.getElementById(target).classList.add("show")
        }
    })
})

/**
 * Dans le modal d'ouverture de projet
 * Gestion de l'affichage des div en fontion du "menu"
 */
let allProjectModalCheckBox = document.getElementById("save-as-new-project-modal").querySelectorAll('.modal-btn-check')

allProjectModalCheckBox.forEach(checkbox => {
    checkbox.addEventListener('change', event => {
        if (event.target.checked) {
            document.getElementById("save-as-new-project-modal").querySelectorAll('.modal-div-content').forEach(div => {
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
    alert_container.classList.remove("hide")

    window.setTimeout(function () {
        alert_container.classList.add("hide")
    }, 5000);
}

/**
 * Gestion de l'affichage du bandeau d'information de type warning
 */
showWarning = function (message) {
    message_element = document.getElementById("warning-message")
    message_element.innerHTML = message

    warning_container = document.getElementById("warning-container")
    warning_container.classList.remove("hide")

    window.setTimeout(function () {
        warning_container.classList.add("hide")
    }, 5000);
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
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.setAttribute('download', filename);
    a.setAttribute('href', window.URL.createObjectURL(blob));
    a.click()
}

var simpleJsonToHtmlTable = function (jsonData) {

    var $table = document.createElement('table')


    for (let key in jsonData) {
        value = jsonData[key]

        var $td1 = document.createElement('td')
        $td1.innerHTML = key

        var $td2 = document.createElement('td')
        $td2.innerHTML = value

        var $tr = document.createElement('tr')
        $tr.appendChild($td1)
        $tr.appendChild($td2)

        $table.appendChild($tr)
    }

    return $table
}

/**
 * Validates that the input string is a valid date formatted as "yyyy-mm-dd"
 */
function isValidDate(dateString) {
    // First check for the pattern
    if (!/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(dateString))
        return false;

    // Parse the date parts to integers
    var parts = dateString.split("-");
    var day = parseInt(parts[2], 10);
    var month = parseInt(parts[1], 10);
    var year = parseInt(parts[0], 10);

    console.log("day : " + day)
    console.log("month : " + month)
    console.log("year : " + year)

    // Check the ranges of month and year
    if (month == 0 || month > 12)
        return false;

    var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Adjust for leap years
    if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
};

// Fonction utile pour trier un array de nombre
/*function compareNumbers(a, b) {
    return a - b;
}*/

/*
 * Gestion de l'affichage en fonction des permissions
 */
var refreshGUI = function () {
    // par défaut on désactive tous les bouttons du toolbar
    document.getElementById('btn-add-layer').classList.add('hide')
    document.getElementById('btn-challenge-calculator').classList.add('hide')
    document.getElementById('btn-pdf-generator').classList.add('hide')
    document.getElementById('btn-measure').classList.add('hide')
    document.getElementById('btn-project-create-open-modal').classList.add('hide')
    document.getElementById('btn-project-update').classList.add('hide')
    document.getElementById('btn-project-open').classList.add('hide')

    // par défaut on désactive tous les bouttons du toolbar
    document.getElementById('btn-add-ref-layer').classList.add('hide')
    document.getElementById('add-layer-menu').querySelector('label[for="btn-add-ref-layer"]').classList.add('hide')

    document.getElementById('btn-add-obs-layer').classList.add('hide')
    document.getElementById('add-layer-menu').querySelector('label[for="btn-add-obs-layer"]').classList.add('hide')

    document.getElementById('btn-add-imported-layer').classList.add('hide')
    document.getElementById('add-layer-menu').querySelector('label[for="btn-add-imported-layer"]').classList.add('hide')

    document.getElementById('btn-add-drawing-layer').classList.add('hide')
    document.getElementById('add-layer-menu').querySelector('label[for="btn-add-drawing-layer"]').classList.add('hide')

    // On fonction des droits, on réactive l'accès au fonctionnalité
    if (role !== null) {
        if (['GET_REF_LAYER', 'GET_OBS_DATA', 'IMPORT', 'DRAW'].some(val => role.authorization_codes.includes(val))) {
            document.getElementById('btn-add-layer').classList.remove('hide')

            if (role.authorization_codes.includes('GET_REF_LAYER')) {
                document.getElementById('btn-add-ref-layer').classList.remove('hide')
                document.getElementById('add-layer-menu').querySelector('label[for="btn-add-ref-layer"]').classList.remove('hide')
            }

            if (role.authorization_codes.includes('GET_OBS_DATA')) {
                document.getElementById('btn-add-obs-layer').classList.remove('hide')
                document.getElementById('add-layer-menu').querySelector('label[for="btn-add-obs-layer"]').classList.remove('hide')
            }

            if (role.authorization_codes.includes('IMPORT')) {
                document.getElementById('btn-add-imported-layer').classList.remove('hide')
                document.getElementById('add-layer-menu').querySelector('label[for="btn-add-imported-layer"]').classList.remove('hide')
            }

            if (role.authorization_codes.includes('DRAW')) {
                document.getElementById('btn-add-drawing-layer').classList.remove('hide')
                document.getElementById('add-layer-menu').querySelector('label[for="btn-add-drawing-layer"]').classList.remove('hide')
            }


            menu_elements = document.getElementById('add-layer-menu').querySelectorAll('input[type=radio]:not(.hide)')

            first_add_layer_menu_element = menu_elements[0]
            last_add_layer_menu_element = menu_elements[menu_elements.length - 1]
            // Dans la fenêtre modal d'ajout de couche, ça active le premier élément du menu affiché (et le contenu associé)
            // Seulement si le premier n'est pas celuio par défaut (à savoir add_ref_layer)
            if (first_add_layer_menu_element.id != 'btn-add-ref-layer') {
                document.getElementById('add-layer-menu').querySelector('label[for="' + first_add_layer_menu_element.id + '"]').click()
            }

            // Ajustement du CSS appliqué à la liste des menu du modal add-layer
            if (first_add_layer_menu_element == last_add_layer_menu_element) {
                document.getElementById('add-layer-menu').querySelector('label[for="' + first_add_layer_menu_element.id + '"]').style.borderRadius = "0.375rem"
            } else {
                document.getElementById('add-layer-menu').querySelector('label[for="' + first_add_layer_menu_element.id + '"]').style.borderRadius = "0.375rem 0.375rem 0 0"
                document.getElementById('add-layer-menu').querySelector('label[for="' + last_add_layer_menu_element.id + '"]').style.borderRadius = "0 0 0.375rem 0.375rem"
            }

        }

        if (role.authorization_codes.includes('WARNING_CALCULATOR')) {
            document.getElementById('btn-challenge-calculator').classList.remove('hide')
        }

        if (role.authorization_codes.includes('EXPORT_PDF')) {
            document.getElementById('btn-pdf-generator').classList.remove('hide')
        }

        if (role.authorization_codes.includes('PROJECT')) {
            document.getElementById('btn-project-create-open-modal').classList.remove('hide')
            document.getElementById('btn-project-update').classList.remove('hide')
            document.getElementById('btn-project-open').classList.remove('hide')
        }

        document.getElementById('btn-measure').classList.remove('hide')
    }

}

refreshGUI()