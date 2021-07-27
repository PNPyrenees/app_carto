(function () {
    "use strict"

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
        //console.log(getCookie("expiration").replace(/"/g, ''))
        //let tokenExpiration = new Date(getCookie("expiration").replace( /(\d{4})-(\d{2})-(\d{2})/, "$2/$1/$3"))
        //"2021-08-03 10:41:19.352548"
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
    
    var loginModal = new bootstrap.Modal(document.getElementById("login-modal"), {
        keyboard: false
    })
      
    /**
     * Validation du formulaire de login
     */
    var form = document.getElementById("login-form")

    form.addEventListener("submit", function (event) {

        event.preventDefault()
        if (!form.checkValidity()) {
            event.stopPropagation()
        } else {
            // Ici, le formulaire est valide, on passe à la phase 
            // d'authentification auprès du usershub
            let login = document.getElementById("login-input").value
            let password = document.getElementById("password-input").value
            usershubAuth(login, password)
        }

        form.classList.add("was-validated")
    }, false)

    /**
     * Authentification de l'utilisateur auprès du userhub 
     */
    function usershubAuth(login, password){

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
            console.log(res)
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
        deleteCookie("username")
        deleteCookie("token")
        deleteCookie("expiration")

        document.getElementById("btn-login").classList.add("active")
        document.getElementById("icon-login").classList.add("active")
        document.getElementById("btn-logout").classList.remove("active")
        document.getElementById("icon-logout").classList.remove("active")
        document.getElementById("username-label").innerHTML = ""
        
    })

    /**
     * Si valide, contrôle l'existance d'un cookie à l'ouverture
     */
    window.addEventListener('load', (event) => {  
        console.log(checkToken())
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


})()