import factory.fuzzy

from openarchiefbeheer.accounts.tests.factories import UserFactory


class DestructionListFactory(factory.django.DjangoModelFactory):
    name = factory.Faker("word")
    author = factory.SubFactory(UserFactory)

    class Meta:
        model = "destruction.DestructionList"


class DestructionListAssigneeFactory(factory.django.DjangoModelFactory):
    destruction_list = factory.SubFactory(DestructionListFactory)

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


class ReviewItemResponseFactory(factory.django.DjangoModelFactory):
    review_item = factory.SubFactory(DestructionListItemReviewFactory)

    class Meta:
        model = "destruction.ReviewItemResponse"


class ReviewResponseFactory(factory.django.DjangoModelFactory):
    review = factory.SubFactory(DestructionListReviewFactory)

    class Meta:
        model = "destruction.ReviewResponse"
