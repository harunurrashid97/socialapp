from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F

from .models import PostLike, CommentLike, ReplyLike


# ── Post likes ────────────────────────────────────────────────────────────────

@receiver(post_save, sender=PostLike)
def increment_post_like_count(sender, instance, created, **kwargs):
    if created:
        from apps.posts.models import Post
        Post.objects.filter(pk=instance.post_id).update(like_count=F("like_count") + 1)


@receiver(post_delete, sender=PostLike)
def decrement_post_like_count(sender, instance, **kwargs):
    from apps.posts.models import Post
    Post.objects.filter(pk=instance.post_id).update(like_count=F("like_count") - 1)


# ── Comment likes ─────────────────────────────────────────────────────────────

@receiver(post_save, sender=CommentLike)
def increment_comment_like_count(sender, instance, created, **kwargs):
    if created:
        from apps.comments.models import Comment
        Comment.objects.filter(pk=instance.comment_id).update(like_count=F("like_count") + 1)


@receiver(post_delete, sender=CommentLike)
def decrement_comment_like_count(sender, instance, **kwargs):
    from apps.comments.models import Comment
    Comment.objects.filter(pk=instance.comment_id).update(like_count=F("like_count") - 1)


# ── Reply likes ───────────────────────────────────────────────────────────────

@receiver(post_save, sender=ReplyLike)
def increment_reply_like_count(sender, instance, created, **kwargs):
    if created:
        from apps.comments.models import Reply
        Reply.objects.filter(pk=instance.reply_id).update(like_count=F("like_count") + 1)


@receiver(post_delete, sender=ReplyLike)
def decrement_reply_like_count(sender, instance, **kwargs):
    from apps.comments.models import Reply
    Reply.objects.filter(pk=instance.reply_id).update(like_count=F("like_count") - 1)
