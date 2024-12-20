from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from drf_spectacular.utils import extend_schema
from rest_framework.generics import ListAPIView, RetrieveAPIView

from openarchiefbeheer.accounts.models import User

from .serializers import UserSerializer


@extend_schema(
    tags=["Users"],
    summary=_("Users list"),
    description=_("List all the users."),
    responses={
        200: UserSerializer(many=True),
    },
)
class UsersView(ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self) -> QuerySet[User]:
        return User.objects.all()


@extend_schema(
    tags=["Users"],
    summary=_("Record managers list"),
    description=_(
        "List all the users that have the permission to create destruction lists."
    ),
    responses={
        200: UserSerializer(many=True),
    },
)
class RecordManagersView(ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self) -> QuerySet[User]:
        return User.objects.record_managers()


@extend_schema(
    tags=["Users"],
    summary=_("Main reviewers list"),
    description=_(
        "List all the users that have the permission to review draft destruction lists."
    ),
    responses={
        200: UserSerializer(many=True),
    },
)
class MainReviewersView(ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self) -> QuerySet[User]:
        return User.objects.main_reviewers()


@extend_schema(
    tags=["Users"],
    summary=_("Co-reviewers list"),
    description=_(
        "List all the users that have the permission to co-review draft destruction lists."
    ),
    responses={
        200: UserSerializer(many=True),
    },
)
class CoReviewersView(ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self) -> QuerySet[User]:
        return User.objects.co_reviewers()


@extend_schema(
    tags=["Users"],
    summary=_("Archivists list"),
    description=_(
        "List all the users that have the permission to review final destruction lists."
    ),
    responses={
        200: UserSerializer(many=True),
    },
)
class ArchivistsView(ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self) -> QuerySet[User]:
        return User.objects.archivists()


@extend_schema(
    tags=["Users"],
    summary=_("Who Am I"),
    description=_("Returns the current logged in user."),
    responses={
        200: UserSerializer(),
    },
)
class WhoAmIView(RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self) -> User:
        return self.request.user
