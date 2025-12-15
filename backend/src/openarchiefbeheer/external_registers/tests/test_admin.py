from django.urls import reverse
from django.utils.translation import gettext as _

from django_webtest import WebTest
from maykin_2fa.test import disable_admin_mfa
from zgw_consumers.test.factories import ServiceFactory

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ..models import ExternalRegisterConfig


@disable_admin_mfa()
class ExternalRegisterConfigAdminTests(WebTest):
    def test_service_cannot_be_related_to_multiple_configs(self):
        superuser = UserFactory.create(superuser=True)
        service1 = ServiceFactory.create(slug="some_service1")

        config1 = ExternalRegisterConfig.objects.create(identifier="config1")
        config1.services.add(service1)
        config2 = ExternalRegisterConfig.objects.create(identifier="config2")

        url = reverse(
            "admin:external_registers_externalregisterconfig_change", args=(config2.pk,)
        )
        response = self.app.get(url, user=superuser)

        self.assertEqual(response.status_code, 200)

        form = response.form
        form["services"] = [service1.pk]
        response_submission = form.submit()

        self.assertEqual(response_submission.status_code, 200)

        error_list = response_submission.html.find_all("ul", class_="errorlist")
        self.assertEqual(len(error_list), 1)
        self.assertEqual(
            error_list[0].string,
            _(
                "One or more of the selected services are already used by another plugin"
            ),
        )

    def test_config_can_be_related_to_service(self):
        superuser = UserFactory.create(superuser=True)
        service1 = ServiceFactory.create(slug="some_service1")
        service2 = ServiceFactory.create(slug="some_service2")

        config1 = ExternalRegisterConfig.objects.create(identifier="config1")
        config1.services.add(service1)
        config2 = ExternalRegisterConfig.objects.create(identifier="config2")

        url = reverse(
            "admin:external_registers_externalregisterconfig_change", args=(config2.pk,)
        )
        response = self.app.get(url, user=superuser)

        self.assertEqual(response.status_code, 200)

        form = response.form
        form["services"] = [service2.pk]
        response_submission = form.submit().follow()

        self.assertEqual(response_submission.status_code, 200)

        self.assertEqual(config2.services.count(), 1)
        self.assertEqual(config2.services.get().pk, service2.pk)

    def test_config_services_can_be_changed(self):
        superuser = UserFactory.create(superuser=True)
        service1 = ServiceFactory.create(slug="some_service1")
        service2 = ServiceFactory.create(slug="some_service2")
        service3 = ServiceFactory.create(slug="some_service3")

        config1 = ExternalRegisterConfig.objects.create(identifier="config1")
        config1.services.add(service1)
        config2 = ExternalRegisterConfig.objects.create(identifier="config2")
        config2.services.add(service2)

        url = reverse(
            "admin:external_registers_externalregisterconfig_change", args=(config2.pk,)
        )
        response = self.app.get(url, user=superuser)

        self.assertEqual(response.status_code, 200)

        form = response.form
        form["services"] = [service2.pk, service3.pk]
        response_submission = form.submit().follow()

        self.assertEqual(response_submission.status_code, 200)
        self.assertEqual(config2.services.count(), 2)
