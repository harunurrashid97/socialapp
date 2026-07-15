import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("posts", "0001_initial"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Comment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("post", models.ForeignKey(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="comments",
                    to="posts.post",
                )),
                ("author", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="comments",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("content", models.TextField(max_length=2000)),
                ("like_count", models.PositiveIntegerField(default=0)),
                ("reply_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "comments", "ordering": ["created_at"]},
        ),
        migrations.CreateModel(
            name="Reply",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("comment", models.ForeignKey(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="replies",
                    to="comments.comment",
                )),
                ("author", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="replies",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("mention", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="mentioned_in_replies",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("content", models.TextField(max_length=2000)),
                ("like_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "replies", "ordering": ["created_at"]},
        ),
        migrations.AddIndex(
            model_name="comment",
            index=models.Index(fields=["post", "created_at"], name="idx_comment_post_created"),
        ),
        migrations.AddIndex(
            model_name="reply",
            index=models.Index(fields=["comment", "created_at"], name="idx_reply_comment_created"),
        ),
    ]
