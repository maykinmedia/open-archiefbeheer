# Generated by Django 4.2.11 on 2024-05-13 08:17

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="EmailConfig",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "subject_review_required",
                    models.CharField(
                        help_text="Subject of the email that will be sent to a reviewer when there is a destruction list ready to be reviewed.",
                        max_length=250,
                        verbose_name="subject review required",
                    ),
                ),
                (
                    "body_review_required",
                    models.TextField(
                        help_text="Body of the email that will be sent to a reviewer when there is a destruction list ready to be reviewed.",
                        verbose_name="body review required",
                    ),
                ),
                (
                    "subject_review_reminder",
                    models.CharField(
                        help_text="Subject of the email that will be sent to a reviewer after a configured period of time if they still haven't reviewed a destruction list.",
                        max_length=250,
                        verbose_name="subject review reminder",
                    ),
                ),
                (
                    "body_review_reminder",
                    models.TextField(
                        help_text="Body of the email that will be sent to a reviewer after a configured period of time if they still haven't reviewed a destruction list.",
                        verbose_name="body review reminder",
                    ),
                ),
                (
                    "subject_changes_requested",
                    models.CharField(
                        help_text="Subject of the email that will be sent to the record manager when a reviewer has requested changes to a destruction list.",
                        max_length=250,
                        verbose_name="subject changes requested",
                    ),
                ),
                (
                    "body_changes_requested",
                    models.TextField(
                        help_text="Body of the email that will be sent to the record manager when a reviewer has requested changes to a destruction list.",
                        verbose_name="body changes requested",
                    ),
                ),
            ],
            options={
                "verbose_name": "email configuration",
                "verbose_name_plural": "email configurations",
            },
        ),
    ]