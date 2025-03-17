# Generated by Django 4.2.18 on 2025-03-14 16:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("config", "0007_alter_archiveconfig_zaaktype"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="archiveconfig",
            name="selectielijstklasse",
        ),
        migrations.AlterField(
            model_name="archiveconfig",
            name="resultaattype",
            field=models.URLField(
                help_text="The result type URL to use when creating the case for the destruction list deletion.",
                max_length=1000,
                verbose_name="resultaattype",
            ),
        ),
    ]
