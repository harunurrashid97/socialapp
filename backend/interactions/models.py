import uuid
from django.db import models
from django.conf import settings


class PostLike(models.Model):
    class ReactionType(models.TextChoices):
        LIKE = "like", "Like"
        LOVE = "love", "Love"
        HAHA = "haha", "Haha"
        WOW = "wow", "Wow"
        SAD = "sad", "Sad"
        ANGRY = "angry", "Angry"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(
        "posts.Post",
        on_delete=models.CASCADE,
        related_name="likes",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="post_likes",
    )
    reaction_type = models.CharField(
        max_length=10,
        choices=ReactionType.choices,
        default=ReactionType.LIKE,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "post_likes"
        unique_together = ("post", "user")
        indexes = [
            models.Index(fields=["post", "user"], name="idx_postlike_post_user"),
        ]

    def __str__(self):
        return f"PostLike: user={self.user_id} post={self.post_id}"


class CommentLike(models.Model):
    """Like on a top-level Comment."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    comment = models.ForeignKey(
        "comments.Comment",
        on_delete=models.CASCADE,
        related_name="likes",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comment_likes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comment_likes"
        unique_together = ("comment", "user")
        indexes = [
            models.Index(fields=["comment", "user"], name="idx_commentlike_comment_user"),
        ]

    def __str__(self):
        return f"CommentLike: user={self.user_id} comment={self.comment_id}"


class ReplyLike(models.Model):
    """Like on a Reply."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reply = models.ForeignKey(
        "comments.Reply",
        on_delete=models.CASCADE,
        related_name="likes",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reply_likes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reply_likes"
        unique_together = ("reply", "user")
        indexes = [
            models.Index(fields=["reply", "user"], name="idx_replylike_reply_user"),
        ]

    def __str__(self):
        return f"ReplyLike: user={self.user_id} reply={self.reply_id}"
