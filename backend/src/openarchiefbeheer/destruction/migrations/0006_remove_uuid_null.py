# Generated by Django 4.2.11 on 2024-06-06 09:17

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("destruction", "0005_populate_uuid_values"),
    ]

    operations = [
        migrations.AlterField(
            model_name="destructionlist",
            name="uuid",
            field=models.UUIDField(
                default=uuid.uuid4, unique=True, verbose_name="uuid"
            ),
        ),
    ]
