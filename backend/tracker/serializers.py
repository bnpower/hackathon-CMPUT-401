from pathlib import Path

from rest_framework import serializers

from .models import Application, Communication, ResumeDocument, SavedJob, TextResume

MASTER_RESUME_CONTENT = "YOUR NAME\nEmail · Phone · Portfolio\n\nABOUT ME\nWrite a short introduction about your interests and experience.\n\nEXPERIENCE\nRole · Company · Dates\n• Describe your contribution and its impact.\n\nEDUCATION\nDegree · University · Graduation year\n\nSKILLS\nAdd your relevant skills."
MAX_RESUME_BYTES = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {"pdf", "docx", "png", "jpg", "jpeg"}


class ApplicationSerializer(serializers.ModelSerializer):
    followUp = serializers.DateField(
        source="follow_up", required=False, allow_null=True
    )
    sourceJobId = serializers.IntegerField(
        source="source_job_id", required=False, allow_null=True
    )
    jobPayload = serializers.JSONField(source="job_payload", required=False)

    class Meta:
        model = Application
        fields = (
            "id",
            "company",
            "position",
            "date",
            "status",
            "followUp",
            "sourceJobId",
            "jobPayload",
        )

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class SavedJobSerializer(serializers.ModelSerializer):
    jobId = serializers.IntegerField(source="job_id")
    jobPayload = serializers.JSONField(source="job_payload", required=False)

    class Meta:
        model = SavedJob
        fields = ("id", "jobId", "jobPayload", "created_at")
        read_only_fields = ("id", "created_at")

    def create(self, validated_data):
        user = self.context["request"].user
        job_payload = validated_data.pop("job_payload", {})
        saved_job, _created = SavedJob.objects.update_or_create(
            user=user,
            job_id=validated_data["job_id"],
            defaults={"job_payload": job_payload},
        )
        return saved_job


class TextResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextResume
        fields = ("id", "name", "content", "master", "updated_at")
        read_only_fields = ("id", "updated_at")

    def validate(self, attrs):
        request = self.context["request"]
        master = attrs.get("master", getattr(self.instance, "master", False))
        if master:
            existing = TextResume.objects.filter(user=request.user, master=True)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    {"master": "Only one master resume is allowed."}
                )
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ResumeDocumentSerializer(serializers.ModelSerializer):
    addedAt = serializers.DateTimeField(source="created_at", read_only=True)
    downloadUrl = serializers.SerializerMethodField()

    class Meta:
        model = ResumeDocument
        fields = (
            "id",
            "name",
            "extension",
            "size",
            "content_type",
            "addedAt",
            "downloadUrl",
            "file",
        )
        read_only_fields = (
            "id",
            "name",
            "extension",
            "size",
            "content_type",
            "addedAt",
            "downloadUrl",
        )
        extra_kwargs = {"file": {"write_only": True}}

    def get_downloadUrl(self, obj):
        request = self.context.get("request")
        url = f"/api/resume-documents/{obj.pk}/download/"
        return request.build_absolute_uri(url) if request else url

    def validate_file(self, file):
        extension = Path(file.name).suffix.lower().lstrip(".")
        if extension not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                "Choose a PDF, DOCX, PNG, JPG, or JPEG file."
            )
        if file.size == 0:
            raise serializers.ValidationError(
                "That file is empty. Choose another resume."
            )
        if file.size > MAX_RESUME_BYTES:
            raise serializers.ValidationError(
                "That file is too large. The limit is 10 MB."
            )

        header = file.read(12)
        file.seek(0)
        if extension == "pdf" and not header.startswith(b"%PDF-"):
            raise serializers.ValidationError("That file does not appear to be a PDF.")
        if extension == "docx" and not header.startswith(b"PK"):
            raise serializers.ValidationError(
                "That file does not appear to be a DOCX document."
            )
        if extension == "png" and not header.startswith(b"\x89PNG\r\n\x1a\n"):
            raise serializers.ValidationError(
                "That file does not appear to be a PNG image."
            )
        if extension in {"jpg", "jpeg"} and not header.startswith(b"\xff\xd8\xff"):
            raise serializers.ValidationError(
                "That file does not appear to be a JPEG image."
            )
        return file

    def create(self, validated_data):
        file = validated_data["file"]
        extension = Path(file.name).suffix.lower().lstrip(".")
        return ResumeDocument.objects.create(
            user=self.context["request"].user,
            file=file,
            name=file.name,
            extension=extension,
            size=file.size,
            content_type=getattr(file, "content_type", "") or "",
        )


class CommunicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Communication
        fields = ("id", "company", "type", "date", "notes")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
