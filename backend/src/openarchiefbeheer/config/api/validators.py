from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _

from rest_framework.exceptions import ValidationError

RSIN_LENGTH = 9

validate_digits = RegexValidator(
    regex="^[0-9]+$",
    message=_("The characters can only be digits."),
    code="only-digits",
)


def validate_rsin(value: str) -> None:
    """
    Validates that a string value is a valid RSIN by applying the
    '11-proef' checking.

    :param value: String object representing a presumably good RSIN.
    """
    validate_digits(value)
    if len(value) != RSIN_LENGTH:
        raise ValidationError(
            _("A RSIN must be %(length)s characters long.") % {"length": RSIN_LENGTH},
            code="invalid-length",
        )

    # 11-proef check.
    total = 0
    for multiplier, char in enumerate(reversed(value), start=1):
        if multiplier == 1:
            total += -multiplier * int(char)
        else:
            total += multiplier * int(char)

    if total % 11 != 0:
        raise ValidationError(_("Invalid RSIN."), code="invalid")
