import json

from django.core.serializers.json import DjangoJSONEncoder


class HashableDict(dict):
    def __hash__(self):
        return hash(json.dumps(self, cls=DjangoJSONEncoder, sort_keys=True))
