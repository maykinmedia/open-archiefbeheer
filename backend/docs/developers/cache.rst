.. _developers_cache:

Caching 
=======

Backend
-------

Functools cache
^^^^^^^^^^^^^^^

We currently use ``lru_cache`` for the retrieval of a particular ZGW service and the creation of a client from it.
The ``lru_cache`` does not expire, but it grows up to a maxsize (for more info, see the `docs <https://docs.python.org/3/library/functools.html#functools.lru_cache>`_).
If there are any changes to the a ``Service``, then a signal receiver will clear the cache.

There is also a signal receiver listening for changes to ``APIConfig`` which clears the cache for creating the client for the selectielijst API Service.

Django cache
^^^^^^^^^^^^

We use the decorators ``@_cached`` and ``@_cached_with_args`` for functions that make requests to Open Zaak and perform expensive work with the results.
These decorators cache the results in the Django ``"default"`` cache. This gives us the possibility of easily clearing them all if we know that something has changed in Open Zaak.

``@_cached_with_args`` is meant for functions that take one or more string arguments, for example urls:

.. code:: python

    @_cached_with_args
    def retrieve_selectielijstklasse_resultaat(resultaat_url: str) -> JSONValue:
        ...

The View ``ClearDefaultCacheView`` enables to clear the default cache with an API call. 

Tests
^^^^^

Previously we used to mock the ``get_solo`` method of Solo objects since this method caches the retrieved object.
Now, for the ``APIConfig`` model we have the ``APIConfigFactory``, which clears the solo cache before creating a new solo object for the test.

Frontend
--------

.. TODO