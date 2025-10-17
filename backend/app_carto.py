import os
import re
from pathlib import Path
from readline import insert_text
from flask import Flask, render_template, send_from_directory, request, make_response, jsonify, Response
import requests
import json
from datetime import datetime, date
from sqlalchemy import create_engine, text, func, bindparam, select, literal_column, cast
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import aliased
#from sqlalchemy.sql.expression import true
from functools import wraps
from werkzeug.utils import secure_filename
import shutil 

from .models import Role, VLayerList, Layer, BibStatusType, VRegneList, VGroupTaxoList, BibCommune, BibMeshScale, BibGroupStatus, ImportedLayer, Logs, Project, BibAuthorization, Group, GroupAuthorization
from .schema import RoleSchema, VLayerListSchema, LayerSchema, BibGroupStatusSchema, ImportedLayerSchema, LogsSchema, ProjectSchema

import logging 
"""from requests.api import request"""

from .utils.env import read_config, db_app, ma

import sys

app = Flask(__name__, template_folder='../frontend')
CONFIG_FILE = Path(__file__).absolute().parent.parent / "config/config.toml"

# Ajout du pre_ping permettant de s'assurer que la connexion est active
# avant de lancer un requête
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
}

config = read_config(CONFIG_FILE)
app.config.update(config)

# On force le fait de ne pas trier les json par keyname
app.config['JSON_SORT_KEYS'] = False

# paramtrage en dur du chemin de stockage des média
app.config['UPLOAD_FOLDER'] = './backend/static/media/'
app.config['TMP_UPLOAD_FOLDER'] = './backend/static/tmp_upload/'
# paramétrage en dur des types de fichier d'upload autorisés lors de l'édition de couche
app.config['ALLOWED_FEATURE_FILES_EXTENSIONS'] = {'pdf', 'png', 'jpg', 'jpeg'}

# Pour débuggage : A retirer pour passage en PROD
#app.config['SQLALCHEMY_ECHO'] = True

db_app.init_app(app)
db_sig = create_engine(app.config['SQLALCHEMY_SIG_DATABASE_URI'], pool_pre_ping=True)


logging.basicConfig(filename="logs/app_carto_errors.log", 
                format='%(asctime)s %(message)s', 
                filemode='w') 
logger=logging.getLogger()
logger.setLevel(logging.DEBUG) 

# exemple utiisation du logger
#logger.debug("Here it's loggin")
# Préférer app.logger.info() !!

