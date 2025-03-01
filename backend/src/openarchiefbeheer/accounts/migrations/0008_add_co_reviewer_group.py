# Generated by Django 4.2.16 on 2024-10-30 08:50

from django.db import migrations


def create_co_reviewer_group(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    User = apps.get_model("accounts", "User")
    ContentType = apps.get_model("contenttypes", "ContentType")

    can_co_review, _ = Permission.objects.get_or_create(
        codename="can_co_review_destruction",
        name="Can co-review destruction",
        content_type=ContentType.objects.get_for_model(User),
    )

    co_reviewers_group, _ = Group.objects.get_or_create(name="Co-reviewer")
    co_reviewers_group.permissions.add(can_co_review)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_add_superuser_group"),
    ]

    operations = [
        migrations.RunPython(create_co_reviewer_group, migrations.RunPython.noop),
    ]
