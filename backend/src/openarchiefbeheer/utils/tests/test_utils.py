from django.test import TestCase

from zgw_consumers.constants import APITypes
from zgw_consumers.models import Service

from ..exceptions import NoServiceConfigured
from ..services import get_service


class UtilsTests(TestCase):
    def test_no_zaak_services_configured(self):
        Service.objects.filter(api_type=APITypes.zrc).delete()

        with self.assertRaises(NoServiceConfigured):
            get_service(APITypes.zrc)
