from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(recipient=request.user).order_by("-created_at")[:50]
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        serializer = NotificationSerializer(notifications, many=True)
        return Response({
            "notifications": serializer.data,
            "unread_count": unread_count
        })


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id=None):
        if notification_id:
            notification = Notification.objects.filter(recipient=request.user, id=notification_id).first()
            if notification:
                notification.is_read = True
                notification.save()
        else:
            Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
            
        return Response({"status": "ok"})
