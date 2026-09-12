from django.contrib import admin

from .models import Communication


@admin.register(Communication)
class CommunicationAdmin(admin.ModelAdmin):
    list_display = ["application", "type", "direction", "occurred_at"]
    list_filter = ["type", "direction"]
