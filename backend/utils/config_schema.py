from marshmallow import (
    Schema,
    fields,
    validates, 
    ValidationError,
)

class ConfSchema(Schema):
    APP_NAME = fields.String(required=True)
    LOGO_STRUCTURE = fields.String(required=True)
    DEBUG = fields.Boolean(missing=False)
    ENV = fields.String(required=True)
    #TEST = fields.String(required=True)

    @validates("ENV")
    def check_env_value(self, value):
        env_values = ["production", "development"]
        if value not in env_values :
            raise ValidationError("Valeur incorrect. Valeurs attendues : {}".format(env_values)) 