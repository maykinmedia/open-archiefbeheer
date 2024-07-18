import os
import warnings

from .utils import config

os.environ.setdefault("DEBUG", "yes")
os.environ.setdefault("ALLOWED_HOSTS", "*")
os.environ.setdefault(
    "SECRET_KEY",
    "django-insecure-@if!5@phjc@5oh+39_jj9154htyse60f7h(re8q2aweux_r59*",
)
os.environ.setdefault("IS_HTTPS", "no")
os.environ.setdefault("VERSION_TAG", "dev")

os.environ.setdefault("DB_NAME", "openarchiefbeheer")
os.environ.setdefault("DB_USER", "openarchiefbeheer")
os.environ.setdefault("DB_PASSWORD", "openarchiefbeheer")

os.environ.setdefault("ENVIRONMENT", "development")

from .base import *  # noqa isort:skip

# Feel free to switch dev to sqlite3 for simple projects,
# os.environ.setdefault("DB_ENGINE", "django.db.backends.sqlite3")

#
# Standard Django settings.
#
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

LOGGING["loggers"].update(
    {
        "openarchiefbeheer": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": True,
        },
        "django": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": True,
        },
        "django.db.backends": {
            "handlers": ["django"],
            "level": "DEBUG",
            "propagate": False,
        },
        "performance": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": True,
        },
        #
        # See: https://code.djangoproject.com/ticket/30554
        # Autoreload logs excessively, turn it down a bit.
        #
        "django.utils.autoreload": {
            "handlers": ["django"],
            "level": "INFO",
            "propagate": False,
        },
    }
)

SESSION_ENGINE = "django.contrib.sessions.backends.db"

# in memory cache and django-axes don't get along.
# https://django-axes.readthedocs.io/en/latest/configuration.html#known-configuration-problems
CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
    "axes": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"},
}

#
# Library settings
#

ELASTIC_APM["DEBUG"] = True

# Django debug toolbar
INSTALLED_APPS += ["debug_toolbar"]
MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE
INTERNAL_IPS = ("127.0.0.1",)

# None of the authentication backends require two-factor authentication.
if config("DISABLE_2FA", default=False):
    MAYKIN_2FA_ALLOW_MFA_BYPASS_BACKENDS = AUTHENTICATION_BACKENDS

# THOU SHALT NOT USE NAIVE DATETIMES
warnings.filterwarnings(
    "error",
    r"DateTimeField .* received a naive datetime",
    RuntimeWarning,
    r"django\.db\.models\.fields",
)

# Playwright settings
PLAYWRIGHT_BROWSER = config("PLAYWRIGHT_BROWSER", default="chromium")
PLAYWRIGHT_HEADLESS = config("PLAYWRIGHT_HEADLESS", default=True)
PLAYWRIGHT_TRACE_PATH = config("PLAYWRIGHT_TRACE_PATH", default="playwright-trace.zip")

# Serve the frontend on /.
SERVE_FRONTEND = config("SERVE_FRONTEND", default=False)

# Override settings with local settings.
try:
    from .local import *  # noqa
except ImportError:
    pass
