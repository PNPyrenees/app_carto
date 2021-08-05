import os
from pathlib import Path
from flask import Flask, render_template, send_from_directory, request, make_response, jsonify, Markup
import requests
import json
from datetime import datetime
from sqlalchemy import create_engine, text

from .models import Role, VLayerList, Layer
from .schema import RoleSchema, VLayerListSchema, LayerSchema

"""from requests.api import request"""

from .utils.env import read_config, db_app, ma

import sys

app = Flask(__name__, template_folder='../frontend')
CONFIG_FILE = Path(__file__).absolute().parent.parent / "config/config.toml"

config = read_config(CONFIG_FILE)
app.config.update(config)

db_app.init_app(app)
db_sig = create_engine(app.config['SQLALCHEMY_SIG_DATABASE_URI'])

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

@app.route('/api/auth/logout', methods=['PATCH'])
def logout():
    """ Deconnexion d'un utilisateur 
    Supprime le token et la date d'expiration du token en BDD

    Parameters
    ----------
        POST Data : Token devant être "détruit"

    Returns
    -------
        code_http
    """
    postdata = request.json
    token = postdata['token']
    
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except:
        return jsonify({
            'status': 'error',
            'message': 'Erreur lors de la déconnexion : Aucun role associé au token'
        }), 520

    # On efface les valeur associé au Token
    role.role_token = None
    role.role_token_expiration = None
    role.role_date_update = datetime.now()

    #Enregistrement en base
    db_app.session.add(role)
    db_app.session.commit() 

    #role_schema = RoleSchema()
    #role_dump = role_schema.dump(role)
    return jsonify({
            'status': 'OK',
            'message': 'Token supprimé !'
        })


@app.route('/api/layer/get_layers_list', methods=['GET'])
def get_layers_list():
    """ Fourni la liste des couches de données
    disponible pour chaque groupe

    Returns
    -------
        JSON
    """
    # Nécessite jsonify car on retourne plusieur ligne
    return jsonify(VLayerListSchema(many=True).dump(VLayerList.query.all()))


@app.route('/api/ref_layer/<ref_layer_id>', methods=['GET'])
def getRefLayerData(ref_layer_id):
    """ Fourni la données correspondant au ref_layer_id
    au format geojson

    Returns
    -------
        GEOJSON
    """
    layer = Layer.query.get(ref_layer_id)
    layer_schema = LayerSchema().dump(layer)

    statement = text("""
        SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(feature)) AS geojson_layer 
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature', 
                'geometry', ST_AsGeoJSON(st_transform(geom, 3857))::jsonb, 
                'properties', to_jsonb(row) - 'geom') AS feature  
            FROM (select * from {}.{} t ) row
        ) features
    """.format(layer_schema["layer_schema_name"], layer_schema["layer_table_name"]))

    #layer_datas = db_sig.execute(statement).fetchone()._asdict()
    layer_datas = db_sig.execute(statement).fetchone()._asdict()
    layer_datas['desc_layer'] = layer_schema
    #layer_datas.append(layer_schema)
    #return datas.fetchone()._asdict()
    return layer_datas

#@app.route('/api/get_svg/<svg_name>', methods=['GET'])
#def getSvg(svg_name):
#    """ Cherche et retourne un svg à partir de son nom (avec extension)
#
#    Returns
#    -------
#        svg (html)
#    """
#
#    svg_rootdir = "backend/static/images/svg"
#
#    f = ""
#
#    # On recherche le svg dans les dossiers et sous-dossiers
#    for root, dirs, files in os.walk(svg_rootdir):
#        if svg_name in files:
#            svg_path = os.path.join(root, svg_name)
#            svg_file = open(svg_path, 'r').read()    
#
#    return render_template("svg.html", svg=Markup(svg_file))

if __name__ == "__main__":
    app.run()
