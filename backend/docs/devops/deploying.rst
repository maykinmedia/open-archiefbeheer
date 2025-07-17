.. _devops_deploying:

=========
Deploying
=========

We currently have 2 ways to deploy:

#. With Ansible: 
   For deploying with Ansible, we use the ``maykinmedia/commonground-deployment`` repo.
#. With Kubernetes:
   For deploying with Kubernetes, we use the charts in the ``maykinmedia/charts`` repo and the values in the ``maykinmedia/kubernetes-deployment`` repo.

Please see the respective (private) repositories mentioned above for more information on deployment.

Open Zaak
=========

The minimum supported version of Open Zaak is ``1.18.0``.

.. _devops-deploying-configuration:

Configuration
=============

After a successful deploy, the app will show a banner saying that there are errors that need to be fixed. This is **not**
something that went wrong during deployment, but it means that the application still needs to be configured.

.. figure:: ./_assets/health-check-error.png
   :align: center
   :alt: Banner reporting that health checks detected configuration errors.

This configuration is meant to be done by Administrators with specific domain-knowledge of the processes. For this reason,
this part of the configuration was not automated via ``django-setup-configuration``.