from django.urls import path
from .views import (
    CreateReviewView,
    MyReviewsGivenView,
    PainterReviewsPublicView,
    MyReviewsReceivedView,
    PainterReplyView,
    CheckReviewView,
)

urlpatterns = [
    path('',                              CreateReviewView.as_view(),          name='review-create'),
    path('my/',                           MyReviewsGivenView.as_view(),        name='my-reviews-given'),
    path('painter/me/',                   MyReviewsReceivedView.as_view(),     name='my-reviews-received'),
    path('painter/<int:painter_id>/',     PainterReviewsPublicView.as_view(),  name='painter-reviews-public'),
    path('<uuid:pk>/reply/',              PainterReplyView.as_view(),          name='review-reply'),
    path('<uuid:booking_id>/check/',      CheckReviewView.as_view(),           name='review-check'),
]
