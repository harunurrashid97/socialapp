import uuid
from django.db import models
from django.conf import settings


def post_image_upload_path(instance, filename):
    """Store images under media/posts/<user_id>/<filename>."""
    ext = filename.rsplit(".", 1)[-1].lower()
    new_filename = f"{uuid.uuid4()}.{ext}"
    return f"posts/{instance.author_id}/{new_filename}"


class Post(models.Model):
    """
    Core post model.

    Visibility choices:
      - PUBLIC  : visible to all authenticated users
      - PRIVATE : visible only to the author

    Designed for scale:
      - UUID primary key (avoids sequential enumeration)
      - DB indexes on (author, created_at) and (visibility, created_at)
        to support efficient feed queries
      - like_count / comment_count are denormalized counters updated via
        signals in the interactions/comments apps — avoids expensive COUNT(*)
        on hot read paths
    """

    class Visibility(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts",
        db_index=True,
    )
    content = models.TextField(max_length=5000)
    image = models.ImageField(upload_to=post_image_upload_path, null=True, blank=True)
    visibility = models.CharField(
        max_length=10,
        choices=Visibility.choices,
        default=Visibility.PUBLIC,
        db_index=True,
    )

    # Denormalized counters for fast reads at scale
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "posts"
        ordering = ["-created_at"]
        indexes = [
            # Feed query: public posts newest first
            models.Index(fields=["visibility", "-created_at"], name="idx_post_visibility_created"),
            # Author's own posts
            models.Index(fields=["author", "-created_at"], name="idx_post_author_created"),
        ]

    def __str__(self):
        return f"Post({self.id}) by {self.author_id} [{self.visibility}]"
