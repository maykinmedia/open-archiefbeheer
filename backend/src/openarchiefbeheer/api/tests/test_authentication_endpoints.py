from django.test import override_settings

from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APIClient, APITestCase

from openarchiefbeheer.accounts.tests.factories import UserFactory


class CSRFAPIClient(APIClient):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("enforce_csrf_checks", True)
        super().__init__(*args, **kwargs)


@override_settings(LANGUAGE_CODE="en")
class LoginTests(APITestCase):
    def test_no_csrf_token(self):
        login_url = reverse("api:authentication:login")

        client = CSRFAPIClient()

        response = client.post(login_url, data={})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.json()["detail"], "CSRF Failed: CSRF cookie not set.")

    def test_no_credentials_given(self):
        login_url = reverse("api:authentication:login")

        response = self.client.post(login_url, data={})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()["username"][0], "This field is required.")
        self.assertEqual(response.json()["password"][0], "This field is required.")

    def test_wrong_credentials_given(self):
        login_url = reverse("api:authentication:login")

        response = self.client.post(
            login_url, data={"username": "bla", "password": "bla"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["nonFieldErrors"][0],
            "Unable to log in with provided credentials.",
        )

    def test_happy_flow(self):
        login_url = reverse("api:authentication:login")
        UserFactory.create(username="test", password="password")

        response = self.client.post(
            login_url, data={"username": "test", "password": "password"}
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertIn("openarchiefbeheer_sessionid", response.cookies)


class LogoutTest(APITestCase):
    def test_not_authenticated(self):
        logout_url = reverse("api:authentication:logout")

        response = self.client.post(logout_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_happy_flow(self):
        logout_url = reverse("api:authentication:logout")
        user = UserFactory.create(username="test", password="test")
        self.client.force_authenticate(user=user)

        response = self.client.post(logout_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertNotIn("openarchiefbeheer_sessionid", response.cookies)
