from django.db import transaction
from django.http import FileResponse
from rest_framework import decorators, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Application, Communication, ResumeDocument, SavedJob, TextResume
from .serializers import (
    MASTER_RESUME_CONTENT,
    ApplicationSerializer,
    CommunicationSerializer,
    ResumeDocumentSerializer,
    SavedJobSerializer,
    TextResumeSerializer,
)


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user)


class SavedJobViewSet(viewsets.ModelViewSet):
    queryset = SavedJob.objects.all()
    serializer_class = SavedJobSerializer

    def get_queryset(self):
        return SavedJob.objects.filter(user=self.request.user)

    @decorators.action(
        detail=False, methods=["delete"], url_path=r"by-job/(?P<job_id>[^/.]+)"
    )
    def delete_by_job(self, request, job_id=None):
        deleted, _ = self.get_queryset().filter(job_id=job_id).delete()
        return Response({"deleted": deleted})


class TextResumeViewSet(viewsets.ModelViewSet):
    queryset = TextResume.objects.all()
    serializer_class = TextResumeSerializer

    def get_queryset(self):
        return TextResume.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        self.ensure_master_resume(request.user)
        return super().list(request, *args, **kwargs)

    @staticmethod
    def ensure_master_resume(user):
        if not TextResume.objects.filter(user=user, master=True).exists():
            TextResume.objects.create(
                user=user,
                name="My main resume",
                content=MASTER_RESUME_CONTENT,
                master=True,
            )

    def perform_destroy(self, instance):
        if instance.master:
            return
        instance.delete()


class ResumeDocumentViewSet(viewsets.ModelViewSet):
    queryset = ResumeDocument.objects.all()
    serializer_class = ResumeDocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return ResumeDocument.objects.filter(user=self.request.user)

    @decorators.action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        document = self.get_object()
        return FileResponse(
            document.file.open("rb"), as_attachment=True, filename=document.name
        )

    @transaction.atomic
    def perform_destroy(self, instance):
        storage = instance.file.storage
        file_name = instance.file.name
        instance.delete()
        if file_name:
            storage.delete(file_name)


class CommunicationViewSet(viewsets.ModelViewSet):
    queryset = Communication.objects.all()
    serializer_class = CommunicationSerializer

    def get_queryset(self):
        return Communication.objects.filter(user=self.request.user)
