from django.test import TestCase


class SelectionDocsTest(TestCase):
    def test_docs_dont_crash(self):
        response = self.client.get("/api/docs/#tag/Selection/operation/selections_list")

        self.assertEqual(response.status_code, 200)
