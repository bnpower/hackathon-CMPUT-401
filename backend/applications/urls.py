from rest_framework.routers import DefaultRouter

from .views import ApplicationViewSet, ReminderViewSet

router = DefaultRouter()
router.register("applications", ApplicationViewSet, basename="application")
router.register("reminders", ReminderViewSet, basename="reminder")

urlpatterns = router.urls
