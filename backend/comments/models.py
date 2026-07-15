import uuid
from django.db import models
from django.conf import settings


class Comment(models.Model):
    """
    A top-level comment on a Post.

    Design notes:
      - like_count is a denormalized counter (see interactions signals)
      - reply_count is denormalized for the same reason
      - Indexed on (post, created_at) for efficient comment listing
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(
        "posts.Post",
        on_delete=models.CASCADE,
        related_name="comments",
        db_index=True,
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    content = models.TextField(max_length=2000)

    like_count = models.PositiveIntegerField(default=0)
    reply_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "comments"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["post", "created_at"], name="idx_comment_post_created"),
        ]

    def __str__(self):
        return f"Comment({self.id}) on Post({self.post_id})"


class Reply(models.Model):
    """
    A reply to a Comment (one level deep — no nested replies).

    Keeping replies one level deep keeps the data model simple and
    the UI predictable. The 'mention' field allows tagging another user
    in the reply for context.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        related_name="replies",
        db_index=True,
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="replies",
    )
    mention = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mentioned_in_replies",
    )
    content = models.TextField(max_length=2000)

    like_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "replies"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["comment", "created_at"], name="idx_reply_comment_created"),
        ]

    def __str__(self):
        return f"Reply({self.id}) on Comment({self.comment_id})"
