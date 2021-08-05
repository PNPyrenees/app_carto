from marshmallow import (
    Schema,
    fields,
    validates, 
    ValidationError,
)

# Default BASEMAP
BASEMAPS = [
    {
        "name" : "IGN-Orthophotos",
        "url" : "https://wxs.ign.fr/decouverte/geoportail/wmts?SERVICE=WMTS&REQUEST=GetCapabilities",
        "layer" : "ORTHOIMAGERY.ORTHOPHOTOS",
        "attributions" : "©IGN",
        "isDefault" : 0,
        "format" : "image/jpeg"
    },
    {
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
    APP_URL = fields.String(require=True)
    SQLALCHEMY_DATABASE_URI = fields.String(required=True)
    SQLALCHEMY_SIG_DATABASE_URI = fields.String(required=True)
    SQLALCHEMY_TRACK_MODIFICATIONS = fields.Boolean(missing=False)
    GEONATURE_URL = fields.String(require=True)
    ID_APPLICATION = fields.Integer(require=True)
    LOGO_STRUCTURE = fields.String(required=True)
    DEBUG = fields.Boolean(missing=False)
    ENV = fields.String(required=True)
    CENTER = fields.List(fields.Float, missing=[42.922276035501696, -0.16777084451550842])
    ZOOM_LEVEL = fields.Integer(missing=6)
    BASEMAPS = fields.List(fields.Dict(), missing=BASEMAPS)
    #TEST = fields.String(required=True)

    @validates("ENV")
    def check_env_value(self, value):
        env_values = ["production", "development"]
        if value not in env_values :
            raise ValidationError("Valeur incorrect. Valeurs attendues : {}".format(env_values)) 