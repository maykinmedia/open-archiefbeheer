from django.core.management import BaseCommand

from ...tasks import retrieve_and_cache_zaken_from_openzaak


class Command(BaseCommand):
    help = "Retrieve zaken from Open Zaak and cache them."

    def handle(self, **options):
        self.stdout.write("Retrieving zaken from Open Zaak...")

        retrieve_and_cache_zaken_from_openzaak()

        self.stdout.write("Done.")
