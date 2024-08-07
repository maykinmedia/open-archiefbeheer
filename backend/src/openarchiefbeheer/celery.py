from celery import Celery

from .setup import setup_env

setup_env()

app = Celery(
    "openarchiefbeheer",
)
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
