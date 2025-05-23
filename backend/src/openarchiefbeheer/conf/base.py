import os
from pathlib import Path

# Django-hijack (and Django-hijack-admin)
from django.urls import reverse_lazy

import sentry_sdk
from celery.schedules import crontab
from corsheaders.defaults import default_headers

from .utils import config, get_git_sha, get_release, get_sentry_integrations

# Build paths inside the project, so further paths can be defined relative to
# the code root.

DJANGO_PROJECT_DIR = Path(__file__).resolve().parent.parent

BASE_DIR = DJANGO_PROJECT_DIR.parent.parent

#
# Core Django settings
#
# SITE_ID = config("SITE_ID", default=1)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config("SECRET_KEY")

# NEVER run with DEBUG=True in production-like environments
DEBUG = config("DEBUG", default=False)

# = domains we're running on
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="", split=True)
FRONTEND_URL = config("FRONTEND_URL", default="")
USE_X_FORWARDED_HOST = config("USE_X_FORWARDED_HOST", default=False)


IS_HTTPS = config("IS_HTTPS", default=not DEBUG)

# Internationalization
# https://docs.djangoproject.com/en/2.0/topics/i18n/

LANGUAGE_CODE = "nl-nl"

TIME_ZONE = "Europe/Amsterdam"  # note: this *may* affect the output of DRF datetimes

USE_I18N = True

USE_L10N = True

USE_TZ = True

USE_THOUSAND_SEPARATOR = True

#
# DATABASE and CACHING setup
#
DATABASES = {
    "default": {
        "ENGINE": config("DB_ENGINE", "django.contrib.gis.db.backends.postgis"),
        "NAME": config("DB_NAME", "openarchiefbeheer"),
        "USER": config("DB_USER", "openarchiefbeheer"),
        "PASSWORD": config("DB_PASSWORD", "openarchiefbeheer"),
        "HOST": config("DB_HOST", "localhost"),
        "PORT": config("DB_PORT", 5432),
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"redis://{config('CACHE_DEFAULT', 'localhost:6379/0')}",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
        },
    },
    "axes": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"redis://{config('CACHE_AXES', 'localhost:6379/0')}",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
        },
    },
    "choices_endpoints": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"redis://{config('CACHE_CHOICES', 'localhost:6379/1')}",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
        },
    },
}

# Geospatial libraries
GEOS_LIBRARY_PATH = config("GEOS_LIBRARY_PATH", None)
GDAL_LIBRARY_PATH = config("GDAL_LIBRARY_PATH", None)


#
# APPLICATIONS enabled for this project
#

INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.auth",
    "django.contrib.sessions",
    "django.contrib.contenttypes",
    # NOTE: If enabled, at least one Site object is required and
    # uncomment SITE_ID above.
    # 'django.contrib.sites',
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    # Two-factor authentication in the Django admin, enforced.
    "django_otp",
    "django_otp.plugins.otp_static",
    "django_otp.plugins.otp_totp",
    "two_factor",
    "two_factor.plugins.webauthn",  # USB key/token support
    "maykin_2fa",
    # Optional applications.
    "django_admin_index",
    "django.contrib.admin",
    # 'django.contrib.admindocs',
    # 'django.contrib.humanize',
    # 'django.contrib.sitemaps',
    # External applications.
    "axes",
    "hijack",
    "hijack.contrib.admin",
    "rest_framework",
    "rest_framework_gis",
    "drf_spectacular",
    "zgw_consumers",
    "simple_certmanager",
    "timeline_logger",
    "django_filters",
    "solo",
    "ordered_model",
    "django_jsonform",
    "mozilla_django_oidc",
    "mozilla_django_oidc_db",
    "privates",
    "django_setup_configuration",
    # Project applications.
    "openarchiefbeheer.accounts",
    "openarchiefbeheer.destruction",
    "openarchiefbeheer.utils",
    "openarchiefbeheer.logging",
    "openarchiefbeheer.zaken",
    "openarchiefbeheer.emails",
    "openarchiefbeheer.config",
    "openarchiefbeheer.selection",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    # 'django.middleware.locale.LocaleMiddleware',
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "openarchiefbeheer.middleware.CsrfTokenMiddleware",
    "openarchiefbeheer.middleware.SessionExpiredMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "maykin_2fa.middleware.OTPMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "hijack.middleware.HijackUserMiddleware",
    "mozilla_django_oidc_db.middleware.SessionRefresh",
    # should be last according to docs
    "axes.middleware.AxesMiddleware",
    "djangorestframework_camel_case.middleware.CamelCaseMiddleWare",
]