def valid_token_required(f):
    """ Fonction de type décorateur permettant 
    de controler la validité d'un token

    Parameters
    ----------
    f : je pense que c'est la fonction d'origine
    Returns
    -------
    403 si token invalide
    sinon on retourne dans la fonction de la route
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):

        token = request.cookies.get('token')
        # S'il n'y a pas de token alors invalide
        if (not token):
            return jsonify({
                "status": "error",
                "message": "[Erreur 401-1] - Aucune clés d'authentification trouvée, veuillez vous identifier"
            }), 403

        # Controle de la date d'expiration
        role = Role.query.filter(Role.role_token == token)
        # Controle que le token correspond bien à un utilisateur
        if (role.first() is None):
            return jsonify({
                "status": "error",
                "message": "[Erreur 401-2] - La clés d'authentification est incorrecte, veuillez vous identifier"
            }), 401

        role = role.one()
        # Controle que la date d'expiration n'est pas dépassé
        if (datetime.now() < role.role_token_expiration):
            return f(*args, **kwargs)
        else :
            return jsonify({
                "status": "error",
                "message": "[Erreur 401-3] - La clés d'authentification n'est plus valide, veuillez vous identifier"
            }), 401
    return decorated_function

def check_authorization(authorization_code_list):
    """ Fonction de type décorateur permettant 
    de controler que l'utilisateur possède le droits demandé

    -------
    403 si token invalide
    sinon on retourne dans la fonction de la route initialemnt 
    demandée (-> f(*args, **kwargs))
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            token = request.cookies.get('token')

            # S'il n'y a pas de token alors invalide
            if (not token):
                # de fait, il n'est pas autorisé
                return jsonify({
                    "status": "error",
                    "message": "[Erreur 401-3] - La clés d'authentification est incorrecte, veuillez vous identifier"
                }), 401
            else :
                # Si on a bien un utilisateur authentifié alors on vérifie qu'il a
                # la permission demandée
                role = Role.query.filter(Role.role_token == token).one()
                
                allowed = False
                for authorization_code in authorization_code_list:
                    if (role.has_authorization(authorization_code)):
                        allowed = True
                
                if (allowed):
                    return f(*args, **kwargs)
                else:
                    return jsonify({
                        "status": "error",
                        "message": "[Erreur 403-1] - L'utilisateur ne possède pas l'autorisation " + authorization_code
                    }), 403
                

        return wrapped
    return decorator

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
        default_group = Group.query.get(app.config["DEFAULT_USER_GROUP"])
        # Création de l'utilisateur
        role =  Role(
            role_id = content["user"]["id_role"],
            role_nom = content["user"]["nom_role"],
            role_prenom = content["user"]["prenom_role"],
            role_login = content["user"]["identifiant"],
            role_token = token,
            role_token_expiration = content["expires"],
            role_date_insert = None,
            role_date_update = None,
            groups = [default_group]
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
    resp.set_cookie("token", role.role_token, expires=role.role_token_expiration, path="/", samesite='None', secure=True)
    resp.set_cookie("username", username, expires=role.role_token_expiration, path="/", samesite='None', secure=True)
    resp.set_cookie("expiration", str(role.role_token_expiration), expires=role.role_token_expiration, path="/", samesite='None', secure=True)

    #logger.debug(role.authorization_codes)
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
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """Erreur lors de la déconnexion : Aucun role associé au token - {}""".format(error)
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


@app.route('/api/user_from_token/')
@valid_token_required
def get_user():
    """ Fourni l'utilisateur associé à un token

    Returns
    -------
        JSON
    """    
    token = request.cookies.get('token')

    # Controle de la date d'expiration
    return RoleSchema().dump(Role.query.filter(Role.role_token == token).first())

@app.route('/api/layer/get_layers_list', methods=['GET'])
@valid_token_required
@check_authorization(['GET_REF_LAYER'])
def get_layers_list():
    """ Fourni la liste des couches de données
    disponible pour chaque groupe

    Returns
    -------
        JSON
    """    
    token  = request.cookies.get('token')
    
    # requête de récupération de la liste des layer_id 
    # auquel l'utilisateur à les droits d'accès
    role = Role.query.filter(Role.role_token == token).one()
    authorization_constraints = role.get_authorization_constraints('GET_REF_LAYER')

    if authorization_constraints is None:
        # Il n'y a pas de contrainte d'accès qu'à certain couche
        # Donc on retourne la liste complète
        layer_list = VLayerList.query.all()
        
    else :
        # Il y a des contraintes donc il faut structurer la liste 
        # des couches en fonction
        tmp_layers = (
            select(
                Layer.layer_group,
                Layer.layer_id,
                Layer.layer_label,
                func.coalesce(cast(Layer.layer_metadata_uuid, Layer.layer_label.type), '').label("layer_metadata_uuid")
            )
            .where(Layer.layer_id.in_(authorization_constraints))
            .order_by(Layer.layer_group, Layer.layer_label)
            .cte("tmp_layers")
        )

        json_object = cast(
            func.concat(
                '{"layer_id": ', tmp_layers.c.layer_id,
                ', "layer_label": "', tmp_layers.c.layer_label,
                '", "layer_metadata_uuid": "', tmp_layers.c.layer_metadata_uuid,
                '"}'
            ),
            JSON
        )

        final_query = (
            select(
                tmp_layers.c.layer_group,
                func.json_agg(json_object).label("l_layers")
            )
            .group_by(tmp_layers.c.layer_group)
        )
        layer_list = db_app.session.execute(final_query).all()

    # si la liste des authorization_constraints est vide alors on retourne tout

    # Sinon, on filtre la requete pour n'avoir que les couches autorisées

    # Nécessite jsonify car on retourne plusieur ligne
    return jsonify(VLayerListSchema(many=True).dump(layer_list))


@app.route('/api/ref_layer/<ref_layer_id>', methods=['GET'])
@valid_token_required
@check_authorization(['GET_REF_LAYER'])
def get_ref_layer_data(ref_layer_id):
    """ Fourni la données correspondant au ref_layer_id
    au format geojson

    Returns
    -------
        GEOJSON
    """

    # Controle que l'utilisateur est autorisé à consulter le layer demandé
    token  = request.cookies.get('token')
    
    # Récupération et contrôle de la liste des layer_id 
    # auquel l'utilisateur à les droits d'accès
    role = Role.query.filter(Role.role_token == token).one()
    authorization_constraints = role.get_authorization_constraints('GET_REF_LAYER')

    if authorization_constraints is not None:
        if int(ref_layer_id) not in authorization_constraints:
            return jsonify({
                        "status": "error",
                        "message": "[Erreur 403-2] - L'utilisateur ne possède pas l'autorisation de consulter la couche layer_id=" + str(ref_layer_id)
                    }), 403

    layer = Layer.query.get(ref_layer_id)
    layer_schema = LayerSchema().dump(layer)

    statement = text("""
        SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(feature)) AS geojson_layer 
        FROM (
            SELECT json_build_object(
                'type', 'Feature', 
                'geometry', ST_AsGeoJSON(st_transform(geom, 3857))::json, 
                'properties', json_object_delete_keys(to_json(row), 'geom'::text)) AS feature  
            FROM (select {} AS geom, {} from {}.{} t ) row
        ) features
    """.format(layer_schema["layer_geom_column"], ', '.join(layer_schema["layer_columns"]), layer_schema["layer_schema_name"], layer_schema["layer_table_name"]))

    try :
        with db_sig.connect() as conn:
            layer_datas = conn.execute(statement).fetchone()._asdict()
    except Exception as error:
        return jsonify({
            "status": "error",
            'message': """Erreur lors de la récupération de la couche de référence. 
                Veuillez contacter l'administrateur afin de contrôler la configuration de la couche {}.{} - {}
                """.format(layer_schema["layer_schema_name"], layer_schema["layer_table_name"], error)
        }), 404

    layer_datas['desc_layer'] = layer_schema
    return layer_datas

@app.route('/api/layer/get_statut_list', methods=['GET'])
@valid_token_required
@check_authorization(['GET_OBS_DATA'])
def get_status_list():
    """ Fourni la liste des statuts taxonomiques

    Returns
    -------
        JSON
    """    
    bibStatusType = BibStatusType.query.filter(BibStatusType.active == True).order_by(BibStatusType.status_type_label)
    
    statut_list = []
    for statut in bibStatusType:
        # On cast l'id car de l'autre côté select_pure ne prends que du texte
        statut_list.append({"label": statut.status_type_label, "value": str(statut.status_type_id)})
    
    return jsonify(statut_list)

@app.route('/api/layer/get_regne_list', methods=['GET'])
@valid_token_required
@check_authorization(['GET_OBS_DATA'])
def get_regne_list():
    """ Fourni la liste des groupes taxonomiques

    Returns
    -------
        JSON
    """    
    vRegneList = VRegneList.query.all()
    
    regne_list = []
    for regneList in vRegneList:
        regne_list.append({"label": regneList.group_label, "value": regneList.group_label})
    
    return jsonify(regne_list)

@app.route('/api/layer/get_group_taxo_list', methods=['GET'])
@valid_token_required
@check_authorization(['GET_OBS_DATA'])
def get_group_taxo_list():
    """ Fourni la liste des groupes taxonomiques

    Returns
    -------
        JSON
    """    
    vGroupTaxoList = VGroupTaxoList.query.all()
    
    group_taxo_list = []
    for groupTaxo in vGroupTaxoList:
        group_taxo_list.append({"label": groupTaxo.group_label, "value": groupTaxo.group_label})
    
    return jsonify(group_taxo_list)

@app.route('/api/layer/get_commune_list', methods=['GET'])
@valid_token_required
@check_authorization(['GET_OBS_DATA'])
def get_commune_list():
    """ Fourni la liste des communes

    Returns
    -------
        JSON
    """    
    CommuneList = BibCommune.query.order_by(BibCommune.nom_com).all()
    
    commune_list = []
    for commune in CommuneList:
        commune_list.append({"label": commune.nom_com, "value": commune.insee_com})
    
    return jsonify(commune_list)

@app.route('/api/layer/get_scale_list', methods=['GET'])
@valid_token_required
@check_authorization(['GET_OBS_DATA'])
def get_scale_list():
    """ Fourni la liste des echelles de restitution

    Returns
    -------
        JSON
    """    

    # La liste des echelle de restitution est limité 
    # aux echelles autorisées pour l'utilisateur
    token  = request.cookies.get('token')
    role = Role.query.filter(Role.role_token == token).one()
    authorization_constraints = role.get_authorization_constraints('GET_OBS_DATA')
    if authorization_constraints is not None:
        bibMeshScale = BibMeshScale.query.filter(BibMeshScale.active == True).filter(BibMeshScale.mesh_scale_id.in_(authorization_constraints)).order_by(BibMeshScale.mesh_scale_id)
    else :
        bibMeshScale = BibMeshScale.query.filter(BibMeshScale.active == True).order_by(BibMeshScale.mesh_scale_id)
    
    scale_list = []
    for meshScale in bibMeshScale:
        scale_list.append({"label": meshScale.mesh_scale_label, "value": meshScale.mesh_scale_id})
    
    return jsonify(scale_list)

@app.route('/api/taxons_autocomplete', methods=['GET'])
@valid_token_required
@check_authorization(['GET_OBS_DATA'])
def taxons_autocomplete():
    
    args = request.args
    search_name = args.get("search_name")
    limit = args.get("limit")

    response = requests.get(
        app.config['GEONATURE_URL'] + "/geonature/api/taxhub/api/taxref/allnamebylist/" + str(app.config['TAXHUB_LIST_ID']) + "?search_name=" + search_name + "&limit=" + limit
    )

    return response.content.decode('utf-8')


@app.route('/api/layer/get_group_statut_list', methods=['GET'])
@valid_token_required
@check_authorization(['GET_OBS_DATA'])
def get_group_statut_list():
    """ Fourni la liste des grope de statuts

    Returns
    -------
        JSON
    """    
    bibGroupStatus = BibGroupStatus.query.filter(BibGroupStatus.active == True)
    
    groupStatus_list = []
    for groupStatus in bibGroupStatus:
        groupStatus_list.append({"label": groupStatus.group_status_label, "value": groupStatus.group_status_id, "description": groupStatus.group_status_description})
    
    return jsonify(groupStatus_list)


def check_obs_form_data(postdata):
    """ Contrôle la validité des valeur des filtres 

    Returns
    -------
        array (tableau contenant la liste des erreur en json)
    """    

    # Controle des paramètres envoyés par le client 
    error = []

    # Controle de la iste des cd_nom
    for cd_nom in postdata["cd_nom_list"]:
        if not isinstance(cd_nom, int):
            message = "Erreur dans la liste de taxon (cd_nom <{}> incorrect)".format(cd_nom)
            error.append({
                "field": "cd_nom_list",
                "message": message
            })

    # controle de la valeur du filtre include_infra_taxon
    if not isinstance(postdata["include_infra_taxon"], bool):
        error.append({
            "field": "include_infra_taxon",
            "message": "Valeur incorrect, booléen attendu"
        })
        
    # controle de la liste des groupe taxonomique
    for regne in postdata["regne_list"]:
        if not isinstance(regne, str):
            error.append({
                "field": "regne_list",
                "message": "Valeur incorrect, Chaine de caractère attendu (correspondant au regne)"
            })

    # controle de la liste des groupe taxonomique
    for grp_taxon in postdata["grp_taxon_list"]:
        if not isinstance(grp_taxon, str):
            error.append({
                "field": "grp_taxon_list",
                "message": "Valeur incorrect, Chaine de caractère attendu (correspondant au group2_inpn)"
            })

    # Controle des dates
    datemin_is_valid = False
    if postdata["date_min"]:
        if not re.match("(\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))", postdata["date_min"]):
            error.append({
                "field": "date_min",
                "message": "Format date incorrect, yyyy-mm-dd attendu"
            })
        else :
            datemin_is_valid = True
            date_min = datetime(*[int(item) for item in postdata["date_min"].split('-')])
    

    datemax_is_valid = False
    if postdata["date_max"]:
        if not re.match("(\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))", postdata["date_max"]):
            error.append({
                "field": "date_max",
                "message": "Format date incorrect, yyyy-mm-dd attendu"
            })
        else :
            datemax_is_valid = True
            date_max = datetime(*[int(item) for item in postdata["date_max"].split('-')])

    if postdata["date_min"] and postdata["date_max"] and datemin_is_valid and datemax_is_valid:
        if date_min > date_max:
            error.append({
                "field": "date",
                "message": "Le champ date_min est supérieur à date_max"
            })

    # Controle des périodes
    if (postdata["periode_min"] and not postdata["periode_max"]) or (not postdata["periode_min"] and postdata["periode_max"]):
        # Ici, l'une des deux période n'est pas renseigné
        error.append({
            "field": "periode",
            "message": "Periode_min et periode_max doivent être renseigné"
        })
    elif postdata["periode_min"] and postdata["periode_max"] :
        # Ici, on a bien deux période de renseigné, on controle la syntaxe
        periode_min_is_valid = False
        if not re.match("((0[1-9]|[12]\d|3[01])/(0[1-9]|1[0-2]))", postdata["periode_min"]):
            error.append({
                "field": "periode_min",
                "message": "Format de la période incorrect, dd/mm attendu"
            })
        else:
            periode_min_is_valid = True

        periode_max_is_valid = False
        if not re.match("((0[1-9]|[12]\d|3[01])/(0[1-9]|1[0-2]))", postdata["periode_max"]):
            error.append({
                "field": "periode_max",
                "message": "Format de la période incorrect, dd/mm attendu"
            })
        else:
            periode_max_is_valid = True
        
        if periode_min_is_valid and periode_max_is_valid:
            # Ici, on a deux période avec une syntaxe correct, on contrôle que 
            # periode_min est bien inféreiru à période_max
            periode_min_day = postdata["periode_min"].split('/')[0]
            periode_min_month = postdata["periode_min"].split('/')[1]

            periode_max_day = postdata["periode_max"].split('/')[0]
            periode_max_month = postdata["periode_max"].split('/')[1]

            if periode_max_month < periode_min_month or (periode_max_month == periode_min_month and periode_max_day < periode_min_day) :
                # ici periode_max est supérieur à periode_min
                error.append({
                "field": "periode",
                "message": "Le champ periode_min est supérieur à periode_max"
            })

    # Controle de la liste des statuts
    for status in postdata["status_list"]:
        if not isinstance(status, int):
            message = "Erreur dans la liste des status : id_statut <{}> incorrect".format(status)
            error.append({
                "field": "status_list",
                "message": message
            })

    # Controle de la liste des groupes de statut
    for grp_status in postdata["grp_status_list"]:
        if not isinstance(grp_status, int):
            #print(grp_status)
            message = "Erreur dans la liste des groupe de statuts : id_grp_statut <{}> incorrect".format(grp_status)
            error.append({
                "field": "grp_status_list",
                "message": message
            })

    # Controle de la liste des communes
    for commune in postdata["commune_list"]:
        if not re.match("(\d{4})", commune):
            message = "Erreur dans la liste des commune : code insee <{}> incorrect".format(commune)
            error.append({
                "field": "commune_list",
                "message": message
            })

    # Controle des valeurs d'altitude
    altitude_min_is_valid = False
    if postdata["altitude_min"] is not None:
        if isinstance(postdata["altitude_min"], int):
            altitude_min_is_valid = True
        else :
            error.append({
                "field": "altitude_min",
                "message": "Valeur incorrect, entier attendu"
            })

    altitude_max_is_valid = False
    if postdata["altitude_max"] is not None:
        if isinstance(postdata["altitude_max"], int):
            altitude_max_is_valid = True
        else :
            error.append({
                "field": "altitude_max",
                "message": "Valeur incorrect, entier attendu"
            })
    
    if bool(postdata["altitude_min"]) and bool(postdata["altitude_max"]) and altitude_min_is_valid and altitude_max_is_valid:
        if postdata["altitude_min"] > postdata["altitude_max"]:
            error.append({
                "field": "altitude",
                "message": "Le champ altitude_min doit être inféreur ou égal à altitude_max"
            })

    # Controle du type de restitution
    if postdata["restitution"] is not None:
        if postdata["restitution"] not in ["rt", "po", "re"]:
            message = "Le type de restituion demandé <{}> n'est pas valide. Valeur attendu : 'rt' = Richesse taxonomique, 'po' = Pression d'observation, 're' = Répartition".format(postdata["restitution"])
            error.append({
                "field": "restitution",
                "message": message
            })
    else :
        error.append({
            "field": "restitution",
            "message": "Le type de restitution est obligatoire"
        })

    # Controle de l'echelle demandé
    if postdata["scale"] is not None:
        if not isinstance(postdata["altitude_max"], int):
            message = "L'echelle de restitution demandé <{}> est incorrect".format(postdata["scale"])
            error.append({
                "field": "scale",
                "message": message
            })
    else :
        error.append({
            "field": "scale",
            "message": "L'echelle de restitution est obligatoire"
        })

    return error

def build_obs_layer_from(postdata):
    """ Construit du FROM de la requête
    d'interogation des données d'observation

    Returns
    -------
        string
    """  
    query_from = """
        FROM
            app_carto.t_observations o
    """

    if postdata["scale"] != 999 :
        query_from += """
            LEFT JOIN app_carto.cor_observation_mesh com ON o.obs_id = com.obs_id
            LEFT JOIN app_carto.bib_mesh m ON com.mesh_id = m.mesh_id
        """

    if postdata["status_list"] or postdata["grp_status_list"]:
        query_from += """
	        LEFT JOIN app_carto.cor_observation_status cos ON o.obs_id = cos.obs_id
	        LEFT JOIN app_carto.bib_status_type bst ON cos.status_type_id = bst.status_type_id
        """

    if postdata["commune_list"]:
        query_from += """
	        LEFT JOIN app_carto.cor_observation_commune coc ON o.obs_id = coc.obs_id
        """

    return query_from

def build_obs_layer_where(postdata):
    """ Construit les clause where de la requête
    d'interogation des données d'observation

    Returns
    -------
        string
    """  
    # Construction du where
    if (postdata["scale"] != 999):
        query_where = """
            WHERE
                m.mesh_scale_id = {}
        """.format(postdata["scale"])
    else :
        query_where = """
            WHERE
                1 = 1
        """
    
    if postdata["cd_nom_list"]:
        query_where += """
            AND o.cd_ref in ({})
        """.format(', '.join(str(x) for x in postdata["cd_nom_list"]))

    if postdata["regne_list"]:
        query_where += """
            AND o.regne in ('{}')
        """.format("', '".join(postdata["regne_list"]))

    if postdata["grp_taxon_list"]:
        query_where += """
            AND o.group2_inpn in ('{}')
        """.format("', '".join(postdata["grp_taxon_list"]))
    
    if postdata["date_min"]:
        date_min = datetime(*[int(item) for item in postdata["date_min"].split('-')])

        query_where += """
            AND o.date_min > '{}'
        """.format(date_min.strftime("%Y-%m-%d"))

    if postdata["date_max"]:
        date_max = datetime(*[int(item) for item in postdata["date_max"].split('-')])

        query_where += """
            AND o.date_max < '{}'
        """.format(date_max.strftime("%Y-%m-%d"))

    if postdata["periode_min"]:
        periode_min_day = postdata["periode_min"].split('/')[0]
        periode_min_month = postdata["periode_min"].split('/')[1]

        if periode_min_day.startswith('0'):
            periode_min_day = periode_min_day[1:]

        if periode_min_month.startswith('0'):
            periode_min_month = periode_min_month[1:]

        query_where += """
            AND EXTRACT(DAY FROM o.date_min) >= {} AND EXTRACT(MONTH FROM o.date_min) >= {}
        """.format(periode_min_day, periode_min_month)

    if postdata["periode_max"]:
        periode_max_day = postdata["periode_max"].split('/')[0]
        periode_max_month = postdata["periode_max"].split('/')[1]

        if periode_max_day.startswith('0'):
            periode_max_day = periode_max_day[1:]

        if periode_max_month.startswith('0'):
            periode_max_month = periode_max_month[1:]

        query_where += """
            AND EXTRACT(DAY FROM o.date_max) <= {} AND EXTRACT(MONTH FROM o.date_max) <= {}
        """.format(int(periode_max_day), int(periode_max_month))

    if postdata["status_list"]:
        query_where += """
            AND cos.status_type_id in ({})
        """.format(', '.join(str(x) for x in postdata["status_list"]))

    if postdata["grp_status_list"]:
        query_where += """
            AND bst.group_status_id in ({})
        """.format(', '.join(str(x) for x in postdata["grp_status_list"]))

    if postdata["commune_list"]:
        query_where += """
            AND coc.insee_com in ('{}')
        """.format("', '".join(postdata["commune_list"]))

    if postdata["altitude_min"]:
        query_where += """
            AND o.altitude_min > {}
        """.format(postdata["altitude_min"])

    if postdata["altitude_max"]:
        query_where += """
            AND o.altitude_max > {}
        """.format(postdata["altitude_max"])

    return query_where


def build_obs_layer_query(postdata):
    """ Construit la requête SQL interrogeant les données
    d'observation en fonction du paramétrage du formulaire de requatage

    Returns
    -------
        JSON
    """  

    if postdata["scale"] == 999 :
        select_column = """ 
            row_number() over() AS row_id,
            '<div class="obs-layer-more-data-link" onclick="getMoreObsInfo(event, ''geom'', ''' || ST_AsText(o.geom) || ''')">Plus d''info</div>' AS "lien",
            o.geom
        """
    else :
        select_column = """ 
            row_number() over() AS row_id,
            '<div class="obs-layer-more-data-link" onclick="getMoreObsInfo(event, ''mesh_id'', ' || m.mesh_id || ')">Plus d''info</div>' AS "lien",
            m.geom
        """
        #select_column = """
        #    '<div class="obs-layer-more-data-link" filters="{}"  data_id_type="mesh_id" data_id="' || m.mesh_id || '">Plus d''info</div>' AS "lien",
        #    m.geom
        #""".format(json.dumps(postdata).replace("'", "''"))

    # Construction du select
    query_select = ""
    if postdata["restitution"] == "rt":
        query_select = """ 
            SELECT 
                {},
                count(DISTINCT COALESCE(o.cd_ref, 0)) AS nb_taxon
        """.format(select_column)

    if postdata["restitution"] == "po":
        query_select = """ 
            SELECT 
                {},
                count(DISTINCT o.obs_id) AS nb_observation
        """.format(select_column)

    if postdata["restitution"] == "re":
        query_select = """ 
            SELECT 
                {}
        """.format(select_column)

    # Construction du from
    query_from = build_obs_layer_from(postdata)

    # Construction du WHERE
    query_where = build_obs_layer_where(postdata)
    
    # construction du GROUP BY
    if postdata["scale"] == 999:
        query_groupby = """
            GROUP BY 
                o.geom
        """
    else :
        query_groupby = """
            GROUP BY 
                m.mesh_id, 
                m.geom
        """

    return query_select + query_from + query_where + query_groupby

def getObsLayerStyle(restituion_type, scale, query):
    """ Retourne un json correspondant au style 
    à appliquer en fonction de la requête (query)
    et du type de restitution (restituion_type)

    Returns
    -------
        JSON
    """    
    # cette requête permet de récupérer les bornes des classe
    if restituion_type == "re":
        # Pour la répartition, on applique un applat unique
        if scale == 999:
            # cas restitution brute
            style = [
                {
                    "style_type": "Polygon",
                    "styles": [{
                        "style_name": "Surfacique",
                        "fill_color": "rgba(0, 255, 81, 0.8)",
                        "stroke_color": "rgba(0, 0, 0, 1)",
                        "stroke_width": 1,
                        "stroke_linedash": []
                    }]
                },{
                    "style_type": "Line",
                    "styles": [{
                        "style_name": "Linéaire",
                        "stroke_color": "rgba(0, 255, 81, 1)",
                        "stroke_width": 2,
                        "stroke_linedash": []
                    }],
                }, {
                    "style_type": "Point",
                    "styles": [{
                        "style_name": "Point",
                        "fill_color": "rgba(0, 255, 81, 0.8)",
                        "stroke_color": "rgba(0, 0, 0, 1)",
                        "stroke_width": 1,
                        "stroke_linedash": [],
                        "radius": 5
                    }]
                }
            ]
        else :
            # cas restitution maille
            style = [{
                "style_type": "Polygon",
                "styles": [{
                    "style_name": "Zone de présence",
                    "fill_color": "rgba(0, 255, 81, 0.8)",
                    "stroke_color": "rgba(0, 0, 0, 1)",
                    "stroke_width": 1,
                    "stroke_linedash": []
                }]
            }]
    else:
        
        # pour les autres restitution, on créer 5 classes
        if restituion_type == "rt":
            style_field_filter = "nb_taxon"
            legend_alias = "taxons"
        elif restituion_type == "po": 
            style_field_filter = "nb_observation"
            legend_alias = "observations"

        # Construction de la requête identifiant les bornes à partir des données
        # retournées par la requête d'interrogation des données
        bornes_query = ""
        i = 0
        for borne in app.config['OBS_LAYER_CLASSIFICATION_BORNE']:
            if bornes_query:
                bornes_query += ","
            bornes_query += """
                percentile_disc({}) WITHIN GROUP (ORDER BY {}) as borne_{}""".format(float(borne), str(style_field_filter), str(i))
            i += 1

        style_query = """
            SELECT 
                {}
            FROM ({}) a
        """.format(bornes_query, query)
        
        with db_app.engine.connect() as conn:
            style_query_datas = conn.execute(text(style_query)).fetchone()._asdict()

        # On évite que les bornes soient identique
        i = 0
        for borne in app.config['OBS_LAYER_CLASSIFICATION_BORNE']:
            if i > 0:
                if style_query_datas["borne_" + str(i)] <= style_query_datas["borne_"+ str(i -1)]:
                    style_query_datas["borne_" + str(i)] = style_query_datas["borne_" + str(i -1)] + 1
            i += 1

        style = [{
            "style_type": "Polygon",
            "styles": []
        }]
        i = 0
        for borne in app.config['OBS_LAYER_CLASSIFICATION_BORNE']:
            # Création de la première classe
            if i == 0:
                if style_query_datas["borne_" + str(i)] == 1:
                    style_name = "1 taxon"
                else:
                    style_name = "De 1 à " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                
                tmp_style = {
                    "style_name": style_name,
                    "expression": "feature.get('" +style_field_filter + "') <= " + str(style_query_datas["borne_" + str(i)]),
                    "fill_color": app.config['OBS_LAYER_CLASS_COLOR'][i],
                    "stroke_color": "rgba(0, 0, 0, 1)",
                    "stroke_width": 1,
                    "stroke_linedash": []
                }
            
            #Création des classe "classique"
            if i > 0 :
                tmp_style = {
                    "style_name": "De " + str(style_query_datas["borne_" + str(i - 1)]) + " à " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                    "expression": "feature.get('" +style_field_filter + "') > " + str(style_query_datas["borne_" + str(i-1)]) + " && feature.get('" +style_field_filter + "') <= " + str(style_query_datas["borne_" + str(i)]),
                    "fill_color": app.config['OBS_LAYER_CLASS_COLOR'][i],
                    "stroke_color": "rgba(0, 0, 0, 1)",
                    "stroke_width": 1,
                    "stroke_linedash": []
                }

            style[0]["styles"].append(tmp_style)

            # Création de la dernière classe
            if i == len(app.config['OBS_LAYER_CLASSIFICATION_BORNE']) -1:
                tmp_style = {
                    "style_name": "Plus de " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                    "expression": "feature.get('" +style_field_filter + "') > " + str(style_query_datas["borne_" + str(i)]),
                    "fill_color": app.config['OBS_LAYER_CLASS_COLOR'][i + 1],
                    "stroke_color": "rgba(0, 0, 0, 1)",
                    "stroke_width": 1,
                    "stroke_linedash": []
                }
                style[0]["styles"].append(tmp_style)
            i += 1

        # Style dans le cas de la restitution brute
        if scale == 999:
            # Style point
            style_point = {
                "style_type": "Point",
                "styles": []
            }

            i = 0
            for borne in app.config['OBS_LAYER_CLASSIFICATION_BORNE']:
                # Création de la première classe
                if i == 0:
                    if style_query_datas["borne_" + str(i)] == 1:
                        style_name = "1 taxon"
                    else:
                        style_name = "De 1 à " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                    
                    tmp_style = {
                        "style_name": style_name,
                        "expression": "feature.get('" +style_field_filter + "') <= " + str(style_query_datas["borne_" + str(i)]),
                        "fill_color": app.config['OBS_LAYER_CLASS_COLOR'][i],
                        "stroke_color": "rgba(0, 0, 0, 1)",
                        "stroke_width": 1,
                        "stroke_linedash": []
                    }
                
                #Création des classe "classique"
                if i > 0 :
                    tmp_style = {
                        "style_name": "De " + str(style_query_datas["borne_" + str(i - 1)]) + " à " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                        "expression": "feature.get('" +style_field_filter + "') > " + str(style_query_datas["borne_" + str(i-1)]) + " && feature.get('" +style_field_filter + "') <= " + str(style_query_datas["borne_" + str(i)]),
                        "fill_color": app.config['OBS_LAYER_CLASS_COLOR'][i],
                        "stroke_color": "rgba(0, 0, 0, 1)",
                        "stroke_width": 1,
                        "stroke_linedash": []
                    }

                style_point["styles"].append(tmp_style)

                # Création de la dernière classe
                if i == len(app.config['OBS_LAYER_CLASSIFICATION_BORNE']) -1:
                    tmp_style = {
                        "style_name": "Plus de " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                        "expression": "feature.get('" +style_field_filter + "') > " + str(style_query_datas["borne_" + str(i)]),
                        "fill_color": app.config['OBS_LAYER_CLASS_COLOR'][i + 1],
                        "stroke_color": "rgba(0, 0, 0, 1)",
                        "stroke_width": 1,
                        "stroke_linedash": []
                    }
                    style_point["styles"].append(tmp_style)
                i += 1

            style.append(style_point)

            # Style Ligne
            style_line = {
                "style_type": "Line",
                "styles": []
            }

            i = 0
            for borne in app.config['OBS_LAYER_CLASSIFICATION_BORNE']:
                # Création de la première classe
                if i == 0:
                    if style_query_datas["borne_" + str(i)] == 1:
                        style_name = "1 taxon"
                    else:
                        style_name = "De 1 à " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                    
                    tmp_style = {
                        "style_name": style_name,
                        "expression": "feature.get('" +style_field_filter + "') <= " + str(style_query_datas["borne_" + str(i)]),
                        "stroke_color": app.config['OBS_LAYER_CLASS_COLOR'][i],
                        "stroke_width": 2,
                        "stroke_linedash": []
                    }
                
                #Création des classe "classique"
                if i > 0 :
                    tmp_style = {
                        "style_name": "De " + str(style_query_datas["borne_" + str(i - 1)]) + " à " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                        "expression": "feature.get('" +style_field_filter + "') > " + str(style_query_datas["borne_" + str(i-1)]) + " && feature.get('" +style_field_filter + "') <= " + str(style_query_datas["borne_" + str(i)]),
                        "stroke_color": app.config['OBS_LAYER_CLASS_COLOR'][i],
                        "stroke_width": 2,
                        "stroke_linedash": []
                    }

                style_line["styles"].append(tmp_style)

                # Création de la dernière classe
                if i == len(app.config['OBS_LAYER_CLASSIFICATION_BORNE']) -1:
                    tmp_style = {
                        "style_name": "Plus de " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                        "expression": "feature.get('" +style_field_filter + "') > " + str(style_query_datas["borne_" + str(i)]),
                        "stroke_color": app.config['OBS_LAYER_CLASS_COLOR'][i + 1],
                        "stroke_width": 2,
                        "stroke_linedash": []
                    }
                    style_line["styles"].append(tmp_style)
                i += 1

            style.append(style_line)

    return style

def builLayerLabel(postdata):

    if postdata["restitution"] == "rt":
        restitution = "Nombre de taxon"
    if postdata["restitution"] == "po":
        restitution = "Nombre d'observation"
    if postdata["restitution"] == "re":
        restitution = "Répartition"

    if postdata["scale"] == 999:
        return  restitution + " - " + "Données brutes"
    else :
        mesh_scale = BibMeshScale.query.get(postdata["scale"])
        return  restitution + " - " + mesh_scale.mesh_scale_label
    

@app.route('/api/layer/get_obs_layer_data', methods=['POST'])
@valid_token_required
@check_authorization(['GET_OBS_DATA'])
def get_obs_layer_data():
    """ Retourne une couche geojson des données d'observation
    en fonction des filtres paramétrés

    Returns
    -------
        GEOJSON
    """    
    postdata = request.json

    # Récupération et contrôle de la liste des mesh_scale_id 
    # auquel l'utilisateur à les droits d'accès
    token  = request.cookies.get('token')
    role = Role.query.filter(Role.role_token == token).one()
    authorization_constraints = role.get_authorization_constraints('GET_OBS_DATA')
    if authorization_constraints is not None:
        if int(postdata["scale"]) not in authorization_constraints:
            return jsonify({
                        "status": "error",
                        "message": "[Erreur 403-3] - L'utilisateur ne possède pas l'autorisation de consulter les données à l'echelle demandée= " + str(postdata["scale"])
                    }), 403

    # On cotrôle la validité des filtres
    error = check_obs_form_data(postdata)
    # S'il les données envoyées comportent un erreur, 
    # on retourne les erreurs avec un code http:400
    if error :
        return jsonify({
            'status': 'error',
            'message': error
        }), 400
    
    # Construction de la requête SQL
    query = build_obs_layer_query(postdata)

    #return query

    geojson_query = text("""SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(feature)) AS geojson_layer 
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature', 
                'geometry', ST_AsGeoJSON(st_transform(geom, 3857))::jsonb, 
                'properties', to_jsonb(row) - 'geom') AS feature  
            FROM ({}) row
        ) features""".format(query))

    # Execution de la requête récupérant le GeoJson
    with db_app.engine.connect() as conn:
        obs_layer_datas = conn.execute(geojson_query).fetchone()._asdict()

    # Récupération du style associé
    default_style = getObsLayerStyle(postdata["restitution"], postdata["scale"], query)

    layer_label = builLayerLabel(postdata)

    obs_layer_datas['desc_layer'] = {
        "layer_default_style": default_style,
        "layer_label": layer_label
    }

    return obs_layer_datas


@app.route('/api/layer/get_obs_object_detail', methods=['POST'])
@valid_token_required
@check_authorization(['GET_OBS_DATA', 'WARNING_CALCULATOR'])
def get_obs_object_detail():
    """ Retourne un json contenant des informations
    complémentaire pour les objets retourné par une 
    couche de données d'observation 

    Returns
    -------
        JSON
    """  
    postdata = request.json

    filters = postdata["filters"]

    query_select = """ 
            SELECT 
                o.regne,
                o.group2_inpn,
                coalesce(o.nom_valide, o.nom_cite) as nom_scientifique,
                o.nom_vern,
                TO_CHAR(min(o.date_min), 'dd/mm/yyyy') AS first_obs,
                TO_CHAR(max(o.date_max), 'dd/mm/yyyy') AS last_obs,
                min(o.altitude_min) AS altitude_min,
                max(o.altitude_max) AS altitude_max,
                string_agg(DISTINCT allbst.status_type_label, ' ; ' order by allbst.status_type_label) AS status,
                string_agg(DISTINCT list.obs, ' ; ' order by list.obs) AS observateurs,
                count(DISTINCT o.obs_id) AS nb_obs
        """

    query_from = """
        FROM
            app_carto.t_observations o
            LEFT JOIN app_carto.cor_observation_mesh com ON o.obs_id = com.obs_id
            LEFT JOIN app_carto.bib_mesh m ON com.mesh_id = m.mesh_id
            LEFT JOIN app_carto.cor_observation_status cos ON o.obs_id = cos.obs_id
            LEFT JOIN app_carto.bib_status_type bst ON cos.status_type_id = bst.status_type_id

            LEFT JOIN app_carto.cor_observation_status allcos ON o.obs_id = allcos.obs_id
            LEFT JOIN app_carto.bib_status_type allbst ON allcos.status_type_id = allbst.status_type_id

            LEFT JOIN app_carto.cor_observation_commune coc ON o.obs_id = coc.obs_id

	        CROSS JOIN LATERAL unnest(o.observateurs) as list(obs)
    """

    query_where = build_obs_layer_where(filters)
    if (postdata["data_id_type"] == "mesh_id"):
        query_where = query_where + """AND m.mesh_id={}""".format(postdata["data_id"])
    else :
        query_where = query_where + """AND ST_AsText(o.geom)='{}'""".format(postdata["data_id"])

    if (postdata["data_id_type"] == "mesh_id"):
        query_groupby = """
            GROUP BY 
                m.mesh_id,
        """
    else:
        query_groupby = """
            GROUP BY 
                o.geom,
        """

    query_groupby = query_groupby + """
        o.regne,
        o.group2_inpn,
        coalesce(o.nom_valide, o.nom_cite),
        o.nom_vern
    """

    query = query_select + query_from + query_where + query_groupby

    with db_app.engine.connect() as conn:
        datas = conn.execute(text(query)).all()

    result = []
    for data in datas:
        result.append(data._asdict())

    return jsonify(result)

@app.route('/api/get_warning_calculator_data', methods=['POST'])
@valid_token_required
@check_authorization(['WARNING_CALCULATOR'])
def get_warning_calculator_data():
    """ Retourne les données géographique pour couches 
    déclaré comme étant des couche à enjeux 
    Ainsi que la couche (précise) des données d'observation 
    des taxons dont leur statut est déclaré comme étant à enjeux

    Returns
    -------
        Array<GEOJSON>
    """

    geojson = request.json

    ##
    # Récupération des objets des couches déclaré d'enjeux
    # intersectant le geojson envoyé
    ##
    warning_layers = Layer.query.filter(Layer.layer_is_warning == True)

    warning_result_layers = []
    for warning_layer in warning_layers:

        warning_layer_schema = LayerSchema().dump(warning_layer)
        
        statement = text("""
            SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(feature)) AS geojson_layer 
            FROM (
                WITH data AS (
                    SELECT '{}'::json AS fc
                ),            
                geom AS(
                    SELECT
                        ST_Transform(ST_SetSRID(ST_Union(ST_GeomFromGeoJSON(feat->>'geometry')), 3857), {}) AS geom
                    FROM (
                        SELECT 
                            json_array_elements(fc->'features') AS feat
                        FROM 
                            data
                    ) a
                )
                SELECT json_build_object(
                    'type', 'Feature', 
                    'geometry', ST_AsGeoJSON(st_transform(geom, 3857))::json, 
                    'properties', json_object_delete_keys(to_json(row), 'geom')) AS feature  
                FROM (
                    SELECT t.{} AS geom, {} 
                    FROM {}.{} t 
                    INNER JOIN geom g ON ST_Intersects(t.geom, g.geom)
                ) row
            ) features
        """.format(json.dumps(geojson), app.config['SRID'], warning_layer_schema["layer_geom_column"], ', '.join(warning_layer_schema["layer_columns"]), warning_layer_schema["layer_schema_name"], warning_layer_schema["layer_table_name"]))

        with db_sig.connect() as conn:
            layer_datas = conn.execute(statement).fetchone()._asdict()

        # On ajoute uniquement les résultats non vide !
        if layer_datas['geojson_layer']['features']:
            layer_datas['desc_layer'] = warning_layer_schema
            warning_result_layers.append(layer_datas)


    ##
    # Récupération des observation à enjeux
    # intersectant le geojson envoyé
    ##
    obs_query = text("""SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(feature)) AS geojson_layer 
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature', 
                'geometry', ST_AsGeoJSON(st_transform(geom, 3857))::jsonb, 
                'properties', to_jsonb(row) - 'geom') AS feature  
            FROM (
                WITH data AS (
                    SELECT '{}'::json AS fc
                ),            
                geom AS(
                    SELECT
                        ST_Transform(ST_SetSRID(ST_Union(ST_GeomFromGeoJSON(feat->>'geometry')), 3857), {}) AS geom
                    FROM (
                        SELECT 
                            json_array_elements(fc->'features') AS feat
                        FROM 
                            data
                    ) a
                )
                SELECT DISTINCT
                    o.obs_id, 
                    o.observateurs,
                    o.geom,
                    o.cd_ref, 
                    o.regne, 
                    o.group2_inpn, 
                    o.nom_valide, 
                    o.nom_vern, 
                    to_char(date_min, 'DD-MM-YYYY') AS date_min,
                    to_char(date_max, 'DD-MM-YYYY') AS date_max,
                    string_agg(DISTINCT
                        CASE
                            WHEN st_desc.group_status_id = 1 THEN st.status_type_label
                        END
                    , ' ; ') AS statut_protection,
                    string_agg(DISTINCT
                        CASE
                            WHEN st_desc.group_status_id in (2, 3) THEN st.status_type_label
                        END
                    , ' ; ') AS statut_liste_rouge,
                    string_agg(DISTINCT
                        CASE
                            WHEN st_desc.group_status_id in (5) THEN 'Oui'
                            ELSE 'Non'
                        END
                    , ' ; ') AS statut_reglementaire,
                    string_agg(DISTINCT
                        CASE
                            WHEN st_desc.group_status_id in (6) THEN st.status_type_label
                        END
                    , ' ; ') AS statut_directive_habitat

                FROM
                    app_carto.t_observations o
                    INNER JOIN geom g ON ST_Intersects(o.geom, g.geom)
                    LEFT JOIN app_carto.cor_observation_status cos USING(obs_id)
                    LEFT JOIN app_carto.bib_status_type st USING(status_type_id)
                    LEFT JOIN app_carto.bib_group_status gs USING(group_status_id)
                    LEFT JOIN app_carto.bib_status_type st_desc ON cos.status_type_id = st_desc.status_type_id
                WHERE
                    gs.group_status_is_warning = TRUE
                GROUP BY
                    o.obs_id, 
                    o.observateurs,
                    o.geom,
                    o.cd_ref, 
                    o.regne, 
                    o.group2_inpn, 
                    o.nom_valide, 
                    o.nom_vern, 
                    date_min,
                    date_max
            ) row
        ) features""".format(json.dumps(geojson), app.config['SRID']))


    # Execution de la requête récupérant le GeoJson
    with db_app.engine.connect() as conn:
        obs_layer_datas = conn.execute(obs_query).fetchone()._asdict()

    if obs_layer_datas['geojson_layer']['features']:
        # Récupération du style de type "répartition"
        default_style = [
            {
                "style_type": "Polygon",
                "styles": [{
                    "style_name": "Surfacique",
                    "filter": "",
                    "fill_color": "rgba(0, 255, 81, 0.5)",
                    "stroke_color": "rgba(0, 0, 0, 1)",
                    "stroke_width": 1,
                    "stroke_linedash": []
                }]
            },{
                "style_type": "Line",
                "styles": [{
                    "style_name": "Linéaire",
                    "filter": "",
                    "stroke_color": "rgba(0, 255, 81, 1)",
                    "stroke_width": 2,
                    "stroke_linedash": []
                }],
            }, {
                "style_type": "Point",
                "styles": [{
                    "style_name": "Point",
                    "filter": "",
                    "fill_color": "rgba(0, 255, 81, 0.5)",
                    "stroke_color": "rgba(0, 0, 0, 1)",
                    "stroke_width": 1,
                    "stroke_linedash": [],
                    "radius": 5
                }]
            }
        ]

        layer_label = "Observation d'espèces à enjeux"

        obs_layer_datas['desc_layer'] = {
            "layer_default_style": default_style,
            "layer_label": layer_label
        }

        warning_result_layers.append(obs_layer_datas)

    # On retourne l'ensemble des couche à enjeux
    return json.dumps(warning_result_layers)

@app.route('/api/toponyme_autocomplete', methods=['GET'])
def toponyme_autocomplete():
    """ Autocomplétion de la recherche d'un toponyme

    Returns
    -------
        JSON
    """

    search_name = request.args.get("search_name", "").replace(" ", "%")#.replace("'", "''")
    search_name_for_similarity = request.args.get("search_name", "")#.replace("'", "''")

    limit = request.args.get("limit", 20)

    statement = text("""
        SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(feature)) AS geojson_layer 
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature', 
                'geometry', ST_AsGeoJSON(geom)::jsonb, 
                'properties', to_jsonb(row) - 'geom') AS feature  
            FROM (
                SELECT 
                    toponyme_nom, 
                    toponyme_type,
                    toponyme_precision_geo,
                    ST_Extent(st_transform(ST_Buffer(geom, 1), 3857)) AS geom 
                FROM app_carto.bib_toponyme t
                WHERE 
                    toponyme_nom ilike :search_name
                GROUP BY
                    toponyme_nom, toponyme_type, toponyme_precision_geo, geom
                ORDER BY
	                similarity(toponyme_nom, :search_name_for_similarity) desc
                LIMIT :limit
                 ) row
        ) features
    """)
                     
    params = {
        "search_name": '%' + search_name + '%',
        "search_name_for_similarity": search_name_for_similarity,
        "limit": limit
    }

    with db_app.engine.connect() as conn:
        toponyme_datas = conn.execute(statement, params).fetchone()._asdict()

    return json.dumps(toponyme_datas)

@app.route('/api/warning_calculator/get_layers_list', methods=['GET'])
@check_authorization(['WARNING_CALCULATOR'])
def get_warning_calculator_layers_list():
    """ Retourne la liste des couche utilisé pour la calcul des enjeux
        Ainsi que la liste des statuts d'espèce retenue

    Returns
    -------
        JSON
    """
    layer_list = LayerSchema(many=True).dump(Layer.query.filter(Layer.layer_is_warning == True))
    status_list = BibGroupStatusSchema(many=True).dump(BibGroupStatus.query.filter(BibGroupStatus.group_status_is_warning == True))

    return {"layers": layer_list, "status": status_list}

def to_geojson(files, layer_in_file = None):
    # On recherche le fichier "maitre" shp pour les shapefile ou tab pour les ficheir mapinfo par exemple
    for file in files:
        normalized_filename = file.filename.replace(" ", "_")
        file.save(os.path.join(app.root_path, "static/tmp_upload/", normalized_filename))
        # On en profite pour récupérer le nom du fichier devant être trasformé (ex .shp pour le shapfile)
        if normalized_filename.split('.')[1].lower() in ['shp', 'gpkg', 'tab', 'geojson', 'json', 'kmz', 'kml', 'gpx']:
            filename = normalized_filename.split('.')[0]
            extension = normalized_filename.split('.')[1]

    # Création de la commande ogr2ogr en fonction des données d'entrées
    srs_path = os.path.join(app.root_path, "static/tmp_upload/", filename + "." + extension)
    dst_path = os.path.join(app.root_path, "static/tmp_upload/", filename + ".geojson")
    
    if extension.lower() in ['geojson', 'json'] :
        # Dans le cas d'un geojson, on renome le fichier pour pouvoir le reprojeter
        # en effet, ogr2ogr n'est pas en capacité d'écraser un fichier
        shutil.move(srs_path, os.path.join(app.root_path, "static/tmp_upload/", "tmp_" + filename + "." + extension))
        srs_path = os.path.join(app.root_path, "static/tmp_upload/", "tmp_" + filename + "." + extension)
    
    # Si un nom de couche est spécifié alors on n'extrait que la couche cité (cas pour GPX et GPKG)
    if layer_in_file:
        command = "ogr2ogr -f GeoJSON -t_srs EPSG:3857 -nln data \"" + dst_path + "\" \"" + srs_path + "\" \"" + layer_in_file + "\""
        os.system(command, )
    else :
        command = "ogr2ogr -f GeoJSON -t_srs EPSG:3857 -nln data \"" + dst_path + "\" \"" + srs_path + "\""
        os.system(command, )

    # On récupère le contenu du fichier GeoJson généré dans une variable
    with open(dst_path) as json_file:
        geojson = json.load(json_file)

    ## Supresion des fichier temporaire
    os.remove(os.path.join(dst_path))
    os.remove(os.path.join(srs_path))

    return geojson

@app.route('/api/upload_geodata', methods=['POST'])
@valid_token_required
@check_authorization(['IMPORT'])
def upload_geodata():
    """ Enregistre la données temporairement, la transforme en GeoJson 
        Et l'enregistre en base de données

    Returns
    -------
        Identifiant de la couche ajouté en BDD
    """

    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520

    # Récupération des fichiers et stockage temporaire dans le dossier "static/tmp_upload/"
    files = request.files.getlist("files[]")
    layer_in_file = request.form["layer_in_file"]

    geojson = to_geojson(files, layer_in_file)

    importedLayer =  ImportedLayer(
        None,
        role.role_id,
        role,
        request.form["layername"],
        geojson,
        datetime.now(),
        datetime.now()
    ) 

    db_app.session.add(importedLayer)
    db_app.session.commit() 

    # Supression des données temporaires
    # fichier(s) importé(s)
#    for file in files:
#        normalized_filename = file.filename.replace(" ", "_")
#        extension = normalized_filename.split('.')[1]
#        if extension.lower() in ['geojson', 'json'] :
#            # Cas particulier pour les GeoJson
#            os.remove(os.path.join(app.root_path, "static/tmp_upload/", "tmp_" + file.filename))
#        else :
#            os.remove(os.path.join(app.root_path, "static/tmp_upload/", file.filename))

    return jsonify(importedLayer.imported_layer_id)

@app.route('/api/translate_to_geojson', methods=['POST'])
@valid_token_required
@check_authorization(['WARNING_CALCULATOR'])
def translate_to_geojson():
    """ Convertie des données SIG en GeoJson
    Utilisé notament dans le cas de l'import d'une couche comme 
    périmètre pour le calcul des enjeux.

    Returns
    -------
        Identifiant de la couche ajouté en BDD
    """

    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520

    # Récupération des fichiers et stockage temporaire dans le dossier "static/tmp_upload/"
    files = request.files.getlist("files[]")
    layer_in_file = request.form["layer_in_file"]

    return to_geojson(files,layer_in_file)

@app.route('/api/imported_layer/<ref_layer_id>', methods=['GET', 'DELETE'])
@valid_token_required
@check_authorization(['IMPORT'])
def get_imported_layer(ref_layer_id):
    """ Récupère ou supprime la couche de données

    Returns
    -------
        GeoJson
    """

    imported_layer = ImportedLayer.query.get(ref_layer_id)

    # demande d'une couche importée
    if request.method == 'GET':
        
        result = {
            "geojson_layer": imported_layer.imported_layer_geojson,
            "desc_layer": {
                "layer_default_style": None,
                "layer_label": imported_layer.imported_layer_name,
                "layer_attribution": imported_layer.role.role_nom + " " + imported_layer.role.role_prenom,
                "layer_id": imported_layer.imported_layer_id
            }
        }

        imported_layer.imported_layer_last_view = datetime.now()
    
    # Suppression dune couche importée
    if request.method == 'DELETE':
        db_app.session.delete(imported_layer)
        result = {"delete": True}

    db_app.session.commit()
    return result



@app.route('/api/imported_layer/get_layers_list', methods=['GET'])
@valid_token_required
@check_authorization(['IMPORT'])
def get_imported_layers_list():
    """ Fourni la liste des couches de données
    importé par l'utilisateur courant

    Returns
    -------
        JSON
    """    
    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520

    myImportedLayer = db_app.session.query(
        ImportedLayer.imported_layer_id,
        ImportedLayer.imported_layer_name,
        ImportedLayer.imported_layer_import_date,
        ImportedLayer.imported_layer_last_view
    ).filter_by(role_id=role.role_id).order_by(ImportedLayer.imported_layer_name, ImportedLayer.imported_layer_import_date)

    return jsonify(ImportedLayerSchema(many=True).dump(myImportedLayer))


# Fonction permettant de produire la requête (texte) récupérant la structure 
# d'une table
def get_column_definition(layer_schema):

    layer_schema_name = layer_schema["layer_schema_name"]
    layer_table_name = layer_schema["layer_table_name"]

    layer_media_fields = '{' + '}'
    if layer_schema["layer_media_fields"] is not None:
        layer_media_fields = '{'+','.join(layer_schema["layer_media_fields"])+'}'

    statement = text("""
        WITH geom_column_info AS (
            SELECT 
                pg_namespace.nspname AS table_schema,
                pg_class.relname AS table_name,
                pg_attribute.attname AS column_name,
                format_type(atttypid, atttypmod) AS geom_type--, * 
            FROM 
                pg_catalog.pg_attribute 
                INNER JOIN pg_catalog.pg_class ON pg_class.oid = pg_attribute.attrelid
                INNER JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace	
            WHERE
                format_type(atttypid, atttypmod) like 'geometry%'
        )
        SELECT
            c.table_schema,
            c.table_name,
            c.column_name,
            CASE 
                WHEN c.data_type = 'USER-DEFINED' THEN gci.geom_type
                WHEN c.column_name = ANY (:layer_media_fields) THEN 'media' -- On surcharge le type si le nom du champ est cité comme champ "média"
                WHEN c.data_type in ('smallint', 'integer', 'bigint') THEN 'integer'
                WHEN c.data_type in ('decimal', 'numeric', 'real', 'double precision') THEN 'float'
                WHEN c.data_type in ('character varying', 'varchar') THEN 'varchar'
				WHEN c.data_type = 'ARRAY' AND c.udt_name = '_varchar' THEN 'varchar[]'
                ELSE c.data_type
            END AS data_type,
            c.character_maximum_length,
            c.is_nullable,
            ccu.constraint_name,
            tc.constraint_type,
			CASE 
                WHEN cc.check_clause not like '%ANY%' and c.data_type != 'ARRAY' THEN
                    replace(cc.check_clause, '::' || c.data_type, '')
                ELSE NULL
            END AS constraint,            
            CASE 
				/* cas d'une clause CHECK avec une liste de valeur */
                WHEN cc.check_clause like '%ANY%' THEN
                    to_json((eval('select' || left(split_part(cc.check_clause, ' ANY ', 2), -2)))::varchar[])
				/* Cas des varchar[] avec contrôle des valeurs */
				WHEN c.data_type = 'ARRAY' AND c.udt_name = '_varchar' THEN
					to_json(
                        string_to_array(
                            regexp_replace(
                                regexp_replace(
                                    substring(
                                        cc.check_clause
                                        FROM 'ARRAY\[(.*?)\]'
                                    ),
                                    '''::[a-z ]+',
                                    '',
                                    'g'
                                ),
                                '''',
                                '',
                                'g'
                            ),
                            ', '
                        )
                    )
                ELSE NULL
            END AS l_values,
            CASE 
                WHEN c.data_type in ('character varying', 'varchar') 
					THEN substr(replace(c.column_default, '::' || c.data_type, ''), 2, length(replace(c.column_default, '::' || c.data_type, '')) - 2)
                ELSE replace(c.column_default, '::' || c.data_type, '') 
            END AS default_value
        FROM
            information_schema.columns c 	
            LEFT JOIN information_schema.constraint_column_usage ccu ON 
                c.table_catalog = ccu.table_catalog 
                AND c.table_schema = ccu.table_schema
                AND c.table_name = ccu.table_name
                AND c.column_name = ccu.column_name
            LEFT JOIN information_schema.table_constraints tc ON
                c.table_catalog = tc.table_catalog
                AND c.table_schema = tc.table_schema
                AND c.table_name = tc.table_name
                AND ccu.constraint_name = tc.constraint_name
            LEFT JOIN information_schema.check_constraints cc ON
                tc.constraint_catalog = cc.constraint_catalog 
                AND tc.constraint_schema = cc.constraint_schema
                AND tc.constraint_name = cc.constraint_name 
            LEFT JOIN geom_column_info gci ON 
                c.table_schema = gci.table_schema
                AND c.table_name = gci.table_name
                AND c.column_name = gci.column_name
        WHERE
            c.table_schema = :layer_schema_name
            and c.table_name = :layer_table_name;
    """)

    params = {
        "layer_media_fields": layer_media_fields,
        "layer_schema_name": layer_schema_name,
        "layer_table_name": layer_table_name
    }

    try :
        with db_sig.connect() as conn:
            columns = conn.execute(statement, params).fetchall()               
        return columns
    except Exception as error:
        return jsonify({
            "status": "error",
            'message': """Erreur lors de la récupération de la définition d'une couche. 
                Veuillez contacter l'administrateur afin de contrôler la configuration de la couche {}.{} - {}
                """.format(layer_schema_name, layer_table_name, error)
        }), 404

# Fonction retournant le formulaire html adapté pour ajouter une données à la table <layer_id>
@app.route('/api/get_feature_form_for_layer/<layer_id>', methods=['GET'])
@valid_token_required
@check_authorization(['GET_REF_LAYER', 'EDIT_REF_LAYER'])
def get_feature_form_for_layer(layer_id):

    # Récupération et contrôle de la liste des layer_id 
    # auquel l'utilisateur à les droits d'accès
    token  = request.cookies.get('token')
    role = Role.query.filter(Role.role_token == token).one()
    authorization_constraints = role.get_authorization_constraints('EDIT_REF_LAYER')
    if authorization_constraints is not None:
        if int(layer_id) not in authorization_constraints:
            return jsonify({
                        "status": "error",
                        "message": "[Erreur 403-4] - L'utilisateur ne possède pas l'autorisation de modification sur la couche layer_id=" + str(layer_id)
                    }), 403

    layer = Layer.query.get(layer_id)
    layer_schema = LayerSchema().dump(layer)

    tmp_layer_defintion = get_column_definition(layer_schema)

    layer_definition = []
    for data in tmp_layer_defintion:
        layer_definition.append(data._asdict())

    return render_template('add_form_data.html', layer_definition=layer_definition)
    #return jsonify(result)

@app.route('/api/add_features_for_layer/<layer_id>', methods=['POST'])
@valid_token_required
@check_authorization(['GET_REF_LAYER', 'EDIT_REF_LAYER'])
def add_features_for_layer(layer_id):
    """ Ecrit les données dans la table correspondant à layer id
    puis retourne les données tel qu'elles ont été enregistrées
    Returns
    -------
        Array<GEOJSON>
    """

    # Récupération et contrôle de la liste des layer_id 
    # auquel l'utilisateur à les droits d'accès
    token  = request.cookies.get('token')
    role = Role.query.filter(Role.role_token == token).one()
    authorization_constraints = role.get_authorization_constraints('EDIT_REF_LAYER')
    if authorization_constraints is not None:
        if int(layer_id) not in authorization_constraints:
            return jsonify({
                        "status": "error",
                        "message": "[Erreur 403-4] - L'utilisateur ne possède pas l'autorisation de modification sur la couche layer_id=" + str(layer_id)
                    }), 403

    feature_data = request.json

    layer = Layer.query.get(layer_id)
    layer_schema = LayerSchema().dump(layer)

    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520

    layer_definition = get_column_definition(layer_schema)

    primary_key = get_primary_key_of_layer(layer_schema["layer_schema_name"], layer_schema["layer_table_name"])

    # Création de la requête d'insertion
    column_names = []
    values = []
    for column in layer_definition:

        #column_name = column["column_name"]
        column_name = column.column_name
        column_names.append(column_name)

        value = feature_data[column_name]
        # On adapte le valeur en fonction de leur type
        if value is not None :
            if column.data_type in ['varchar', 'text', 'date', 'timestamp without time zone', 'time without time zone']:
                value = "'" + value.replace("'", "''") + "'"
            if column.data_type in ['uuid']:
                value = value + "::uuid"
            if column.data_type.startswith("geometry"):
                srid = column.data_type.split(",")[1].replace(")","")
                value = "ST_Transform(ST_GeomFromText('" + value + "', 3857), " + srid + ")"
            if column.data_type in ['varchar[]']:
                value = '\'{' + ','.join(value) + '}\''
            if column.data_type in ['media']:

                dest_dir = os.path.join(app.config['UPLOAD_FOLDER'],layer_schema["layer_schema_name"], layer_schema["layer_table_name"])
                if not os.path.exists(dest_dir):
                    os.makedirs(dest_dir)  

                # Contrôle qu'il n'y a pas déjà un fichier avec le même nom dans le dossier de destination
                filename = value
                i = 0
                file_exists = os.path.exists(os.path.join(dest_dir, filename))
                while (file_exists == True ):
                    # si c'est le cas, on ajoute un '_x' (ex: DSC_0254_1.jpg)
                    filename_arr = filename.split(".")
                    file_ext = filename_arr[len(filename_arr) - 1]

                    if (filename.endswith('_' + str(i-1) + '.' + file_ext)) :
                        filename = filename.replace('_' + str(i-1) + '.' + file_ext, '_' + str(i) + '.' + file_ext)
                    else :
                        tmp_filename = ''.join(filename_arr[0:-1])
                        filename = tmp_filename + '_' + str(i) + '.' + file_ext

                    file_exists = os.path.exists(os.path.join(dest_dir, filename))
                    i = i + 1
                
                shutil.move(os.path.join(app.config['TMP_UPLOAD_FOLDER'], value), os.path.join(dest_dir, filename))
                url = app.config['APP_URL'] + "/static/media/" + layer_schema["layer_schema_name"] + "/" + layer_schema["layer_table_name"] + "/" + filename
                value = "'<a href=\"" + url + "\" target=\"_blank\">" + filename + "</a>'"
        else :
            value = 'NULL'

        values.append(value)
    
    insert_statement = """
        INSERT INTO {}.{} ({}) VALUES ({}) RETURNING {}
    """.format(
        layer_schema["layer_schema_name"], 
        layer_schema["layer_table_name"],
        ", ".join(column_names),
        ", ".join(map(str, values)),
        primary_key["attname"]
    )

    try :
        with db_sig.connect() as conn:
            inserted_data_id = conn.execute(text(insert_statement)).fetchone()._asdict()
            conn.commit()
    except Exception as error:
        return jsonify({
            "status": "error",
            'message': """Erreur lors de l'écriture de la données en base' 
                Veuillez contacter l'administrateur afin de contrôler la configuration de la couche {}.{} - {}
                """.format(layer_schema["layer_schema_name"], layer_schema["layer_table_name"], error)
        }), 404

    inserted_data_statement = """
        SELECT * FROM {}.{}
        WHERE {} = {}
    """.format(
        layer_schema["layer_schema_name"], 
        layer_schema["layer_table_name"],
        primary_key["attname"],
        inserted_data_id[primary_key["attname"]]
    )

    with db_sig.connect() as conn:
        inserted_data = conn.execute(text(inserted_data_statement)).fetchone()._asdict()

    logs = Logs(
        log_id = None,
        log_date = None,
        log_type = "Layer edition - INSERT",
        role_id = role.role_id,
        role = role,
        log_data = {
            "layer_id" : layer_id,
            "layer_schema_name" : layer_schema["layer_schema_name"],
            "layer_table_name" : layer_schema["layer_table_name"],
            "inserted_data" : json.loads(json.dumps(inserted_data, default=str))
        }
    )
    db_app.session.add(logs)
    db_app.session.commit()

    return jsonify(True)

# Donne la clé primaire pour la table renseigné en paramètre
def get_primary_key_of_layer(layer_schema_name, layer_table_name):
    get_primary_key_column_statement = """
        SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type
        FROM   pg_index i
        JOIN   pg_attribute a ON a.attrelid = i.indrelid
                            AND a.attnum = ANY(i.indkey)
        WHERE  i.indrelid = '{}.{}'::regclass
        AND    i.indisprimary;
    """.format(layer_schema_name, layer_table_name)

    

    try :
        with db_sig.connect() as conn:
            primary_key_column = conn.execute(text(get_primary_key_column_statement)).fetchall()#._asdict()
    except Exception as error:
        app.logger.info(error)

        return jsonify({
            "status": "error",
            'message': """Erreur lors de la récupération de la clés primaire pour la table {}.{}
                """.format(layer_schema_name, layer_table_name)
        }), 404

    primary_key = []
    for data in primary_key_column:
        primary_key.append(data._asdict())

    return primary_key[0] # Exemple : { 'attname': 'id', 'data_type': 'integer'}

@app.route('/api/update_features_for_layer/<layer_id>', methods=['POST'])
@valid_token_required
@check_authorization(['GET_REF_LAYER', 'EDIT_REF_LAYER'])
def update_features_for_layer(layer_id):
    """ Ecrit les données dans la table correspondant à layer id
    puis retourn les données tel qu'elles ont été enregistrées
    Returns
    -------
        Array<GEOJSON>
    """

    # Récupération et contrôle de la liste des layer_id 
    # auquel l'utilisateur à les droits d'accès
    token  = request.cookies.get('token')
    role = Role.query.filter(Role.role_token == token).one()
    authorization_constraints = role.get_authorization_constraints('EDIT_REF_LAYER')
    if authorization_constraints is not None:
        if int(layer_id) not in authorization_constraints:
            return jsonify({
                        "status": "error",
                        "message": "[Erreur 403-4] - L'utilisateur ne possède pas l'autorisation de modification sur la couche layer_id=" + str(layer_id)
                    }), 403

    feature_data = request.json

    layer = Layer.query.get(layer_id)
    layer_schema = LayerSchema().dump(layer)

    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520

    layer_definition = get_column_definition(layer_schema)

    primary_key = get_primary_key_of_layer(layer_schema["layer_schema_name"], layer_schema["layer_table_name"])
    
    # Récupération des valeurs actuelle (pour log)
    previous_data_statement = """
        SELECT * FROM {}.{}
        WHERE {} = {}
    """.format(
        layer_schema["layer_schema_name"], 
        layer_schema["layer_table_name"],
        primary_key["attname"],
        feature_data[primary_key["attname"]]
    )
    with db_sig.connect() as conn:
        previous_data = conn.execute(text(previous_data_statement)).fetchone()._asdict()

    update_statement = """
        UPDATE {}.{} 
        SET
    """.format(layer_schema["layer_schema_name"], layer_schema["layer_table_name"])

    # Création de la requête d'insertion
    
    first = True
    for column in layer_definition:
        if first != True:
            update_statement = update_statement + ""","""
        
        column_name = column.column_name

        value = feature_data[column_name]
        # On adapte le valeur en fonction de leur type
        if column_name != primary_key["attname"] :
            if value is not None :
                if column.data_type in ['varchar', 'text', 'date', 'timestamp without time zone', 'time without time zone']:
                    value = "'" + value.replace("'", "''") + "'"
                if column.data_type in ['uuid']:
                    value = "'" + value + "'" + "::uuid"
                if column.data_type.startswith("geometry"):
                    srid = column.data_type.split(",")[1].replace(")","")
                    value = "ST_Transform(ST_GeomFromText('" + value + "', 3857), " + srid + ")"
                if column.data_type in ['varchar[]']:
                    value = '\'{' + ','.join(value) + '}\''
                if column.data_type in ['media']:

                    dest_dir = os.path.join(app.config['UPLOAD_FOLDER'],layer_schema["layer_schema_name"], layer_schema["layer_table_name"])
                    if not os.path.exists(dest_dir):
                        os.makedirs(dest_dir) 
                        
                    # Vérification de la présence du fichier dans le dossier temporaire
                    # S'il n'existe pas c'est qu'il n'y a pas de changement
                    filename = value
                    if os.path.exists(os.path.join(app.config['TMP_UPLOAD_FOLDER'], filename)) == True:
                        # Ici, il y a bien le fichier dans le dossier temporaire
                        
                        # Un fichier était-il déjà renseigné en base ?
                        if previous_data[column_name] is not None:
                            # Récupération de l'ancien nom du fichier
                            tmp_previous_filename = previous_data[column_name].split(">")
                            if len(tmp_previous_filename) > 0 :
                                previous_file_name = tmp_previous_filename[1].replace("</a", "")
                            
                            # Suppression de l'ancien fichier si il existe sur le serveur
                            if os.path.exists(os.path.join(dest_dir, previous_file_name)) :
                                os.remove(os.path.join(dest_dir, previous_file_name)) 
                            
                        # puis on copie le fichier qui est dans le dossier temporaire
                        if os.path.exists(os.path.join(app.config['TMP_UPLOAD_FOLDER'], filename)) :
                            # Contrôle qu'il n'y a pas déjà un fichier avec le même nom
                            i = 0
                            file_exists = os.path.exists(os.path.join(dest_dir, filename))
                            while (file_exists == True ):
                                # si c'est le cas, on ajoute un '_x' (ex: DSC_0254_1.jpg)
                                filename_arr = filename.split(".")
                                file_ext = filename_arr[len(filename_arr) - 1]

                                if (filename.endswith('_' + str(i-1) + '.' + file_ext)) :
                                    filename = filename.replace('_' + str(i-1) + '.' + file_ext, '_' + str(i) + '.' + file_ext)
                                else :
                                    tmp_filename = ''.join(filename_arr[0:-1])
                                    filename = tmp_filename + '_' + str(i) + '.' + file_ext

                                file_exists = os.path.exists(os.path.join(dest_dir, filename))
                                i = i + 1

                            shutil.move(os.path.join(app.config['TMP_UPLOAD_FOLDER'], value), os.path.join(dest_dir, filename))

                        # Construction de l'url HTML
                        url = app.config['APP_URL'] + "/static/media/" + layer_schema["layer_schema_name"] + "/" + layer_schema["layer_table_name"] + "/" + filename
                        value = "'<a href=\"" + url + "\" target=\"_blank\">" + filename + "</a>'"
                    else :
                        # ici, le fichier n'a pas changé
                        value = "'" + previous_data[column_name] + "'"
            else :
                value = 'NULL'

                # si on est sur un type média, il faut supprimer l'ancien fichier sur le serveur
                if column.data_type in ['media']:
                    # Un fichier était-il déjà renseigné en base ?
                    if previous_data[column_name] is not None:
                        
                        # Récupération du nom du fichier
                        tmp_previous_filename = previous_data[column_name].split(">")
                        if len(tmp_previous_filename) > 0 :
                            previous_file_name = tmp_previous_filename[1].replace("</a", "")
                    
                        # Suppression du fichier si il existe sur le serveur
                        dest_dir = os.path.join(app.config['UPLOAD_FOLDER'],layer_schema["layer_schema_name"], layer_schema["layer_table_name"])
                        if os.path.exists(os.path.join(dest_dir, previous_file_name)) :
                            os.remove(os.path.join(dest_dir, previous_file_name)) 

            update_statement = update_statement + """
                {} = {}
            """.format(column_name, value)

            first = False

    update_statement = update_statement + """
        WHERE {} = {}
    """.format(primary_key["attname"], feature_data[primary_key["attname"]])

    try :
        with db_sig.connect() as conn:
            update_exec = conn.execute(text(update_statement))#._asdict()
            conn.commit()
    except Exception as error:
        return jsonify({
            "status": "error",
            'message': """Erreur lors de la modification de la données en base' 
                Veuillez contacter l'administrateur afin de contrôler la configuration de la couche {}.{} - {}
                """.format(layer_schema["layer_schema_name"], layer_schema["layer_table_name"], error)
        }), 404


    returned_data_statement = """
        SELECT * FROM {}.{}
        WHERE {} = {}
    """.format(
        layer_schema["layer_schema_name"], 
        layer_schema["layer_table_name"],
        primary_key["attname"],
        feature_data[primary_key["attname"]]
    )

    try :
       with db_sig.connect() as conn:
        returned_data = conn.execute(text(returned_data_statement)).fetchone()._asdict()
    except Exception as error:
        return jsonify({
            "status": "error",
            'message': """Erreur lors de la modification de la données en base' 
                Veuillez contacter l'administrateur afin de contrôler la configuration de la couche {}.{} - {}
                """.format(layer_schema["layer_schema_name"], layer_schema["layer_table_name"], error)
        }), 404

    logs = Logs(
        log_id = None,
        log_date = None,
        log_type = "Layer edition - UPDATE",
        role_id = role.role_id,
        role = role,
        log_data = {
            "layer_id" : layer_id,
            "layer_schema_name" : layer_schema["layer_schema_name"],
            "layer_table_name" : layer_schema["layer_table_name"],
            "previous": json.loads(json.dumps(previous_data, default=str)),
            "new": json.loads(json.dumps(returned_data, default=str))
        }
    )
    db_app.session.add(logs)
    db_app.session.commit()

    return json.loads(json.dumps(returned_data, default=str))

    
@app.route('/api/delete_features_for_layer/<layer_id>', methods=['POST'])
@valid_token_required
@check_authorization(['GET_REF_LAYER', 'EDIT_REF_LAYER'])
def delete_features_for_layer(layer_id):
    """ Supprime un objet dans la table correspondant à layer id
    puis retourne True si pas de prolbème rencontré
    -------
        Boolean
    """

    # Récupération et contrôle de la liste des layer_id 
    # auquel l'utilisateur à les droits d'accès
    token  = request.cookies.get('token')
    role = Role.query.filter(Role.role_token == token).one()
    authorization_constraints = role.get_authorization_constraints('EDIT_REF_LAYER')
    if authorization_constraints is not None:
        if int(layer_id) not in authorization_constraints:
            return jsonify({
                        "status": "error",
                        "message": "[Erreur 403-4] - L'utilisateur ne possède pas l'autorisation de modification sur la couche layer_id=" + str(layer_id)
                    }), 403
        
    feature_data = request.json

    layer = Layer.query.get(layer_id)
    layer_schema = LayerSchema().dump(layer)

    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520

    primary_key = get_primary_key_of_layer(layer_schema["layer_schema_name"], layer_schema["layer_table_name"])

    # Récupération des valeurs actuelle (pour log)
    previous_data_statement = """
        SELECT * FROM {}.{}
        WHERE {} = {}
    """.format(
        layer_schema["layer_schema_name"], 
        layer_schema["layer_table_name"],
        primary_key["attname"],
        feature_data[primary_key["attname"]]
    )
    with db_sig.connect() as conn:
        previous_data = conn.execute(text(previous_data_statement)).fetchone()._asdict()
    

    delete_statement = """
        DELETE FROM {}.{} WHERE {} = {};
    """.format(
        layer_schema["layer_schema_name"], 
        layer_schema["layer_table_name"],
        primary_key["attname"],
        feature_data[primary_key["attname"]]
    )

    try :
        with db_sig.connect() as conn:
            conn.execute(text(delete_statement))
            conn.commit()

        # Suppression des fichiers potentiellement join
        dest_dir = os.path.join(app.config['UPLOAD_FOLDER'],layer_schema["layer_schema_name"], layer_schema["layer_table_name"])
        if layer_schema["layer_media_fields"] is not None :
            for layer_media_field in layer_schema["layer_media_fields"]:
                if previous_data[layer_media_field] is not None:
                    tmp_previous_filename = previous_data[layer_media_field].split(">")
                    if len(tmp_previous_filename) > 0 :
                        previous_file_name = tmp_previous_filename[1].replace("</a", "")

                        # Suppression de l'ancien fichier si il existe sur le serveur
                        if os.path.exists(os.path.join(dest_dir, previous_file_name)) :
                            os.remove(os.path.join(dest_dir, previous_file_name)) 


    except Exception as error:
        return jsonify({
            "status": "error",
            'message': """Erreur lors de la supression de la données en base' 
                Veuillez contacter l'administrateur afin de contrôler la configuration de la couche {}.{} - {}
                """.format(layer_schema["layer_schema_name"], layer_schema["layer_table_name"], error)
        }), 404

    logs = Logs(
        log_id = None,
        log_date = datetime.now(),
        log_type = "Layer edition - DELETE",
        role_id = role.role_id,
        role = role,
        log_data = {
            "layer_id" : layer_id,
            "layer_schema_name" : layer_schema["layer_schema_name"],
            "layer_table_name" : layer_schema["layer_table_name"],
            "deleted_data" : json.loads(json.dumps(previous_data, default=str))
        }
    )

    db_app.session.add(logs)
    db_app.session.commit()

    return {"statut": True}

# Déclaration d'une fonction de contrôle de l'extension du fichier uploadé
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_FEATURE_FILES_EXTENSIONS']

# Gestion de l'envois d'un fichier depuis un client 
# et stockage dans un espace temporaire
@app.route('/api/upload_file', methods=['POST'])
@valid_token_required
@check_authorization(['EDIT_REF_LAYER'])
def upload_file():
    file = request.files['file']

    # Dépôt du fichier dans le dossier temporaire
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['TMP_UPLOAD_FOLDER'], filename))

    #return {"filename": filename}
    return Response(json.dumps({"filename": filename}), mimetype='application/json')
    

