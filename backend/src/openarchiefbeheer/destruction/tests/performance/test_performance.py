import os
from unittest import skip

from django.conf import settings
from django.test import TestCase, tag

from playwright.async_api import async_playwright, expect
from tabulate import tabulate

from openarchiefbeheer.utils.tests.gherkin import GerkinMixin

TEST_ENVIRONMENT = os.getenv("TEST_ENVIRONMENT")
RECORD_MANAGER_USERNAME = os.getenv("RECORD_MANAGER_USERNAME")
RECORD_MANAGER_PASSWORD = os.getenv("RECORD_MANAGER_PASSWORD")
REVIEWER_USERNAME = os.getenv("REVIEWER_USERNAME")
REVIEWER_PASSWORD = os.getenv("REVIEWER_PASSWORD")
ARCHIVARIS_USERNAME = os.getenv("ARCHIVARIS_USERNAME")
ARCHIVARIS_PASSWORD = os.getenv("ARCHIVARIS_PASSWORD")


@tag("performance")
class PerformanceTest(GerkinMixin, TestCase):
    live_server_url = TEST_ENVIRONMENT

    async def flush_results(self, results):
        print(tabulate(results, headers=["Method", "URL", "Duration (ms)"]))
        results.clear()

    @skip("Only used for performance tests")
    async def test_performance(self):
        expect.set_options(timeout=360_000)

        async with async_playwright() as p:
            launch_kwargs = {
                "headless": settings.PLAYWRIGHT_HEADLESS,
            }

            results = []

            async def on_response(response):
                await response.finished()

                request = response.request
                timings = request.timing

                results.append([request.method, request.url, timings["responseEnd"]])

            browser = await getattr(p, settings.PLAYWRIGHT_BROWSER).launch(
                **launch_kwargs
            )
            page = await browser.new_page()
            page.on("response", on_response)

            #
            # PART 1: Record manager
            #

            # Record Manager logs in
            await page.wait_for_timeout(5_000)
            await page.goto(f"{TEST_ENVIRONMENT}/login")
            await page.get_by_label("Gebruikersnaam").fill(RECORD_MANAGER_USERNAME)
            await page.get_by_label("Wachtwoord").fill(RECORD_MANAGER_PASSWORD)
            await page.get_by_role("button", name="Inloggen").click()
            await self.then.path_should_be(page, "/destruction-lists")

            # Record Manager creates list
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen")
            await self.then.path_should_be(page, "/destruction-lists/create")

            await self.when.user_clicks_checkbox(
                page, "(de)selecteer 100 pagina's", index=0
            )
            await self.when.user_clicks_button(
                page, "Vernietigingslijst opstellen", index=1
            )
            await self.when.user_fills_form_field(page, "Naam", "Gigantic list")
            await self.when.user_fills_form_field(
                page, "Reviewer", "John Doe (reviewer1)"
            )
            await self.when.user_fills_form_field(
                page, "Toelichting", "A humongous list"
            )
            await self.when.user_clicks_button(page, "Vernietigingslijst opstellen", 2)
            await self.then.path_should_be(page, "/destruction-lists")

            # Record Manager marks as ready to review
            await self.when.user_clicks_button(page, "Gigantic list")
            await self.then.url_regex_should_be(
                page, f"{TEST_ENVIRONMENT}/destruction-lists/.+?/edit"
            )
            await page.wait_for_timeout(5_000)
            await self.when.user_clicks_button(page, "Ter beoordeling indienen")
            await self.when.user_clicks_button(page, "Ter beoordeling indienen", 1)
            await self.then.path_should_be(page, "/destruction-lists")

            # Record Manager logs out
            await self.when.user_logs_out(page)

            # Print results
            await self.flush_results(results)

            #
            # PART 2: Reviewer rejects
            #

            # Reviewer logs in
            await page.wait_for_timeout(5_000)
            await page.goto(f"{TEST_ENVIRONMENT}/login")
            await page.get_by_label("Gebruikersnaam").fill(REVIEWER_USERNAME)
            await page.get_by_label("Wachtwoord").fill(REVIEWER_PASSWORD)
            await page.get_by_role("button", name="Inloggen").click()
            await self.then.path_should_be(page, "/destruction-lists")

            # Reviewer requests changes
            await self.when.user_clicks_button(page, "Gigantic list")
            await self.then.url_regex_should_be(
                page, f"{TEST_ENVIRONMENT}/destruction-lists/.+?/review"
            )

            # Reviewer rejects list
            await self.when.user_clicks_button(page, "Uitzonderen")
            await self.when.user_fills_form_field(
                page, "Reden", "Please reconsider this zaak"
            )
            await self.when.user_clicks_button(page, "Zaak uitzonderen")
            await self.when.user_clicks_button(page, "Afwijzen")
            await self.when.user_fills_form_field(
                page, "Reden", "Please reconsider the zaak on this list"
            )
            await self.when.user_clicks_button(page, "Vernietigingslijst afwijzen")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_logs_out(page)

            # Print results
            await self.flush_results(results)

            #
            # PART 3: Record manager processes feedback
            #

            # Record Manager logs in
            await page.wait_for_timeout(5_000)
            await page.goto(f"{TEST_ENVIRONMENT}/login")
            await page.get_by_label("Gebruikersnaam").fill(RECORD_MANAGER_USERNAME)
            await page.get_by_label("Wachtwoord").fill(RECORD_MANAGER_PASSWORD)
            await page.get_by_role("button", name="Inloggen").click()
            await self.then.path_should_be(page, "/destruction-lists")

            # Record Manager processes review
            await self.when.user_clicks_button(page, "Gigantic list")
            await self.then.url_regex_should_be(
                page, f"{TEST_ENVIRONMENT}/destruction-lists/.+?/process-review"
            )
            await self.when.user_clicks_button(page, "Muteren")
            await self.when.user_clicks_radio(page, "Afwijzen van het voorstel")
            await self.when.user_fills_form_field(
                page, "Reden", "I still want 10000 cases in my list."
            )
            await self.when.user_clicks_button(page, "muteren")
            await self.when.user_clicks_button(page, "Opnieuw indienen")
            await self.when.user_fills_form_field(
                page, "Opmerking", "Did nothing...", None, 1
            )
            await self.when.user_clicks_button(page, "Opnieuw indienen", 1)
            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_logs_out(page)

            # Print results
            await self.flush_results(results)

            #
            # PART 4: Reviewer approves
            #

            # Reviewer logs in
            await page.wait_for_timeout(5_000)
            await page.goto(f"{TEST_ENVIRONMENT}/login")
            await page.get_by_label("Gebruikersnaam").fill(REVIEWER_USERNAME)
            await page.get_by_label("Wachtwoord").fill(REVIEWER_PASSWORD)
            await page.get_by_role("button", name="Inloggen").click()
            await self.then.path_should_be(page, "/destruction-lists")

            # Wait for the review to be processed
            await page.wait_for_timeout(240_000)

            # Reviewer approves list
            await self.when.user_clicks_button(page, "Gigantic list")
            await self.then.url_regex_should_be(
                page, f"{TEST_ENVIRONMENT}/destruction-lists/.+?/review"
            )
            await self.when.user_clicks_button(page, "Goedkeuren")
            await self.when.user_fills_form_field(page, "Opmerking", "Ship it")
            await self.when.user_clicks_button(page, "Vernietigingslijst goedkeuren")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_logs_out(page)

            # Print results
            await self.flush_results(results)

            #
            # PART 5: Record manager marks as definite
            #

            # Record Manager logs in
            await page.wait_for_timeout(5_000)
            await page.goto(f"{TEST_ENVIRONMENT}/login")
            await page.get_by_label("Gebruikersnaam").fill(RECORD_MANAGER_USERNAME)
            await page.get_by_label("Wachtwoord").fill(RECORD_MANAGER_PASSWORD)
            await page.get_by_role("button", name="Inloggen").click()
            await self.then.path_should_be(page, "/destruction-lists")

            # Record Manager marks as ready to review
            await self.when.user_clicks_button(page, "Gigantic list")
            await self.then.url_regex_should_be(
                page, f"{TEST_ENVIRONMENT}/destruction-lists/.+?/edit"
            )
            await self.when.user_clicks_button(page, "Markeren als definitief")
            await self.when.user_fills_form_field(
                page, "Archivaris", "Kobus Lies (archivaris)"
            )
            await self.when.user_fills_form_field(page, "Opmerking", "Le's goooo")
            await self.when.user_clicks_button(page, "Markeer als definitief")
            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_logs_out(page)

            # Print results
            await self.flush_results(results)

            #
            # PART 6: Archivaris approves
            #

            # Archivaris logs in
            await page.wait_for_timeout(5_000)
            await page.goto(f"{TEST_ENVIRONMENT}/login")
            await page.get_by_label("Gebruikersnaam").fill(ARCHIVARIS_USERNAME)
            await page.get_by_label("Wachtwoord").fill(ARCHIVARIS_PASSWORD)
            await page.get_by_role("button", name="Inloggen").click()
            await self.then.path_should_be(page, "/destruction-lists")

            # Archivaris approves list
            await self.when.user_clicks_button(page, "Gigantic list")
            await self.then.url_regex_should_be(
                page, f"{TEST_ENVIRONMENT}/destruction-lists/.+?/review"
            )
            await self.when.user_clicks_button(page, "Goedkeuren")
            await self.when.user_fills_form_field(page, "Opmerking", "Let's delete 🔥")
            await self.when.user_clicks_button(page, "Vernietigingslijst goedkeuren")
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_logs_out(page)

            # Print results
            await self.flush_results(results)

            #
            # PART 7: Record manager starts deletion process
            #

            # Record Manager logs in
            await page.wait_for_timeout(5_000)
            await page.goto(f"{TEST_ENVIRONMENT}/login")
            await page.get_by_label("Gebruikersnaam").fill(RECORD_MANAGER_USERNAME)
            await page.get_by_label("Wachtwoord").fill(RECORD_MANAGER_PASSWORD)
            await page.get_by_role("button", name="Inloggen").click()
            await self.then.path_should_be(page, "/destruction-lists")

            # Record Manager processes review
            await self.when.user_clicks_button(page, "Gigantic list")
            await self.then.url_regex_should_be(
                page, f"{TEST_ENVIRONMENT}/destruction-lists/.+?/edit"
            )
            await self.when.user_clicks_button(page, "Vernietigen starten")
            await self.when.user_fills_form_field(
                page, "Type naam van de lijst ter bevestiging", "Gigantic list"
            )
            await self.when.user_clicks_button(page, "10000 zaken vernietigen")
            await self.then.path_should_be(page, "/destruction-lists")
            await self.when.user_logs_out(page)

            # Print results
            await self.flush_results(results)
