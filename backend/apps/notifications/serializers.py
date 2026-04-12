from rest_framework import serializers
from .models import Notification
from apps.users.serializers import UserProfileSerializer


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserProfileSerializer(read_only=True)
    post_id = serializers.UUIDField(source="post.id", read_only=True, allow_null=True)
    post_content_snippet = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "actor",
            "verb",
            "post_id",
            "post_content_snippet",
            "is_read",
            "created_at",
        ]

    def get_post_content_snippet(self, obj):
        if obj.post:
            return obj.post.content[:50] + "..." if len(obj.post.content) > 50 else obj.post.content
        return None
