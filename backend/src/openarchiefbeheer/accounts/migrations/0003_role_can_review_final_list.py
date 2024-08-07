# Generated by Django 4.2.11 on 2024-06-28 11:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_role_user_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="role",
            name="can_review_final_list",
            field=models.BooleanField(
                default=False,
                help_text="Indicates whether a user is an 'archivist'. This user can only review lists that have been marked as 'final'.",
                verbose_name="can review final list",
            ),
        ),
    ]
