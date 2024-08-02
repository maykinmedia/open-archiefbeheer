# Generated by Django 4.2.14 on 2024-07-26 14:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("emails", "0003_emailconfig_body_error_during_deletion_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="emailconfig",
            name="body_successful_deletion",
            field=models.TextField(
                blank=True,
                help_text="Body of the email that will be sent to all the assignees when a list is successfully deleted.",
                verbose_name="body successful deletion",
            ),
        ),
        migrations.AddField(
            model_name="emailconfig",
            name="subject_successful_deletion",
            field=models.CharField(
                blank=True,
                help_text="Subject of the email that will be sent to all the assignees when a list is successfully deleted.",
                max_length=250,
                verbose_name="subject successful deletion",
            ),
        ),
    ]