from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema
from rest_framework.generics import ListAPIView

from openarchiefbeheer.accounts.models import User

from .serializers import UserSerializer


@extend_schema(
    summary=_("Reviewers list"),
    description=_(
        "List all the users that have the permission to review destruction lists."
    ),
    responses={
        200: UserSerializer(many=True),
    },
)
class ReviewersView(ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self) -> QuerySet[User]:
        return User.objects.reviewers()
