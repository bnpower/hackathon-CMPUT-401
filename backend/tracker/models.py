from django.conf import settings
from django.db import models


class Application(models.Model):
    class Status(models.TextChoices):
        APPLIED = "Applied", "Applied"
        INTERVIEW = "Interview", "Interview"
        OFFER = "Offer", "Offer"
        REJECTION = "Rejection", "Rejection"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications")
    company = models.CharField(max_length=100)
    position = models.CharField(max_length=150)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)
    follow_up = models.DateField(blank=True, null=True)
    source_job_id = models.PositiveIntegerField(blank=True, null=True)
    job_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.position} at {self.company}"


class SavedJob(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_jobs")
    job_id = models.PositiveIntegerField()
    job_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "job_id"], name="unique_saved_job_per_user"),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email}: {self.job_id}"


class TextResume(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="text_resumes")
    name = models.CharField(max_length=120)
    content = models.TextField()
    master = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-master", "name"]

    def __str__(self):
        return self.name


class ResumeDocument(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resume_documents")
    file = models.FileField(upload_to="resume_uploads/%Y/%m/%d/")
    name = models.CharField(max_length=255)
    extension = models.CharField(max_length=10)
    size = models.PositiveIntegerField()
    content_type = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Communication(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="communications")
    company = models.CharField(max_length=100)
    type = models.CharField(max_length=60)
    date = models.DateField()
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.type}: {self.company}"
