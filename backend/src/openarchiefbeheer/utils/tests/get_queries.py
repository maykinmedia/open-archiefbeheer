from django.db import DEFAULT_DB_ALIAS, connections
from django.test.utils import CaptureQueriesContext


def executed_queries():
    conn = connections[DEFAULT_DB_ALIAS]

    return CaptureQueriesContext(conn)
