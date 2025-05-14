from marshmallow import (
    Schema,
    fields,
    validates, 
    ValidationError,
)

# Default BASEMAP
BASEMAPS = [
    {
        "type" : "Tile",
        "name" : "IGN-Orthophotos",
        "url" : "https://wxs.ign.fr/decouverte/geoportail/wmts?SERVICE=WMTS&REQUEST=GetCapabilities",
        "layer" : "ORTHOIMAGERY.ORTHOPHOTOS",
        "attributions" : "©IGN",
        "isDefault" : 0,
        "format" : "image/jpeg"
    },
    {
        "type" : "Tile",
        "name" : "IGN-Plan",
        "url" : "https://wxs.ign.fr/decouverte/geoportail/wmts?SERVICE=WMTS&REQUEST=GetCapabilities",
        "layer" : "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
        "attributions" : "©IGN",
        "isDefault" : 1,
        "format" : "image/png"
    }
]

class ConfSchema(Schema):
    APP_NAME = fields.String(required=True)
    APP_URL = fields.String(required=True)
    SQLALCHEMY_DATABASE_URI = fields.String(required=True)
    SQLALCHEMY_SIG_DATABASE_URI = fields.String(required=True)
    # Voir l'utilité de conserver cette variable de configuration
    #SQLALCHEMY_TRACK_MODIFICATIONS = fields.Boolean(load_default=False)
    GEONATURE_URL = fields.String(required=True)
    TAXHUB_LIST_ID = fields.Integer(required=True)
    ID_APPLICATION = fields.Integer(required=True)
    GEONETWORK_URL = fields.String(required=False)
    GEONETWORK_USER = fields.String(required=False)
    GEONETWORK_PASSWORD = fields.String(required=False)
    LOGO_STRUCTURE = fields.String(required=True)
    DEBUG = fields.Boolean(load_default=False)
    ENV = fields.String(required=True)
    CENTER = fields.List(fields.Float, load_default=[42.922276035501696, -0.16777084451550842])
    ZOOM_LEVEL = fields.Integer(load_default=6)
    BASEMAPS = fields.List(fields.Dict(), load_default=BASEMAPS)
    OBS_LAYER_CLASSIFICATION_BORNE = fields.List(fields.Float, load_default=[0.1, 0.2, 0.4, 0.8])
    OBS_LAYER_CLASS_COLOR = fields.List(fields.String, load_default=["rgba(237, 248, 251, 0.9)", "rgba(179, 205, 227, 0.9)", "rgba(140, 150, 198, 0.9)", "rgba(136, 86, 167, 0.9)", "rgba(129, 15, 124, 0.9)"])
    SRID = fields.Integer(required=True)
    #TEST = fields.String(required=True)

    @validates("ENV")
    def check_env_value(self, value, **kwargs):
        env_values = ["production", "development"]
        if value not in env_values :
            raise ValidationError("Valeur incorrect. Valeurs attendues : {}".format(env_values)) 