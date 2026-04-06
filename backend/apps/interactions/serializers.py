from rest_framework import serializers
from apps.users.models import User


class LikerSerializer(serializers.ModelSerializer):
    """Minimal user info returned in likers lists."""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ("id", "full_name", "email")
