/**
 * Retourne la valeur d'un cookie
 */ 
function getCookie(cname) {
    let name = cname + "=";
        let ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

/**
 * Supprime la valeur d'un cookie
 */ 
function deleteCookie(cname){
    //setCookie(cname, '', -1);
    document.cookie = cname +"="
}

/**
 * Contrôle que le token dans les cookies est valide
 */
function checkToken(){
    let token = getCookie("token")
    let tokenExpiration = Date.parse(getCookie("expiration").replace(/"/g, ''))

    // Y a t-il un token ?
    if (!token ) {
        //toto()
        console.log("pas de token")
        return false
    }
    // Y -t-il une date d'expiration ?
    if (!tokenExpiration) {
        console.log("pas de date d'expiration")
        return false
    }
    // La date d'expiration est elle passé ?
    if (tokenExpiration < Date.now()){
        console.log("Token expiré")
        return false
    }

    return true
}

/**
 * Fonction permettant d'ouvrir la fenêtre d'authentification
 * Utile dans le cas ou le serveur retourne une erreur 403 - Token invalid
 */
var forceOpenLoginModal = function(){

    // Ouverture du modal d'authentification
    loginModal.show()
    // Gestion affichage "Se connecter" / "Se déconnecter"
    document.getElementById("btn-login").classList.add("active")
    document.getElementById("icon-login").classList.add("active")
    document.getElementById("btn-logout").classList.remove("active")
    document.getElementById("icon-logout").classList.remove("active")
    document.getElementById("username-label").innerHTML = ""

    // Si on ouvre la fenêtre modal c'est que l'utilisateur n'est plus authentifié
    // donc on purge le cookie
    /*deleteCookie("username")
    deleteCookie("token")
    deleteCookie("expiration")*/
}
    
/**
 * Validation du formulaire de login
 */
const login_form = document.getElementById("login-form")

login_form.addEventListener("submit", function (event) {

    event.preventDefault()
    if (!login_form.checkValidity()) {
        console.log(login_form)
        event.stopPropagation()
    } else {
        // Ici, le formulaire est valide, on passe à la phase 
        // d'authentification auprès du usershub
        let login = document.getElementById("login-input").value
        let password = document.getElementById("password-input").value
        usershubAuth(login, password)
        
    }

    login_form.classList.add("was-validated")
}, false)

/**
 * Authentification de l'utilisateur auprès du userhub 
 */
 var usershubAuth = function (login, password){
    
    //On masque et supprime le message d'erreur avant la tentative d'authentification
    document.getElementById("form-login-error").style.display = "none"
    document.getElementById("form-login-error").innerHTML = "";

    // Appel API pour authentification
    fetch(APP_URL + "/api/auth/login", {
        method: "POST",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin",
        body: JSON.stringify({
            "login": login,
            "password": password,
            "id_application": ID_APPLICATION
        })
    })
    .then(res => {
        //console.log(res)
        if (res.status != 200){
            // En envoi l"erreur dans le catch
            throw res.json();
        } else {
            return res.json()
        }
    })
    .then(data => {
        loginModal.hide() // Fermeture du modal
        // Gestion affichage "Se connecter" / "Se déconnecter"
        document.getElementById("btn-login").classList.remove("active")
        document.getElementById("icon-login").classList.remove("active")
        document.getElementById("btn-logout").classList.add("active")
        document.getElementById("icon-logout").classList.add("active")
        document.getElementById("username-label").innerHTML = getCookie('username').replace(/"/g, '')

        //return data ;
    })
    .catch(error => {
        error.then(err => { 
            document.getElementById("form-login-error").innerHTML = err.msg;
            document.getElementById("form-login-error").style.display = "block"
        })
    })
}

/**
 * Gestion de la déconnexion (suppression du cookie)
 */ 
var btn_logout = document.getElementById("btn-logout")
btn_logout.addEventListener("click", function (event) { 

    fetch(APP_URL + "/api/auth/logout", {
        method: "PATCH",
        headers: { 
            "Accept": "application/json", 
            "Content-Type": "application/json" 
        },
        credentials: "same-origin",
        body: JSON.stringify({
            "token": getCookie("token")
        })
    })
    .then(res => {
        if (res.status != 200){
            // En envoi l"erreur dans le catch
            throw res.json();
        } else {
            return res.json()
        }
    })
    .then(res => {
        deleteCookie("username")
        deleteCookie("token")
        deleteCookie("expiration")

        document.getElementById("btn-login").classList.add("active")
        document.getElementById("icon-login").classList.add("active")
        document.getElementById("btn-logout").classList.remove("active")
        document.getElementById("icon-logout").classList.remove("active")
        document.getElementById("username-label").innerHTML = ""
    })
    .catch(error => {
        error.then(err => { 
            showAlert(err.message)
        })
    })
})

/**
 * Si valide, contrôle l'existance d'un cookie à l'ouverture
 */
window.addEventListener('load', (event) => {  
    //console.log(checkToken())
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
 * Controle de l'authentification avant ouverture du modal
 */
var check_auth_button = document.getElementsByClassName('check-auth')

for (var i = 0; i < check_auth_button.length; i++) {
    check_auth_button[i].addEventListener('click', (event) =>{
        // On ne se concentre que sur les actions ouvrant des modales
        
        if (event.currentTarget.getAttribute('modal-target')){
            if (checkToken() === false ){   
                // Utilisateur non connecté => on ouvre le modal de connexion
                loginModal.show()
            } else {
                // Utilisateur connecté => On ouvre la modal cible
                let target = event.currentTarget.getAttribute('modal-target')
                if (target) {
                    target = document.getElementById(target)
                    target = bootstrap.Modal.getInstance(target)
                    target.show()
                }
            }
        }

         
    })
}

