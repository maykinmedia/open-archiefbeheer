# Generated by Django 4.2.15 on 2024-08-13 10:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("zaken", "0004_alter_zaak_archiefnominatie"),
    ]

    operations = [
        migrations.AlterField(
            model_name="zaak",
            name="url",
            field=models.URLField(max_length=1000, unique=True, verbose_name="URL"),
        ),
    ]
