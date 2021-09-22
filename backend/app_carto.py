import os
import re
from pathlib import Path
from flask import Flask, render_template, send_from_directory, request, make_response, jsonify, Markup
import requests
import json
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
#from sqlalchemy.sql.expression import true
from functools import wraps

from .models import Role, VLayerList, Layer, BibStatusType, VRegneList, VGroupTaxoList, BibCommune, BibMeshScale, BibGroupStatus
from .schema import RoleSchema, VLayerListSchema, LayerSchema, BibGroupStatusSchema

"""from requests.api import request"""

from .utils.env import read_config, db_app, ma

import sys

app = Flask(__name__, template_folder='../frontend')
CONFIG_FILE = Path(__file__).absolute().parent.parent / "config/config.toml"

config = read_config(CONFIG_FILE)
app.config.update(config)

# On force le fait de ne pas trier les json par keyname
app.config['JSON_SORT_KEYS'] = False

db_app.init_app(app)
db_sig = create_engine(app.config['SQLALCHEMY_SIG_DATABASE_URI'])

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
                "message": "[Erreur 403-1] - Aucune clés d'authentification trouvée, veuillez vous identifier"
            }), 403

        # Controle de la date d'expiration
        role = Role.query.filter(Role.role_token == token)
        # Controle que le token correspond bien à un utilisateur
        if (role.first() is None):
            return jsonify({
                "status": "error",
                "message": "[Erreur 403-2] - La clés d'authentification est incorrecte, veuillez vous identifier"
            }), 403

        role = role.one()
        # Controle que la date d'expiration n'est pas dépassé
        if (datetime.now() < role.role_token_expiration):
            return f(*args, **kwargs)
        else :
            return jsonify({
                "status": "error",
                "message": "[Erreur 403-3] - La clés d'authentification n'est plus valide, veuillez vous identifier"
            }), 403
    return decorated_function

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
@valid_token_required
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
@valid_token_required
def get_ref_layer_data(ref_layer_id):
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
            FROM (select {} AS geom, {} from {}.{} t ) row
        ) features
    """.format(layer_schema["layer_geom_column"], ', '.join(layer_schema["layer_columns"]), layer_schema["layer_schema_name"], layer_schema["layer_table_name"]))

    try :
        layer_datas = db_sig.execute(statement).fetchone()._asdict()
    except :
        return jsonify({
            "status": "error",
            'message': """Erreur lors de la récupération de la couche de référence. 
                Veuillez contacter l'administrateur afin de contrôler la configuration de la couche {}.{}
                """.format(layer_schema["layer_schema_name"], layer_schema["layer_table_name"])
        }), 404

    layer_datas['desc_layer'] = layer_schema
    return layer_datas

@app.route('/api/layer/get_statut_list', methods=['GET'])
@valid_token_required
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
def get_scale_list():
    """ Fourni la liste des echelle de restitution

    Returns
    -------
        JSON
    """    
    bibMeshScale = BibMeshScale.query.filter(BibMeshScale.active == True).order_by(BibMeshScale.mesh_scale_id)
    
    scale_list = []
    for meshScale in bibMeshScale:
        scale_list.append({"label": meshScale.mesh_scale_label, "value": meshScale.mesh_scale_id})
    
    return jsonify(scale_list)

@app.route('/api/layer/get_group_statut_list', methods=['GET'])
@valid_token_required
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
    
    if postdata["altitude_min"] is not None and postdata["altitude_max"] is not None and altitude_min_is_valid and altitude_max_is_valid:
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


def build_obs_layer_query(postdata):
    """ Construit la requête SQL interrogeant les données
    d'observation en fonction du paramétrage du formulaire de requatage

    Returns
    -------
        JSON
    """   

    if postdata["scale"] == 999 :
        select_column = """ 
            o.geom
        """
    else :
        select_column = "m.geom"
    

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
            AND EXTRACT(DAY FROM o.date_min) > {} AND EXTRACT(MONTH FROM o.date_min) > {}
        """.format(periode_min_day, periode_min_month)

    if postdata["periode_max"]:
        periode_max_day = postdata["periode_max"].split('/')[0]
        periode_max_month = postdata["periode_max"].split('/')[1]

        if periode_max_day.startswith('0'):
            periode_max_day = periode_max_day[1:]

        if periode_max_month.startswith('0'):
            periode_max_month = periode_max_month[1:]

        query_where += """
            AND EXTRACT(DAY FROM o.date_max) < {} AND (EXTRACT(MONTH FROM o.date_max) + 1) < {}
        """.format(int(periode_max_day), int(periode_max_month))

    if postdata["status_list"]:
        query_where += """
            AND cos.statut_type_id in ({})
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
        else :
            # cas restitution maille
            style = [{
                "style_type": "Polygon",
                "styles": [{
                    "style_name": "Zone de présence",
                    "filter": "",
                    "fill_color": "rgba(0, 255, 81, 0.5)",
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

        style_query_datas = db_app.engine.execute(style_query).fetchone()._asdict()

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
                    "filter": {
                        "operator": "<=",
                        "left_term": style_field_filter,
                        "right_term": style_query_datas["borne_" + str(i)],
                        "or": [],
                        "and": []
                    },
                    "fill_color": app.config['OBS_LAYER_CLASS_COLOR'][i],
                    "stroke_color": "rgba(0, 0, 0, 1)",
                    "stroke_width": 1,
                    "stroke_linedash": []
                }
            
            #Création des classe "classique"
            if i > 0 :
                tmp_style = {
                    "style_name": "De " + str(style_query_datas["borne_" + str(i - 1)]) + " à " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                    "filter": {
                        "operator": ">",
                        "left_term": style_field_filter,
                        "right_term": style_query_datas["borne_" + str(i -1)],
                        "or": [],
                        "and": [{
                            "left_term": style_field_filter,
                            "operator": "<=",
                            "right_term": style_query_datas["borne_" + str(i)],
                            "and": [],
                            "or": []
                        }]
                    },
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
                    "filter": {
                        "operator": ">",
                        "left_term": style_field_filter,
                        "right_term": style_query_datas["borne_" + str(i)],
                        "or": [],
                        "and": []
                    },
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
                        "filter": {
                            "operator": "<=",
                            "left_term": style_field_filter,
                            "right_term": style_query_datas["borne_" + str(i)],
                            "or": [],
                            "and": []
                        },
                        "fill_color": app.config['OBS_LAYER_CLASS_COLOR'][i],
                        "stroke_color": "rgba(0, 0, 0, 1)",
                        "stroke_width": 1,
                        "stroke_linedash": []
                    }
                
                #Création des classe "classique"
                if i > 0 :
                    tmp_style = {
                        "style_name": "De " + str(style_query_datas["borne_" + str(i - 1)]) + " à " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                        "filter": {
                            "operator": ">",
                            "left_term": style_field_filter,
                            "right_term": style_query_datas["borne_" + str(i -1)],
                            "or": [],
                            "and": [{
                                "left_term": style_field_filter,
                                "operator": "<=",
                                "right_term": style_query_datas["borne_" + str(i)],
                                "and": [],
                                "or": []
                            }]
                        },
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
                        "filter": {
                            "operator": ">",
                            "left_term": style_field_filter,
                            "right_term": style_query_datas["borne_" + str(i)],
                            "or": [],
                            "and": []
                        },
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
                        "filter": {
                            "operator": "<=",
                            "left_term": style_field_filter,
                            "right_term": style_query_datas["borne_" + str(i)],
                            "or": [],
                            "and": []
                        },
                        "stroke_color": app.config['OBS_LAYER_CLASS_COLOR'][i],
                        "stroke_width": 2,
                        "stroke_linedash": []
                    }
                
                #Création des classe "classique"
                if i > 0 :
                    tmp_style = {
                        "style_name": "De " + str(style_query_datas["borne_" + str(i - 1)]) + " à " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                        "filter": {
                            "operator": ">",
                            "left_term": style_field_filter,
                            "right_term": style_query_datas["borne_" + str(i -1)],
                            "or": [],
                            "and": [{
                                "left_term": style_field_filter,
                                "operator": "<=",
                                "right_term": style_query_datas["borne_" + str(i)],
                                "and": [],
                                "or": []
                            }]
                        },
                        "stroke_color": app.config['OBS_LAYER_CLASS_COLOR'][i],
                        "stroke_width": 2,
                        "stroke_linedash": []
                    }

                style_line["styles"].append(tmp_style)

                # Création de la dernière classe
                if i == len(app.config['OBS_LAYER_CLASSIFICATION_BORNE']) -1:
                    tmp_style = {
                        "style_name": "Plus de " + str(style_query_datas["borne_" + str(i)]) + " " + legend_alias,
                        "filter": {
                            "operator": ">",
                            "left_term": style_field_filter,
                            "right_term": style_query_datas["borne_" + str(i)],
                            "or": [],
                            "and": []
                        },
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
def get_obs_layer_data():
    """ Retourne une couche geojson des données d'observation
    en fonction des filtres paramétrés

    Returns
    -------
        GEOJSON
    """    
    postdata = request.json

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

    geojson_query = text("""SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(feature)) AS geojson_layer 
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature', 
                'geometry', ST_AsGeoJSON(st_transform(geom, 3857))::jsonb, 
                'properties', to_jsonb(row) - 'geom') AS feature  
            FROM ({}) row
        ) features""".format(query))

    # Execution de la requête récupérant le GeoJson
    obs_layer_datas = db_app.engine.execute(geojson_query).fetchone()._asdict()

    # Récupération du style associé
    default_style = getObsLayerStyle(postdata["restitution"], postdata["scale"], query)

    layer_label = builLayerLabel(postdata)

    obs_layer_datas['desc_layer'] = {
        "layer_default_style": default_style,
        "layer_label": layer_label
    }

    return obs_layer_datas

@app.route('/api/get_warning_calculator_data', methods=['POST'])
@valid_token_required
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
            SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(feature)) AS geojson_layer 
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
                SELECT jsonb_build_object(
                    'type', 'Feature', 
                    'geometry', ST_AsGeoJSON(st_transform(geom, 3857))::jsonb, 
                    'properties', to_jsonb(row) - 'geom') AS feature  
                FROM (
                    SELECT t.{} AS geom, {} 
                    FROM {}.{} t 
                    INNER JOIN geom g ON ST_Intersects(t.geom, g.geom)
                ) row
            ) features
        """.format(json.dumps(geojson), app.config['SRID'], warning_layer_schema["layer_geom_column"], ', '.join(warning_layer_schema["layer_columns"]), warning_layer_schema["layer_schema_name"], warning_layer_schema["layer_table_name"]))

        layer_datas = db_sig.execute(statement).fetchone()._asdict()

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
    obs_layer_datas = db_app.engine.execute(obs_query).fetchone()._asdict()

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

    search_name = request.args.get("search_name", "").replace(" ", "%").replace("'", "''")
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
                    nom, 
                    type,
                    precision_geo,
                    ST_Extent(st_transform(ST_Buffer(geom, 1), 3857)) AS geom 
                FROM app_carto.bib_toponyme t
                WHERE 
                    nom ilike '%{}%'
                GROUP BY
                    nom, type, precision_geo, geom
                ORDER BY
	                similarity(nom, '{}') desc
                LIMIT {}
                 ) row
        ) features
    """.format(search_name, request.args.get("search_name", ""), limit))

    #try :
    toponyme_datas = db_app.engine.execute(statement).fetchone()._asdict()
    

    return json.dumps(toponyme_datas)
    #return BibToponymeSchema().dump(data)

@app.route('/api/warning_calculator/get_layers_list', methods=['GET'])
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


if __name__ == "__main__":
    app.run()
