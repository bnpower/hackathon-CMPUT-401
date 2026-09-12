from django.contrib import admin

from .models import Application, ApplicationStatusHistory, Reminder


class ApplicationStatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ["changed_at"]


class ReminderInline(admin.TabularInline):
    model = Reminder
    extra = 0


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ["position_title", "company_name", "stage", "date_applied", "owner"]
    list_filter = ["stage"]
    search_fields = ["company_name", "position_title"]
    inlines = [ApplicationStatusHistoryInline, ReminderInline]


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ["title", "application", "due_at", "is_completed"]
    list_filter = ["is_completed"]
