import os

from locust import HttpUser, task

LOCUST_USERNAME = os.getenv("LOCUST_USERNAME")
LOCUST_PASSWORD = os.getenv("LOCUST_PASSWORD")


class RecordManager(HttpUser):
    csrftoken_header = None

    def on_start(self) -> None:
        # Get CSRF token
        headers = {"Referer": f"{self.host}/login"}

        response = self.client.get("/api/v1/whoami/", headers=headers)
        headers.update({"X-CSRFToken": response.headers.get("X-CSRFToken")})

        # Login
        response = self.client.post(
            "/api/v1/auth/login/",
            headers=headers,
            data={"username": LOCUST_USERNAME, "password": LOCUST_PASSWORD},
        )

        self.csrftoken_header = response.headers.get("X-CSRFToken")

    @task
    def get_destruction_lists(self):
        self.client.get(
            "/api/v1/destruction-lists/",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )

    @task
    def get_destruction_list_items_page_1(self):
        self.client.get(
            "/api/v1/destruction-list-items/",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )

    @task
    def get_zaken_page_1(self):
        self.client.get(
            "/api/v1/zaken/",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )

    @task
    def get_reviewers(self):
        self.client.get(
            "/api/v1/reviewers/",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )

    @task
    def get_selectielijstklasse_choices(self):
        self.client.get(
            "/api/v1/_selectielijstklasse-choices/",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )

    @task
    def get_zaaktype_choices(self):
        self.client.get(
            "/api/v1/_zaaktypen-choices/",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )

    @task
    def get_reviews_for_list(self):
        self.client.get(
            "/api/v1/destruction-list-reviews/?destructionList__uuid=3239f290-df0c-4123-8aa3-81e9e11bc5c4&ordering=-created",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )

    @task
    def get_items_for_list(self):
        self.client.get(
            "/api/v1/destruction-list-items/?item-destruction_list=3239f290-df0c-4123-8aa3-81e9e11bc5c4&item-status=suggested",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )

    @task
    def get_zaken_not_list_except(self):
        self.client.get(
            "/api/v1/zaken/?not_in_destruction_list_except=3239f290-df0c-4123-8aa3-81e9e11bc5c4",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )

    @task
    def get_logs_for_list(self):
        self.client.get(
            "/api/v1/logs/?destruction_list=3239f290-df0c-4123-8aa3-81e9e11bc5c4",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )

    @task
    def get_coreviewers(self):
        self.client.get(
            "/api/v1/co-reviewers/",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )

    @task
    def get_coreviews(self):
        self.client.get(
            "/api/v1/destruction-list-co-reviews/?destructionList__uuid=3239f290-df0c-4123-8aa3-81e9e11bc5c4",
            headers={
                "Referer": f"{self.host}/login",
                "X-CSRFToken": self.csrftoken_header,
            },
        )
