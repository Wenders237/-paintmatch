from django.urls import path
from .views import (
    ClientQuoteRequestListView, ClientQuoteRequestDetailView,
    PainterQuoteRequestListView,
    PainterQuoteCreateView, PainterQuoteDetailView, PainterSendQuoteView,
    ClientQuoteListView, ClientQuoteDetailView, ClientRespondQuoteView,
    ClientBookingListView, PainterBookingListView,
    BookingDetailView, PainterBookingActionView,
    ClientBookingActionView, WorkProgressCreateView,
    ProgressReactionView,
    InitiatePaymentView, PaymentHistoryView,
    AIQuoteAssistView,
)

urlpatterns = [
    # Demandes de devis
    path('quote-requests/painter/',           PainterQuoteRequestListView.as_view(),  name='painter-quote-requests'),
    path('quote-requests/',                   ClientQuoteRequestListView.as_view(),   name='client-quote-requests'),
    path('quote-requests/<uuid:pk>/',         ClientQuoteRequestDetailView.as_view(), name='client-quote-request-detail'),

    # Devis
    path('quotes/client/',                    ClientQuoteListView.as_view(),          name='client-quotes'),
    path('quotes/',                           PainterQuoteCreateView.as_view(),       name='painter-quote-create'),
    path('quotes/<uuid:pk>/client/',          ClientQuoteDetailView.as_view(),        name='client-quote-detail'),
    path('quotes/<uuid:pk>/send/',            PainterSendQuoteView.as_view(),         name='painter-quote-send'),
    path('quotes/<uuid:pk>/respond/',         ClientRespondQuoteView.as_view(),       name='client-quote-respond'),
    path('quotes/<uuid:pk>/',                 PainterQuoteDetailView.as_view(),       name='painter-quote-detail'),

    # Réservations
    path('bookings/client/',                  ClientBookingListView.as_view(),        name='client-bookings'),
    path('bookings/painter/',                 PainterBookingListView.as_view(),       name='painter-bookings'),
    path('bookings/<uuid:pk>/action/',        PainterBookingActionView.as_view(),     name='booking-painter-action'),
    path('bookings/<uuid:pk>/client-action/', ClientBookingActionView.as_view(),      name='booking-client-action'),
    path('bookings/<uuid:pk>/progress/',      WorkProgressCreateView.as_view(),       name='booking-progress'),
    path('bookings/<uuid:pk>/pay/',           InitiatePaymentView.as_view(),          name='booking-pay'),
    path('bookings/<uuid:pk>/payments/',      PaymentHistoryView.as_view(),           name='booking-payments'),
    path('bookings/<uuid:pk>/',               BookingDetailView.as_view(),            name='booking-detail'),

    # Réactions aux étapes
    path('progress/<uuid:pk>/react/',         ProgressReactionView.as_view(),         name='progress-react'),

    # Assistance IA
    path('ai-assist/',                        AIQuoteAssistView.as_view(),            name='ai-quote-assist'),
]
