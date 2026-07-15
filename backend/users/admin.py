from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone
from django.utils.html import format_html
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from .models import User


class OutstandingTokenInline(admin.TabularInline):
    model = OutstandingToken
    extra = 0
    readonly_fields = ("jti", "short_token", "created_at", "expires_at", "is_active")
    fields = ("short_token", "created_at", "expires_at", "is_active")
    can_delete = False
    verbose_name = "Token"
    verbose_name_plural = "Tokens"

    def short_token(self, obj):
        """Show only first 40 chars of token to keep the table clean."""
        token_str = str(obj.token)
        return format_html(
            '<span title="{}" style="font-family:monospace; font-size:11px;">'
            "{}...</span>",
            token_str,       # full token on hover
            token_str[:40],  # truncated display
        )
    short_token.short_description = "Token"

    def is_active(self, obj):
        return obj.expires_at > timezone.now()
    is_active.boolean = True
    is_active.short_description = "Active"

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "email",
        "first_name",
        "last_name",
        "is_active",
        "is_staff",
        "last_login",
        "created_at",
    )
    list_filter = ("is_staff", "is_superuser", "is_active")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("-created_at",)
    inlines = [OutstandingTokenInline]

    fieldsets = (
        (None, {
            "fields": ("email", "password")
        }),
        ("Personal Info", {
            "fields": ("first_name", "last_name")
        }),
        ("Permissions", {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")
        }),
        ("Activity", {
            "fields": ("last_login", "created_at", "updated_at"),
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "password1", "password2"),
        }),
    )

    readonly_fields = ("last_login", "created_at", "updated_at")