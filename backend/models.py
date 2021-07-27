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