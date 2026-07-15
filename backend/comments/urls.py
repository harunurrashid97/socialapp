from django.urls import path
from . import views

urlpatterns = [
    # Comments on a post
    path("posts/<uuid:post_id>/", views.CommentListCreateView.as_view(), name="comment-list-create"),
    path("<uuid:pk>/", views.CommentDetailView.as_view(), name="comment-detail"),

    # Replies on a comment
    path("<uuid:comment_id>/replies/", views.ReplyListCreateView.as_view(), name="reply-list-create"),
    path("replies/<uuid:pk>/", views.ReplyDetailView.as_view(), name="reply-detail"),
]
