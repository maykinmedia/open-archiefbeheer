from contextlib import asynccontextmanager

from django.conf import settings
from django.contrib.staticfiles.testing import StaticLiveServerTestCase

from playwright.async_api import async_playwright


@asynccontextmanager
async def browser_page():
    async with async_playwright() as p:
        try:
            launch_kwargs = {
                "headless": settings.PLAYWRIGHT_HEADLESS,
            }

            browser = await getattr(p, settings.PLAYWRIGHT_BROWSER).launch(
                **launch_kwargs
            )
            page = await browser.new_page()
            yield page
        finally:
            await browser.close()


@asynccontextmanager
async def browser_page_with_tracing():
    async with async_playwright() as p:
        launch_kwargs = {
            "headless": settings.PLAYWRIGHT_HEADLESS,
        }

        browser = await getattr(p, settings.PLAYWRIGHT_BROWSER).launch(**launch_kwargs)
        context = await browser.new_context()
        await context.tracing.start(screenshots=True, snapshots=True, sources=True)

        page = await context.new_page()

        try:
            yield page
        finally:
            await context.tracing.stop(path=settings.PLAYWRIGHT_TRACE_PATH)
            await browser.close()


class PlaywrightTestCase(StaticLiveServerTestCase):
    port = settings.PLAYWRIGHT_PORT
