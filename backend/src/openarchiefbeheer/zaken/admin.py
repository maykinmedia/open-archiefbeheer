from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.urls import path, reverse
from django.utils.translation import gettext_lazy as _

from .models import Zaak
from .tasks import resync_zaken


@admin.register(Zaak)
class ZaakAdmin(admin.ModelAdmin):

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            path(
                "resync-zaken/",
                self.admin_site.admin_view(self.queue_resync_zaken),
                name="resync-zaken",
            ),
        ]
        return my_urls + urls

    def queue_resync_zaken(self, request):
        redirect_url = reverse("admin:zaken_zaak_changelist")
        if request.method != "POST":
            self.message_user(
                request,
                _("Only POST request supported."),
                messages.ERROR,
            )
            return HttpResponseRedirect(redirect_url)

        resync_zaken.delay()
        self.message_user(
            request,
            _(
                "Syncing of the zaken will happen in the background. It may take a while."
            ),
            messages.SUCCESS,
        )
        return HttpResponseRedirect(redirect_url)
