import socket
from contextlib import asynccontextmanager

from django.conf import settings
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.core.cache import cache
from django.test.testcases import LiveServerThread, QuietWSGIRequestHandler

from playwright.async_api import async_playwright


@asynccontextmanager
async def browser_page(log_levels=["debug"]):
    async with async_playwright() as p:
        try:
            launch_kwargs = {
                "headless": settings.PLAYWRIGHT_HEADLESS,
            }

            browser = await getattr(p, settings.PLAYWRIGHT_BROWSER).launch(
                **launch_kwargs
            )
            page = await browser.new_page()
            page.on(
                "console",
                lambda message: message.type in log_levels
                and print(message.type.upper(), message),
            )

            yield page
        finally:
            await browser.close()


@asynccontextmanager
async def browser_page_with_tracing(log_levels=["debug"]):
    async with async_playwright() as p:
        launch_kwargs = {
            "headless": settings.PLAYWRIGHT_HEADLESS,
        }

        browser = await getattr(p, settings.PLAYWRIGHT_BROWSER).launch(**launch_kwargs)
        context = await browser.new_context()
        await context.tracing.start(screenshots=True, snapshots=True, sources=True)

        page = await context.new_page()
        page.on(
            "console",
            lambda message: message.type in log_levels
            and print(message.type.upper(), message),
        )

        try:
            yield page
        finally:
            await context.tracing.stop(path=settings.PLAYWRIGHT_TRACE_PATH)
            await browser.close()


class LiveServerThreadWithReuse(LiveServerThread):
    """Live server thread with a retry limit for finding an available port."""

    def _create_server(self, connections_override=None):
        max_retries = 100  # Limit retries to 100 steps
        retries = 0

        while retries < max_retries:
            try:
                return self.server_class(
                    (self.host, self.port),
                    QuietWSGIRequestHandler,
                    allow_reuse_address=True,
                    connections_override=connections_override,
                )
            except OSError as e:
                if e.errno == socket.errno.EADDRINUSE:  # Port is in use
                    self.port += 1  # Try the next port
                    retries += 1
                else:
                    raise  # Re-raise unexpected errors

        # If no port was found after max_retries, raise an exception
        raise RuntimeError(
            f"Could not find an available port after {max_retries} attempts starting from {self.port - max_retries}."
        )


class PlaywrightTestCase(StaticLiveServerTestCase):
    port = settings.E2E_PORT
    fixtures = ["permissions.json"]
    server_thread_class = LiveServerThreadWithReuse

    def setUp(self):
        super().setUp()

        self.addCleanup(cache.clear)
