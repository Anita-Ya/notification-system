from django.urls import path, include
from rest_framework.routers import DefaultRouter
from notifications.views import (
    TriggerViewSet,
    ChannelTemplateViewSet,
    NotificationLogViewSet,
    StatusOverviewView,
    WebPushView,
    AuthViews
)

router = DefaultRouter()
router.register(r'triggers', TriggerViewSet, basename='trigger')
router.register(r'templates', ChannelTemplateViewSet, basename='template')
router.register(r'logs', NotificationLogViewSet, basename='log')

urlpatterns = [
    path('status/', StatusOverviewView.as_view(), name='status-overview'),
    path('webpush/vapid-key/', WebPushView.as_view(), name='webpush-vapid-key'),
    path('webpush/subscribe/', WebPushView.as_view(), name='webpush-subscribe'),
    path('auth/<str:action_type>/', AuthViews.as_view(), name='auth-actions'),
    path('', include(router.urls)),
]
