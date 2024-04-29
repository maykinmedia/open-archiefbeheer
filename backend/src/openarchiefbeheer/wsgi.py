"""
WSGI config for openarchiefbeheer project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""
import os

from django.core.wsgi import get_wsgi_application

from openarchiefbeheer.setup import setup_env

setup_env()

application = get_wsgi_application()
