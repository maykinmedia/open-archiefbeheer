import copy

import factory


class SelectionItemFactory(factory.django.DjangoModelFactory):
    key = factory.Faker("word")
    zaak_url = factory.Faker("url")
    selection_data = factory.LazyAttribute(
        lambda item: copy.copy({"selected": item.is_selected, "detail": {}})
    )

    class Meta:
        model = "selection.SelectionItem"

    class Params:
        is_selected = False
