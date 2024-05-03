from django.conf import settings

from celery import Celery

from .setup import setup_env

setup_env()

app = Celery(
    "openarchiefbeheer",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    task_soft_time_limit=settings.CELERY_TASK_SOFT_TIME_LIMIT,
)
app.autodiscover_tasks()
