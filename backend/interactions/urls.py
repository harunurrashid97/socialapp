from django.urls import path
from . import views

urlpatterns = [
    # Post likes
    path("posts/<uuid:post_id>/like/", views.PostLikeToggleView.as_view(), name="post-like-toggle"),
    path("posts/<uuid:post_id>/likers/", views.PostLikersView.as_view(), name="post-likers"),

    # Comment likes
    path("comments/<uuid:comment_id>/like/", views.CommentLikeToggleView.as_view(), name="comment-like-toggle"),
    path("comments/<uuid:comment_id>/likers/", views.CommentLikersView.as_view(), name="comment-likers"),

    # Reply likes
    path("replies/<uuid:reply_id>/like/", views.ReplyLikeToggleView.as_view(), name="reply-like-toggle"),
    path("replies/<uuid:reply_id>/likers/", views.ReplyLikersView.as_view(), name="reply-likers"),
]
