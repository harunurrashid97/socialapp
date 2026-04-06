from django.contrib import admin
from .models import Comment, Reply

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "post", "like_count", "reply_count", "created_at")
    search_fields = ("content", "author__email")
    ordering = ("-created_at",)
    readonly_fields = ("like_count", "reply_count", "created_at", "updated_at")

@admin.register(Reply)
class ReplyAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "comment", "mention", "like_count", "created_at")
    search_fields = ("content", "author__email")
    ordering = ("-created_at",)
    readonly_fields = ("like_count", "created_at", "updated_at")