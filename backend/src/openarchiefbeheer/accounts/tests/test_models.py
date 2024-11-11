from django.test import TransactionTestCase

from .factories import UserFactory


class TestUserModel(TransactionTestCase):
    def test_string_method(self):
        with self.subTest("With all names"):
            user = UserFactory.create(
                first_name="John", last_name="Doe", username="jdoe"
            )

            self.assertEqual(str(user), "John Doe (jdoe)")

        with self.subTest("With one name"):
            user = UserFactory.create(first_name="", last_name="Doe", username="jodoe")

            self.assertEqual(str(user), "Doe (jodoe)")

        with self.subTest("With no name"):
            user = UserFactory.create(first_name="", last_name="", username="johndoe")

            self.assertEqual(str(user), "johndoe")