ROOT_URLCONF = "openarchiefbeheer.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [DJANGO_PROJECT_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "openarchiefbeheer.utils.context_processors.settings",
            ],
        },
    },
]

WSGI_APPLICATION = "openarchiefbeheer.wsgi.application"

# Translations
LOCALE_PATHS = (DJANGO_PROJECT_DIR / "conf" / "locale",)

#
# SERVING of static and media files
#

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "static"

# Additional locations of static files
STATICFILES_DIRS = [DJANGO_PROJECT_DIR / "static"]

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = [
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
]

MEDIA_ROOT = BASE_DIR / "media"

MEDIA_URL = "/media/"

FILE_UPLOAD_PERMISSIONS = 0o644

#
# Sending EMAIL
#
EMAIL_HOST = config("EMAIL_HOST", default="localhost")
EMAIL_PORT = config(
    "EMAIL_PORT", default=25
)  # disabled on Google Cloud, use 487 instead
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=False)
EMAIL_TIMEOUT = 10

DEFAULT_FROM_EMAIL = config(
    "DEFAULT_FROM_EMAIL", default="openarchiefbeheer@example.com"
)

#
# LOGGING
#
LOG_STDOUT = config("LOG_STDOUT", default=False)

LOGGING_DIR = BASE_DIR / "log"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "%(asctime)s %(levelname)s %(name)s %(module)s %(process)d %(thread)d  %(message)s"
        },
        "timestamped": {"format": "%(asctime)s %(levelname)s %(name)s  %(message)s"},
        "simple": {"format": "%(levelname)s  %(message)s"},
        "performance": {
            "format": "%(asctime)s %(process)d | %(thread)d | %(message)s",
        },
    },
    "filters": {
        "require_debug_false": {"()": "django.utils.log.RequireDebugFalse"},
    },
    "handlers": {
        "mail_admins": {
            "level": "ERROR",
            "filters": ["require_debug_false"],
            "class": "django.utils.log.AdminEmailHandler",
        },
        "null": {
            "level": "DEBUG",
            "class": "logging.NullHandler",
        },
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "timestamped",
        },
        "django": {
            "level": "DEBUG",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGGING_DIR / "django.log",
            "formatter": "verbose",
            "maxBytes": 1024 * 1024 * 10,  # 10 MB
            "backupCount": 10,
        },
        "project": {
            "level": "DEBUG",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGGING_DIR / "openarchiefbeheer.log",
            "formatter": "verbose",
            "maxBytes": 1024 * 1024 * 10,  # 10 MB
            "backupCount": 10,
        },
        "performance": {
            "level": "INFO",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGGING_DIR / "performance.log",
            "formatter": "performance",
            "maxBytes": 1024 * 1024 * 10,  # 10 MB
            "backupCount": 10,
        },
    },
    "loggers": {
        "openarchiefbeheer": {
            "handlers": ["project"] if not LOG_STDOUT else ["console"],
            "level": "INFO",
            "propagate": True,
        },
        "django.request": {
            "handlers": ["django"] if not LOG_STDOUT else ["console"],
            "level": "ERROR",
            "propagate": True,
        },
        "django.template": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": True,
        },
    },
}

#
# AUTH settings - user accounts, passwords, backends...
#
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Allow logging in with both username+password and email+password
AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesBackend",
    "openarchiefbeheer.accounts.backends.UserModelEmailBackend",
    "django.contrib.auth.backends.ModelBackend",
    "mozilla_django_oidc_db.backends.OIDCAuthenticationBackend",
]

SESSION_COOKIE_NAME = "openarchiefbeheer_sessionid"
SESSION_ENGINE = "django.contrib.sessions.backends.cache"

LOGIN_URL = reverse_lazy("admin:login")
LOGIN_REDIRECT_URL = reverse_lazy("admin:index")
LOGOUT_REDIRECT_URL = reverse_lazy("admin:index")

