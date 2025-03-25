import os
import warnings

from .utils import config

SESSION_ENGINE = "django.contrib.sessions.backends.db"

os.environ.setdefault("IS_HTTPS", "no")
os.environ.setdefault("SECRET_KEY", "dummy")
# Do not log requests in CI/tests:
#
# * overhead making tests slower
# * it conflicts with SimpleTestCase in some cases when the run-time configuration is
#   looked up from the django-solo model
os.environ.setdefault("LOG_REQUESTS", "no")

# Playwright settings
PLAYWRIGHT_BROWSER = config("PLAYWRIGHT_BROWSER", default="chromium")
PLAYWRIGHT_HEADLESS = config("PLAYWRIGHT_HEADLESS", default=True)
PLAYWRIGHT_TRACE_PATH = config("PLAYWRIGHT_TRACE_PATH", default="playwright-trace.zip")
PLAYWRIGHT_SAVE_TRACE = config("PLAYWRIGHT_SAVE_TRACE", default=True)

from .base import *  # noqa isort:skip

# End-to-end test settings
E2E_PORT = config("E2E_PORT", default=8000)
E2E_SERVE_FRONTEND = config("E2E_SERVE_FRONTEND", default=False)

CACHES.update(
    {
        "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
        # See: https://github.com/jazzband/django-axes/blob/master/docs/configuration.rst#cache-problems
        "axes": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"},
    }
)

# don't spend time on password hashing in tests/user factories
PASSWORD_HASHERS = ["django.contrib.auth.hashers.UnsaltedMD5PasswordHasher"]

ENVIRONMENT = "CI"


#
# Django-axes
#
AXES_BEHIND_REVERSE_PROXY = False


# THOU SHALT NOT USE NAIVE DATETIMES
warnings.filterwarnings(
    "error",
    r"DateTimeField .* received a naive datetime",
    RuntimeWarning,
    r"django\.db\.models\.fields",
)