@app.route('/api/get_metadata_for_layer/<layer_id>', methods=['GET'])
@valid_token_required
@check_authorization(['GET_REF_LAYER'])
def get_metadata_for_layer(layer_id):

    ####
    # Ajouter un contrôle pour s'assurer que les métadonnées 
    # demandé font bien partie des layer autorisé pour l'utilisateur
    ###


    # récupération de l'UUID de la métadonnée
    layer = Layer.query.get(layer_id)
    layer_schema = LayerSchema().dump(layer)
    layer_metadata_uuid = layer_schema["layer_metadata_uuid"]

    geonetwork_url = app.config['GEONETWORK_URL']
    geonetwork_user = app.config['GEONETWORK_USER']
    geonetwork_password = app.config['GEONETWORK_PASSWORD']

    # Récupération du X-XSRF-TOKEN
    response = requests.get(geonetwork_url + "/fre/info?type=me")
    token = response.cookies.get("XSRF-TOKEN")

    # Authentification
    response = requests.get(geonetwork_url + "/fre/info?type=me", auth=(geonetwork_user, geonetwork_password), headers = {"X-XSRF-TOKEN" : token})
    jsessionid = response.cookies.get("JSESSIONID")

    # Construction du cookies à joindre à la demande de métadonnées
    cookies = {"XSRF-TOKEN" : token, "JSESSIONID": jsessionid}

    # Récupération de la fiche métadonnée
    #response = requests.get(geonetwork_url + "/api/records/a0adbf16-7d55-4336-8338-b80a60d2987e/formatters/xml?approved=true", cookies = cookies)
    response = requests.get(geonetwork_url + "/api/records/" + layer_metadata_uuid + "/formatters/json?approved=true", cookies = cookies, headers = {"Accept" : "application/json"})

    json_metadata = response.content

    json_metadata = json.loads(json_metadata)

    # Récupération de la descripton de la couche
    try:
        md_abstract = json_metadata["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:abstract"]["gco:CharacterString"]["#text"]
    except(KeyError, IndexError):
        md_abstract = None

    # Récupération de la date
    try:
        md_date = json_metadata["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:citation"]["gmd:CI_Citation"]["gmd:date"]["gmd:CI_Date"]["gmd:date"]["gco:DateTime"]["#text"]
    except(KeyError, IndexError):
        md_date = None

    if md_date is None:
        try:
            md_date = json_metadata["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:citation"]["gmd:CI_Citation"]["gmd:date"]["gmd:CI_Date"]["gmd:date"]["gco:Date"]["#text"]
        except(KeyError, IndexError):
            md_date = None

    # et du type de date (création / Publication / Révision)
    try:
        md_type_date = json_metadata["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:citation"]["gmd:CI_Citation"]["gmd:date"]["gmd:CI_Date"]["gmd:dateType"]["gmd:CI_DateTypeCode"]["@codeListValue"]
    except(KeyError, IndexError):
        md_type_date = None

    # Récupération du contact
    # Attention, il est sous la forme d'une liste s'il y en a plusieur uniquement
    if isinstance(json_metadata["gmd:contact"], list):
        tmp_l_contact = json_metadata["gmd:contact"]
    else :
        tmp_l_contact = []
        tmp_l_contact.append(json_metadata["gmd:contact"])

    l_contacts = []
    for tmp_contact in tmp_l_contact:

        try:
            md_contact = tmp_contact["gmd:CI_ResponsibleParty"]["gmd:organisationName"]["gco:CharacterString"]["#text"]
        except(KeyError, IndexError):
            md_contact = None     

        # Récupération du role du contact
        try:
            md_role_contact = tmp_contact["gmd:CI_ResponsibleParty"]["gmd:role"]["gmd:CI_RoleCode"]["@codeListValue"]
            if md_role_contact == "originator":
                md_role_contact = "A l’origine de" 
            if md_role_contact == "author":
                md_role_contact = "Distributeur" 
            if md_role_contact == "publisher":
                md_role_contact = "Editeur (publication)" 
            if md_role_contact == "processor":
                md_role_contact = "Exécutant" 
            if md_role_contact == "resourceProvider":
                md_role_contact = "Fournisseur" 
            if md_role_contact == "custodian":
                md_role_contact = "Gestionnaire"
            if md_role_contact == "pointOfContact":
                md_role_contact = "Point de contact" 
            if md_role_contact == "principalInvestigator":
                md_role_contact = "Point de recherche" 
            if md_role_contact == "owner":
                md_role_contact = "Propriétaire" 
            if md_role_contact == "user":
                md_role_contact = "Utilisateur"    
        except(KeyError, IndexError):
            md_role_contact = None 

        l_contacts.append({"md_contact": md_contact, "md_role_contact": md_role_contact})

    # Récupération de la généalogie
    try:
        if json_metadata["gmd:dataQualityInfo"]["gmd:DQ_DataQuality"]["gmd:lineage"]["gmd:LI_Lineage"]["gmd:statement"]["gco:CharacterString"] is not None:
            md_genealogie = json_metadata["gmd:dataQualityInfo"]["gmd:DQ_DataQuality"]["gmd:lineage"]["gmd:LI_Lineage"]["gmd:statement"]["gco:CharacterString"]["#text"]
        else :
            md_genealogie = ""
    except(KeyError, IndexError):
        md_genealogie = None

    # Récupération de l'état de la couche
    try:
        md_etat = json_metadata["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:status"]["gmd:MD_ProgressCode"]["@codeListValue"]
        if md_etat == "historicalArchive":
           md_etat = "Archivé - Ressource archivée hors ligne" 
        if md_etat == "required":
           md_etat = "Création ou mise à jour requise - Ressource qui doit être générée ou mise à jour" 
        if md_etat == "underDevelopment":
           md_etat = "En cours de création - Ressource en cours de création" 
        if md_etat == "completed":
           md_etat = "Finalisé - Production de la ressource finalisée" 
        if md_etat == "onGoing":
           md_etat = "Mise à jour continue - Ressource continuellement mise à jour" 
        if md_etat == "obsolete":
           md_etat = "Obsolète - Ressource obsolète" 
        if md_etat == "planned":
           md_etat = "Planifié - Ressource créée ou mise à jour sur base d'une date fixée" 
    except(KeyError, IndexError):
        md_etat = None

    md_link = geonetwork_url + "/fre/catalog.search#/metadata/" + layer_metadata_uuid

    result = {
        "layer_label" : layer_schema["layer_label"],
        "md_abstract" : md_abstract,
        "md_date" : md_date,
        "md_type_date" : md_type_date,
        "l_contacts" : l_contacts,
        "md_genealogie" : md_genealogie,
        "md_etat": md_etat,
        "md_link": md_link
    }

    return Response(json.dumps(result), mimetype='application/json')

