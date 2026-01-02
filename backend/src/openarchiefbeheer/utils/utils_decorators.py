import functools
import inspect

from requests_mock.mocker import Mocker


class AsyncCapableRequestsMock(Mocker):
    """
    Extends the `Mock` class with asynchronous mocking capabilities.

    The AsyncCapableRequestsMock class provides functionality for decorating both
    synchronous and asynchronous callables, enabling support for mocking
    in scenarios where asynchronous functions are used. This ensures
    flexible testing and a consistent interface, regardless of whether the
    callable is synchronous or asynchronous.
    """

    def decorate_callable(self, func):
        """Decorates a callable

        :param callable func: callable to decorate
        """
        is_async = inspect.iscoroutinefunction(func)

        def prepare_args(args, kwargs, m):
            if self._kw:
                kwargs[self._kw] = m
            else:
                args = list(args)
                args.append(m)
            return args, kwargs

        if is_async:

            @functools.wraps(func)
            async def inner(*args, **kwargs):
                with self.copy() as m:
                    args, kwargs = prepare_args(args, kwargs, m)
                    return await func(*args, **kwargs)

        else:

            @functools.wraps(func)
            def inner(*args, **kwargs):
                with self.copy() as m:
                    args, kwargs = prepare_args(args, kwargs, m)
                    return func(*args, **kwargs)

        return inner
