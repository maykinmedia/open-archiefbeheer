# Generated by Django 4.2.11 on 2024-05-13 14:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("zaken", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="zaak",
            name="resultaat",
        ),
        migrations.RemoveField(
            model_name="zaak",
            name="zaaktype",
        ),
        migrations.AddField(
            model_name="zaak",
            name="resultaat",
            field=models.JSONField(blank=True, null=True, verbose_name="resultaat"),
        ),
        migrations.AddField(
            model_name="zaak",
            name="zaaktype",
            field=models.JSONField(blank=True, null=True, verbose_name="zaaktype"),
        ),
    ]
