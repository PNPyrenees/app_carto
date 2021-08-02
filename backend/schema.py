from .utils.env import ma
from .models import Role, VLayerList, Layer

class RoleSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Role
        load_instance = True

class VLayerListSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = VLayerList
        load_instance = True

class LayerSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Layer
        load_instance = True