#
# SECURITY settings
#
SESSION_COOKIE_SAMESITE = config("SESSION_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_SECURE = config("SESSION_COOKIE_SECURE", IS_HTTPS)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = config("SESSION_COOKIE_AGE", 1209600)  # 2 weeks in seconds

CSRF_COOKIE_SAMESITE = config("CSRF_COOKIE_SAMESITE", "Lax")
CSRF_COOKIE_SECURE = config("CSRF_COOKIE_SECURE", IS_HTTPS)
CSRF_FAILURE_VIEW = "openarchiefbeheer.accounts.views.csrf_failure"

X_FRAME_OPTIONS = "DENY"

#
# FIXTURES
#

FIXTURE_DIRS = (DJANGO_PROJECT_DIR / "fixtures",)

#
# Custom settings
#
PROJECT_NAME = "openarchiefbeheer"
ENVIRONMENT = config("ENVIRONMENT", "")
SHOW_ALERT = True
ENABLE_ADMIN_NAV_SIDEBAR = config("ENABLE_ADMIN_NAV_SIDEBAR", default=False)

# This setting is used by the csrf_failure view (accounts app).
# You can specify any path that should match the request.path
# Note: the LOGIN_URL Django setting is not used because you could have
# multiple login urls defined.
LOGIN_URLS = [reverse_lazy("admin:login")]


if "GIT_SHA" in os.environ:
    GIT_SHA = config("GIT_SHA", "")
else:
    GIT_SHA = get_git_sha()

if "RELEASE" in os.environ:
    RELEASE = config("RELEASE", "")
else:
    RELEASE = get_release() or GIT_SHA


REQUESTS_READ_TIMEOUT = config("REQUESTS_READ_TIMEOUT", 30)
# Default (connection timeout, read timeout) for the requests library (in seconds)
REQUESTS_DEFAULT_TIMEOUT = (10, REQUESTS_READ_TIMEOUT)

ZAKEN_CHUNK_SIZE = config("ZAKEN_CHUNK_SIZE", 10)

E2E_SERVE_FRONTEND = False

RETRY_TOTAL = config("RETRY_TOTAL", 5)
RETRY_BACKOFF_FACTOR = config("RETRY_BACKOFF_FACTOR", 5)
RETRY_STATUS_FORCELIST = config(
    "RETRY_STATUS_FORCELIST", "502,503,504", split=True, csv_cast=int
)

WAITING_PERIOD = config("WAITING_PERIOD", 7)

RECORDING_CASSETTES_VCR = config("RECORDING_CASSETTES_VCR", False)

##############################
#                            #
# 3RD PARTY LIBRARY SETTINGS #
#                            #
##############################

#
# Django-Admin-Index
#
ADMIN_INDEX_SHOW_REMAINING_APPS = False
ADMIN_INDEX_AUTO_CREATE_APP_GROUP = False
ADMIN_INDEX_SHOW_REMAINING_APPS_TO_SUPERUSERS = True
ADMIN_INDEX_DISPLAY_DROP_DOWN_MENU_CONDITION_FUNCTION = (
    "openarchiefbeheer.utils.django_two_factor_auth.should_display_dropdown_menu"
)

#
# DJANGO-AXES
#
AXES_CACHE = "axes"  # refers to CACHES setting
# The number of login attempts allowed before a record is created for the
# failed logins. Default: 3
AXES_FAILURE_LIMIT = 10
# If set, defines a period of inactivity after which old failed login attempts
# will be forgotten. Can be set to a python timedelta object or an integer. If
# an integer, will be interpreted as a number of hours. Default: None
AXES_COOLOFF_TIME = 1
# If set, specifies a template to render when a user is locked out. Template
# receives cooloff_time and failure_limit as context variables. Default: None
AXES_LOCKOUT_TEMPLATE = "account_blocked.html"
AXES_LOCKOUT_PARAMETERS = [["ip_address", "user_agent", "username"]]
# By default, Axes obfuscates values for formfields named "password", but the admin
# interface login formfield name is "auth-password", so we obfuscate that as well
AXES_SENSITIVE_PARAMETERS = ["password", "auth-password"]  # nosec

# The default meta precedence order
IPWARE_META_PRECEDENCE_ORDER = (
    "HTTP_X_FORWARDED_FOR",
    "X_FORWARDED_FOR",  # <client>, <proxy1>, <proxy2>
    "HTTP_CLIENT_IP",
    "HTTP_X_REAL_IP",
    "HTTP_X_FORWARDED",
    "HTTP_X_CLUSTER_CLIENT_IP",
    "HTTP_FORWARDED_FOR",
    "HTTP_FORWARDED",
    "HTTP_VIA",
    "REMOTE_ADDR",
)

#
# MAYKIN-2FA
#
# It uses django-two-factor-auth under the hood so you can configure
# those settings too.
#
# we run the admin site monkeypatch instead.
TWO_FACTOR_PATCH_ADMIN = False
# Relying Party name for WebAuthn (hardware tokens)
TWO_FACTOR_WEBAUTHN_RP_NAME = config(
    "TWO_FACTOR_WEBAUTHN_RP_NAME", default="openarchiefbeheer"
)
# use platform for fingerprint readers etc., or remove the setting to allow any.
# cross-platform would limit the options to devices like phones/yubikeys
TWO_FACTOR_WEBAUTHN_AUTHENTICATOR_ATTACHMENT = config(
    "TWO_FACTOR_WEBAUTHN_AUTHENTICATOR_ATTACHMENT", default="platform"
)
# add entries from AUTHENTICATION_BACKENDS that already enforce their own two-factor
# auth, avoiding having some set up MFA again in the project.
MAYKIN_2FA_ALLOW_MFA_BYPASS_BACKENDS = [
    "mozilla_django_oidc_db.backends.OIDCAuthenticationBackend",
]

#
# DJANGO-HIJACK
#
HIJACK_PERMISSION_CHECK = "maykin_2fa.hijack.superusers_only_and_is_verified"
HIJACK_INSERT_BEFORE = (
    '<div class="content">'  # note that this only applies to the admin
)

#
# SENTRY - error monitoring
#
SENTRY_DSN = config("SENTRY_DSN", None)

if SENTRY_DSN:
    SENTRY_CONFIG = {
        "dsn": SENTRY_DSN,
        "release": RELEASE,
        "environment": ENVIRONMENT,
    }

    sentry_sdk.init(
        **SENTRY_CONFIG, integrations=get_sentry_integrations(), send_default_pii=True
    )

# Elastic APM
ELASTIC_APM_SERVER_URL = os.getenv("ELASTIC_APM_SERVER_URL", None)
ELASTIC_APM = {
    "SERVICE_NAME": f"openarchiefbeheer {ENVIRONMENT}",
    "SECRET_TOKEN": config("ELASTIC_APM_SECRET_TOKEN", "default"),
    "SERVER_URL": ELASTIC_APM_SERVER_URL,
}
if not ELASTIC_APM_SERVER_URL:
    ELASTIC_APM["ENABLED"] = False
    ELASTIC_APM["SERVER_URL"] = "http://localhost:8200"

# Subpath (optional)
# This environment variable can be configured during deployment.
SUBPATH = config("SUBPATH", None)
if SUBPATH:
    SUBPATH = f"/{SUBPATH.strip('/')}"

#
# DJANGO REST FRAMEWORK
#
ENABLE_THROTTLING = config("ENABLE_THROTTLING", default=True)

throttle_rate_anon = (
    config("THROTTLE_RATE_ANON", default="2500/hour") if ENABLE_THROTTLING else None
)
throttle_rate_user = (
    config("THROTTLE_RATE_USER", default="15000/hour") if ENABLE_THROTTLING else None
)

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        # used by regular throttle classes
        "anon": throttle_rate_anon,
        "user": throttle_rate_user,
    },
    "DEFAULT_RENDERER_CLASSES": [
        "djangorestframework_camel_case.render.CamelCaseJSONRenderer",
        "djangorestframework_camel_case.render.CamelCaseBrowsableAPIRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "djangorestframework_camel_case.parser.CamelCaseJSONParser",
        "djangorestframework_camel_case.parser.CamelCaseFormParser",
        "djangorestframework_camel_case.parser.CamelCaseMultiPartParser",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "JSON_UNDERSCOREIZE": {"ignore_keys": ("_expand",)},
}


