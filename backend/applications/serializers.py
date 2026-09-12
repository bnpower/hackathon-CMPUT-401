from rest_framework import serializers

from communications.serializers import CommunicationSerializer
from resumes.serializers import ResumeSerializer

from .models import Application, ApplicationStatusHistory, Reminder


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationStatusHistory
        fields = ["id", "stage", "changed_at", "note"]
        read_only_fields = ["id", "changed_at"]


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = ["id", "application", "title", "due_at", "notes", "is_completed", "created_at"]
        read_only_fields = ["id", "created_at"]


class ApplicationSerializer(serializers.ModelSerializer):
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    reminders = ReminderSerializer(many=True, read_only=True)
    communications = CommunicationSerializer(many=True, read_only=True)
    resumes = ResumeSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            "id",
            "company_name",
            "position_title",
            "job_posting_url",
            "location",
            "salary_range",
            "stage",
            "date_applied",
            "notes",
            "status_history",
            "reminders",
            "communications",
            "resumes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def update(self, instance, validated_data):
        new_stage = validated_data.get("stage")
        if new_stage and new_stage != instance.stage:
            ApplicationStatusHistory.objects.create(
                application=instance,
                stage=new_stage,
                note=f"Stage changed from {instance.stage} to {new_stage}",
            )
        return super().update(instance, validated_data)

    def create(self, validated_data):
        application = super().create(validated_data)
        ApplicationStatusHistory.objects.create(
            application=application,
            stage=application.stage,
            note="Application created",
        )
        return application
