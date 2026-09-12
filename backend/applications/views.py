from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Application, Reminder
from .serializers import ApplicationSerializer, ReminderSerializer


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["stage"]
    search_fields = ["company_name", "position_title", "location"]
    ordering_fields = ["created_at", "updated_at", "date_applied", "stage"]

    def get_queryset(self):
        return Application.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["is_completed", "application"]
    ordering_fields = ["due_at", "created_at"]

    def get_queryset(self):
        return Reminder.objects.filter(application__owner=self.request.user)
