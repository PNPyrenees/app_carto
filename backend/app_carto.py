import os
from pathlib import Path
from flask import Flask, render_template, send_from_directory, request, make_response
import requests
import json
from datetime import datetime

from .models import Role
from .schema import RoleSchema

"""from requests.api import request"""

from .utils.env import read_config, db_app, ma

import sys

app = Flask(__name__, template_folder='../frontend')
CONFIG_FILE = Path(__file__).absolute().parent.parent / "config/config.toml"

config = read_config(CONFIG_FILE)
app.config.update(config)

db_app.init_app(app)

@app.route('/')
def index():
    """ Délivrer la page html unique du site

    Parameters
    ----------

    Returns
    -------
    html
        index.html
    """
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    """ Délivrer le favicon.ico

    Parameters
    ----------

    Returns
    -------
    img
        icon favicon.ico
    """
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'images/favicon.ico', mimetype='image/vnd.microsoft.icon')


@app.route('/api/auth/login', methods=['POST'])
def login():
    """ Authentification d'un utilisateur 
    en faisant appel à l'API GeoNature

    Parameters
    ----------
        POST Data : login et mot de passe de l'utilisateur 
            (+ identifiant de l'application dans usershub)

    Returns
    -------
        cookie
        json
    """
    postdata = request.json

    response = requests.post(app.config['GEONATURE_URL'] + '/geonature/api/auth/login', json = postdata)
    content = json.loads(response.content.decode('utf-8'))

    if response.status_code != 200:
        """return jsonify({
            'status': 'error',
            'message': 'Erreur d\'authentification : {}'.format(json.loads(content.decode('utf-8')))
        }), response.status_code """
        """return json.loads(content.decode('utf-8')), response.status_code """
        return content, response.status_code 

    token = response.headers['Set-Cookie'].split(";")[0].split("=")[1]

    # On contrôle si l'utilisateur est déjà renseigné dans la base de l'application
    role_schema = RoleSchema()
    role = Role.query.get(content["user"]["id_role"])
    if role is None:
        # Création de l'utilisateur
        role =  Role(
            content["user"]["id_role"],
            content["user"]["nom_role"],
            content["user"]["prenom_role"],
            content["user"]["identifiant"],
            token,
            content["expires"],
            None,
            None
        )        
    else:
        # Mise à jour de l'utilisateur
        role.role_nom = content["user"]["nom_role"]
        role.role_prenom = content["user"]["prenom_role"]
        role.role_login = content["user"]["identifiant"]
        role.role_token = token
        role.role_token_expiration = content["expires"]
        role.role_date_update = datetime.now()

    #Enregistrement en base
    db_app.session.add(role)
    db_app.session.commit()    

    # Construction de la réponse
    role_dump = role_schema.dump(role)
    resp = make_response(role_dump)

    username = role.role_prenom + " " + role.role_nom
    resp.set_cookie("token", role.role_token, expires=role.role_token_expiration, path="/" )
    resp.set_cookie("username", username, expires=role.role_token_expiration, path="/" )
    resp.set_cookie("expiration", str(role.role_token_expiration), expires=role.role_token_expiration, path="/" )

    return resp

if __name__ == "__main__":
    app.run()
