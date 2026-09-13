import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import EmailTokenObtainPairSerializer, RegisterSerializer, SocialAuthSerializer, UserSerializer

User = get_user_model()


def token_payload(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": UserSerializer(user).data,
    }


def split_name(name):
    parts = (name or "").strip().split(None, 1)
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], parts[1]


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(token_payload(user), status=status.HTTP_201_CREATED)


class EmailTokenObtainPairView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = EmailTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        user = User.objects.get(email__iexact=request.data.get("email", ""))
        response.data["user"] = UserSerializer(user).data
        return response


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SocialAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        raw_id_token = serializer.validated_data.get("id_token")
        if not raw_id_token:
            return Response({"detail": "id_token is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.GOOGLE_CLIENT_ID:
            return Response({"detail": "GOOGLE_CLIENT_ID is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            profile = google_id_token.verify_oauth2_token(
                raw_id_token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response({"detail": "Invalid Google token."}, status=status.HTTP_400_BAD_REQUEST)

        email = (profile.get("email") or "").lower()
        if not email or not profile.get("email_verified"):
            return Response({"detail": "Google account email must be verified."}, status=status.HTTP_400_BAD_REQUEST)

        defaults = {
            "username": "",
            "first_name": profile.get("given_name", ""),
            "last_name": profile.get("family_name", ""),
            "auth_provider": "google",
            "google_sub": profile.get("sub"),
            "picture_url": profile.get("picture", ""),
        }
        user, created = User.objects.get_or_create(email=email, defaults=defaults)
        if not created:
            user.google_sub = user.google_sub or profile.get("sub")
            user.picture_url = profile.get("picture", user.picture_url)
            if not user.first_name:
                user.first_name = profile.get("given_name", "")
            if not user.last_name:
                user.last_name = profile.get("family_name", "")
            user.auth_provider = "google" if user.auth_provider == "email" else user.auth_provider
            user.save(update_fields=["google_sub", "picture_url", "first_name", "last_name", "auth_provider"])
        return Response(token_payload(user))


class LinkedInLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SocialAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data.get("code")
        redirect_uri = serializer.validated_data.get("redirect_uri")
        if not code or not redirect_uri:
            return Response({"detail": "code and redirect_uri are required."}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.LINKEDIN_CLIENT_ID or not settings.LINKEDIN_CLIENT_SECRET:
            return Response({"detail": "LinkedIn OAuth credentials are not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        token_response = requests.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        if token_response.status_code >= 400:
            return Response({"detail": "LinkedIn token exchange failed."}, status=status.HTTP_400_BAD_REQUEST)

        access_token = token_response.json().get("access_token")
        profile_response = requests.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if profile_response.status_code >= 400:
            return Response({"detail": "LinkedIn profile lookup failed."}, status=status.HTTP_400_BAD_REQUEST)

        profile = profile_response.json()
        email = (profile.get("email") or "").lower()
        if not email or profile.get("email_verified") is False:
            return Response({"detail": "LinkedIn account email must be verified."}, status=status.HTTP_400_BAD_REQUEST)

        first_name = profile.get("given_name", "")
        last_name = profile.get("family_name", "")
        if not first_name and not last_name:
            first_name, last_name = split_name(profile.get("name", ""))

        defaults = {
            "username": "",
            "first_name": first_name,
            "last_name": last_name,
            "auth_provider": "linkedin",
            "linkedin_sub": profile.get("sub"),
            "picture_url": profile.get("picture", ""),
        }
        user, created = User.objects.get_or_create(email=email, defaults=defaults)
        if not created:
            user.linkedin_sub = user.linkedin_sub or profile.get("sub")
            user.picture_url = profile.get("picture", user.picture_url)
            if not user.first_name:
                user.first_name = first_name
            if not user.last_name:
                user.last_name = last_name
            user.auth_provider = "linkedin" if user.auth_provider == "email" else user.auth_provider
            user.save(update_fields=["linkedin_sub", "picture_url", "first_name", "last_name", "auth_provider"])
        return Response(token_payload(user))