# Création d'un projet
@app.route('/api/project/create', methods=['POST'])
@valid_token_required
@check_authorization(['PROJECT'])
def create_project():
    postdata = request.json

    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520

    project = Project(
        project_id = None,
        role_id = role.role_id,
        project_name = postdata["project_name"],
        project_content = postdata["project_content"],
        project_creation_date = datetime.now(),
        project_update_date = datetime.now()
    )

    db_app.session.add(project)
    db_app.session.commit()

    return jsonify(ProjectSchema(many=False).dump(project))

# Enregistrement du contenu d'un projet
@app.route('/api/project/update_content', methods=['POST'])
@valid_token_required
@check_authorization(['PROJECT'])
def update_project_content():
    postdata = request.json

    project = Project.query.get(postdata["project_id"])

    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520

    # On s'assure que celui qui demande la mise à jour du 
    # projet est bien le propriétaire du projet
    if project.role_id == role.role_id :
        project.project_content = postdata["project_content"]
        project.project_update_date = datetime.now()

        db_app.session.commit()

        return jsonify(True)
    else :
        return jsonify({
            'status': 'error',
            'message': """[Erreur] L'utilisateur n'est pas le propriétaire du projet - {}""".format(error)
        }), 520

# Modification du nom d'un projet
@app.route('/api/project/update_name', methods=['POST'])
@valid_token_required
@check_authorization(['PROJECT'])
def update_project_name():
    postdata = request.json

    project = Project.query.get(postdata["project_id"])

    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520

    # On s'assure que celui qui demande la mise à jour du 
    # projet est bien le propriétaire du projet
    if project.role_id == role.role_id :

        project.project_name = postdata["project_name"]
        project.project_update_date = datetime.now()

        db_app.session.commit()


        return jsonify(True)
    else :
        return jsonify({
            'status': 'error',
            'message': """[Erreur] L'utilisateur n'est pas le propriétaire du projet - {}""".format(error)
        }), 520

