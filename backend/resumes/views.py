from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Resume
from .serializers import ResumeSerializer


class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_master", "application"]
    search_fields = ["title"]
    ordering_fields = ["created_at", "updated_at"]

    def get_queryset(self):
        return Resume.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
