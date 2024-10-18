import random

import factory


def get_selection_data():
    return {"selected": random.choice([True, False]), "details": {}}


class SelectionItemFactory(factory.django.DjangoModelFactory):
    key = factory.Faker("word")
    zaak_url = factory.Faker("url")
    selection_data = factory.LazyFunction(get_selection_data)

    class Meta:
        model = "selection.SelectionItem"

    class Params:
        is_selected = factory.Trait(selection_data__selected=True)
