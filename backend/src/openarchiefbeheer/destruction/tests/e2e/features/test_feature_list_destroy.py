# fmt: off
from unittest.mock import patch

from django.test import override_settings, tag

from asgiref.sync import sync_to_async
from celery.beat import Scheduler
from celery.schedules import schedule

from openarchiefbeheer.celery import app as celery_app
from openarchiefbeheer.utils.tests.e2e import browser_page
from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
from openarchiefbeheer.utils.utils_decorators import AsyncCapableRequestsMock

from ....constants import InternalStatus, ListStatus

TEST_BEAT_SCHEDULE = {
    "process-destruction-lists": {
        "task": "openarchiefbeheer.destruction.tasks.queue_destruction_lists_for_deletion",
        "schedule": schedule(run_every=0),
    },
}

@tag("e2e")
@AsyncCapableRequestsMock()
class FeatureListDestroyTests(GherkinLikeTestCase):

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        CELERY_TASK_EAGER_PROPAGATES=True,
        CELERY_BEAT_SCHEDULE=TEST_BEAT_SCHEDULE,
        WAITING_PERIOD=0
    )
    async def test_scenario_record_manager_destroys_list(self, requests_mock: AsyncCapableRequestsMock):
        scheduler = Scheduler(app=celery_app)

        async with browser_page() as page:
            await self.given.services_are_configured(requests_mock)
            await self.given.record_manager_exists()
            destruction_list = await self.given.list_exists(
                name="Destruction list to destroy",
                status=ListStatus.ready_to_delete,
                uuid="00000000-0000-0000-0000-000000000000",
            )

            await self.when.record_manager_logs_in(page)
            await self.then.path_should_be(page, "/destruction-lists")

            await self.when.user_clicks_button(page, "Destruction list to destroy")
            await self.then.path_should_be(page, f"/destruction-lists/{destruction_list.uuid}/edit")

            await self.when.user_clicks_button(page, "Vernietigen starten")
            await self.when.user_fills_form_field(page, "Type naam van de lijst ter bevestiging", "Destruction list to destroy")
            await self.when.user_clicks_button(page, "100 zaken vernietigen")

            await self.then.path_should_be(page, "/destruction-lists")
            await self.then.list_should_have_processing_status(page, destruction_list, InternalStatus.new)

        # when the list is queued for destruction its processing status is changed to "new" and the planned
        # destruction date is set.
        # celery beat schedules `queue_destruction_lists_for_deletion` task which filters all
        # destruction lists to find eligible ones and delete them
        # Here we test that after the user clicks on the button "Vernietigen starten" this process really kicks off
        # So we mock celery beat schedule and test that task to destroy the list is called.
        # The task itself is tested in the separate unittest with VCR.
        with patch(
                "openarchiefbeheer.destruction.tasks.delete_destruction_list"
        ) as mock_task_delete:
            await sync_to_async(
                scheduler.tick,
                thread_sensitive=True,
            )()

        mock_task_delete.assert_called_once_with(destruction_list)
