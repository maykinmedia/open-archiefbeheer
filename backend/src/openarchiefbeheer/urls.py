from django.apps import apps
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import include, path
from django.views.generic.base import TemplateView

from maykin_2fa import monkeypatch_admin
from maykin_2fa.urls import urlpatterns, webauthn_urlpatterns
from mozilla_django_oidc_db.views import AdminLoginFailure

from openarchiefbeheer.accounts.views.password_reset import PasswordResetView

# Configure admin

monkeypatch_admin()

handler500 = "maykin_common.views.server_error"
admin.site.site_header = "openarchiefbeheer admin"
admin.site.site_title = "openarchiefbeheer admin"
admin.site.index_title = "Welcome to the openarchiefbeheer admin"

# URL routing

urlpatterns = [
    path(
        "admin/password_reset/",
        PasswordResetView.as_view(),
        name="admin_password_reset",
    ),
    path(
        "admin/password_reset/done/",
        auth_views.PasswordResetDoneView.as_view(),
        name="password_reset_done",
    ),
    # Use custom login views for the admin + support hardware tokens
    path("admin/", include((urlpatterns, "maykin_2fa"))),
    path("admin/", include((webauthn_urlpatterns, "two_factor"))),
    path("admin/hijack/", include("hijack.urls")),
    path("admin/", admin.site.urls),
    path("admin/login/failure/", AdminLoginFailure.as_view(), name="admin-oidc-error"),
    path(
        "reset/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    path(
        "reset/done/",
        auth_views.PasswordResetCompleteView.as_view(),
        name="password_reset_complete",
    ),
    path("oidc/", include("mozilla_django_oidc.urls")),
    path("api/", include("openarchiefbeheer.api.urls", namespace="api")),
    # Simply show the master template.
    path("", TemplateView.as_view(template_name="master.html"), name="root"),
]

# NOTE: The staticfiles_urlpatterns also discovers static files (ie. no need to run collectstatic). Both the static
# folder and the media folder are only served via Django if DEBUG = True.
urlpatterns += staticfiles_urlpatterns() + static(
    settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
)

if settings.DEBUG and apps.is_installed("debug_toolbar"):
    import debug_toolbar

    urlpatterns = [
        path("__debug__/", include(debug_toolbar.urls)),
    ] + urlpatterns

# Serve frontend paths
#
# For this to work, you need to have built the frontend (`npm run build` in the frontend/ dir). We explicitly set all
# the used (base) paths here, in the future we might use `re_path` if the amount of paths  increases.
if settings.E2E_SERVE_FRONTEND:
    urlpatterns = [
        path("", TemplateView.as_view(template_name="index.html"), name="frontend"),
        path(
            "login",
            TemplateView.as_view(template_name="index.html"),
            name="frontend-login",
        ),
        path(
            "logout",
            TemplateView.as_view(template_name="index.html"),
            name="frontend-logout",
        ),
    ] + urlpatterns
