from typing import TYPE_CHECKING

from django.conf import settings
from django.core.mail import send_mail

if TYPE_CHECKING:
    from openarchiefbeheer.accounts.models import User
    from openarchiefbeheer.destruction.models import DestructionList

from .models import EmailConfig
from .render_backend import get_sandboxed_backend


def send_review_request_email(
    user: "User", destruction_list: "DestructionList"
) -> None:
    config = EmailConfig.get_solo()

    backend = get_sandboxed_backend()
    template = backend.from_string(config.body_review_required)

    formatted_body = template.render(context={"user": user, "list": destruction_list})

    send_mail(
        subject=config.subject_review_required,
        message=formatted_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
