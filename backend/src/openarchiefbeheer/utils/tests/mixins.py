from django.core.cache import caches


class ClearCacheMixin:
    def setUp(self):
        super().setUp()

        for cache in caches:
            caches[cache].clear()
            self.addCleanup(caches[cache].clear)
