from pathlib import Path
from collections import ChainMap

import toml
import sys
from marshmallow import ValidationError
#from pprint import pprint
from backend.utils.config_schema import ConfSchema
#from backend.utils.errors import ConfigError, AppError

from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow

from sqlalchemy import create_engine

db_app = SQLAlchemy()
#db_sig = create_engine(app.config['SQLALCHEMY_SIG_DATABASE_URI'])
ma = Marshmallow()

def read_config(toml_conf_file):
    """
        Fonction qui charge le fichier de configuration
         et le valide avec le Schema marshmallow associé
    """
    if toml_conf_file.is_file():
        toml_config = toml.load(str(toml_conf_file))

        try:
            configs_py = ConfSchema().load(toml_config)
        except ValidationError as err:
            msg = "Erreur dans la configuration de l'application ('{}') :\n".format(toml_conf_file)
            for key, errors in err.messages.items():
                msg += "\n\t{} : {}\n".format(key, errors)
            raise Exception(msg)
        return configs_py
    else:
        raise Exception("Missing file {}".format(toml_conf_file))