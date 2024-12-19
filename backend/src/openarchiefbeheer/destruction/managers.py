from django.db.models import Manager, Prefetch, QuerySet

from openarchiefbeheer.accounts.models import User


class DestructionListQuerySet(QuerySet):
    def permitted_for_user(self, user: User):
        """
        Returns a queryset filtered to items visible to the given user.
        Visibility is granted if the user has the 'accounts.can_start_destruction'
        permission or is assigned to the list.
        """
        if user.has_perm("accounts.can_start_destruction"):
            return self

        return self.filter(assignees__user__in=[user.pk])

    def annotate_user_permissions(self):
        """
        Adds `user_permission_codenames` and `group_permission_codenames` as `ArrayField` to the `author`,
        `assignee`, and `assignees__user` in the current QuerySet containing the codenames of the applicable
        permissions. `user_permissions` and `permissions` are prefetched to minimize queries.

        This is used to avoid n+1 issues with nested `UserSerializer`.
        """
        from openarchiefbeheer.destruction.models import DestructionListAssignee

        return self.prefetch_related(
            Prefetch(
                "author",
                queryset=User.objects.annotate_permissions(),
            ),
            Prefetch(
                "assignee",
                queryset=User.objects.annotate_permissions(),
            ),
            Prefetch(
                "assignees",
                queryset=DestructionListAssignee.objects.prefetch_related(
                    Prefetch(
                        "user",
                        queryset=User.objects.annotate_permissions(),
                    )
                ).order_by("pk"),
            ),
        )


class DestructionListManager(Manager.from_queryset(DestructionListQuerySet)):
    pass
