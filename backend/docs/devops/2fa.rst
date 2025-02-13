.. _devops_2fa:

===============
Configuring 2FA
===============

Environment variables
=====================

When using the WebAuthn plugin to use hardware tokens, the following variables should be set:

- ``TWO_FACTOR_WEBAUTHN_RP_NAME``: The relying party name is used to scope the device to an intstance of an 
  application. So it should be application **and** instance specific. For example, ``openarchiefbeheer-maykin-test``.
- ``TWO_FACTOR_WEBAUTHN_AUTHENTICATOR_ATTACHMENT``: Possible values: ``platform | cross-platform``. 
  With "platform" it is possible to use embedded fingerprint readers, while with "cross-platform" an external 
  device needs to be used.