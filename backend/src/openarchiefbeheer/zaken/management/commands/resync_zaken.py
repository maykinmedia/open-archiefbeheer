from django.core.management import BaseCommand

from ...tasks import resync_zaken


class Command(BaseCommand):
    help = "Resync the zaken cached locally with Open Zaak."

    def handle(self, **options):
        self.stdout.write("Retrieving zaken from Open Zaak...")

        resync_zaken()

        self.stdout.write("Done.")
