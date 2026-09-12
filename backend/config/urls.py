from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def root(request):
    return JsonResponse(
        {
            "name": "hackathon-CMPUT-401",
            "frontend": "http://localhost:5173",
            "healthcheck": "/api/health/",
        }
    )

urlpatterns = [
    path('', root, name='root'),
    path('api/', include('api.urls')),
    path('admin/', admin.site.urls),
]
