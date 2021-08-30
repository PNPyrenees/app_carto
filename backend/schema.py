from .utils.env import ma
from .models import Role, VLayerList, Layer, BibStatusType, BibGroupStatus, VGroupTaxoList

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

class BibGroupStatusSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = BibGroupStatus
        load_instance = True

#class BibStatusTypeSchema(ma.SQLAlchemyAutoSchema):
#    class Meta:
#        model = BibStatusType
#        load_instance = True

#class VGroupTaxoListSchema(ma.SQLAlchemyAutoSchema):
#    class Meta:
#        model = VGroupTaxoList
#        load_instance = True
