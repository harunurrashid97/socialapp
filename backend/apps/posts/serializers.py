from rest_framework import serializers
from .models import Post
from apps.users.serializers import UserProfileSerializer


class PostSerializer(serializers.ModelSerializer):
    """
    Full post serializer for read operations.
    Includes author details and request-user's like state.
    """
    author = UserProfileSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    reaction_type = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Post
        fields = (
            "id",
            "author",
            "content",
            "image",
            "visibility",
            "like_count",
            "comment_count",
            "is_liked",
            "reaction_type",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "author", "like_count", "comment_count", "created_at", "updated_at")

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_reaction_type(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            like = obj.likes.filter(user=request.user).first()
            return like.reaction_type if like else None
        return None


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating / updating posts."""

    class Meta:
        model = Post
        fields = ("content", "image", "visibility")

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Post content cannot be blank.")
        return value


class PostLikersSerializer(serializers.Serializer):
    """Returns a list of users who liked a post/comment/reply."""
    id = serializers.UUIDField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
