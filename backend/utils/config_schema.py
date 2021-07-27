from marshmallow import (
    Schema,
    fields,
    validates, 
    ValidationError,
)

class ConfSchema(Schema):
    APP_NAME = fields.String(required=True)
    APP_URL = fields.String(require=True)
    SQLALCHEMY_DATABASE_URI = fields.String(required=True)
    SQLALCHEMY_TRACK_MODIFICATIONS = fields.Boolean(missing=False)
    GEONATURE_URL = fields.String(require=True)
    ID_APPLICATION = fields.Integer(require=True)
    LOGO_STRUCTURE = fields.String(required=True)
    DEBUG = fields.Boolean(missing=False)
    ENV = fields.String(required=True)
    #TEST = fields.String(required=True)

    @validates("ENV")
    def check_env_value(self, value):
        env_values = ["production", "development"]
        if value not in env_values :
            raise ValidationError("Valeur incorrect. Valeurs attendues : {}".format(env_values)) 