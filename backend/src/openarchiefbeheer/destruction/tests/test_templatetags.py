from django.test import TestCase, override_settings

from openarchiefbeheer.emails.render_backend import get_sandboxed_backend

from .factories import DestructionListFactory


class TestTemplateTags(TestCase):
    @override_settings(FRONTEND_URL="https://openarchiefbeheer.nl/")
    def test_destruction_list_link(self):
        destruction_list = DestructionListFactory.create(name="Testing templates")

        backend = get_sandboxed_backend()
        template = backend.from_string("{% destruction_list_link dl 'edit' %}")

        formatted_body = template.render(context={"dl": destruction_list})

        self.assertEqual(
            formatted_body,
            f"https://openarchiefbeheer.nl/destruction-lists/{destruction_list.uuid}/edit",
        )
