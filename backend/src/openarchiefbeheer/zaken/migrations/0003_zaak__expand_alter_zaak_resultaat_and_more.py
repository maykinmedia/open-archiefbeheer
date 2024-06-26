# Generated by Django 4.2.11 on 2024-05-14 12:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("zaken", "0002_alter_zaak_resultaat_and_zaak_zaaktype"),
    ]

    operations = [
        migrations.AddField(
            model_name="zaak",
            name="_expand",
            field=models.JSONField(
                blank=True, default=dict, null=True, verbose_name="expand"
            ),
        ),
        migrations.AlterField(
            model_name="zaak",
            name="resultaat",
            field=models.URLField(blank=True, null=True, verbose_name="resultaat"),
        ),
        migrations.AlterField(
            model_name="zaak",
            name="zaaktype",
            field=models.URLField(blank=True, null=True, verbose_name="zaaktype"),
        ),
    ]