# retourne la liste des projets d'un utilisateur
@app.route('/api/project/my_projects', methods=['GET'])
@valid_token_required
@check_authorization(['PROJECT'])
def get_my_project():
    """ Fourni la liste des projet créé par l'utilisateur courant

    Returns
    -------
        JSON
    """    
    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520



    myProject = db_app.session.query(
        Project.project_id,
        Project.role_id,
        Project.project_name,
        #Project.project_content,
        Project.project_creation_date,
        Project.project_update_date
    ).filter_by(role_id=role.role_id).order_by(Project.project_name, Project.project_update_date)

    return jsonify(ProjectSchema(many=True).dump(myProject))

@app.route('/api/project/<project_id>', methods=['GET'])
@valid_token_required
@check_authorization(['PROJECT'])
def get_project(project_id):
    """ retourne un projet

    Returns
    -------
        GeoJson
    """
    project = Project.query.get(project_id)

    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520

    # On s'assure que celui qui demande l'ouverture de
    # projet est bien le propriétaire du projet
    if project.role_id == role.role_id :
        return jsonify(ProjectSchema().dump(project))
    else :
        return jsonify({
                'status': 'error',
                'message': """[Erreur] L'utilisateur courant n'est pas le propriétaire ce projet - {}""".format(error)
            }), 403

    

