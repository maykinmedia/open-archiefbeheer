import factory.fuzzy
from factory import post_generation

from openarchiefbeheer.accounts.tests.factories import UserFactory
from openarchiefbeheer.zaken.tests.factories import ZaakFactory


class DestructionListFactory(factory.django.DjangoModelFactory):
    name = factory.Faker("word")
    author = factory.SubFactory(UserFactory)
    assignee = factory.SelfAttribute("author")

    class Meta:
        model = "destruction.DestructionList"
        django_get_or_create = ("name",)


class DestructionListAssigneeFactory(factory.django.DjangoModelFactory):
    destruction_list = factory.SubFactory(DestructionListFactory)
    user = factory.SubFactory(UserFactory)

    class Meta:
        model = "destruction.DestructionListAssignee"


class DestructionListItemFactory(factory.django.DjangoModelFactory):
    destruction_list = factory.SubFactory(DestructionListFactory)

    class Meta:
        model = "destruction.DestructionListItem"

    class Params:
        with_zaak = factory.Trait(
            zaak=factory.SubFactory(ZaakFactory),
        )


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

    @post_generation
    def post(review_response, create, extracted, **kwargs):
        if not create:
            return

        DestructionListAssigneeFactory.create(
            destruction_list=review_response.review.destruction_list,
        )
