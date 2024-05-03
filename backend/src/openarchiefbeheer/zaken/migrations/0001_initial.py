# Generated by Django 4.2.11 on 2024-05-03 10:27

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Zaak",
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
                    "data",
                    models.JSONField(
                        help_text="The data of the zaak, retrieved from Zaak API",
                        verbose_name="data",
                    ),
                ),
            ],
            options={
                "verbose_name": "Zaak",
                "verbose_name_plural": "Zaken",
            },
        ),
    ]
