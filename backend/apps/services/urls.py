"""
PaintMatch — URLs de l'application services.
Préfixe : /api/services/
"""

from django.urls import path
from .views import (
    ServiceCategoryListView,
    SkillListView,
    PainterPublicProfileView,
    MySkillsView,
    MySkillDetailView,
    MyQualificationsView,
    MyQualificationDetailView,
    MyDocumentsView,
    MyDocumentDetailView,
    MyPortfolioView,
    MyPortfolioDetailView,
    MyPortfolioImageUploadView,
    MyPortfolioImageDeleteView,
    MyServiceOffersView,
    MyServiceOfferDetailView,
)

urlpatterns = [

    # --- Données publiques ---
    path('categories/',                              ServiceCategoryListView.as_view(),      name='service-categories'),
    path('skills/',                                  SkillListView.as_view(),                name='service-skills'),
    path('painters/<int:painter_id>/profile/',       PainterPublicProfileView.as_view(),     name='painter-public-profile'),

    # --- Compétences du peintre connecté ---
    path('my/skills/',                               MySkillsView.as_view(),                 name='my-skills'),
    path('my/skills/<int:pk>/',                      MySkillDetailView.as_view(),            name='my-skill-detail'),

    # --- Qualifications ---
    path('my/qualifications/',                       MyQualificationsView.as_view(),         name='my-qualifications'),
    path('my/qualifications/<uuid:pk>/',             MyQualificationDetailView.as_view(),    name='my-qualification-detail'),

    # --- Documents professionnels ---
    path('my/documents/',                            MyDocumentsView.as_view(),              name='my-documents'),
    path('my/documents/<uuid:pk>/',                  MyDocumentDetailView.as_view(),         name='my-document-detail'),

    # --- Portfolio ---
    path('my/portfolio/',                            MyPortfolioView.as_view(),              name='my-portfolio'),
    path('my/portfolio/<uuid:pk>/',                  MyPortfolioDetailView.as_view(),        name='my-portfolio-detail'),
    path('my/portfolio/<uuid:portfolio_id>/images/', MyPortfolioImageUploadView.as_view(),   name='my-portfolio-image-upload'),
    path('my/portfolio/images/<uuid:pk>/',           MyPortfolioImageDeleteView.as_view(),   name='my-portfolio-image-delete'),

    # --- Offres de services ---
    path('my/offers/',                               MyServiceOffersView.as_view(),          name='my-service-offers'),
    path('my/offers/<uuid:pk>/',                     MyServiceOfferDetailView.as_view(),     name='my-service-offer-detail'),
]
