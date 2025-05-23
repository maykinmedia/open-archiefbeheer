from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission

import factory
from factory import post_generation
from factory.django import DjangoModelFactory

User = get_user_model()


class UserFactory(DjangoModelFactory):
    username = factory.Sequence(lambda n: f"user-{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    password = factory.PostGenerationMethodCall("set_password", "password")
    email = factory.Faker("email")

    class Meta:
        model = User
        django_get_or_create = ("username",)

    class Params:
        superuser = factory.Trait(
            is_staff=True,
            is_superuser=True,
        )

    @post_generation
    def post(user, create, extracted, **kwargs):
        if not create:
            return

        for item, value in kwargs.items():
            if not value:
                continue

            assert item in [
                "can_review_final_list",
                "can_start_destruction",
                "can_review_destruction",
                "can_co_review_destruction",
                "can_configure_application",
            ]

            if not (permission := Permission.objects.filter(codename=item).first()):
                print(">>>>> NO PERMISSION, ", item)
                continue

            # permission = Permission.objects.get(codename=item)
            user.user_permissions.add(permission)
