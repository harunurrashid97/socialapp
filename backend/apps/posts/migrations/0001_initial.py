import uuid
import apps.posts.models
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Post",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("author", models.ForeignKey(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="posts",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("content", models.TextField(max_length=5000)),
                ("image", models.ImageField(blank=True, null=True, upload_to=apps.posts.models.post_image_upload_path)),
                ("visibility", models.CharField(
                    choices=[("public", "Public"), ("private", "Private")],
                    db_index=True,
                    default="public",
                    max_length=10,
                )),
                ("like_count", models.PositiveIntegerField(default=0)),
                ("comment_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "posts", "ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="post",
            index=models.Index(fields=["visibility", "-created_at"], name="idx_post_visibility_created"),
        ),
        migrations.AddIndex(
            model_name="post",
            index=models.Index(fields=["author", "-created_at"], name="idx_post_author_created"),
        ),
    ]
