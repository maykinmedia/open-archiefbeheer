from contextlib import asynccontextmanager

from django.conf import settings
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.core.cache import cache
from django.test.testcases import LiveServerThread, QuietWSGIRequestHandler

from playwright.async_api import async_playwright


@asynccontextmanager
async def browser_page(log_levels=["debug"]):
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

        save_trace = True
        try:
            yield page
            save_trace = False
        finally:
            if save_trace:
                await context.tracing.stop(path=settings.PLAYWRIGHT_TRACE_PATH)
            await browser.close()


class LiveServerThreadWithReuse(LiveServerThread):
    """Live server thread with reuse of local addresses

    Apparently, after the server thread is stopped, the socket is still bound to the address and in TIME_WAIT state.
    The connection is kept around so that any delayed packets can be matched to the connection and handled appropriately.
    The OS will close the connection once a timeout period has passed.
    By reusing the address, we prevent the ``socket.error: [Errno 48] Address already in use`` error.
    """

    def _create_server(self, connections_override=None):
        return self.server_class(
            (self.host, self.port),
            QuietWSGIRequestHandler,
            allow_reuse_address=True,
            connections_override=connections_override,
        )


class PlaywrightTestCase(StaticLiveServerTestCase):
    port = settings.E2E_PORT
    fixtures = ["permissions.json"]
    server_thread_class = LiveServerThreadWithReuse

    def setUp(self):
        super().setUp()

        self.addCleanup(cache.clear)
