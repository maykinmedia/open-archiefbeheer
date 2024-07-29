from django.contrib.auth import get_user_model

import factory
from factory.django import DjangoModelFactory

from ..models import Role

User = get_user_model()


class RoleFactory(DjangoModelFactory):
    name = factory.Sequence(lambda n: f"Role {n}")

    class Meta:
        model = Role


class UserFactory(DjangoModelFactory):
    username = factory.Sequence(lambda n: f"user-{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    password = factory.PostGenerationMethodCall("set_password", "password")
    role = factory.SubFactory(RoleFactory)
    email = factory.Faker("email")

    class Meta:
        model = User

    class Params:
        superuser = factory.Trait(
            is_staff=True,
            is_superuser=True,
        )
