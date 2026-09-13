from django.contrib import admin

from .models import Application, Communication, ResumeDocument, SavedJob, TextResume


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("company", "position", "status", "date", "follow_up", "user")
    list_filter = ("status", "date")
    search_fields = ("company", "position", "user__email")


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ("job_id", "user", "created_at")
    search_fields = ("job_id", "user__email")


@admin.register(TextResume)
class TextResumeAdmin(admin.ModelAdmin):
    list_display = ("name", "master", "user", "updated_at")
    list_filter = ("master",)
    search_fields = ("name", "user__email")


@admin.register(ResumeDocument)
class ResumeDocumentAdmin(admin.ModelAdmin):
    list_display = ("name", "extension", "size", "user", "created_at")
    search_fields = ("name", "user__email")


@admin.register(Communication)
class CommunicationAdmin(admin.ModelAdmin):
    list_display = ("company", "type", "date", "user")
    search_fields = ("company", "notes", "user__email")
