# Generated by Django 4.2.11 on 2024-06-26 13:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("emails", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="emailconfig",
            name="body_last_review",
            field=models.TextField(
                blank=True,
                help_text="Body of the email that will be sent to the record manager when the last reviewer has approved a destruction list.",
                verbose_name="body last review",
            ),
        ),
        migrations.AddField(
            model_name="emailconfig",
            name="body_positive_review",
            field=models.TextField(
                blank=True,
                help_text="Body of the email that will be sent to the record manager when a reviewer has approved a destruction list.",
                verbose_name="body positive review",
            ),
        ),
        migrations.AddField(
            model_name="emailconfig",
            name="subject_last_review",
            field=models.CharField(
                blank=True,
                help_text="Subject of the email that will be sent to the record manager when the last reviewer has approved a destruction list.",
                max_length=250,
                verbose_name="subject last review",
            ),
        ),
        migrations.AddField(
            model_name="emailconfig",
            name="subject_positive_review",
            field=models.CharField(
                blank=True,
                help_text="Subject of the email that will be sent to the record manager when a reviewer has approved a destruction list.",
                max_length=250,
                verbose_name="subject positive review",
            ),
        ),
    ]