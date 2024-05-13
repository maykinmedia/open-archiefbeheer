from unittest.mock import patch

from django.core import mail
from django.test import TestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.destruction.tests.factories import DestructionListFactory

from ..models import EmailConfig
from ..utils import send_review_request_email


class RenderingEmailTemplatesTestCase(TestCase):

    def test_render_email_templates(self):
        user = UserFactory.create(username="reviewer1", email="reviewer1@test.nl")
        destruction_list = DestructionListFactory.create(name="List 1")

        with patch(
            "openarchiefbeheer.emails.utils.EmailConfig.get_solo",
            return_value=EmailConfig(
                body_review_required="This is a test user: {{ user }} and a test list: {{ list }}."
            ),
        ):
            send_review_request_email(user, destruction_list)

        messages = mail.outbox

        self.assertEqual(len(messages), 1)
        self.assertEqual(
            messages[0].body, "This is a test user: reviewer1 and a test list: List 1."
        )
