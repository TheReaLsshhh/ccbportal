from django.contrib import admin
from django.contrib import messages
from django import forms
from .models import AcademicProgram, ProgramSpecialization, Announcement, Event, Achievement, Department, Personnel, AdmissionRequirement, EnrollmentProcessStep, AdmissionNote, News, InstitutionalInfo, Download, ChatbotSession, ChatbotMessage

# Register your models here.
admin.site.register(AcademicProgram)
admin.site.register(ProgramSpecialization)

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'is_active', 'display_order')
    list_filter = ('is_active',)
    search_fields = ('title', 'body', 'details')
    ordering = ('display_order', '-date')

admin.site.register(Event)

admin.site.register(Achievement)

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

@admin.register(AdmissionRequirement)
class AdmissionRequirementAdmin(admin.ModelAdmin):
    list_display = ('category', 'requirement_text_short', 'display_order', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('requirement_text',)
    ordering = ('category', 'display_order', 'id')
    
    def requirement_text_short(self, obj):
        return obj.requirement_text[:80] + '...' if len(obj.requirement_text) > 80 else obj.requirement_text
    requirement_text_short.short_description = 'Requirement'

@admin.register(EnrollmentProcessStep)
class EnrollmentProcessStepAdmin(admin.ModelAdmin):
    list_display = ('category', 'step_number', 'title', 'display_order', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('title', 'description')
    ordering = ('category', 'display_order', 'step_number')
    fieldsets = (
        ('Step Information', {
            'fields': ('category', 'step_number', 'title', 'description')
        }),
        ('Display Settings', {
            'fields': ('is_active', 'display_order')
        }),
    )

@admin.register(AdmissionNote)
class AdmissionNoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'note_text_short', 'display_order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title', 'note_text')
    ordering = ('display_order', 'title')
    
    def note_text_short(self, obj):
        return obj.note_text[:80] + '...' if len(obj.note_text) > 80 else obj.note_text
    note_text_short.short_description = 'Note'

admin.site.register(News)

@admin.register(InstitutionalInfo)
class InstitutionalInfoAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    fieldsets = (
        ('Vision', {
            'fields': ('vision',)
        }),
        ('Mission', {
            'fields': ('mission',)
        }),
        ('Goals', {
            'fields': ('goals',),
            'description': 'Enter goals one per line. Each line will be displayed as a separate goal item.'
        }),
        ('Core Values', {
            'fields': ('core_values',),
            'description': 'Enter core values description. You can use HTML formatting or plain text.'
        }),
        ('Display Settings', {
            'fields': ('is_active',)
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one active record
        if InstitutionalInfo.objects.filter(is_active=True).exists():
            return not InstitutionalInfo.objects.exists()
        return True
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of the only record
        if InstitutionalInfo.objects.count() <= 1:
            return False
        return True

@admin.register(ChatbotSession)
class ChatbotSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'ip_address', 'message_count', 'created_at', 'last_activity')
    list_filter = ('created_at', 'last_activity')
    search_fields = ('session_id', 'ip_address')
    readonly_fields = ('session_id', 'created_at', 'last_activity')
    ordering = ('-last_activity',)


@admin.register(ChatbotMessage)
class ChatbotMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'user_message_preview', 'bot_response_preview', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user_message', 'bot_response', 'session__session_id')
    readonly_fields = ('session', 'created_at')
    ordering = ('-created_at',)
    
    def user_message_preview(self, obj):
        return obj.user_message[:50] + '...' if len(obj.user_message) > 50 else obj.user_message
    user_message_preview.short_description = 'User Message'
    
    def bot_response_preview(self, obj):
        return obj.bot_response[:50] + '...' if len(obj.bot_response) > 50 else obj.bot_response
    bot_response_preview.short_description = 'Bot Response'


admin.site.register(Download)
