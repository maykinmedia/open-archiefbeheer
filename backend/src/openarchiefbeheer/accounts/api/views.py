from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.generics import ListAPIView, RetrieveAPIView

from ..models import User
from .filtersets import UsersFilterset
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
    filter_backends = (DjangoFilterBackend,)
    filterset_class = UsersFilterset

    def get_queryset(self) -> QuerySet[User]:
        return User.objects.annotate_permissions()


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
