# Generated by Django 4.2.11 on 2024-05-23 09:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("destruction", "0002_destructionlistassignee"),
    ]

    operations = [
        migrations.AddField(
            model_name="destructionlist",
            name="status_changed",
            field=models.DateTimeField(
                blank=True,
                help_text="Tracks when the status was changed.",
                null=True,
                verbose_name="status changed",
            ),
        ),
    ]