#
# SPECTACULAR - OpenAPI schema generation
#
_DESCRIPTION = """
Open Archiefbeheer provides an API to manage archiving cases.
"""

API_VERSION = "1.0.1"

SPECTACULAR_SETTINGS = {
    "SCHEMA_PATH_PREFIX": "/api/v1",
    "TITLE": "Open Archiefbeheer API",
    "DESCRIPTION": _DESCRIPTION,
    "VERSION": API_VERSION,
    "POSTPROCESSING_HOOKS": [
        "openarchiefbeheer.zaken.api.drf_spectacular.hooks.camelize_serializer_fields_but_not_query_parameters",
        "openarchiefbeheer.selection.api.drf_spectacular.hooks.update_schema_for_dynamic_keys",
    ],
}

#
# Django CORS-headers
#

# This is reflected in the access-control-allow-origin header
# An origin is the scheme (http/https) + the domain name + port number
CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", split=True, default=[])
CORS_ALLOWED_ORIGIN_REGEXES = config(
    "CORS_ALLOWED_ORIGIN_REGEXES", split=True, default=[]
)
CORS_ALLOW_ALL_ORIGINS = config("CORS_ALLOW_ALL_ORIGINS", default=False)

# This is reflected in the Access-Control-Allow-Headers response header.
# It is used in response to a preflight request to indicate which headers can be included in the actual request.
CORS_EXTRA_ALLOW_HEADERS = config("CORS_EXTRA_ALLOW_HEADERS", split=True, default=[])
CORS_ALLOW_HEADERS = (
    *default_headers,
    *CORS_EXTRA_ALLOW_HEADERS,
)

