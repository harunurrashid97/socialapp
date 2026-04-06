from django.contrib import admin
from .models import Post

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "visibility", "like_count", "comment_count", "created_at")
    list_filter = ("visibility", "created_at")
    search_fields = ("content", "author__email")
    ordering = ("-created_at",)
    readonly_fields = ("like_count", "comment_count", "created_at", "updated_at")