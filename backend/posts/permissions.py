from django.shortcuts import get_object_or_404
from rest_framework.exceptions import NotFound

from .models import Post


def get_accessible_post(post_id, user):
    """
    Fetch a Post by id and enforce visibility rules in one place.
    Raises NotFound (404) if the post doesn't exist OR is private and
    the requesting user isn't the author — callers should never be able
    to distinguish between "doesn't exist" and "not yours to see".
    """
    post = get_object_or_404(Post, pk=post_id)
    check_post_visible(post, user)
    return post


def check_post_visible(post, user):
    """Raise NotFound if `post` is private and `user` isn't its author."""
    if post.visibility == Post.Visibility.PRIVATE and post.author != user:
        raise NotFound("Not found.")
