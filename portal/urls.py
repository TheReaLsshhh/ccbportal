from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReactAppView.as_view(), name='index'),
    path('api/test/', views.api_test, name='api_test'),
    
    # Public API endpoints
    path('api/academic-programs/', views.api_academic_programs, name='api_academic_programs'),
    path('api/academic-programs/<int:program_id>/', views.api_academic_program_detail, name='api_academic_program_detail'),
    path('api/news-events/', views.api_news_events, name='api_news_events'),
    path('api/announcements/', views.api_announcements, name='api_announcements'),
    path('api/events/', views.api_events, name='api_events'),
    path('api/achievements/', views.api_achievements, name='api_achievements'),
    path('api/admissions-info/', views.api_admissions_info, name='api_admissions_info'),
    path('api/downloads/', views.api_downloads, name='api_downloads'),
    path('api/contact-form/', views.api_contact_form, name='api_contact_form'),
    path('api/contact/', views.contact, name='contact'),
    path('api/contact/verify/', views.api_contact_verify, name='api_contact_verify'),
    path('api/search/', views.api_search, name='api_search'),
    
    # Admin login endpoint
    path('api/admin/login/', views.api_admin_login, name='api_admin_login'),
    path('api/admin/auth-check/', views.api_admin_auth_check, name='api_admin_auth_check'),
    path('api/admin/logout/', views.api_admin_logout, name='api_admin_logout'),
    
    # Admin-only CRUD endpoints for Academic Programs
    path('api/admin/academic-programs/', views.api_admin_academic_programs, name='api_admin_academic_programs'),
    path('api/admin/academic-programs/create/', views.api_create_academic_program, name='api_create_academic_program'),
    path('api/admin/academic-programs/<int:program_id>/', views.api_update_academic_program, name='api_update_academic_program'),
    path('api/admin/academic-programs/<int:program_id>/delete/', views.api_delete_academic_program, name='api_delete_academic_program'),
    
    # Admin-only CRUD endpoints for Events
    path('api/admin/events/', views.api_admin_events, name='api_admin_events'),
    path('api/admin/events/create/', views.api_create_event, name='api_create_event'),
    path('api/admin/events/<int:event_id>/', views.api_update_event, name='api_update_event'),
    path('api/admin/events/<int:event_id>/delete/', views.api_delete_event, name='api_delete_event'),
    
    # Admin-only CRUD endpoints for Achievements
    path('api/admin/achievements/', views.api_admin_achievements, name='api_admin_achievements'),
    path('api/admin/achievements/create/', views.api_create_achievement, name='api_create_achievement'),
    path('api/admin/achievements/<int:achievement_id>/', views.api_update_achievement, name='api_update_achievement'),
    path('api/admin/achievements/<int:achievement_id>/delete/', views.api_delete_achievement, name='api_delete_achievement'),
    
    # Admin-only CRUD endpoints for Announcements
    path('api/admin/announcements/', views.api_admin_announcements, name='api_admin_announcements'),
    path('api/admin/announcements/create/', views.api_create_announcement, name='api_create_announcement'),
    path('api/admin/announcements/<int:announcement_id>/', views.api_update_announcement, name='api_update_announcement'),
    path('api/admin/announcements/<int:announcement_id>/delete/', views.api_delete_announcement, name='api_delete_announcement'),
    
    # Public API endpoints for Departments and Personnel
    path('api/departments/', views.api_departments, name='api_departments'),
    path('api/personnel/', views.api_personnel, name='api_personnel'),
    
    # Admin-only CRUD endpoints for Departments
    path('api/admin/departments/', views.api_admin_departments, name='api_admin_departments'),
    path('api/admin/departments/create/', views.api_create_department, name='api_create_department'),
    path('api/admin/departments/<int:department_id>/', views.api_update_department, name='api_update_department'),
    path('api/admin/departments/<int:department_id>/delete/', views.api_delete_department, name='api_delete_department'),
    
    # Admin-only CRUD endpoints for Personnel
    path('api/admin/personnel/', views.api_admin_personnel, name='api_admin_personnel'),
    path('api/admin/personnel/create/', views.api_create_personnel, name='api_create_personnel'),
    path('api/admin/personnel/<int:personnel_id>/', views.api_update_personnel, name='api_update_personnel'),
    path('api/admin/personnel/<int:personnel_id>/delete/', views.api_delete_personnel, name='api_delete_personnel'),
] 