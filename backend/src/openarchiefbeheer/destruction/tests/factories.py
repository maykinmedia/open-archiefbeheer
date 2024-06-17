import factory.fuzzy

from openarchiefbeheer.accounts.tests.factories import UserFactory

from ..constants import ListRole


class DestructionListFactory(factory.django.DjangoModelFactory):
    name = factory.Faker("word")
    author = factory.SubFactory(UserFactory)

    class Meta:
        model = "destruction.DestructionList"


class DestructionListAssigneeFactory(factory.django.DjangoModelFactory):
    destruction_list = factory.SubFactory(DestructionListFactory)
    role = ListRole.reviewer

    class Meta:
        model = "destruction.DestructionListAssignee"


class DestructionListItemFactory(factory.django.DjangoModelFactory):
    destruction_list = factory.SubFactory(DestructionListFactory)
    zaak = factory.Faker("url")

    class Meta:
        model = "destruction.DestructionListItem"


class DestructionListReviewFactory(factory.django.DjangoModelFactory):
    destruction_list = factory.SubFactory(DestructionListFactory)
    author = factory.SubFactory(UserFactory)

    class Meta:
        model = "destruction.DestructionListReview"


class DestructionListItemReviewFactory(factory.django.DjangoModelFactory):
    destruction_list = factory.SubFactory(DestructionListFactory)
    destruction_list_item = factory.SubFactory(
        DestructionListItemFactory,
        destruction_list=factory.SelfAttribute("..destruction_list"),
    )
    review = factory.SubFactory(
        DestructionListReviewFactory,
        destruction_list=factory.SelfAttribute("..destruction_list"),
    )

    class Meta:
        model = "destruction.DestructionListItemReview"
