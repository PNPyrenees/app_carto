from requests import api
from .utils.env import db_app
from datetime import datetime

class Role(db_app.Model):
    __tablename__ = 't_roles'
    __table_args__ = {'schema': 'app_carto'}
    role_id = db_app.Column(db_app.Integer, primary_key = True)
    role_nom = db_app.Column(db_app.String(50))
    role_prenom = db_app.Column(db_app.String(50))
    role_login = db_app.Column(db_app.String(250))
    role_token = db_app.Column(db_app.String(500))
    role_token_expiration = db_app.Column(db_app.DateTime())
    role_date_insert = db_app.Column(db_app.DateTime(), default=datetime.now())
    role_date_update = db_app.Column(db_app.DateTime(), default=datetime.now())

    def __init__(
        self,
        role_id,
        role_nom,
        role_prenom,
        role_login,
        role_token,
        role_token_expiration,
        role_date_insert,
        role_date_update
    ):
        self.role_id = role_id
        self.role_nom = role_nom
        self.role_prenom = role_prenom
        self.role_login = role_login
        self.role_token = role_token
        self.role_token_expiration = role_token_expiration
        self.role_date_insert = role_date_insert
        self.role_date_updat = role_date_update

"""class Role(db_app.Model):
    __tablename__ = 't_roles'
    __table_args__ = {'schema': 'app_carto'}
    role_id = db_app.Column(db_app.Integer, primary_key = True)

    def __init__(
        self,
        role_id
    ):
        self.role_id = role_id"""

class Layer(db_app.Model):
    __tablename__ = 't_layers'
    __table_args__ = {'schema': 'app_carto'}
    layer_id = db_app.Column(db_app.Integer, primary_key = True)
    layer_schema_name = db_app.Column(db_app.String(50))
    layer_table_name = db_app.Column(db_app.String(50))
    layer_group = db_app.Column(db_app.String(50))
    layer_label = db_app.Column(db_app.String(50))
    layer_is_default = db_app.Column(db_app.Boolean)
    layer_default_style = db_app.Column(db_app.JSON())
    layer_is_challenge = db_app.Column(db_app.Boolean)

    def __init__(
        self,
        layer_id,
        layer_schema_name,
        layer_table_name,
        layer_group,
        layer_label,
        layer_is_default,
        layer_default_style,
        layer_is_challenge
    ):
        self.layer_id = layer_id
        self.layer_schema_name = layer_schema_name
        self.layer_table_name = layer_table_name
        self.layer_group = layer_group
        self.layer_label = layer_label
        self.layer_is_default = layer_is_default
        self.layer_default_style = layer_default_style
        self.layer_is_challenge = layer_is_challenge

class VLayerList(db_app.Model):
    __tablename__ = 'v_layers_list_by_group'
    __table_args__ = {'schema': 'app_carto'}
    layer_group = db_app.Column(db_app.String(50), primary_key=True)
    l_layers = db_app.Column(db_app.JSON())

    def __init__(
        self,
        layer_group,
        l_layers
        
    ):
        self.layer_group = layer_group
        self.l_layers = l_layers