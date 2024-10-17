.. _devops_oidc:

Configuration for OIDC
======================

- ``SESSION_COOKIE_AGE`` should have the same duration as the identity provider. 
  Otherwise you end up with mismatching sessions between Django and IdP (see Github `issue`_).
  For Keycloak, it should match the realm setting ``ssoSessionIdleTimeout``.

.. _issue: https://github.com/maykinmedia/open-archiefbeheer/issues/422