from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Communication
from .serializers import CommunicationSerializer


class CommunicationViewSet(viewsets.ModelViewSet):
    serializer_class = CommunicationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["application", "type", "direction"]
    ordering_fields = ["occurred_at", "created_at"]

    def get_queryset(self):
        return Communication.objects.filter(application__owner=self.request.user)
