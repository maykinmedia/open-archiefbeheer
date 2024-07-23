.. _developers_gherkin-like-tests:

==================
Gherkin-like tests
==================

This is an addition to regular end-to-end (e2e) tests. A `Gherkin`_-style test can be implemented using the experimental
`GherkinLikeTestCase` class, which allows tests be written in a somewhat human-readable way. This allows developers to hide
away implementation details while dealing with `Playwright`_ or other issues when running e2e tests, while keeping tests
easy to read and easy to write.

.. _Gherkin: https://cucumber.io/docs/gherkin/reference/
.. _Playwright: https://playwright.dev

Example:

.. code:: Python

    from django.test import tag

    from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase
    from openarchiefbeheer.utils.tests.e2e import browser_page


    @tag("e2e")
    class FeatureLogin(GherkinLikeTestCase):
        async def test_scenario_log_in(self):
            async with browser_page() as page:
                await self.given.record_manager_exists()
                await self.when.record_manager_logs_in(page)
                await self.then.page_should_contain_text(page, "Vernietigingslijsten")


Gherkin
=======

Gherkin is a language used for writing structured documentation that describes software behaviors without detailing how
that functionality is implemented.

Gherkin implements various keywords (Feature, Scenario, Given, When, Then):

- **Feature** Defines a feature or a functionality.
- **Scenario** Defines a particular situation or example.
- **Given** Describes the initial context or state of the system.
- **When** Specifies an action or event that occurs.
- **Then** Describes the expected outcome or result.

Usage in tests
==============

The Gherkin-like implementation of this project focuses on compatibility/compliance with the Python/Django ecosystem
rather than following Gherkin as a strict syntax. The implementation is also *not* compatible with the `Cucumber`_ tool.

.. _Cucumber: https://cucumber.io

**Feature**

Test files for features should be created as python files within the specific Django app, e.g.
`tests/e2e/feature/test_feature_login.py`.

**Scenario**

Scenarios should be implemented as test classes within the feature file, they should extend from `GherkinLikeTestCase`
and be annotated with the `tag` decorator set to `e2e`.

Example:

.. code:: python

    from django.test import tag

    from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCase


    @tag("e2e")
    class FeatureLoginTests(GherkinLikeTestCase):
        pass


**Given, When, Then**

The `src/utils/tests/gherkin.py` file contains the `GherkinLikeTestCase` class, which contains the `Given`,
`When` and `Then` classes. These classes contain domain specific methods that can be called using their respective
`given`, `when` or `then` property on the  `GherkinLikeTestCase`.

Example:

.. code:: python

    from django.test import tag

    from openarchiefbeheer.utils.tests.gherkin import GherkinLikeTestCasekeTestCase
    from openarchiefbeheer.utils.tests.e2e import browser_page


    @tag("e2e")
    class FeatureLoginTests(GherkinLikeTestCase):
        async with browser_page() as page:
            await self.given.record_manager_exists()
            await self.when.record_manager_logs_in(page)
            await self.then.page_should_contain_text(page, "Vernietigingslijsten")


*Given*

Given describes the initial context or state of the system. The `Given` class can be extended with reusable methods that
setup the system for testing, e.g. by calling factories.

.. code:: python

    async with browser_page() as page:
        await self.given.record_manager_exists()


*When*

`When` specifies an action or event. The `When` class can be extended with reusable methods that perform certain actions,
e.g. clicking a button. Every public method in the `When` class should take `page` (the current Playwright page) as
first argument. This argument should be one of either `browser_page` or `browser_page_with_tracing` and should be
shared for all `when.` calls using `with` statement.

.. code:: python

    async with browser_page() as page:
        await self.when.record_manager_logs_in(page)


*Then*

`Then` describes the expected outcome. The `Then` class can be extended with reusable methods that perform assertions on
the current outcome. Just like `when.` methods, the first argument should always be the Playwright `page`.


.. code:: python

    async with browser_page() as page:
        await self.then.page_should_contain_text(page, "Vernietigingslijsten")
