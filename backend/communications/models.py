import uuid

from django.db import models

from applications.models import Application


class Communication(models.Model):
    class Type(models.TextChoices):
        EMAIL = "email", "Email"
        PHONE_CALL = "phone_call", "Phone Call"
        INTERVIEW = "interview", "Interview"
        OFFER = "offer", "Offer"
        REJECTION = "rejection", "Rejection"
        OTHER = "other", "Other"

    class Direction(models.TextChoices):
        INBOUND = "inbound", "Inbound"
        OUTBOUND = "outbound", "Outbound"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="communications"
    )
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.EMAIL)
    direction = models.CharField(max_length=10, choices=Direction.choices, default=Direction.INBOUND)
    contact_name = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    occurred_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-occurred_at"]

    def __str__(self):
        return f"{self.type} with {self.application} on {self.occurred_at:%Y-%m-%d}"
