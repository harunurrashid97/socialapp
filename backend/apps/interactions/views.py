from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.posts.models import Post
from apps.comments.models import Comment, Reply
from .models import PostLike, CommentLike, ReplyLike
from .serializers import LikerSerializer


class PostLikeToggleView(APIView):
    """
    POST /api/interactions/posts/<post_id>/like/
    Toggles like on a post. Returns new like state and count.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, pk=post_id)
        reaction_type = request.data.get("reaction_type", PostLike.ReactionType.LIKE)

        # Validate reaction type
        if reaction_type not in PostLike.ReactionType.values:
            reaction_type = PostLike.ReactionType.LIKE

        # Private post guard
        if post.visibility == Post.Visibility.PRIVATE and post.author != request.user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        like = PostLike.objects.filter(post=post, user=request.user).first()
        if like:
            if like.reaction_type == reaction_type:
                # Same reaction - toggle off
                like.delete()
                liked = False
                current_reaction = None
            else:
                # Different reaction - update type
                like.reaction_type = reaction_type
                like.save()
                liked = True
                current_reaction = reaction_type
        else:
            # No reaction yet - create new
            PostLike.objects.create(post=post, user=request.user, reaction_type=reaction_type)
            liked = True
            current_reaction = reaction_type

        post.refresh_from_db(fields=["like_count"])
        return Response({
            "liked": liked, 
            "like_count": post.like_count,
            "reaction_type": current_reaction
        })


class PostLikersView(APIView):
    """
    GET /api/interactions/posts/<post_id>/likers/
    Returns the list of users who liked this post.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        post = get_object_or_404(Post, pk=post_id)
        if post.visibility == Post.Visibility.PRIVATE and post.author != request.user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        likers = post.likes.select_related("user").order_by("-created_at")
        users = [like.user for like in likers]
        serializer = LikerSerializer(users, many=True)
        return Response(serializer.data)


class CommentLikeToggleView(APIView):
    """
    POST /api/interactions/comments/<comment_id>/like/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        comment = get_object_or_404(Comment, pk=comment_id)
        like = CommentLike.objects.filter(comment=comment, user=request.user).first()
        if like:
            like.delete()
            liked = False
        else:
            CommentLike.objects.create(comment=comment, user=request.user)
            liked = True

        comment.refresh_from_db(fields=["like_count"])
        return Response({"liked": liked, "like_count": comment.like_count})


class CommentLikersView(APIView):
    """
    GET /api/interactions/comments/<comment_id>/likers/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, comment_id):
        comment = get_object_or_404(Comment, pk=comment_id)
        likers = comment.likes.select_related("user").order_by("-created_at")
        users = [like.user for like in likers]
        serializer = LikerSerializer(users, many=True)
        return Response(serializer.data)


class ReplyLikeToggleView(APIView):
    """
    POST /api/interactions/replies/<reply_id>/like/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, reply_id):
        reply = get_object_or_404(Reply, pk=reply_id)
        like = ReplyLike.objects.filter(reply=reply, user=request.user).first()
        if like:
            like.delete()
            liked = False
        else:
            ReplyLike.objects.create(reply=reply, user=request.user)
            liked = True

        reply.refresh_from_db(fields=["like_count"])
        return Response({"liked": liked, "like_count": reply.like_count})


class ReplyLikersView(APIView):
    """
    GET /api/interactions/replies/<reply_id>/likers/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, reply_id):
        reply = get_object_or_404(Reply, pk=reply_id)
        likers = reply.likes.select_related("user").order_by("-created_at")
        users = [like.user for like in likers]
        serializer = LikerSerializer(users, many=True)
        return Response(serializer.data)
