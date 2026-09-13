from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ApplicationViewSet,
    CommunicationViewSet,
    ResumeDocumentViewSet,
    SavedJobViewSet,
    TextResumeViewSet,
)

router = DefaultRouter()
router.register("applications", ApplicationViewSet, basename="application")
router.register("saved-jobs", SavedJobViewSet, basename="saved-job")
router.register("resumes", TextResumeViewSet, basename="resume")
router.register("resume-documents", ResumeDocumentViewSet, basename="resume-document")
router.register("communications", CommunicationViewSet, basename="communication")

urlpatterns = [path("", include(router.urls))]
