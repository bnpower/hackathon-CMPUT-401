from rest_framework import serializers

from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id",
            "title",
            "is_master",
            "based_on",
            "application",
            "content",
            "file",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        owner = self.context["request"].user
        is_master = attrs.get("is_master", getattr(self.instance, "is_master", False))
        if is_master:
            existing = Resume.objects.filter(owner=owner, is_master=True)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    "A master resume already exists. Unset it before creating another."
                )
        return attrs

    def create(self, validated_data):
        based_on = validated_data.get("based_on")
        if based_on and not validated_data.get("content"):
            validated_data["content"] = based_on.content
        return super().create(validated_data)
