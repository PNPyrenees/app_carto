from requests import api
from .utils.env import db_app
from datetime import datetime
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
#from geoalchemy2 import Geometry

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

    importedLayers = relationship("ImportedLayer")

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
    layer_is_warning = db_app.Column(db_app.Boolean)
    layer_attribution = db_app.Column(db_app.String(255))
    layer_geom_column = db_app.Column(db_app.String(50))
    layer_columns = db_app.Column(db_app.ARRAY(db_app.String))
    layer_is_editable = db_app.Column(db_app.Boolean)
    layer_allowed_geometry = db_app.Column(db_app.ARRAY(db_app.String))

    def __init__(
        self,
        layer_id,
        layer_schema_name,
        layer_table_name,
        layer_group,
        layer_label,
        layer_is_default,
        layer_default_style,
        layer_is_warning,
        layer_attribution,
        layer_geom_column,
        layer_columns,
        layer_is_editable,
        layer_allowed_geometry
    ):
        self.layer_id = layer_id
        self.layer_schema_name = layer_schema_name
        self.layer_table_name = layer_table_name
        self.layer_group = layer_group
        self.layer_label = layer_label
        self.layer_is_default = layer_is_default
        self.layer_default_style = layer_default_style
        self.layer_is_warning = layer_is_warning
        self.layer_attribution = layer_attribution
        self.layer_geom_column = layer_geom_column
        self.layer_columns = layer_columns
        self.layer_is_editable = layer_is_editable
        self.layer_allowed_geometry = layer_allowed_geometry

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

class BibGroupStatus(db_app.Model):
    __tablename__ = 'bib_group_status'
    __table_args__ = {'schema': 'app_carto'}
    group_status_id = db_app.Column(db_app.Integer, primary_key=True)
    group_status_label = db_app.Column(db_app.String(50))
    group_status_description = db_app.Column(db_app.Text)
    active = db_app.Column(db_app.Boolean)
    group_status_is_warning = db_app.Column(db_app.Boolean)
    
    status = relationship("BibStatusType")

    def __init__(
        self,
        group_status_id,
        group_status_label,
        group_status_description,
        status,
        active,
        group_status_is_warning
        
    ):
        self.group_status_id = group_status_id
        self.group_status_label = group_status_label
        self.group_status_description = group_status_description
        self.status = status
        self.active = active
        self.group_status_is_warning = group_status_is_warning

class BibStatusType(db_app.Model):
    __tablename__ = 'bib_status_type'
    __table_args__ = {'schema': 'app_carto'}
    status_type_id = db_app.Column(db_app.Integer, primary_key=True)
    status_type_label = db_app.Column(db_app.String(50))
    group_status_id = db_app.Column(db_app.Integer, ForeignKey('app_carto.bib_group_status.group_status_id'))
    active = db_app.Column(db_app.Boolean)

    group_status = relationship("BibGroupStatus", back_populates="status")

    def __init__(
        self,
        status_type_id,
        status_type_label,
        group_status_id,
        active
        
    ):
        self.status_type_id = status_type_id
        self.status_type_label = status_type_label
        self.group_status_id = group_status_id
        self.active = active

class VGroupTaxoList(db_app.Model):
    __tablename__ = 'v_group_taxo_list'
    __table_args__ = {'schema': 'app_carto'}
    group_label = db_app.Column(db_app.String(50), primary_key=True)

    def __init__(
        self,
        group_label
        
    ):
        self.group_label = group_label

class VRegneList(db_app.Model):
    __tablename__ = 'v_regne_list'
    __table_args__ = {'schema': 'app_carto'}
    group_label = db_app.Column(db_app.String(50), primary_key=True)

    def __init__(
        self,
        group_label
        
    ):
        self.group_label = group_label

class BibCommune(db_app.Model):
    __tablename__ = 'bib_commune'
    __table_args__ = {'schema': 'app_carto'}
    insee_com = db_app.Column(db_app.String(5), primary_key=True)
    nom_com = db_app.Column(db_app.String(200))

    def __init__(
        self,
        insee_com,
        nom_com
        
    ):
        self.insee_com = insee_com
        self.nom_com = nom_com

class BibMeshScale(db_app.Model):
    __tablename__ = 'bib_mesh_scale'
    __table_args__ = {'schema': 'app_carto'}
    mesh_scale_id = db_app.Column(db_app.Integer, primary_key=True)
    mesh_scale_label = db_app.Column(db_app.String(50))
    active = db_app.Column(db_app.Boolean)

    def __init__(
        self,
        mesh_scale_id,
        mesh_scale_label,
        active
        
    ):
        self.mesh_scale_id = mesh_scale_id
        self.mesh_scale_label = mesh_scale_label
        self.active = active

class ImportedLayer(db_app.Model):
    __tablename__ = 't_imported_layer'
    __table_args__ = {'schema': 'app_carto'}
    imported_layer_id = db_app.Column(db_app.Integer, primary_key = True)
    role_id = db_app.Column(db_app.Integer, ForeignKey('app_carto.t_roles.role_id'))
    imported_layer_name = db_app.Column(db_app.String(255))
    imported_layer_geojson = db_app.Column(JSONB)
    imported_layer_import_date = db_app.Column(db_app.DateTime(), default=datetime.now())
    imported_layer_last_view = db_app.Column(db_app.DateTime(), default=datetime.now())

    role = relationship("Role", back_populates="importedLayers")

    def __init__(
        self,
        imported_layer_id,
        role_id,
        role,
        imported_layer_name,
        imported_layer_geojson,
        imported_layer_import_date,
        imported_layer_last_view
        
    ):
        self.imported_layer_id = imported_layer_id
        self.role_id = role_id
        self.role = role
        self.imported_layer_name = imported_layer_name
        self.imported_layer_geojson = imported_layer_geojson
        self.imported_layer_import_date = imported_layer_import_date
        self.imported_layer_last_view = imported_layer_last_view

#class BibToponyme(db_app.Model):
#    __tablename__ = 'bib_toponyme'
#    __table_args__ = {'schema': 'app_carto'}
#    id = db_app.Column(db_app.Integer, primary_key=True)
#    nom = db_app.Column(db_app.String(255))
#    type = db_app.Column(db_app.String(50))
#    geom = db_app.Column(Geometry("GEOMETRY", 2154))
#
#    def __init__(
#        self,
#        id,
#        nom,
#        type,
#        geom
#        
#    ):
#        self.id = id
#        self.nom = nom
#        self.type = type
#        self.geom = geom