import os
import warnings

os.environ.setdefault("IS_HTTPS", "no")
os.environ.setdefault("SECRET_KEY", "dummy")
# Do not log requests in CI/tests:
#
# * overhead making tests slower
# * it conflicts with SimpleTestCase in some cases when the run-time configuration is
#   looked up from the django-solo model
os.environ.setdefault("LOG_REQUESTS", "no")

from .base import *  # noqa isort:skip

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
