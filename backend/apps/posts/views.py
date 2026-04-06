from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Post
from .serializers import PostSerializer, PostCreateSerializer
from .pagination import PostCursorPagination


class PostListCreateView(APIView):
    """
    GET  /api/posts/          — Paginated feed (public posts + own private posts), newest first.
    POST /api/posts/          — Create a new post (text + optional image).
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        # Show public posts OR own private posts
        queryset = (
            Post.objects.select_related("author")
            .filter(
                Q(visibility=Post.Visibility.PUBLIC) | Q(author=request.user)
            )
            .order_by("-created_at")
        )
        paginator = PostCursorPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = PostSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = PostCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        post = serializer.save(author=request.user)
        return Response(
            PostSerializer(post, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class PostDetailView(APIView):
    """
    GET    /api/posts/<id>/   — Retrieve a single post.
    PUT    /api/posts/<id>/   — Update post (author only).
    DELETE /api/posts/<id>/   — Delete post (author only).
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_visible_post(self, pk, user):
        """Return post if visible to the requesting user, else 404."""
        post = get_object_or_404(Post, pk=pk)
        if post.visibility == Post.Visibility.PRIVATE and post.author != user:
            from rest_framework.exceptions import NotFound
            raise NotFound("Post not found.")
        return post

    def get(self, request, pk):
        post = self._get_visible_post(pk, request.user)
        serializer = PostSerializer(post, context={"request": request})
        return Response(serializer.data)

    def put(self, request, pk):
        post = get_object_or_404(Post, pk=pk, author=request.user)
        serializer = PostCreateSerializer(post, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        post = serializer.save()
        return Response(PostSerializer(post, context={"request": request}).data)

    def delete(self, request, pk):
        post = get_object_or_404(Post, pk=pk, author=request.user)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyPostsView(APIView):
    """
    GET /api/posts/mine/  — Returns only the authenticated user's posts (all visibilities).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = (
            Post.objects.select_related("author")
            .filter(author=request.user)
            .order_by("-created_at")
        )
        paginator = PostCursorPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = PostSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)
