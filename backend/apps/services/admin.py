from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import (
    ServiceCategory, Skill, PainterSkill,
    Qualification, ProfessionalDoc, Portfolio, PortfolioImage, ServiceOffer
)


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'order')
    list_editable = ('is_active', 'order')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name',)


class PortfolioImageInline(admin.TabularInline):
    model = PortfolioImage
    extra = 1


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('title', 'painter', 'category', 'date_completed')
    list_filter = ('category',)
    search_fields = ('title', 'painter__user__email')
    inlines = [PortfolioImageInline]


@admin.register(ProfessionalDoc)
class ProfessionalDocAdmin(admin.ModelAdmin):
    list_display = ('painter', 'doc_type', 'title', 'uploaded_at', 'is_verified')
    list_filter = ('doc_type', 'is_verified')
    list_editable = ('is_verified',)
    search_fields = ('painter__user__email', 'title')


@admin.register(ServiceOffer)
class ServiceOfferAdmin(admin.ModelAdmin):
    list_display = ('title', 'painter', 'category', 'price_range_min', 'price_range_max', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('title', 'painter__user__email')
