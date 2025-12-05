from django.contrib import admin
from .models import AcademicProgram, ProgramSpecialization, Announcement, Event, Achievement, Department, Personnel

# Register your models here.
admin.site.register(AcademicProgram)
admin.site.register(ProgramSpecialization)

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'is_active', 'display_order')
    list_filter = ('is_active',)
    search_fields = ('title', 'body', 'details')
    ordering = ('display_order', '-date')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_date', 'start_time', 'end_time', 'location', 'is_active', 'display_order')
    list_filter = ('is_active', 'event_date')
    search_fields = ('title', 'description', 'details', 'location')
    ordering = ('display_order', 'event_date', 'start_time')
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'details')
        }),
        ('Date & Time', {
            'fields': ('event_date', 'start_time', 'end_time')
        }),
        ('Additional Information', {
            'fields': ('location', 'is_active', 'display_order')
        }),
    )

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('title', 'achievement_date', 'category', 'is_active', 'display_order')
    list_filter = ('is_active', 'achievement_date', 'category')
    search_fields = ('title', 'description', 'details', 'category')
    ordering = ('display_order', '-achievement_date')
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'details')
        }),
        ('Date & Category', {
            'fields': ('achievement_date', 'category')
        }),
        ('Display Settings', {
            'fields': ('is_active', 'display_order')
        }),
    )

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'department_type', 'head_name', 'office_location', 'is_active', 'display_order')
    list_filter = ('department_type', 'is_active')
    search_fields = ('name', 'description', 'head_name', 'office_location')
    ordering = ('department_type', 'display_order', 'name')
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'department_type', 'description')
        }),
        ('Contact Information', {
            'fields': ('office_location', 'phone', 'email')
        }),
        ('Leadership', {
            'fields': ('head_name', 'head_title')
        }),
        ('Display Settings', {
            'fields': ('is_active', 'display_order')
        }),
    )

@admin.register(Personnel)
class PersonnelAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'department', 'title', 'position_type', 'is_active', 'display_order')
    list_filter = ('department', 'position_type', 'is_active')
    search_fields = ('first_name', 'last_name', 'title', 'specialization', 'email')
    ordering = ('department', 'position_type', 'display_order', 'last_name')
    fieldsets = (
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'middle_name')
        }),
        ('Position Information', {
            'fields': ('department', 'position_type', 'title', 'specialization')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone', 'office_location')
        }),
        ('Additional Information', {
            'fields': ('bio', 'qualifications')
        }),
        ('Display Settings', {
            'fields': ('is_active', 'display_order')
        }),
    )