# Reflected in the Access-Control-Expose-Headers header
# Specifies which response headers are exposed to JS in cross-origin requests.
CORS_EXPOSE_HEADERS = ["X-CSRFToken"]

# Reflected in the Access-Control-Allow-Credentials header.
# This response header tells the browser whether to expose the response to the JS when the request's credentials mode
# is 'include'. When used in a preflight response, it tells whether to send credentials (in our case, the cookies).
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    split=True,
    default=[],
)

#
# CELERY
#
CELERY_BROKER_URL = config("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
# Add a 2 hours timeout to all Celery tasks.
CELERY_TASK_SOFT_TIME_LIMIT = config("CELERY_TASK_SOFT_TIME_LIMIT", 7200)

CELERY_BEAT_SCHEDULE = {
    "retrieve-and-cache-zaken": {
        "task": "openarchiefbeheer.zaken.tasks.retrieve_and_cache_zaken_from_openzaak",
        # run every 24 hours, executing the task at 00:00
        "schedule": crontab(hour="0", minute="0"),
    },
    "resync-zaken": {
        "task": "openarchiefbeheer.zaken.tasks.resync_zaken",
        # run every saturday, executing the task at 12:00 (midday)
        "schedule": crontab(day_of_week="sat", hour="12", minute="0"),
    },
    "process-destruction-lists": {
        "task": "openarchiefbeheer.destruction.tasks.queue_destruction_lists_for_deletion",
        # run every 24 hours, executing the task at 12:00
        "schedule": crontab(hour="12", minute="0"),
    },
}

#
# Django OIDC
#
OIDC_AUTHENTICATE_CLASS = "mozilla_django_oidc_db.views.OIDCAuthenticationRequestView"
OIDC_CALLBACK_CLASS = "mozilla_django_oidc_db.views.OIDCCallbackView"
OIDC_REDIRECT_ALLOWED_HOSTS = config(
    "OIDC_REDIRECT_ALLOWED_HOSTS", default="", split=True
)
# See issue #422 and https://mozilla-django-oidc.readthedocs.io/en/2.0.0/installation.html#validate-id-tokens-by-renewing-them
OIDC_RENEW_ID_TOKEN_EXPIRY_SECONDS = config(
    "OIDC_RENEW_ID_TOKEN_EXPIRY_SECONDS", default=60 * 15
)

#
# Django privates
#
PRIVATE_MEDIA_ROOT = os.path.join(BASE_DIR, "private_media")

PRIVATE_MEDIA_URL = "/private-media/"

#
# Django setup configuration
#
SETUP_CONFIGURATION_STEPS = [
    "zgw_consumers.contrib.setup_configuration.steps.ServiceConfigurationStep",
    "openarchiefbeheer.config.setup_configuration.steps.APIConfigConfigurationStep",
    "mozilla_django_oidc_db.setup_configuration.steps.AdminOIDCConfigurationStep",
]
