from django.contrib import admin

from .models import Resume


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ["title", "owner", "is_master", "application", "updated_at"]
    list_filter = ["is_master"]
    search_fields = ["title"]
