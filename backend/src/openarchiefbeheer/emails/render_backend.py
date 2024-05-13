from django.template.backends.django import DjangoTemplates


class SandboxedTemplates(DjangoTemplates):
    def __init__(self, params: dict) -> None:
        params = params.copy()
        params.setdefault("NAME", "django_sandboxed")
        # no file system paths to look up files (also blocks {% include %} etc)
        params.setdefault("DIRS", [])
        params.setdefault("APP_DIRS", False)
        params.setdefault("OPTIONS", {})

        super().__init__(params)

    def get_templatetag_libraries(self, custom_libraries: dict) -> dict:
        """
        The parent returns template tag libraries from installed
        applications and the supplied custom_libraries argument.
        """
        return {}

    def template_dirs(self) -> list:
        """
        The parent returns a list of directories to search for templates.
        We only need to render from string.
        """
        return []


def get_sandboxed_backend() -> SandboxedTemplates:
    return SandboxedTemplates({})
