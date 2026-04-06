from rest_framework import serializers
from .models import Comment, Reply
from apps.users.serializers import UserProfileSerializer


class ReplySerializer(serializers.ModelSerializer):
    author = UserProfileSerializer(read_only=True)
    mention = UserProfileSerializer(read_only=True)
    mention_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Reply
        fields = (
            "id",
            "comment",
            "author",
            "mention",
            "mention_id",
            "content",
            "like_count",
            "is_liked",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "comment", "author", "like_count", "created_at", "updated_at")

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class ReplyCreateSerializer(serializers.ModelSerializer):
    mention_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Reply
        fields = ("content", "mention_id")

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Reply content cannot be blank.")
        return value


class CommentSerializer(serializers.ModelSerializer):
    author = UserProfileSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    replies = ReplySerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = (
            "id",
            "post",
            "author",
            "content",
            "like_count",
            "reply_count",
            "is_liked",
            "replies",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id", "post", "author", "like_count", "reply_count", "created_at", "updated_at"
        )

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ("content",)

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Comment content cannot be blank.")
        return value
