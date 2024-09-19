import functools
from typing import Callable


def log_errors(logger_func: Callable) -> Callable:
    def decorator_func(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper_func(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
            except Exception as exc:
                logger_func(exc)
                raise exc
            return result

        return wrapper_func

    return decorator_func
