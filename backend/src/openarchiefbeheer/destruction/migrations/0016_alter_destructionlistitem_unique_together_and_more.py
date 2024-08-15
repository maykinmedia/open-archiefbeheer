# Generated by Django 4.2.15 on 2024-08-09 12:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("destruction", "0015_alter_destructionlistassignee_options_and_more"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="destructionlistitem",
            unique_together=set(),
        ),
        migrations.RenameField(
            model_name="destructionlistitem", old_name="zaak", new_name="zaak_url"
        ),
        migrations.AlterField(
            model_name="destructionlistitem",
            name="zaak_url",
            field=models.URLField(
                db_index=True,
                help_text="URL-reference to the ZAAK (in Zaken API), which is planned to be destroyed.",
                verbose_name="zaak_url",
                blank=True,
            ),
        ),
    ]
