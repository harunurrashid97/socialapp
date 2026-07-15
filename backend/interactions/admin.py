from django.contrib import admin
from .models import PostLike, CommentLike, ReplyLike

@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ("user", "post", "created_at")
    ordering = ("-created_at",)

@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ("user", "comment", "created_at")
    ordering = ("-created_at",)

@admin.register(ReplyLike)
class ReplyLikeAdmin(admin.ModelAdmin):
    list_display = ("user", "reply", "created_at")
    ordering = ("-created_at",)