@app.route('/api/project/<project_id>', methods=['DELETE'])
@valid_token_required
@check_authorization(['PROJECT'])
def delete_project(project_id):
    """ supprime un projet

    Returns
    -------
        GeoJson
    """
    project = Project.query.get(project_id)

    # Récupération de l'utilisateur courrant
    token = request.cookies.get('token')
    try:
        role = Role.query.filter(Role.role_token == token).one()
    except Exception as error:
        return jsonify({
            'status': 'error',
            'message': """[Erreur] Aucun role associé au token - {}""".format(error)
        }), 520

    # On s'assure que celui qui demande la suppression du 
    # projet est bien le propriétaire du projet
    if project.role_id == role.role_id :
        try:
            db_app.session.delete(project)
            db_app.session.commit()
        except Exception as error:
            return jsonify({
                'status': 'error',
                'message': """[Erreur] Impossible de supprimer le projet - {}""".format(error)
            }), 520
    else :
        return jsonify({
                'status': 'error',
                'message': """[Erreur] L'utilisateur courant n'a pas le droit de supprimer ce projet - {}""".format(error)
            }), 403

    return jsonify(True)

@app.route('/robots.txt')
def get_robots_file():
 return send_from_directory(app.static_folder, request.path[1:])

# Fonction permettant de sérialisé proprement les date contenu dans un json    
#def json_serial(obj):
#    """JSON serializer for objects not serializable by default json code"""
#
#    if isinstance(obj, (datetime, date)):
#        return obj.isoformat()
#    raise TypeError ("Type %s not serializable" % type(obj))

if __name__ == "__main__":
    app.run()