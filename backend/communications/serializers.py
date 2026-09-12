from rest_framework import serializers

from .models import Communication


class CommunicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Communication
        fields = [
            "id",
            "application",
            "type",
            "direction",
            "contact_name",
            "subject",
            "notes",
            "occurred_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_application(self, application):
        request = self.context["request"]
        if application.owner_id != request.user.id:
            raise serializers.ValidationError("You do not own this application.")
        return application
