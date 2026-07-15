from django.urls import path
from . import views

urlpatterns = [
    path("", views.PostListCreateView.as_view(), name="post-list-create"),
    path("mine/", views.MyPostsView.as_view(), name="post-mine"),
    path("<uuid:pk>/", views.PostDetailView.as_view(), name="post-detail"),
]
