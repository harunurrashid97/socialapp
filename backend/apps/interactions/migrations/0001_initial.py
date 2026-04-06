import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("posts", "0001_initial"),
        ("comments", "0001_initial"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="PostLike",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("post", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="likes",
                    to="posts.post",
                )),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="post_likes",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "post_likes"},
        ),
        migrations.CreateModel(
            name="CommentLike",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("comment", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="likes",
                    to="comments.comment",
                )),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="comment_likes",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "comment_likes"},
        ),
        migrations.CreateModel(
            name="ReplyLike",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("reply", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="likes",
                    to="comments.reply",
                )),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="reply_likes",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "reply_likes"},
        ),
        migrations.AlterUniqueTogether(name="postlike", unique_together={("post", "user")}),
        migrations.AlterUniqueTogether(name="commentlike", unique_together={("comment", "user")}),
        migrations.AlterUniqueTogether(name="replylike", unique_together={("reply", "user")}),
        migrations.AddIndex(
            model_name="postlike",
            index=models.Index(fields=["post", "user"], name="idx_postlike_post_user"),
        ),
        migrations.AddIndex(
            model_name="commentlike",
            index=models.Index(fields=["comment", "user"], name="idx_commentlike_comment_user"),
        ),
        migrations.AddIndex(
            model_name="replylike",
            index=models.Index(fields=["reply", "user"], name="idx_replylike_reply_user"),
        ),
    ]
