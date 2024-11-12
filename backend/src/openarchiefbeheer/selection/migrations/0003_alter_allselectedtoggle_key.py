# Generated by Django 4.2.16 on 2024-11-12 14:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("selection", "0002_allselectedtoggle"),
    ]

    operations = [
        migrations.AlterField(
            model_name="allselectedtoggle",
            name="key",
            field=models.CharField(
                help_text="The key to access this selection. ",
                max_length=250,
                unique=True,
                verbose_name="key",
            ),
        ),
    ]
