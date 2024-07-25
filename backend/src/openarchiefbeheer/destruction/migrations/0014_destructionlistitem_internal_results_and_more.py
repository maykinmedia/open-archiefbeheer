# Generated by Django 4.2.11 on 2024-07-12 13:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("destruction", "0013_destructionlist_processing_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="destructionlistitem",
            name="internal_results",
            field=models.JSONField(
                default=dict,
                help_text="When this item gets processed, the URL of the resources deleted from Open Zaak get stored here.",
                verbose_name="internal result",
            ),
        ),
        migrations.AddField(
            model_name="destructionlistitem",
            name="processing_status",
            field=models.CharField(
                choices=[
                    ("new", "new"),
                    ("queued", "queued"),
                    ("processing", "processing"),
                    ("failed", "failed"),
                    ("succeeded", "succeeded"),
                ],
                default="new",
                help_text="Field used to track the status of the deletion of a destruction list item.",
                max_length=80,
                verbose_name="processing status",
            ),
        ),
    ]
