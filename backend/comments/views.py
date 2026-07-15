from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import F, Exists, OuterRef, Prefetch

from posts.models import Post
from posts.permissions import get_accessible_post, check_post_visible
from posts.pagination import CommentCursorPagination, ReplyCursorPagination
from interactions.models import CommentLike, ReplyLike
from .models import Comment, Reply
from .serializers import (
    CommentSerializer,
    CommentCreateSerializer,
    ReplySerializer,
    ReplyCreateSerializer,
)


def _reply_queryset_for(user):
    """Replies annotated with this user's like state, ready to prefetch."""
    like_qs = ReplyLike.objects.filter(reply=OuterRef("pk"), user=user)
    return (
        Reply.objects.select_related("author", "mention")
        .annotate(is_liked_annotated=Exists(like_qs))
        .order_by("created_at")
    )


class CommentListCreateView(APIView):
    """
    GET  /api/comments/posts/<post_id>/   — List comments for a post (oldest first).
    POST /api/comments/posts/<post_id>/   — Add a comment to a post.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "comment-create"

    def get_throttles(self):
        if self.request.method == "POST":
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get(self, request, post_id):
        post = get_accessible_post(post_id, request.user)

        like_qs = CommentLike.objects.filter(comment=OuterRef("pk"), user=request.user)
        queryset = (
            Comment.objects.select_related("author")
            .annotate(is_liked_annotated=Exists(like_qs))
            .prefetch_related(
                Prefetch("replies", queryset=_reply_queryset_for(request.user))
            )
            .filter(post=post)
            .order_by("created_at")
        )
        paginator = CommentCursorPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = CommentSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, post_id):
        post = get_accessible_post(post_id, request.user)
        serializer = CommentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            comment = serializer.save(author=request.user, post=post)
            # Increment denormalized counter on the post
            Post.objects.filter(pk=post.pk).update(comment_count=F("comment_count") + 1)

        return Response(
            CommentSerializer(comment, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class CommentDetailView(APIView):
    """
    PUT    /api/comments/<id>/   — Edit a comment (author only).
    DELETE /api/comments/<id>/   — Delete a comment (author only).
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "comment-mutate"

    def get_throttles(self):
        if self.request.method in ("PUT", "DELETE"):
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def put(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk, author=request.user)
        serializer = CommentCreateSerializer(comment, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        comment = serializer.save()
        return Response(CommentSerializer(comment, context={"request": request}).data)

    def delete(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk, author=request.user)
        with transaction.atomic():
            post_id = comment.post_id
            comment.delete()
            Post.objects.filter(pk=post_id).update(comment_count=F("comment_count") - 1)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReplyListCreateView(APIView):
    """
    GET  /api/comments/<comment_id>/replies/   — List replies (paginated).
    POST /api/comments/<comment_id>/replies/   — Add a reply.

    Both actions verify the parent post is visible to the requesting user —
    a comment/reply id alone isn't proof of access, since ids can be
    guessed or shared, and the post they belong to may be private.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "reply-create"

    def get_throttles(self):
        if self.request.method == "POST":
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def _get_accessible_comment(self, comment_id, user):
        comment = get_object_or_404(Comment.objects.select_related("post"), pk=comment_id)
        check_post_visible(comment.post, user)
        return comment

    def get(self, request, comment_id):
        comment = self._get_accessible_comment(comment_id, request.user)
        replies = _reply_queryset_for(request.user).filter(comment=comment)
        paginator = ReplyCursorPagination()
        page = paginator.paginate_queryset(replies, request)
        serializer = ReplySerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, comment_id):
        comment = self._get_accessible_comment(comment_id, request.user)
        serializer = ReplyCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        mention_id = serializer.validated_data.pop("mention_id", None)

        with transaction.atomic():
            reply = Reply.objects.create(
                comment=comment,
                author=request.user,
                mention_id=mention_id,
                content=serializer.validated_data["content"],
            )
            # Increment reply counter on the comment
            Comment.objects.filter(pk=comment.pk).update(reply_count=F("reply_count") + 1)

        return Response(
            ReplySerializer(reply, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ReplyDetailView(APIView):
    """
    PUT    /api/comments/replies/<id>/   — Edit a reply (author only).
    DELETE /api/comments/replies/<id>/   — Delete a reply (author only).
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "reply-mutate"

    def get_throttles(self):
        if self.request.method in ("PUT", "DELETE"):
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def put(self, request, pk):
        reply = get_object_or_404(Reply, pk=pk, author=request.user)
        serializer = ReplyCreateSerializer(reply, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        reply = serializer.save()
        return Response(ReplySerializer(reply, context={"request": request}).data)

    def delete(self, request, pk):
        reply = get_object_or_404(Reply, pk=pk, author=request.user)
        with transaction.atomic():
            comment_id = reply.comment_id
            reply.delete()
            Comment.objects.filter(pk=comment_id).update(reply_count=F("reply_count") - 1)
        return Response(status=status.HTTP_204_NO_CONTENT)
