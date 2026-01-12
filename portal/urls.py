from django.urls import path, re_path
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
    
    # Admin-only CRUD endpoints for Admission Requirements
    path('api/admin/admission-requirements/', views.api_admin_admission_requirements, name='api_admin_admission_requirements'),
    path('api/admin/admission-requirements/create/', views.api_create_admission_requirement, name='api_create_admission_requirement'),
    path('api/admin/admission-requirements/<int:requirement_id>/', views.api_update_admission_requirement, name='api_update_admission_requirement'),
    path('api/admin/admission-requirements/<int:requirement_id>/delete/', views.api_delete_admission_requirement, name='api_delete_admission_requirement'),
    
    # Admin-only CRUD endpoints for Enrollment Process Steps
    path('api/admin/enrollment-steps/', views.api_admin_enrollment_steps, name='api_admin_enrollment_steps'),
    path('api/admin/enrollment-steps/create/', views.api_create_enrollment_step, name='api_create_enrollment_step'),
    path('api/admin/enrollment-steps/<int:step_id>/', views.api_update_enrollment_step, name='api_update_enrollment_step'),
    path('api/admin/enrollment-steps/<int:step_id>/delete/', views.api_delete_enrollment_step, name='api_delete_enrollment_step'),
    
    # Admin-only CRUD endpoints for Admission Notes
    path('api/admin/admission-notes/', views.api_admin_admission_notes, name='api_admin_admission_notes'),
    path('api/admin/admission-notes/create/', views.api_create_admission_note, name='api_create_admission_note'),
    path('api/admin/admission-notes/<int:note_id>/', views.api_update_admission_note, name='api_update_admission_note'),
    path('api/admin/admission-notes/<int:note_id>/delete/', views.api_delete_admission_note, name='api_delete_admission_note'),
    
    # Public API endpoint for News
    path('api/news/', views.api_news, name='api_news'),
    
    # Admin-only CRUD endpoints for News
    path('api/admin/news/', views.api_admin_news, name='api_admin_news'),
    path('api/admin/news/create/', views.api_create_news, name='api_create_news'),
    path('api/admin/news/<int:news_id>/', views.api_update_news, name='api_update_news'),
    path('api/admin/news/<int:news_id>/delete/', views.api_delete_news, name='api_delete_news'),
    
    # Public API endpoint for Institutional Info
    path('api/institutional-info/', views.api_institutional_info, name='api_institutional_info'),
    
    # Admin-only endpoints for Institutional Info
    path('api/admin/institutional-info/', views.api_admin_institutional_info, name='api_admin_institutional_info'),
    path('api/admin/institutional-info/update/', views.api_update_institutional_info, name='api_update_institutional_info'),
    
    # Admin-only CRUD endpoints for Downloads
    path('api/admin/downloads/', views.api_admin_downloads, name='api_admin_downloads'),
    path('api/admin/downloads/create/', views.api_create_download, name='api_create_download'),
    path('api/admin/downloads/<int:download_id>/', views.api_update_download, name='api_update_download'),
    path('api/admin/downloads/<int:download_id>/delete/', views.api_delete_download, name='api_delete_download'),
    
    # Handle webpack hot-update requests to suppress 404 errors
    # These files are served by webpack-dev-server (port 3000), not Django
    re_path(r'^.*\.hot-update\.(js|json)$', views.handle_hot_update, name='handle_hot_update'),
] 