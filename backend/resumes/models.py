import uuid

from django.conf import settings
from django.db import models

from applications.models import Application


class Resume(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resumes"
    )
    title = models.CharField(max_length=255)
    is_master = models.BooleanField(default=False)
    based_on = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="tailored_versions",
    )
    application = models.ForeignKey(
        Application,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="resumes",
        help_text="Set when this resume is a tailored version for a specific application.",
    )
    content = models.TextField(blank=True)
    file = models.FileField(upload_to="resumes/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner"],
                condition=models.Q(is_master=True),
                name="unique_master_resume_per_owner",
            )
        ]

    def __str__(self):
        return self.title
