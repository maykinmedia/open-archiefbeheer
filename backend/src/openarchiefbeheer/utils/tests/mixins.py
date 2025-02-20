from django.core.cache import cache


class ClearCacheMixin:
    def setUp(self):
        super().setUp()

        self.addCleanup(cache.clear)
