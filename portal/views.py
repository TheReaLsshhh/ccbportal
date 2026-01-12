from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth import authenticate, login
from django.core.paginator import Paginator
from django.db.models import Q
from django.core.mail import send_mail, EmailMessage, EmailMultiAlternatives
from django.utils.html import escape
from django.utils.crypto import get_random_string
from django.utils import timezone
from django.core.exceptions import ValidationError
import socket
import json
from django.conf import settings
from functools import wraps
import datetime
from email.mime.image import MIMEImage
from .models import AcademicProgram, ProgramSpecialization, Announcement, Event, Achievement, ContactSubmission, EmailVerification, Department, Personnel, AdmissionRequirement, EnrollmentProcessStep, AdmissionNote, News, InstitutionalInfo, Download
from .utils import build_safe_media_url, sanitize_input, validate_file_upload
import os


def login_required_json(view_func):
    """Custom decorator that returns JSON error for unauthenticated users instead of redirecting"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'status': 'error',
                'message': 'Authentication required',
                'authenticated': False
            }, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


def _compute_lan_base_url() -> str:
    """Return a best-effort base URL using the host's LAN IP on dynamic port.
    Port defaults to 8000 but can be set via DJANGO_PORT environment variable.
    Prefers addresses like 192.168.44.x when available.
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
    except Exception:
        ip = "127.0.0.1"
    # Use dynamic port from environment variable, default to 8000
    port = int(os.getenv('DJANGO_PORT', '8000'))
    return f"http://{ip}:{port}"


def _compute_frontend_base_url() -> str:
    """Return a best-effort frontend base URL using LAN IP on port 3000."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
    except Exception:
        ip = "127.0.0.1"
    return f"http://{ip}:3000"


# Utility: robustly parse dates from various common formats
def _parse_date(value: object) -> datetime.date:
    """Parse a date value coming from JSON into a datetime.date.

    Accepts:
    - datetime.date or datetime.datetime (returns date component)
    - ISO date string (YYYY-MM-DD)
    - Common browser-locale strings like MM/DD/YYYY or DD/MM/YYYY
    """
    if isinstance(value, datetime.date) and not isinstance(value, datetime.datetime):
        return value
    if isinstance(value, datetime.datetime):
        return value.date()
    if isinstance(value, str):
        # Try ISO first
        try:
            return datetime.date.fromisoformat(value)
        except ValueError:
            pass
        # Try common numeric formats
        for fmt in ("%m/%d/%Y", "%d/%m/%Y"):
            try:
                return datetime.datetime.strptime(value, fmt).date()
            except ValueError:
                continue
    raise ValueError("Invalid date format. Expected YYYY-MM-DD or MM/DD/YYYY.")


# Utility: parse time strings into datetime.time objects
def _parse_time(value: object) -> datetime.time:
    """Parse a time value into a datetime.time.
    
    Accepts:
    - datetime.time (returns as-is)
    - datetime.datetime (returns time component)
    - Time string in formats: "HH:MM" or "HH:MM:SS"
    """
    if isinstance(value, datetime.time):
        return value
    if isinstance(value, datetime.datetime):
        return value.time()
    if isinstance(value, str):
        # Try HH:MM:SS format first
        try:
            return datetime.datetime.strptime(value, '%H:%M:%S').time()
        except ValueError:
            pass
        # Try HH:MM format
        try:
            return datetime.datetime.strptime(value, '%H:%M').time()
        except ValueError:
            pass
    raise ValueError("Invalid time format. Expected HH:MM or HH:MM:SS.")


def _public_image_url(rel_path: str) -> str:
    base = os.getenv('PUBLIC_IMAGE_BASE_URL') or os.getenv('PUBLIC_BASE_URL', _compute_lan_base_url())
    if not rel_path.startswith('/'):
        rel_path = '/' + rel_path
    return f"{base}{rel_path}"


def index(request):
    """Serve React frontend"""
    return render(request, 'index.html')


def api_test(request):
    """Test API endpoint"""
    return JsonResponse({
        'message': 'Hello from Django API!',
        'status': 'success'
    })


@require_http_methods(["GET"])
def api_academic_programs(request):
    """Get academic programs data from database"""
    try:
        # Get all active programs ordered by display_order
        programs = AcademicProgram.objects.filter(is_active=True).order_by('display_order', 'title')
        
        programs_data = []
        for program in programs:
            # Get active specializations for this program
            specializations = program.specializations.filter(is_active=True).values_list('name', flat=True)
            
            program_data = {
                'id': program.id,
                'title': program.title,
                'short_title': program.short_title,
                'program_type': program.program_type,
                'description': program.description,
                'duration_years': program.duration_years,
                'total_units': program.total_units,
                'with_enhancements': program.with_enhancements,
                'duration_text': program.duration_text,
                'units_text': program.units_text,
                'enhancements_text': program.enhancements_text,
                'program_overview': program.program_overview,
                'core_courses': program.core_courses.split('\n') if program.core_courses else [],
                'career_prospects': program.career_prospects,
                'general_requirements': getattr(program, 'general_requirements', '').split('\n') if getattr(program, 'general_requirements', None) else [],
                'specific_requirements': getattr(program, 'specific_requirements', '').split('\n') if getattr(program, 'specific_requirements', None) else [],
                'specializations': list(specializations),
                'display_order': program.display_order,
                'created_at': program.created_at.isoformat(),
                'updated_at': program.updated_at.isoformat()
            }
            programs_data.append(program_data)
        
        return JsonResponse({
            'status': 'success',
            'programs': programs_data,
            'count': len(programs_data)
        })
    
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching programs: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def api_academic_program_detail(request, program_id):
    """Get detailed information for a specific academic program"""
    try:
        program = get_object_or_404(AcademicProgram, id=program_id, is_active=True)
        
        # Get active specializations
        specializations = program.specializations.filter(is_active=True).values('id', 'name', 'description')
        
        program_data = {
            'id': program.id,
            'title': program.title,
            'short_title': program.short_title,
            'program_type': program.program_type,
            'description': program.description,
            'duration_years': program.duration_years,
            'total_units': program.total_units,
            'with_enhancements': program.with_enhancements,
            'duration_text': program.duration_text,
            'units_text': program.units_text,
            'enhancements_text': program.enhancements_text,
            'program_overview': program.program_overview,
            'core_courses': program.core_courses.split('\n') if program.core_courses else [],
            'career_prospects': program.career_prospects,
            'general_requirements': getattr(program, 'general_requirements', '').split('\n') if getattr(program, 'general_requirements', None) else [],
            'specific_requirements': getattr(program, 'specific_requirements', '').split('\n') if getattr(program, 'specific_requirements', None) else [],
            'specializations': list(specializations),
            'display_order': program.display_order,
            'created_at': program.created_at.isoformat(),
            'updated_at': program.updated_at.isoformat()
        }
        
        return JsonResponse({
            'status': 'success',
            'program': program_data
        })
    
    except AcademicProgram.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Program not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching program: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def api_news_events(request):
    """Get news and events data"""
    news_items = [
        {
            'id': 1,
            'date': 'December 18, 2025',
            'title': 'CCB Research Symposium 2025',
            'description': 'Showcasing innovative research projects across departments.',
            'image_url': '/static/images/news1.jpg'
        },
        {
            'id': 2,
            'date': 'December 15, 2025',
            'title': 'Annual Recognition Day 2025',
            'description': 'Celebrating the achievements of our outstanding students.',
            'image_url': '/static/images/news2.jpg'
        },
        {
            'id': 3,
            'date': 'December 12, 2025',
            'title': 'Community Outreach Program',
            'description': 'Volunteer activities focused on education and health awareness.',
            'image_url': '/static/images/news3.jpg'
        },
        {
            'id': 4,
            'date': 'December 10, 2025',
            'title': 'New Computer Laboratory Opening',
            'description': 'State-of-the-art facilities for hands-on IT learning.',
            'image_url': '/static/images/news4.jpg'
        },
        {
            'id': 5,
            'date': 'December 9, 2025',
            'title': 'Faculty Development Workshop',
            'description': 'Continuous upskilling for academic excellence.',
            'image_url': '/static/images/news5.jpg'
        },
        {
            'id': 6,
            'date': 'December 7, 2025',
            'title': 'Alumni Homecoming',
            'description': 'A night of memories and connections with our alumni.',
            'image_url': '/static/images/news6.jpg'
        }
    ]
    return JsonResponse({'news_items': news_items})


@require_http_methods(["GET"])
def api_admissions_info(request):
    """Get admissions information"""
    # Get requirements grouped by category
    requirements_by_category = {}
    for category, _ in AdmissionRequirement.CATEGORY_CHOICES:
        requirements = AdmissionRequirement.objects.filter(
            category=category,
            is_active=True
        ).order_by('display_order', 'id')
        requirements_by_category[category] = [
            {
                'id': req.id,
                'text': req.requirement_text,
                'display_order': req.display_order
            }
            for req in requirements
        ]
    
    # Get enrollment process steps grouped by category
    process_steps_by_category = {}
    for category, _ in EnrollmentProcessStep.CATEGORY_CHOICES:
        steps = EnrollmentProcessStep.objects.filter(
            category=category,
            is_active=True
        ).order_by('display_order', 'step_number')
        process_steps_by_category[category] = [
            {
                'id': step.id,
                'step_number': step.step_number,
                'title': step.title,
                'description': step.description,
                'display_order': step.display_order
            }
            for step in steps
        ]
    
    # Also provide a flat list for backward compatibility
    # Include steps even if they don't have a category (for backward compatibility)
    process_steps = EnrollmentProcessStep.objects.filter(
        is_active=True
    ).order_by('category', 'display_order', 'step_number')
    
    process_steps_data = [
        {
            'id': step.id,
            'step_number': step.step_number,
            'title': step.title,
            'description': step.description,
            'category': getattr(step, 'category', 'new-scholar'),  # Default to 'new-scholar' if category doesn't exist
            'display_order': step.display_order
        }
        for step in process_steps
    ]
    
    # Also add any steps that might have been missed (e.g., NULL categories or migration issues)
    # Get all active steps and ensure they're in the grouped data
    all_active_steps = EnrollmentProcessStep.objects.filter(is_active=True)
    for step in all_active_steps:
        step_category = getattr(step, 'category', None) or 'new-scholar'
        # Ensure the category exists in our grouped data
        if step_category not in process_steps_by_category:
            process_steps_by_category[step_category] = []
        # Check if this step is already in the list (avoid duplicates)
        step_ids = [s['id'] for s in process_steps_by_category[step_category]]
        if step.id not in step_ids:
            process_steps_by_category[step_category].append({
                'id': step.id,
                'step_number': step.step_number,
                'title': step.title,
                'description': step.description,
                'display_order': step.display_order
            })
    
    # Sort each category's steps by display_order and step_number
    for category in process_steps_by_category:
        process_steps_by_category[category].sort(key=lambda x: (x.get('display_order', 0), x.get('step_number', 0)))
    
    # Get admission notes
    notes = AdmissionNote.objects.filter(
        is_active=True
    ).order_by('display_order', 'id')
    
    notes_data = [
        {
            'id': note.id,
            'title': note.title,
            'text': note.note_text,
            'display_order': note.display_order
        }
        for note in notes
    ]
    
    admissions_data = {
        'requirements': requirements_by_category,
        'process_steps': process_steps_data,  # Flat list for backward compatibility
        'process_steps_by_category': process_steps_by_category,  # Grouped by category
        'notes': notes_data
    }
    return JsonResponse(admissions_data)


@require_http_methods(["GET"])
def api_downloads(request):
    """
    Public API endpoint to retrieve active downloads grouped by category.
    
    Returns only downloads marked as active, organized by their category for easy
    frontend rendering. This endpoint is used by the public Downloads page to
    display available files to users.
    
    Returns:
        JSON response with downloads organized by category:
        {
            'status': 'success',
            'downloads': {
                'category-name': [
                    {
                        'id': int,
                        'title': str,
                        'description': str,
                        'file_url': str,
                        'file_type': str,
                        'category': str,
                        'category_display': str
                    }
                ]
            }
        }
    """
    try:
        downloads = Download.objects.filter(is_active=True).order_by('category', 'display_order', 'title')
        
        # Group downloads by category
        downloads_by_category = {}
        for download in downloads:
            category = download.category
            if category not in downloads_by_category:
                downloads_by_category[category] = []
            
            downloads_by_category[category].append({
                'id': download.id,
                'title': download.title,
                'description': download.description,
                'file_url': build_safe_media_url(request, download.file) if download.file else None,
                'file_type': download.file_type or 'FILE',
                'category': download.category,
                'category_display': download.get_category_display()
            })
        
        return JsonResponse({
            'status': 'success',
            'downloads': downloads_by_category
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching downloads: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def api_announcements(request):
    """Return active announcements"""
    try:
        items = Announcement.objects.filter(is_active=True).order_by('display_order', '-date')
        data = [
            {
                'id': a.id,
                'title': a.title,
                'date': a.date.isoformat(),
                'body': a.body,
                'details': a.details,
                'image': build_safe_media_url(request, a) if a.image else None,
            }
            for a in items
        ]
        return JsonResponse({'status': 'success', 'announcements': data, 'count': len(data)})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error fetching announcements: {str(e)}'}, status=500)


@require_http_methods(["POST"])
@csrf_exempt
@login_required
@permission_required('portal.add_announcement', raise_exception=True)
def api_create_announcement(request):
    """Create a new announcement (Admin only)"""
    try:
        # Handle multipart/form-data for file upload
        if request.content_type and 'multipart/form-data' in request.content_type:
            title = sanitize_input(request.POST.get('title', ''), max_length=200)
            date = request.POST.get('date')
            body = sanitize_input(request.POST.get('body', ''))
            details = sanitize_input(request.POST.get('details', ''))
            is_active = request.POST.get('is_active', 'true').lower() == 'true'
            display_order = int(request.POST.get('display_order', 0))
            image = request.FILES.get('image')
            
            # Validate image upload if provided
            if image:
                is_valid, error_msg = validate_file_upload(image, max_size_mb=10)
                if not is_valid:
                    return JsonResponse({
                        'status': 'error',
                        'message': error_msg
                    }, status=400)
        else:
            # Handle JSON (for backward compatibility, though image won't work)
            data = json.loads(request.body)
            title = sanitize_input(data.get('title', ''), max_length=200)
            date = data.get('date')
            body = sanitize_input(data.get('body', ''))
            details = sanitize_input(data.get('details', ''))
            is_active = data.get('is_active', True)
            display_order = data.get('display_order', 0)
            image = None

        # Validate required fields
        required_fields = {'title': title, 'date': date, 'body': body}
        for field, value in required_fields.items():
            if not value:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Field "{field}" is required'
                }, status=400)

        announcement = Announcement.objects.create(
            title=title,
            date=_parse_date(date),
            body=body,
            details=details,
            is_active=is_active,
            display_order=display_order
        )
        
        # Handle image upload
        if image:
            announcement.image = image
            announcement.save()

        return JsonResponse({
            'status': 'success',
            'message': 'Announcement created successfully',
            'announcement': {
                'id': announcement.id,
                'title': announcement.title,
                'date': announcement.date.isoformat(),
                'image': build_safe_media_url(request, announcement) if announcement.image else None
            }
        }, status=201)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error creating announcement: {str(e)}'
        }, status=500)


@require_http_methods(["PUT", "PATCH"])
@csrf_exempt
@login_required
@permission_required('portal.change_announcement', raise_exception=True)
def api_update_announcement(request, announcement_id):
    """Update an announcement (Admin only)"""
    try:
        announcement = get_object_or_404(Announcement, id=announcement_id)
        
        # Handle multipart/form-data for file upload
        if request.content_type and 'multipart/form-data' in request.content_type:
            if 'title' in request.POST:
                announcement.title = request.POST.get('title')
            if 'date' in request.POST:
                announcement.date = _parse_date(request.POST.get('date'))
            if 'body' in request.POST:
                announcement.body = request.POST.get('body')
            if 'details' in request.POST:
                announcement.details = request.POST.get('details', '')
            if 'is_active' in request.POST:
                announcement.is_active = request.POST.get('is_active', 'true').lower() == 'true'
            if 'display_order' in request.POST:
                announcement.display_order = int(request.POST.get('display_order', 0))
            
            # Handle image upload
            image = request.FILES.get('image')
            remove_image = request.POST.get('remove_image', 'false').lower() == 'true'
            
            if remove_image:
                if announcement.image:
                    announcement.image.delete(save=False)
                announcement.image = None
            elif image:
                announcement.image = image
        else:
            # Handle JSON
            data = json.loads(request.body)
            
            fields_to_update = [
                'title', 'date', 'body', 'details', 'is_active', 'display_order'
            ]

            for field in fields_to_update:
                if field in data:
                    if field == 'date':
                        setattr(announcement, field, _parse_date(data[field]))
                    else:
                        setattr(announcement, field, data[field])

        announcement.save()

        return JsonResponse({
            'status': 'success',
            'message': 'Announcement updated successfully',
            'announcement': {
                'id': announcement.id,
                'title': announcement.title,
                'date': announcement.date.isoformat(),
                'image': announcement.image.url if announcement.image else None
            }
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Announcement.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Announcement not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error updating announcement: {str(e)}'
        }, status=500)


@require_http_methods(["DELETE"])
@csrf_exempt
@login_required
@permission_required('portal.delete_announcement', raise_exception=True)
def api_delete_announcement(request, announcement_id):
    """Delete an announcement (Admin only)"""
    try:
        announcement = get_object_or_404(Announcement, id=announcement_id)
        announcement_title = announcement.title
        announcement.delete()

        return JsonResponse({
            'status': 'success',
            'message': f'Announcement "{announcement_title}" deleted successfully'
        })
    
    except Announcement.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Announcement not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error deleting announcement: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def api_events(request):
    """Return active events"""
    try:
        items = Event.objects.filter(is_active=True).order_by('display_order', 'event_date', 'start_time')
        data = []
        for e in items:
            event_data = {
                'id': e.id,
                'title': e.title,
                'description': e.description,
                'details': e.details,
                'event_date': e.event_date.isoformat(),
                'start_time': e.start_time.strftime('%H:%M'),
                'end_time': e.end_time.strftime('%H:%M'),
                'formatted_time': e.formatted_time,
                'formatted_date': e.formatted_date,
                'location': e.location,
                'display_order': e.display_order,
            }
            if e.image:
                event_data['image'] = build_safe_media_url(request, e)
            else:
                event_data['image'] = None
            data.append(event_data)
        return JsonResponse({'status': 'success', 'events': data, 'count': len(data)})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error fetching events: {str(e)}'}, status=500)


@require_http_methods(["GET"])
def api_achievements(request):
    """Return active achievements"""
    try:
        items = Achievement.objects.filter(is_active=True).order_by('display_order', '-achievement_date')
        data = []
        for a in items:
            achievement_data = {
                'id': a.id,
                'title': a.title,
                'description': a.description,
                'details': a.details,
                'achievement_date': a.achievement_date.isoformat(),
                'formatted_date': a.formatted_date,
                'category': a.category,
                'display_order': a.display_order,
            }
            if a.image:
                achievement_data['image'] = build_safe_media_url(request, a)
            else:
                achievement_data['image'] = None
            data.append(achievement_data)
        return JsonResponse({'status': 'success', 'achievements': data, 'count': len(data)})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error fetching achievements: {str(e)}'}, status=500)


@require_http_methods(["GET"])
def api_search(request):
    """Dynamic search across all content types"""
    try:
        query = request.GET.get('q', '').strip()
        
        if not query or len(query) < 2:
            return JsonResponse({
                'status': 'success', 
                'results': [], 
                'count': 0,
                'message': 'Query too short. Please enter at least 2 characters.'
            })
        
        results = []
        
        # Search in Academic Programs
        try:
            programs = AcademicProgram.objects.filter(
                is_active=True
            ).filter(
                models.Q(title__icontains=query) |
                models.Q(description__icontains=query) |
                models.Q(program_overview__icontains=query) |
                models.Q(short_title__icontains=query)
            )[:5]
            
            for program in programs:
                results.append({
                    'id': f'program_{program.id}',
                    'title': program.title,
                    'description': program.description[:150] + '...' if len(program.description) > 150 else program.description,
                    'category': 'Academic Program',
                    'url': '/academics',
                    'type': 'academic_program'
                })
        except Exception as e:
            print(f"Error searching programs: {e}")
        
        # Search in Events
        try:
            events = Event.objects.filter(
                is_active=True
            ).filter(
                models.Q(title__icontains=query) |
                models.Q(description__icontains=query) |
                models.Q(details__icontains=query) |
                models.Q(location__icontains=query)
            )[:5]
            
            for event in events:
                results.append({
                    'id': f'event_{event.id}',
                    'title': event.title,
                    'description': event.description[:150] + '...' if len(event.description) > 150 else event.description,
                    'category': 'Event',
                    'url': '/news',
                    'type': 'event'
                })
        except Exception as e:
            print(f"Error searching events: {e}")
        
        # Search in Announcements
        try:
            announcements = Announcement.objects.filter(
                is_active=True
            ).filter(
                models.Q(title__icontains=query) |
                models.Q(body__icontains=query) |
                models.Q(details__icontains=query)
            )[:5]
            
            for announcement in announcements:
                results.append({
                    'id': f'announcement_{announcement.id}',
                    'title': announcement.title,
                    'description': announcement.body[:150] + '...' if len(announcement.body) > 150 else announcement.body,
                    'category': 'Announcement',
                    'url': '/news',
                    'type': 'announcement'
                })
        except Exception as e:
            print(f"Error searching announcements: {e}")
        
        # Search in Achievements
        try:
            achievements = Achievement.objects.filter(
                is_active=True
            ).filter(
                models.Q(title__icontains=query) |
                models.Q(description__icontains=query) |
                models.Q(details__icontains=query) |
                models.Q(category__icontains=query)
            )[:5]
            
            for achievement in achievements:
                results.append({
                    'id': f'achievement_{achievement.id}',
                    'title': achievement.title,
                    'description': achievement.description[:150] + '...' if len(achievement.description) > 150 else achievement.description,
                    'category': f'Achievement - {achievement.category}',
                    'url': '/news',
                    'type': 'achievement'
                })
        except Exception as e:
            print(f"Error searching achievements: {e}")
        
        # Search in Departments
        try:
            departments = Department.objects.filter(
                is_active=True
            ).filter(
                models.Q(name__icontains=query) |
                models.Q(description__icontains=query) |
                models.Q(head_name__icontains=query) |
                models.Q(office_location__icontains=query)
            )[:3]
            
            for department in departments:
                results.append({
                    'id': f'department_{department.id}',
                    'title': department.name,
                    'description': department.description[:150] + '...' if len(department.description) > 150 else department.description,
                    'category': f'Department - {department.department_type.title()}',
                    'url': '/faculty',
                    'type': 'department'
                })
        except Exception as e:
            print(f"Error searching departments: {e}")
        
        # Search in Personnel
        try:
            personnel = Personnel.objects.filter(
                is_active=True
            ).filter(
                models.Q(first_name__icontains=query) |
                models.Q(last_name__icontains=query) |
                models.Q(middle_name__icontains=query) |
                models.Q(title__icontains=query) |
                models.Q(specialization__icontains=query) |
                models.Q(bio__icontains=query)
            )[:3]
            
            for person in personnel:
                full_name = f"{person.first_name} {person.last_name}".strip()
                if person.middle_name:
                    full_name += f" {person.middle_name}"
                results.append({
                    'id': f'personnel_{person.id}',
                    'title': full_name,
                    'description': f"{person.title} - {person.specialization or 'Faculty Member'}",
                    'category': f'Personnel - {person.position_type.title()}',
                    'url': '/faculty',
                    'type': 'personnel'
                })
        except Exception as e:
            print(f"Error searching personnel: {e}")
        
        # Add comprehensive static pages and content
        static_pages = [
            # Main Navigation Pages
            {
                'id': 'page_home',
                'title': 'Home Page',
                'description': 'Welcome to City College of Bayawan - Honor and Excellence for the Highest Good',
                'category': 'Main Navigation',
                'url': '/',
                'type': 'page'
            },
            {
                'id': 'page_academics',
                'title': 'Academic Programs',
                'description': 'Explore our undergraduate programs and academic offerings',
                'category': 'Main Navigation',
                'url': '/academics',
                'type': 'page'
            },
            {
                'id': 'page_admissions',
                'title': 'Admissions',
                'description': 'Admission requirements, enrollment process, and important dates for new students and transferees',
                'category': 'Main Navigation',
                'url': '/admissions',
                'type': 'page'
            },
            {
                'id': 'page_news',
                'title': 'News & Events',
                'description': 'Latest announcements, school events, activities, achievements, and press releases',
                'category': 'Main Navigation',
                'url': '/news',
                'type': 'page'
            },
            {
                'id': 'page_downloads',
                'title': 'Downloads',
                'description': 'Enrollment forms, clearance forms, request slips, shift forms, HR policies, and handbooks',
                'category': 'Main Navigation',
                'url': '/downloads',
                'type': 'page'
            },
            
            # Secondary Navigation Pages
            {
                'id': 'page_students',
                'title': 'Students',
                'description': 'Student handbook, academic calendar, student services, guidance counseling, library services, campus activities',
                'category': 'Secondary Navigation',
                'url': '/students',
                'type': 'page'
            },
            {
                'id': 'page_faculty',
                'title': 'Faculty & Staff',
                'description': 'Department directory, personnel information, teaching resources, administrative systems, communication tools',
                'category': 'Secondary Navigation',
                'url': '/faculty',
                'type': 'page'
            },
            {
                'id': 'page_about',
                'title': 'About Us',
                'description': 'History, mission, vision, core values, organizational chart, administrative officers, campus map and facilities',
                'category': 'Secondary Navigation',
                'url': '/about',
                'type': 'page'
            },
            {
                'id': 'page_contact',
                'title': 'Contact Us',
                'description': 'Get in touch with City College of Bayawan - address, phone, email, office hours, and contact form',
                'category': 'Secondary Navigation',
                'url': '/contact',
                'type': 'page'
            },
            
            
            # Admissions Content
            {
                'id': 'admission_requirements',
                'title': 'Admission Requirements',
                'description': 'Complete requirements for new students, transferees, and scholarship applicants including documents and procedures',
                'category': 'Admissions',
                'url': '/admissions',
                'type': 'admission_info'
            },
            {
                'id': 'enrollment_process',
                'title': 'Enrollment Process',
                'description': 'Step-by-step enrollment process: form accomplishment, subject advising, payment, verification, and encoding',
                'category': 'Admissions',
                'url': '/admissions',
                'type': 'admission_info'
            },
            {
                'id': 'scholarship_programs',
                'title': 'Scholarship Programs',
                'description': 'Paglambo Scholar program and other financial assistance opportunities for eligible students',
                'category': 'Admissions',
                'url': '/admissions',
                'type': 'admission_info'
            },
            
            # Student Services Content
            {
                'id': 'student_handbook',
                'title': 'Student Handbook',
                'description': 'Comprehensive guide containing all policies, procedures, and guidelines for students',
                'category': 'Student Services',
                'url': '/students',
                'type': 'student_resource'
            },
            {
                'id': 'academic_calendar',
                'title': 'Academic Calendar',
                'description': 'Important dates, schedules, holidays, exams, and academic year timeline',
                'category': 'Student Services',
                'url': '/students',
                'type': 'student_resource'
            },
            {
                'id': 'guidance_counseling',
                'title': 'Guidance & Counseling',
                'description': 'Academic advising, career counseling, personal development, and mental health support',
                'category': 'Student Services',
                'url': '/students',
                'type': 'student_resource'
            },
            {
                'id': 'library_services',
                'title': 'Library Services',
                'description': 'Book collections, online databases, study spaces, and research support',
                'category': 'Student Services',
                'url': '/students',
                'type': 'student_resource'
            },
            {
                'id': 'registrar_office',
                'title': 'Registrar\'s Office',
                'description': 'Enrollment services, transcript requests, academic records, and graduation requirements',
                'category': 'Student Services',
                'url': '/students',
                'type': 'student_resource'
            },
            {
                'id': 'health_services',
                'title': 'Health Services',
                'description': 'Medical care, health education, emergency care, and wellness programs',
                'category': 'Student Services',
                'url': '/students',
                'type': 'student_resource'
            },
            {
                'id': 'it_support',
                'title': 'IT Support',
                'description': 'Computer lab access, internet support, software assistance, and technical training',
                'category': 'Student Services',
                'url': '/students',
                'type': 'student_resource'
            },
            {
                'id': 'financial_aid',
                'title': 'Financial Aid',
                'description': 'Scholarship programs, student loans, work-study programs, and financial counseling',
                'category': 'Student Services',
                'url': '/students',
                'type': 'student_resource'
            },
            
            # Campus Life Content
            {
                'id': 'student_government',
                'title': 'Student Government',
                'description': 'Represent student interests and organize campus-wide events and activities',
                'category': 'Campus Life',
                'url': '/students',
                'type': 'campus_activity'
            },
            {
                'id': 'academic_clubs',
                'title': 'Academic Clubs',
                'description': 'Subject-specific clubs for Business, IT, Education, and Hospitality students',
                'category': 'Campus Life',
                'url': '/students',
                'type': 'campus_activity'
            },
            {
                'id': 'cultural_organizations',
                'title': 'Cultural Organizations',
                'description': 'Celebrate diversity and promote cultural awareness through various activities',
                'category': 'Campus Life',
                'url': '/students',
                'type': 'campus_activity'
            },
            {
                'id': 'sports_teams',
                'title': 'Sports Teams',
                'description': 'Represent CCB in various sports competitions and intramural activities',
                'category': 'Campus Life',
                'url': '/students',
                'type': 'campus_activity'
            },
            
            # Faculty & Staff Content
            {
                'id': 'department_directory',
                'title': 'Department Directory',
                'description': 'Contact information for all academic departments and administrative offices',
                'category': 'Faculty & Staff',
                'url': '/faculty',
                'type': 'faculty_resource'
            },
            {
                'id': 'teaching_resources',
                'title': 'Teaching Resources',
                'description': 'Learning Management System, library resources, and professional development',
                'category': 'Faculty & Staff',
                'url': '/faculty',
                'type': 'faculty_resource'
            },
            {
                'id': 'administrative_systems',
                'title': 'Administrative Systems',
                'description': 'Student Information System, Financial Management, Inventory Management, Facility Booking',
                'category': 'Faculty & Staff',
                'url': '/faculty',
                'type': 'faculty_resource'
            },
            {
                'id': 'communication_tools',
                'title': 'Communication Tools',
                'description': 'Email System, Video Conferencing, Internal Messaging, Announcement Portal',
                'category': 'Faculty & Staff',
                'url': '/faculty',
                'type': 'faculty_resource'
            },
            {
                'id': 'support_services',
                'title': 'Support Services',
                'description': 'IT Support, Facilities Maintenance, Security Services, Emergency Procedures',
                'category': 'Faculty & Staff',
                'url': '/faculty',
                'type': 'faculty_resource'
            },
            
            # Downloads Content
            {
                'id': 'enrollment_forms',
                'title': 'Enrollment Forms',
                'description': 'Enrollment Load Form, Load Slip, and student registration documents',
                'category': 'Downloads',
                'url': '/downloads',
                'type': 'download'
            },
            {
                'id': 'clearance_forms',
                'title': 'Clearance Forms',
                'description': 'COPC Compilation, EF Continuing, and approval documents',
                'category': 'Downloads',
                'url': '/downloads',
                'type': 'download'
            },
            {
                'id': 'request_forms',
                'title': 'Request Forms',
                'description': 'Request Slip and formal request documentation',
                'category': 'Downloads',
                'url': '/downloads',
                'type': 'download'
            },
            {
                'id': 'shift_forms',
                'title': 'Shift Forms',
                'description': 'Schedule and program adjustment forms',
                'category': 'Downloads',
                'url': '/downloads',
                'type': 'download'
            },
            {
                'id': 'hr_policies',
                'title': 'HR Policies',
                'description': 'Employee Handbook, Code of Ethics, Leave Policies for faculty and staff',
                'category': 'Downloads',
                'url': '/downloads',
                'type': 'download'
            },
            {
                'id': 'handbooks',
                'title': 'Handbooks',
                'description': 'Student Handbook, Code of Conduct, Academic Policies',
                'category': 'Downloads',
                'url': '/downloads',
                'type': 'download'
            },
            
            # About Us Content
            {
                'id': 'college_history',
                'title': 'College History',
                'description': 'History and establishment of City College of Bayawan, milestones and achievements',
                'category': 'About Us',
                'url': '/about',
                'type': 'about_info'
            },
            {
                'id': 'mission_vision',
                'title': 'Mission, Vision, Core Values',
                'description': 'Mission: Quality education for innovative graduates. Vision: Leading tertiary institution. Values: CHARACTER, COMPETENCE, BANKABILITY',
                'category': 'About Us',
                'url': '/about',
                'type': 'about_info'
            },
            {
                'id': 'organizational_chart',
                'title': 'Organizational Chart',
                'description': 'College President, Vice Presidents, Academic Departments, Support Services structure',
                'category': 'About Us',
                'url': '/about',
                'type': 'about_info'
            },
            {
                'id': 'administrative_officers',
                'title': 'Administrative Officers',
                'description': 'Executive Officers, Department Heads, and administrative staff directory',
                'category': 'About Us',
                'url': '/about',
                'type': 'about_info'
            },
            {
                'id': 'campus_facilities',
                'title': 'Campus Facilities',
                'description': 'Academic buildings, library, computer labs, student center, sports facilities, cafeteria',
                'category': 'About Us',
                'url': '/about',
                'type': 'about_info'
            },
            
            # Contact Information
            {
                'id': 'contact_info',
                'title': 'Contact Information',
                'description': 'City College of Bayawan, Government Center, Banga, Bayawan City, Negros Oriental, Philippines 6221',
                'category': 'Contact',
                'url': '/contact',
                'type': 'contact_info'
            },
            {
                'id': 'office_hours',
                'title': 'Office Hours',
                'description': 'Monday - Friday: 8:00 AM - 5:00 PM, Saturday and Sunday: Closed',
                'category': 'Contact',
                'url': '/contact',
                'type': 'contact_info'
            },
            {
                'id': 'contact_form',
                'title': 'Contact Form',
                'description': 'Send us a message - admissions, academics, student services, faculty, general inquiries',
                'category': 'Contact',
                'url': '/contact',
                'type': 'contact_info'
            }
        ]
        
        # Filter static pages by query
        for page in static_pages:
            if (query.lower() in page['title'].lower() or 
                query.lower() in page['description'].lower() or 
                query.lower() in page['category'].lower()):
                results.append(page)
        
        # Add dynamic content from actual pages
        try:
            # Get announcements content
            announcements = Announcement.objects.filter(is_active=True)
            for announcement in announcements:
                if (query.lower() in announcement.title.lower() or 
                    query.lower() in announcement.body.lower() or 
                    (announcement.details and query.lower() in announcement.details.lower())):
                    results.append({
                        'id': f'announcement_{announcement.id}',
                        'title': announcement.title,
                        'description': announcement.body[:150] + '...' if len(announcement.body) > 150 else announcement.body,
                        'category': 'Announcements',
                        'url': '/news',
                        'type': 'announcement',
                        'date': announcement.date.isoformat() if announcement.date else None
                    })
        except Exception as e:
            print(f"Error searching announcements: {e}")
        
        try:
            # Get events content
            events = Event.objects.filter(is_active=True)
            for event in events:
                if (query.lower() in event.title.lower() or 
                    query.lower() in event.description.lower() or 
                    (event.details and query.lower() in event.details.lower()) or
                    (event.location and query.lower() in event.location.lower())):
                    results.append({
                        'id': f'event_{event.id}',
                        'title': event.title,
                        'description': event.description[:150] + '...' if len(event.description) > 150 else event.description,
                        'category': 'School Events and Activities',
                        'url': '/news',
                        'type': 'event',
                        'date': event.event_date.isoformat() if event.event_date else None,
                        'location': event.location
                    })
        except Exception as e:
            print(f"Error searching events: {e}")
        
        try:
            # Get achievements content
            achievements = Achievement.objects.filter(is_active=True)
            for achievement in achievements:
                if (query.lower() in achievement.title.lower() or 
                    query.lower() in achievement.description.lower() or 
                    (achievement.details and query.lower() in achievement.details.lower()) or
                    (achievement.category and query.lower() in achievement.category.lower())):
                    results.append({
                        'id': f'achievement_{achievement.id}',
                        'title': achievement.title,
                        'description': achievement.description[:150] + '...' if len(achievement.description) > 150 else achievement.description,
                        'category': 'Achievements and Press Releases',
                        'url': '/news',
                        'type': 'achievement',
                        'date': achievement.achievement_date.isoformat() if achievement.achievement_date else None,
                        'category_detail': achievement.category
                    })
        except Exception as e:
            print(f"Error searching achievements: {e}")
        
        try:
            # Get academic programs content with detailed information
            academic_programs = AcademicProgram.objects.filter(is_active=True)
            for program in academic_programs:
                # Search in title, description, overview, core courses, career prospects
                search_text = f"{program.title} {program.description or ''} {program.program_overview or ''}"
                if program.core_courses:
                    search_text += " " + " ".join(program.core_courses)
                if program.career_prospects:
                    search_text += " " + program.career_prospects
                
                if query.lower() in search_text.lower():
                    results.append({
                        'id': f'program_{program.id}',
                        'title': program.title,
                        'description': program.description[:150] + '...' if program.description and len(program.description) > 150 else (program.description or 'Academic program details available'),
                        'category': 'Academic Programs',
                        'url': '/academics',
                        'type': 'program',
                        'duration': program.duration_text,
                        'units': program.units_text
                    })
        except Exception as e:
            print(f"Error searching academic programs: {e}")
        
        try:
            # Get departments content with detailed information
            departments = Department.objects.all()
            for department in departments:
                search_text = f"{department.name} {department.description or ''}"
                if department.head_name:
                    search_text += f" {department.head_name}"
                if department.office_location:
                    search_text += f" {department.office_location}"
                
                if query.lower() in search_text.lower():
                    results.append({
                        'id': f'department_{department.id}',
                        'title': department.name,
                        'description': department.description[:150] + '...' if department.description and len(department.description) > 150 else (department.description or f'{department.department_type.title()} department'),
                        'category': 'Departments',
                        'url': '/faculty',
                        'type': 'department',
                        'head_name': department.head_name,
                        'office_location': department.office_location
                    })
        except Exception as e:
            print(f"Error searching departments: {e}")
        
        try:
            # Get personnel content with detailed information
            personnel = Personnel.objects.filter(is_active=True)
            for person in personnel:
                search_text = f"{person.full_name} {person.specialization or ''} {person.title or ''}"
                if person.department:
                    search_text += f" {person.department.name}"
                
                if query.lower() in search_text.lower():
                    results.append({
                        'id': f'personnel_{person.id}',
                        'title': person.full_name,
                        'description': f"{person.specialization or person.title or 'Faculty/Staff'} - {person.department.name if person.department else 'Staff'}"[:150],
                        'category': 'Faculty & Staff',
                        'url': '/faculty',
                        'type': 'personnel',
                        'specialization': person.specialization,
                        'department': person.department.name if person.department else None
                    })
        except Exception as e:
            print(f"Error searching personnel: {e}")
        
        # Limit total results and sort by relevance
        results = results[:15]  # Limit to 15 total results
        
        return JsonResponse({
            'status': 'success',
            'results': results,
            'count': len(results),
            'query': query
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': f'Error performing search: {str(e)}'
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def api_contact_form(request):
    """Create pending submission and email verification link to the user."""
    try:
        data = json.loads(request.body)
        name = data.get('name', '')
        email = data.get('email', '')
        message = data.get('message', '')
        subject = data.get('subject', 'general')
        phone = data.get('phone', '')

        if not name or not email or not message or not subject:
            return JsonResponse({'status': 'error', 'message': 'Missing required fields'}, status=400)

        token = get_random_string(48)
        ContactSubmission.objects.create(
            name=name,
            email=email,
            phone=phone,
            subject=subject,
            message=message,
            verification_token=token,
        )

        EmailVerification.objects.create(
            email=email,
            token=token,
            expires_at=timezone.now() + timezone.timedelta(hours=24),
        )

        verify_base = os.getenv('PUBLIC_BASE_URL', _compute_lan_base_url())
        verify_link = f"{verify_base}/api/contact/verify/?token={token}"

        try:
            template_id = os.getenv('BREVO_TEMPLATE_VERIFY_ID', 'pyQwppLrv4ZmJXNIxtiv40BWqPRD.FxParmAD1z8dZwY1B6uvtEybYqN')
            sent = _send_brevo_template(
                to_email=email,
                template_id=template_id,
                merge_data={'verify_link': verify_link, 'name': name}
            )
            if not sent:
                html = f"""
                <div style=\"font-family: Arial, Helvetica, sans-serif; color:#1e1e1e; line-height:1.5;\">
                  <h2 style=\"margin:0 0 10px 0; color:#2d5a2d;\">Verify your email to send your message</h2>
                  <p style=\"margin:0 0 12px 0;\">Hello {name},</p>
                  <p style=\"margin:0 0 8px 0;\">Please confirm your email address to send your message to <strong>City College of Bayawan</strong>.</p>
                  
                  <div style=\"margin:16px 0; padding:20px; background-color:#f8f9fa; border-left:4px solid #2d5a2d; border-radius:4px;\">
                    <h3 style=\"margin:0 0 15px 0; color:#2d5a2d; font-size:18px; font-weight:bold;\">CITY COLLEGE OF BAYAWAN</h3>
                    <div style=\"margin:0 0 8px 0; color:#333; font-size:14px;\">Government Center, Banga, Bayawan City</div>
                    <div style=\"margin:0 0 8px 0; color:#333; font-size:14px;\">Cabcabon, Brgy. Banga, Bayawan City</div>
                    <div style=\"margin:0 0 12px 0; color:#333; font-size:14px;\">Negros Oriental, 6221</div>
                    <div style=\"margin:0 0 4px 0; color:#333; font-size:14px;\">(035) 522-0409</div>   
                  </div>
                  
                  <p style=\"margin:0 0 22px 0;\">\n                    <a href=\"{verify_link}\" style=\"background:#ff8c00; color:#ffffff; text-decoration:none; padding:10px 16px; border-radius:6px; font-weight:700; display:inline-block;\">Verify Email</a>
                  </p>
                  <p style=\"margin:0 0 18px 0; font-size:12px; color:#666;\">If the button doesn't work, copy and paste this link into your browser:<br><span style=\"word-break:break-all;\"><a href=\"{verify_link}\" style=\"color:#2d5a2d;\">{verify_link}</a></span></p>
                  <hr style=\"border:none; border-top:1px solid #e6e6e6; margin:16px 0;\"/>
                  <p style=\"margin:10px 0 0 0; font-size:12px; color:#666;\">This link expires in 24 hours. If you did not request this, please ignore this email.</p>
                </div>
                """
                msg = EmailMessage(
                    subject="Verify your email to send your message to City College of Bayawan",
                    body=html,
                    from_email=None,
                    to=[email],
                )
                msg.content_subtype = 'html'
                msg.send(fail_silently=False)
            return JsonResponse({"status": "success", "message": "Verification email sent. Please check your inbox."})
        except Exception as e:
            return JsonResponse({"status": "error", "message": f"Failed to send verification email: {str(e)}"}, status=500)

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)


@require_http_methods(["POST"])
@csrf_exempt
def api_admin_login(request):
    """Admin login endpoint"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '')
        password = data.get('password', '')

        if not username or not password:
            return JsonResponse({
                'status': 'error',
                'message': 'Username and password are required'
            }, status=400)

        # Authenticate user
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            if user.is_active and user.is_staff:
                # Log the user in
                login(request, user)
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Login successful',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'is_staff': user.is_staff,
                        'is_superuser': user.is_superuser
                    }
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Account is not active or does not have admin privileges'
                }, status=403)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid username or password'
            }, status=401)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Login failed: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
@login_required_json
def api_admin_auth_check(request):
    """Check if user is authenticated"""
    return JsonResponse({
        'status': 'success',
        'authenticated': True,
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'is_staff': request.user.is_staff,
            'is_superuser': request.user.is_superuser
        }
    })


@require_http_methods(["POST"])
@csrf_exempt
@login_required_json
def api_admin_logout(request):
    """Admin logout endpoint"""
    from django.contrib.auth import logout
    logout(request)
    return JsonResponse({
        'status': 'success',
        'message': 'Logged out successfully'
    })


@require_http_methods(["GET"])
@login_required
def api_admin_academic_programs(request):
    """Get all academic programs for admin (including inactive)"""
    try:
        programs = AcademicProgram.objects.all().order_by('display_order', 'title')
        programs_data = []
        for program in programs:
            specializations = program.specializations.all().values_list('name', flat=True)
            program_data = {
                'id': program.id,
                'title': program.title,
                'short_title': program.short_title,
                'program_type': program.program_type,
                'description': program.description,
                'duration_years': program.duration_years,
                'total_units': program.total_units,
                'with_enhancements': program.with_enhancements,
                'program_overview': program.program_overview,
                'core_courses': program.core_courses,
                'career_prospects': program.career_prospects,
                'specializations': list(specializations),
                'is_active': program.is_active,
                'display_order': program.display_order,
                'created_at': program.created_at.isoformat(),
                'updated_at': program.updated_at.isoformat()
            }
            programs_data.append(program_data)
        
        return JsonResponse({
            'status': 'success',
            'programs': programs_data,
            'count': len(programs_data)
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching programs: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
@login_required
def api_admin_events(request):
    """Get all events for admin (including inactive)"""
    try:
        events = Event.objects.all().order_by('display_order', 'event_date', 'start_time')
        events_data = []
        for event in events:
            event_data = {
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'details': event.details,
                'event_date': event.event_date.isoformat(),
                'start_time': event.start_time.strftime('%H:%M'),
                'end_time': event.end_time.strftime('%H:%M'),
                'location': event.location,
                'is_active': event.is_active,
                'display_order': event.display_order,
                'created_at': event.created_at.isoformat(),
                'updated_at': event.updated_at.isoformat()
            }
            if event.image:
                event_data['image'] = request.build_absolute_uri(event.image.url)
            else:
                event_data['image'] = None
            events_data.append(event_data)
        
        return JsonResponse({
            'status': 'success',
            'events': events_data,
            'count': len(events_data)
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching events: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
@login_required
def api_admin_achievements(request):
    """Get all achievements for admin (including inactive)"""
    try:
        achievements = Achievement.objects.all().order_by('display_order', '-achievement_date')
        achievements_data = []
        for achievement in achievements:
            achievement_data = {
                'id': achievement.id,
                'title': achievement.title,
                'description': achievement.description,
                'details': achievement.details,
                'achievement_date': achievement.achievement_date.isoformat(),
                'category': achievement.category,
                'is_active': achievement.is_active,
                'display_order': achievement.display_order,
                'created_at': achievement.created_at.isoformat(),
                'updated_at': achievement.updated_at.isoformat()
            }
            achievement_data['image'] = build_safe_media_url(request, achievement)
            achievements_data.append(achievement_data)
        
        return JsonResponse({
            'status': 'success',
            'achievements': achievements_data,
            'count': len(achievements_data)
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching achievements: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
@login_required
def api_admin_announcements(request):
    """Get all announcements for admin (including inactive)"""
    try:
        announcements = Announcement.objects.all().order_by('display_order', '-date')
        announcements_data = []
        for announcement in announcements:
            announcement_data = {
                'id': announcement.id,
                'title': announcement.title,
                'date': announcement.date.isoformat(),
                'body': announcement.body,
                'details': announcement.details,
                'image': request.build_absolute_uri(announcement.image.url) if announcement.image else None,
                'is_active': announcement.is_active,
                'display_order': announcement.display_order,
                'created_at': announcement.created_at.isoformat(),
                'updated_at': announcement.updated_at.isoformat()
            }
            announcements_data.append(announcement_data)
        
        return JsonResponse({
            'status': 'success',
            'announcements': announcements_data,
            'count': len(announcements_data)
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching announcements: {str(e)}'
        }, status=500)


# Admin-only CRUD operations for Academic Programs
@require_http_methods(["POST"])
@csrf_exempt
@login_required
@permission_required('portal.add_academicprogram', raise_exception=True)
def api_create_academic_program(request):
    """Create a new academic program (Admin only)"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['title', 'short_title', 'description']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'status': 'error',
                    'message': f'Field "{field}" is required'
                }, status=400)
        
        # Create the program
        program = AcademicProgram.objects.create(
            title=data['title'],
            short_title=data['short_title'],
            program_type=data.get('program_type', 'BS'),
            description=data['description'],
            duration_years=data.get('duration_years', 4),
            total_units=data.get('total_units', 120),
            with_enhancements=data.get('with_enhancements', 0),
            program_overview=data.get('program_overview', ''),
            core_courses=data.get('core_courses', ''),
            career_prospects=data.get('career_prospects', ''),
            is_active=data.get('is_active', True),
            display_order=data.get('display_order', 0)
        )
        
        return JsonResponse({
            'status': 'success',
            'message': 'Program created successfully',
            'program': {
                'id': program.id,
                'title': program.title,
                'short_title': program.short_title
            }
        }, status=201)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error creating program: {str(e)}'
        }, status=500)


@require_http_methods(["PUT", "PATCH"])
@csrf_exempt
@login_required
@permission_required('portal.change_academicprogram', raise_exception=True)
def api_update_academic_program(request, program_id):
    """Update an academic program (Admin only)"""
    try:
        program = get_object_or_404(AcademicProgram, id=program_id)
        data = json.loads(request.body)
        
        # Update fields
        fields_to_update = [
            'title', 'short_title', 'program_type', 'description', 'duration_years',
            'total_units', 'with_enhancements', 'program_overview', 'core_courses', 
            'career_prospects', 'is_active', 'display_order'
        ]
        
        for field in fields_to_update:
            if field in data:
                setattr(program, field, data[field])
        
        program.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Program updated successfully',
            'program': {
                'id': program.id,
                'title': program.title,
                'short_title': program.short_title
            }
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except AcademicProgram.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Program not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error updating program: {str(e)}'
        }, status=500)


@require_http_methods(["DELETE"])
@csrf_exempt
@login_required
@permission_required('portal.delete_academicprogram', raise_exception=True)
def api_delete_academic_program(request, program_id):
    """Delete an academic program (Admin only)"""
    try:
        program = get_object_or_404(AcademicProgram, id=program_id)
        program_title = program.title
        program.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': f'Program "{program_title}" deleted successfully'
        })
    
    except AcademicProgram.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Program not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error deleting program: {str(e)}'
        }, status=500)


# Admin-only CRUD operations for Events
@require_http_methods(["POST"])
@csrf_exempt
@login_required
@permission_required('portal.add_event', raise_exception=True)
def api_create_event(request):
    """Create a new event (Admin only)"""
    try:
        # Handle multipart/form-data for file upload
        if request.content_type and 'multipart/form-data' in request.content_type:
            title = sanitize_input(request.POST.get('title', ''), max_length=200)
            description = sanitize_input(request.POST.get('description', ''))
            details = sanitize_input(request.POST.get('details', ''))
            event_date = request.POST.get('event_date')
            start_time = request.POST.get('start_time')
            end_time = request.POST.get('end_time')
            location = sanitize_input(request.POST.get('location', ''), max_length=200)
            is_active = request.POST.get('is_active', 'true').lower() == 'true'
            display_order = int(request.POST.get('display_order', 0))
            image = request.FILES.get('image')
            
            # Validate image upload if provided
            if image:
                is_valid, error_msg = validate_file_upload(image, max_size_mb=10)
                if not is_valid:
                    return JsonResponse({
                        'status': 'error',
                        'message': error_msg
                    }, status=400)
        else:
            # Handle JSON (for backward compatibility, though image won't work)
            data = json.loads(request.body)
            title = sanitize_input(data.get('title', ''), max_length=200)
            description = sanitize_input(data.get('description', ''))
            details = sanitize_input(data.get('details', ''))
            event_date = data.get('event_date')
            start_time = data.get('start_time')
            end_time = data.get('end_time')
            location = sanitize_input(data.get('location', ''), max_length=200)
            is_active = data.get('is_active', True)
            display_order = data.get('display_order', 0)
            image = None
        
        # Validate required fields
        required_fields = {'title': title, 'description': description, 'event_date': event_date, 'start_time': start_time, 'end_time': end_time}
        for field, value in required_fields.items():
            if not value:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Field "{field}" is required'
                }, status=400)
        
        # Create the event
        event = Event.objects.create(
            title=title,
            description=description,
            details=details,
            event_date=_parse_date(event_date),
            start_time=_parse_time(start_time),
            end_time=_parse_time(end_time),
            location=location,
            is_active=is_active,
            display_order=display_order
        )
        
        # Handle image upload if provided
        if image:
            event.image = image
            event.save()
        
        event_data = {
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'details': event.details,
            'event_date': event.event_date.isoformat(),
            'start_time': event.start_time.strftime('%H:%M'),
            'end_time': event.end_time.strftime('%H:%M'),
            'location': event.location,
            'is_active': event.is_active,
            'display_order': event.display_order,
            'created_at': event.created_at.isoformat(),
            'updated_at': event.updated_at.isoformat()
        }
        event_data['image'] = build_safe_media_url(request, event)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Event created successfully',
            'event': event_data
        }, status=201)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error creating event: {str(e)}'
        }, status=500)


@require_http_methods(["PUT", "PATCH", "POST"])
@csrf_exempt
@login_required
@permission_required('portal.change_event', raise_exception=True)
def api_update_event(request, event_id):
    """Update an event (Admin only)"""
    try:
        event = get_object_or_404(Event, id=event_id)
        
        # Handle multipart/form-data for file upload
        if request.content_type and 'multipart/form-data' in request.content_type:
            if 'title' in request.POST:
                event.title = request.POST.get('title')
            if 'description' in request.POST:
                event.description = request.POST.get('description')
            if 'details' in request.POST:
                event.details = request.POST.get('details', '')
            if 'event_date' in request.POST:
                event.event_date = _parse_date(request.POST.get('event_date'))
            if 'start_time' in request.POST:
                event.start_time = _parse_time(request.POST.get('start_time'))
            if 'end_time' in request.POST:
                event.end_time = _parse_time(request.POST.get('end_time'))
            if 'location' in request.POST:
                event.location = request.POST.get('location', '')
            if 'is_active' in request.POST:
                event.is_active = request.POST.get('is_active', 'true').lower() == 'true'
            if 'display_order' in request.POST:
                event.display_order = int(request.POST.get('display_order', 0))
            
            # Handle image upload
            image = request.FILES.get('image')
            remove_image = request.POST.get('remove_image', 'false').lower() == 'true'
            
            if remove_image:
                if event.image:
                    event.image.delete(save=False)
                event.image = None
            elif image:
                event.image = image
        else:
            # Handle JSON
            data = json.loads(request.body)
            
            # Update fields
            fields_to_update = [
                'title', 'description', 'details', 'event_date', 'start_time', 
                'end_time', 'location', 'is_active', 'display_order'
            ]
            
            for field in fields_to_update:
                if field in data:
                    if field == 'event_date':
                        setattr(event, field, _parse_date(data[field]))
                    elif field in ['start_time', 'end_time']:
                        setattr(event, field, _parse_time(data[field]))
                    else:
                        setattr(event, field, data[field])
        
        event.save()
        
        event_data = {
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'details': event.details,
            'event_date': event.event_date.isoformat(),
            'start_time': event.start_time.strftime('%H:%M'),
            'end_time': event.end_time.strftime('%H:%M'),
            'location': event.location,
            'is_active': event.is_active,
            'display_order': event.display_order,
            'created_at': event.created_at.isoformat(),
            'updated_at': event.updated_at.isoformat()
        }
        event_data['image'] = build_safe_media_url(request, event)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Event updated successfully',
            'event': event_data
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Event.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Event not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error updating event: {str(e)}'
        }, status=500)


@require_http_methods(["DELETE"])
@csrf_exempt
@login_required
@permission_required('portal.delete_event', raise_exception=True)
def api_delete_event(request, event_id):
    """Delete an event (Admin only)"""
    try:
        event = get_object_or_404(Event, id=event_id)
        event_title = event.title
        event.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': f'Event "{event_title}" deleted successfully'
        })
    
    except Event.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Event not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error deleting event: {str(e)}'
        }, status=500)


# Admin-only CRUD operations for Achievements
@require_http_methods(["POST"])
@csrf_exempt
@login_required
@permission_required('portal.add_achievement', raise_exception=True)
def api_create_achievement(request):
    """Create a new achievement (Admin only)"""
    try:
        # Handle multipart/form-data for file upload
        if request.content_type and 'multipart/form-data' in request.content_type:
            title = sanitize_input(request.POST.get('title', ''), max_length=200)
            description = sanitize_input(request.POST.get('description', ''))
            details = sanitize_input(request.POST.get('details', ''))
            achievement_date = request.POST.get('achievement_date')
            category = sanitize_input(request.POST.get('category', 'Achievement'), max_length=100)
            is_active = request.POST.get('is_active', 'true').lower() == 'true'
            display_order = int(request.POST.get('display_order', 0))
            image = request.FILES.get('image')
            
            # Validate image upload if provided
            if image:
                is_valid, error_msg = validate_file_upload(image, max_size_mb=10)
                if not is_valid:
                    return JsonResponse({
                        'status': 'error',
                        'message': error_msg
                    }, status=400)
        else:
            # Handle JSON (for backward compatibility, though image won't work)
            data = json.loads(request.body)
            title = sanitize_input(data.get('title', ''), max_length=200)
            description = sanitize_input(data.get('description', ''))
            details = sanitize_input(data.get('details', ''))
            achievement_date = data.get('achievement_date')
            category = sanitize_input(data.get('category', 'Achievement'), max_length=100)
            is_active = data.get('is_active', True)
            display_order = data.get('display_order', 0)
            image = None
        
        # Validate required fields
        required_fields = {'title': title, 'description': description, 'achievement_date': achievement_date}
        for field, value in required_fields.items():
            if not value:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Field "{field}" is required'
                }, status=400)
        
        # Create the achievement
        achievement = Achievement.objects.create(
            title=title,
            description=description,
            details=details,
            achievement_date=_parse_date(achievement_date),
            category=category,
            is_active=is_active,
            display_order=display_order
        )
        
        # Handle image upload if provided
        if image:
            achievement.image = image
            achievement.save()
        
        achievement_data = {
            'id': achievement.id,
            'title': achievement.title,
            'description': achievement.description,
            'details': achievement.details,
            'achievement_date': achievement.achievement_date.isoformat(),
            'category': achievement.category,
            'is_active': achievement.is_active,
            'display_order': achievement.display_order,
            'created_at': achievement.created_at.isoformat(),
            'updated_at': achievement.updated_at.isoformat()
        }
        if achievement.image:
            achievement_data['image'] = request.build_absolute_uri(achievement.image.url)
        else:
            achievement_data['image'] = None
        
        return JsonResponse({
            'status': 'success',
            'message': 'Achievement created successfully',
            'achievement': achievement_data
        }, status=201)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error creating achievement: {str(e)}'
        }, status=500)


@require_http_methods(["PUT", "PATCH"])
@csrf_exempt
@login_required
@permission_required('portal.change_achievement', raise_exception=True)
def api_update_achievement(request, achievement_id):
    """Update an achievement (Admin only)"""
    try:
        achievement = get_object_or_404(Achievement, id=achievement_id)
        
        # Handle multipart/form-data for file upload
        if request.content_type and 'multipart/form-data' in request.content_type:
            if 'title' in request.POST:
                achievement.title = request.POST.get('title')
            if 'description' in request.POST:
                achievement.description = request.POST.get('description')
            if 'details' in request.POST:
                achievement.details = request.POST.get('details', '')
            if 'achievement_date' in request.POST:
                achievement.achievement_date = _parse_date(request.POST.get('achievement_date'))
            if 'category' in request.POST:
                achievement.category = request.POST.get('category', 'Achievement')
            if 'is_active' in request.POST:
                achievement.is_active = request.POST.get('is_active', 'true').lower() == 'true'
            if 'display_order' in request.POST:
                achievement.display_order = int(request.POST.get('display_order', 0))
            
            # Handle image upload
            image = request.FILES.get('image')
            remove_image = request.POST.get('remove_image', 'false').lower() == 'true'
            
            if remove_image:
                if achievement.image:
                    achievement.image.delete(save=False)
                achievement.image = None
            elif image:
                achievement.image = image
        else:
            # Handle JSON (for backward compatibility, though image won't work)
            data = json.loads(request.body)
            
            # Update fields
            fields_to_update = [
                'title', 'description', 'details', 'achievement_date', 
                'category', 'is_active', 'display_order'
            ]
            
            for field in fields_to_update:
                if field in data:
                    if field == 'achievement_date':
                        setattr(achievement, field, _parse_date(data[field]))
                    else:
                        setattr(achievement, field, data[field])
        
        achievement.save()
        
        achievement_data = {
            'id': achievement.id,
            'title': achievement.title,
            'description': achievement.description,
            'details': achievement.details,
            'achievement_date': achievement.achievement_date.isoformat(),
            'category': achievement.category,
            'is_active': achievement.is_active,
            'display_order': achievement.display_order,
            'created_at': achievement.created_at.isoformat(),
            'updated_at': achievement.updated_at.isoformat()
        }
        if achievement.image:
            achievement_data['image'] = request.build_absolute_uri(achievement.image.url)
        else:
            achievement_data['image'] = None
        
        return JsonResponse({
            'status': 'success',
            'message': 'Achievement updated successfully',
            'achievement': achievement_data
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Achievement.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Achievement not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error updating achievement: {str(e)}'
        }, status=500)


@require_http_methods(["DELETE"])
@csrf_exempt
@login_required
@permission_required('portal.delete_achievement', raise_exception=True)
def api_delete_achievement(request, achievement_id):
    """Delete an achievement (Admin only)"""
    try:
        achievement = get_object_or_404(Achievement, id=achievement_id)
        achievement_title = achievement.title
        achievement.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': f'Achievement "{achievement_title}" deleted successfully'
        })
    
    except Achievement.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Achievement not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error deleting achievement: {str(e)}'
        }, status=500)


class ReactAppView(TemplateView):
    template_name = 'index.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'CCB Portal'
        return context


@csrf_exempt
def contact(request):
    if request.method == "POST":
        data = json.loads(request.body)
        name = data.get("name")
        email = data.get("email")
        phone = data.get("phone")
        subject = data.get("subject")
        message = data.get("message")

        # Mirror the same verification flow for SPA endpoint
        token = get_random_string(48)
        ContactSubmission.objects.create(
            name=name or '',
            email=email or '',
            phone=phone or '',
            subject=subject or 'general',
            message=message or '',
            verification_token=token,
        )

        EmailVerification.objects.create(
            email=email or '',
            token=token,
            expires_at=timezone.now() + timezone.timedelta(hours=24),
        )

        verify_base = os.getenv('PUBLIC_BASE_URL', _compute_lan_base_url())
        verify_link = f"{verify_base}/api/contact/verify/?token={token}"

        try:
            template_id = os.getenv('BREVO_TEMPLATE_VERIFY_ID', 'pyQwppLrv4ZmJXNIxtiv40BWqPRD.FxParmAD1z8dZwY1B6uvtEybYqN')
            sent = _send_brevo_template(
                to_email=email,
                template_id=template_id,
                merge_data={'verify_link': verify_link, 'name': name}
            )
            if not sent:
                html = f"""
                <div style=\"font-family: Arial, Helvetica, sans-serif; color:#1e1e1e; line-height:1.5;\">
                  <h2 style=\"margin:0 0 10px 0; color:#2d5a2d;\">Verify your email to send your message</h2>
                  <p style=\"margin:0 0 12px 0;\">Hello {name},</p>
                  <p style=\"margin:0 0 8px 0;\">Please confirm your email address to send your message to <strong>City College of Bayawan</strong>.</p>
                  
                  <div style=\"margin:16px 0; padding:20px; background-color:#f8f9fa; border-left:4px solid #2d5a2d; border-radius:4px;\">
                    <h3 style=\"margin:0 0 15px 0; color:#2d5a2d; font-size:18px; font-weight:bold;\">CITY COLLEGE OF BAYAWAN</h3>
                    <div style=\"margin:0 0 8px 0; color:#333; font-size:14px;\">Government Center, Cabcabon Hills, Bayawan City</div>
                    <div style=\"margin:0 0 12px 0; color:#333; font-size:14px;\">Negros Oriental, 6221</div>
                    <div style=\"margin:0 0 4px 0; color:#333; font-size:14px;\">(035) 430-0263</div>
                    <div style=\"margin:8px 0 0 0; font-weight:bold; color:#333; font-size:14px;\">#IbayawBayawan #KitaAngBayawan!</div>
                  </div>
                  
                  <p style=\"margin:0 0 22px 0;\">\n                    <a href=\"{verify_link}\" style=\"background:#ff8c00; color:#ffffff; text-decoration:none; padding:10px 16px; border-radius:6px; font-weight:700; display:inline-block;\">Verify Email</a>
                  </p>
                  <p style=\"margin:0 0 18px 0; font-size:12px; color:#666;\">If the button doesn't work, copy and paste this link into your browser:<br><span style=\"word-break:break-all;\"><a href=\"{verify_link}\" style=\"color:#2d5a2d;\">{verify_link}</a></span></p>
                  <hr style=\"border:none; border-top:1px solid #e6e6e6; margin:16px 0;\"/>
                  <p style=\"margin:10px 0 0 0; font-size:12px; color:#666;\">This link expires in 24 hours. If you did not request this, please ignore this email.</p>
                </div>
                """
                msg = EmailMessage(
                    subject="Verify your email to send your message to City College of Bayawan",
                    body=html,
                    from_email=None,
                    to=[email],
                )
                msg.content_subtype = 'html'
                msg.send(fail_silently=False)
            return JsonResponse({"status": "success", "message": "Verification email sent. Please check your inbox."})
        except Exception as e:
            return JsonResponse({"status": "error", "message": f"Failed to send verification email: {str(e)}"}, status=500)

    return JsonResponse({"status": "error", "message": "Invalid request"}, status=400)


@require_http_methods(["GET"])
def api_contact_verify(request):
    token = request.GET.get('token', '')
    if not token:
        if 'text/html' in request.META.get('HTTP_ACCEPT', '') or request.GET.get('format') == 'html':
            return render(request, 'verify_result.html', {
                'ok': False,
                'title': 'Verification Error',
                'message': 'Missing token'
            }, status=400)
        return JsonResponse({'status': 'error', 'message': 'Missing token'}, status=400)

    try:
        verification = EmailVerification.objects.get(token=token, is_used=False)
        if verification.expires_at < timezone.now():
            return JsonResponse({'status': 'error', 'message': 'Token expired'}, status=400)

        submission = ContactSubmission.objects.get(verification_token=token)

        display_from = f"{submission.name} via CCB <{getattr(settings, 'DEFAULT_FROM_EMAIL', None) or ''}>"

        # Prepare safe values
        sub_name = escape(submission.name or '')
        sub_email = escape(submission.email or '')
        sub_phone = escape(submission.phone or '')
        sub_subject = escape(submission.subject or 'general')
        sub_message = escape(submission.message or '').replace('\n', '<br/>')

        # Plain-text fallback
        text_body = (
            f"From: {submission.name}\n"
            f"Email: {submission.email}\n"
            f"Phone: {submission.phone}\n\n"
            f"Message:\n{submission.message}"
        )

        # Branded HTML email
        html_body = f"""
        <div style=\"font-family: Arial, Helvetica, sans-serif; color:#1e1e1e; line-height:1.6; background:#f5f7f5; padding:18px;\">
          <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:720px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 24px rgba(0,0,0,0.08);\">
            <tr>
              <td style=\"background:linear-gradient(135deg,#2d5a2d,#3a6b3a); padding:18px 22px; color:#fff;\">
                <div>
                  <div style=\"font-weight:800; font-size:16px; letter-spacing:.5px;\">CITY COLLEGE OF BAYAWAN</div>
                  <div style=\"opacity:.9; font-size:12px;\">New message from website contact form</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style=\"padding:20px 22px;\">
                <h2 style=\"margin:0 0 12px 0; color:#2d5a2d; font-size:18px;\">[Contact Form] {sub_subject}</h2>

                <div style=\"margin:0 0 14px 0; padding:14px; background:#f8f9fa; border-left:4px solid #2d5a2d; border-radius:8px;\">
                  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">
                    <tr>
                      <td style=\"padding:6px 0; color:#555; width:100px;\"><strong>Name:</strong></td>
                      <td style=\"padding:6px 0; color:#111;\">{sub_name}</td>
                    </tr>
                    <tr>
                      <td style=\"padding:6px 0; color:#555;\"><strong>Email:</strong></td>
                      <td style=\"padding:6px 0;\"><a href=\"mailto:{sub_email}\" style=\"color:#2d5a2d; text-decoration:none;\">{sub_email}</a></td>
                    </tr>
                    <tr>
                      <td style=\"padding:6px 0; color:#555;\"><strong>Phone:</strong></td>
                      <td style=\"padding:6px 0; color:#111;\">{sub_phone or '<span style=\\"color:#888;\\">—</span>'}</td>
                    </tr>
                  </table>
                </div>

                <div style=\"margin:0 0 6px 0; color:#2d5a2d; font-weight:700;\">Message</div>
                <div style=\"padding:14px; border:1px solid #e6e6e6; border-radius:8px; background:#ffffff;\">{sub_message}</div>

                <div style=\"margin-top:16px; font-size:12px; color:#6b6b6b;\">Reply directly to this email to respond to the sender.</div>
              </td>
            </tr>
            <tr>
              <td style=\"background:#f3f5f3; padding:14px 22px; font-size:12px; color:#6b6b6b;\">
                Government Center, Banga, Bayawan City, Negros Oriental 6221 · (035) 430-0263
              </td>
            </tr>
          </table>
        </div>
        """

        admin_msg = EmailMultiAlternatives(
            subject=f"[Contact Form] {submission.subject}",
            body=text_body,
            from_email=display_from if getattr(settings, 'DEFAULT_FROM_EMAIL', None) else None,
            to=[os.getenv('CONTACT_INBOX', 'citycollegeofbayawan@gmail.com')],
            reply_to=[submission.email] if submission.email else None,
        )
        admin_msg.attach_alternative(html_body, 'text/html')
        admin_msg.send(fail_silently=False)

        verification.is_used = True
        verification.save(update_fields=['is_used'])
        submission.is_verified = True
        submission.status = 'verified'
        submission.verified_at = timezone.now()
        submission.save(update_fields=['is_verified', 'status', 'verified_at'])

        if 'text/html' in request.META.get('HTTP_ACCEPT', '') or request.GET.get('format') == 'html':
            return render(request, 'verify_result.html', {
                'ok': True,
                'title': 'Verified',
                'message': 'Your email has been verified and your message was sent.',
                'home_url': os.getenv('FRONTEND_BASE_URL', _compute_frontend_base_url())
            })
        return JsonResponse({'status': 'success', 'message': 'Verification successful. Your message has been sent.'})
    except EmailVerification.DoesNotExist:
        if 'text/html' in request.META.get('HTTP_ACCEPT', '') or request.GET.get('format') == 'html':
            return render(request, 'verify_result.html', {
                'ok': False,
                'title': 'Verification Error',
                'message': 'Invalid or already used token',
                'home_url': os.getenv('FRONTEND_BASE_URL', _compute_frontend_base_url())
            }, status=400)
        return JsonResponse({'status': 'error', 'message': 'Invalid or already used token'}, status=400)
    except ContactSubmission.DoesNotExist:
        if 'text/html' in request.META.get('HTTP_ACCEPT', '') or request.GET.get('format') == 'html':
            return render(request, 'verify_result.html', {
                'ok': False,
                'title': 'Verification Error',
                'message': 'Submission not found for token',
                'home_url': os.getenv('FRONTEND_BASE_URL', _compute_frontend_base_url())
            }, status=404)
        return JsonResponse({'status': 'error', 'message': 'Submission not found for token'}, status=404)
    except Exception as e:
        if 'text/html' in request.META.get('HTTP_ACCEPT', '') or request.GET.get('format') == 'html':
            return render(request, 'verify_result.html', {
                'ok': False,
                'title': 'Verification Error',
                'message': str(e),
                'home_url': os.getenv('FRONTEND_BASE_URL', _compute_frontend_base_url())
            }, status=500)
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


# Department and Personnel API Views

@require_http_methods(["GET"])
def api_departments(request):
    """Get all departments and offices"""
    try:
        departments = Department.objects.filter(is_active=True).order_by('department_type', 'display_order', 'name')
        departments_data = []
        
        for dept in departments:
            # Get personnel for this department
            personnel = Personnel.objects.filter(department=dept, is_active=True).order_by('position_type', 'display_order', 'last_name')
            personnel_data = []
            
            for person in personnel:
                personnel_data.append({
                    'id': person.id,
                    'full_name': person.full_name,
                    'title': person.title,
                    'specialization': person.specialization,
                    'display_title': person.display_title,
                    'position_type': person.position_type,
                    'email': person.email,
                    'phone': person.phone,
                    'office_location': person.office_location,
                    'bio': person.bio,
                    'qualifications': person.qualifications,
                })
            
            departments_data.append({
                'id': dept.id,
                'name': dept.name,
                'department_type': dept.department_type,
                'description': dept.description,
                'office_location': dept.office_location,
                'phone': dept.phone,
                'email': dept.email,
                'head_name': dept.head_name,
                'head_title': dept.head_title,
                'personnel': personnel_data,
            })
        
        return JsonResponse({
            'status': 'success',
            'departments': departments_data
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@require_http_methods(["GET"])
def api_personnel(request):
    """Get all personnel"""
    try:
        personnel = Personnel.objects.filter(is_active=True).order_by('department', 'position_type', 'display_order', 'last_name')
        personnel_data = []
        
        for person in personnel:
            personnel_data.append({
                'id': person.id,
                'department_id': person.department.id,
                'department_name': person.department.name,
                'department_type': person.department.department_type,
                'full_name': person.full_name,
                'first_name': person.first_name,
                'last_name': person.last_name,
                'middle_name': person.middle_name,
                'title': person.title,
                'specialization': person.specialization,
                'display_title': person.display_title,
                'position_type': person.position_type,
                'email': person.email,
                'phone': person.phone,
                'office_location': person.office_location,
                'bio': person.bio,
                'qualifications': person.qualifications,
            })
        
        return JsonResponse({
            'status': 'success',
            'personnel': personnel_data
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


# Admin CRUD operations for Departments

@require_http_methods(["GET"])
@login_required_json
@permission_required('portal.view_department', raise_exception=True)
def api_admin_departments(request):
    """Get all departments (including inactive) for admin"""
    try:
        departments = Department.objects.all().order_by('department_type', 'display_order', 'name')
        departments_data = []
        
        for dept in departments:
            departments_data.append({
                'id': dept.id,
                'name': dept.name,
                'department_type': dept.department_type,
                'description': dept.description,
                'office_location': dept.office_location,
                'phone': dept.phone,
                'email': dept.email,
                'head_name': dept.head_name,
                'head_title': dept.head_title,
                'is_active': dept.is_active,
                'display_order': dept.display_order,
                'created_at': dept.created_at.isoformat(),
                'updated_at': dept.updated_at.isoformat(),
            })
        
        return JsonResponse({
            'status': 'success',
            'departments': departments_data
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@require_http_methods(["GET"])
@login_required_json
@permission_required('portal.view_personnel', raise_exception=True)
def api_admin_personnel(request):
    """Get all personnel (including inactive) for admin"""
    try:
        personnel = Personnel.objects.all().order_by('department', 'position_type', 'display_order', 'last_name')
        personnel_data = []
        
        for person in personnel:
            personnel_data.append({
                'id': person.id,
                'department_id': person.department.id,
                'department_name': person.department.name,
                'first_name': person.first_name,
                'last_name': person.last_name,
                'middle_name': person.middle_name,
                'full_name': person.full_name,
                'title': person.title,
                'specialization': person.specialization,
                'display_title': person.display_title,
                'position_type': person.position_type,
                'email': person.email,
                'phone': person.phone,
                'office_location': person.office_location,
                'bio': person.bio,
                'qualifications': person.qualifications,
                'is_active': person.is_active,
                'display_order': person.display_order,
                'created_at': person.created_at.isoformat(),
                'updated_at': person.updated_at.isoformat(),
            })
        
        return JsonResponse({
            'status': 'success',
            'personnel': personnel_data
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
@login_required
@permission_required('portal.add_department', raise_exception=True)
def api_create_department(request):
    """Create a new department"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['name', 'department_type']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({'status': 'error', 'message': f'{field} is required'}, status=400)
        
        department = Department.objects.create(
            name=data['name'],
            department_type=data['department_type'],
            description=data.get('description', ''),
            office_location=data.get('office_location', ''),
            phone=data.get('phone', ''),
            email=data.get('email', ''),
            head_name=data.get('head_name', ''),
            head_title=data.get('head_title', ''),
            display_order=data.get('display_order', 0),
        )
        
        return JsonResponse({
            'status': 'success',
            'message': 'Department created successfully',
            'department': {
                'id': department.id,
                'name': department.name,
                'department_type': department.department_type,
                'description': department.description,
                'office_location': department.office_location,
                'phone': department.phone,
                'email': department.email,
                'head_name': department.head_name,
                'head_title': department.head_title,
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@require_http_methods(["PUT", "PATCH"])
@csrf_exempt
@login_required
@permission_required('portal.change_department', raise_exception=True)
def api_update_department(request, department_id):
    """Update a department"""
    try:
        department = get_object_or_404(Department, id=department_id)
        data = json.loads(request.body)
        
        # Update fields
        department.name = data.get('name', department.name)
        department.department_type = data.get('department_type', department.department_type)
        department.description = data.get('description', department.description)
        department.office_location = data.get('office_location', department.office_location)
        department.phone = data.get('phone', department.phone)
        department.email = data.get('email', department.email)
        department.head_name = data.get('head_name', department.head_name)
        department.head_title = data.get('head_title', department.head_title)
        department.display_order = data.get('display_order', department.display_order)
        
        department.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Department updated successfully',
            'department': {
                'id': department.id,
                'name': department.name,
                'department_type': department.department_type,
                'description': department.description,
                'office_location': department.office_location,
                'phone': department.phone,
                'email': department.email,
                'head_name': department.head_name,
                'head_title': department.head_title,
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@require_http_methods(["DELETE"])
@csrf_exempt
@login_required
@permission_required('portal.delete_department', raise_exception=True)
def api_delete_department(request, department_id):
    """Delete a department"""
    try:
        department = get_object_or_404(Department, id=department_id)
        department.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Department deleted successfully'
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


# Admin CRUD operations for Personnel

@require_http_methods(["POST"])
@csrf_exempt
@login_required
@permission_required('portal.add_personnel', raise_exception=True)
def api_create_personnel(request):
    """Create a new personnel member"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['department_id', 'first_name', 'last_name', 'title']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({'status': 'error', 'message': f'{field} is required'}, status=400)
        
        # Validate department exists
        try:
            department = Department.objects.get(id=data['department_id'])
        except Department.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Department not found'}, status=400)
        
        personnel = Personnel.objects.create(
            department=department,
            first_name=data['first_name'],
            last_name=data['last_name'],
            middle_name=data.get('middle_name', ''),
            position_type=data.get('position_type', 'faculty'),
            title=data['title'],
            specialization=data.get('specialization', ''),
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            office_location=data.get('office_location', ''),
            bio=data.get('bio', ''),
            qualifications=data.get('qualifications', ''),
            display_order=data.get('display_order', 0),
        )
        
        return JsonResponse({
            'status': 'success',
            'message': 'Personnel created successfully',
            'personnel': {
                'id': personnel.id,
                'department_id': personnel.department.id,
                'department_name': personnel.department.name,
                'full_name': personnel.full_name,
                'title': personnel.title,
                'specialization': personnel.specialization,
                'display_title': personnel.display_title,
                'position_type': personnel.position_type,
                'email': personnel.email,
                'phone': personnel.phone,
                'office_location': personnel.office_location,
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@require_http_methods(["PUT", "PATCH"])
@csrf_exempt
@login_required
@permission_required('portal.change_personnel', raise_exception=True)
def api_update_personnel(request, personnel_id):
    """Update a personnel member"""
    try:
        personnel = get_object_or_404(Personnel, id=personnel_id)
        data = json.loads(request.body)
        
        # Update department if provided
        if 'department_id' in data:
            try:
                department = Department.objects.get(id=data['department_id'])
                personnel.department = department
            except Department.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Department not found'}, status=400)
        
        # Update other fields
        personnel.first_name = data.get('first_name', personnel.first_name)
        personnel.last_name = data.get('last_name', personnel.last_name)
        personnel.middle_name = data.get('middle_name', personnel.middle_name)
        personnel.position_type = data.get('position_type', personnel.position_type)
        personnel.title = data.get('title', personnel.title)
        personnel.specialization = data.get('specialization', personnel.specialization)
        personnel.email = data.get('email', personnel.email)
        personnel.phone = data.get('phone', personnel.phone)
        personnel.office_location = data.get('office_location', personnel.office_location)
        personnel.bio = data.get('bio', personnel.bio)
        personnel.qualifications = data.get('qualifications', personnel.qualifications)
        personnel.display_order = data.get('display_order', personnel.display_order)
        
        personnel.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Personnel updated successfully',
            'personnel': {
                'id': personnel.id,
                'department_id': personnel.department.id,
                'department_name': personnel.department.name,
                'full_name': personnel.full_name,
                'title': personnel.title,
                'specialization': personnel.specialization,
                'display_title': personnel.display_title,
                'position_type': personnel.position_type,
                'email': personnel.email,
                'phone': personnel.phone,
                'office_location': personnel.office_location,
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@require_http_methods(["DELETE"])
@csrf_exempt
@login_required
@permission_required('portal.delete_personnel', raise_exception=True)
def api_delete_personnel(request, personnel_id):
    """Delete a personnel member"""
    try:
        personnel = get_object_or_404(Personnel, id=personnel_id)
        personnel.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Personnel deleted successfully'
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


# Admin: Admissions Requirements CRUD
@login_required_json
@require_http_methods(["GET"])
def api_admin_admission_requirements(request):
    """Get all admission requirements (admin)"""
    requirements = AdmissionRequirement.objects.all().order_by('category', 'display_order', 'id')
    requirements_data = [
        {
            'id': req.id,
            'category': req.category,
            'category_display': req.get_category_display(),
            'requirement_text': req.requirement_text,
            'display_order': req.display_order,
            'is_active': req.is_active,
            'created_at': req.created_at.isoformat(),
            'updated_at': req.updated_at.isoformat(),
        }
        for req in requirements
    ]
    return JsonResponse({'requirements': requirements_data})


@csrf_exempt
@login_required_json
@require_http_methods(["POST"])
def api_create_admission_requirement(request):
    """Create a new admission requirement (saves list format as single record)"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        if not data.get('category'):
            return JsonResponse({'status': 'error', 'message': 'Category is required'}, status=400)
        if not data.get('requirement_text'):
            return JsonResponse({'status': 'error', 'message': 'Requirement text is required'}, status=400)
        
        # Save the entire text (including newlines) as a single record
        requirement = AdmissionRequirement.objects.create(
            category=data.get('category'),
            requirement_text=data.get('requirement_text', '').strip(),
            display_order=data.get('display_order', 0),
            is_active=data.get('is_active', True)
        )
        return JsonResponse({
            'status': 'success',
            'requirement': {
                'id': requirement.id,
                'category': requirement.category,
                'category_display': requirement.get_category_display(),
                'requirement_text': requirement.requirement_text,
                'display_order': requirement.display_order,
                'is_active': requirement.is_active,
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@csrf_exempt
@login_required_json
@require_http_methods(["PUT"])
def api_update_admission_requirement(request, requirement_id):
    """Update an admission requirement"""
    try:
        requirement = get_object_or_404(AdmissionRequirement, id=requirement_id)
        data = json.loads(request.body)
        
        if 'category' in data:
            requirement.category = data.get('category')
        if 'requirement_text' in data:
            requirement.requirement_text = data.get('requirement_text', '').strip()
        if 'display_order' in data:
            requirement.display_order = data.get('display_order', 0)
        if 'is_active' in data:
            requirement.is_active = data.get('is_active', True)
        
        requirement.save()
        
        return JsonResponse({
            'status': 'success',
            'requirement': {
                'id': requirement.id,
                'category': requirement.category,
                'category_display': requirement.get_category_display(),
                'requirement_text': requirement.requirement_text,
                'display_order': requirement.display_order,
                'is_active': requirement.is_active,
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@csrf_exempt
@login_required_json
@require_http_methods(["DELETE"])
def api_delete_admission_requirement(request, requirement_id):
    """Delete an admission requirement"""
    try:
        requirement = get_object_or_404(AdmissionRequirement, id=requirement_id)
        requirement.delete()
        return JsonResponse({
            'status': 'success',
            'message': 'Admission requirement deleted successfully'
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


# Admin: Enrollment Process Steps CRUD
@login_required_json
@require_http_methods(["GET"])
def api_admin_enrollment_steps(request):
    """Get all enrollment process steps (admin)"""
    steps = EnrollmentProcessStep.objects.all().order_by('category', 'display_order', 'step_number')
    steps_data = [
        {
            'id': step.id,
            'category': step.category,
            'category_display': step.get_category_display(),
            'step_number': step.step_number,
            'title': step.title,
            'description': step.description,
            'display_order': step.display_order,
            'is_active': step.is_active,
            'created_at': step.created_at.isoformat(),
            'updated_at': step.updated_at.isoformat(),
        }
        for step in steps
    ]
    return JsonResponse({'steps': steps_data})


@csrf_exempt
@login_required_json
@require_http_methods(["POST"])
def api_create_enrollment_step(request):
    """Create a new enrollment process step"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        if not data.get('step_number'):
            return JsonResponse({'status': 'error', 'message': 'Step number is required'}, status=400)
        if not data.get('title'):
            return JsonResponse({'status': 'error', 'message': 'Title is required'}, status=400)
        if not data.get('description'):
            return JsonResponse({'status': 'error', 'message': 'Description is required'}, status=400)
        
        step = EnrollmentProcessStep.objects.create(
            category=data.get('category', 'new-scholar'),
            step_number=data.get('step_number'),
            title=data.get('title', '').strip(),
            description=data.get('description', '').strip(),
            display_order=data.get('display_order', 0),
            is_active=data.get('is_active', True)
        )
        return JsonResponse({
            'status': 'success',
            'step': {
                'id': step.id,
                'category': step.category,
                'category_display': step.get_category_display(),
                'step_number': step.step_number,
                'title': step.title,
                'description': step.description,
                'display_order': step.display_order,
                'is_active': step.is_active,
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@csrf_exempt
@login_required_json
@require_http_methods(["PUT"])
def api_update_enrollment_step(request, step_id):
    """Update an enrollment process step"""
    try:
        step = get_object_or_404(EnrollmentProcessStep, id=step_id)
        data = json.loads(request.body)
        
        if 'category' in data:
            step.category = data.get('category', 'new-scholar')
        if 'step_number' in data:
            step.step_number = data.get('step_number')
        if 'title' in data:
            step.title = data.get('title', '').strip()
        if 'description' in data:
            step.description = data.get('description', '').strip()
        if 'display_order' in data:
            step.display_order = data.get('display_order', 0)
        if 'is_active' in data:
            step.is_active = data.get('is_active', True)
        
        step.save()
        
        return JsonResponse({
            'status': 'success',
            'step': {
                'id': step.id,
                'category': step.category,
                'category_display': step.get_category_display(),
                'step_number': step.step_number,
                'title': step.title,
                'description': step.description,
                'display_order': step.display_order,
                'is_active': step.is_active,
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@csrf_exempt
@login_required_json
@require_http_methods(["DELETE"])
def api_delete_enrollment_step(request, step_id):
    """Delete an enrollment process step"""
    try:
        step = get_object_or_404(EnrollmentProcessStep, id=step_id)
        step.delete()
        return JsonResponse({
            'status': 'success',
            'message': 'Enrollment step deleted successfully'
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


# Admin: Admission Notes CRUD
@login_required_json
@require_http_methods(["GET"])
def api_admin_admission_notes(request):
    """Get all admission notes (admin)"""
    notes = AdmissionNote.objects.all().order_by('display_order', 'id')
    notes_data = [
        {
            'id': note.id,
            'title': note.title,
            'note_text': note.note_text,
            'display_order': note.display_order,
            'is_active': note.is_active,
            'created_at': note.created_at.isoformat(),
            'updated_at': note.updated_at.isoformat(),
        }
        for note in notes
    ]
    return JsonResponse({'notes': notes_data})


@csrf_exempt
@login_required_json
@require_http_methods(["POST"])
def api_create_admission_note(request):
    """Create a new admission note"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        if not data.get('title'):
            return JsonResponse({'status': 'error', 'message': 'Title is required'}, status=400)
        if not data.get('note_text'):
            return JsonResponse({'status': 'error', 'message': 'Note text is required'}, status=400)
        
        note = AdmissionNote.objects.create(
            title=data.get('title', '').strip(),
            note_text=data.get('note_text', '').strip(),
            display_order=data.get('display_order', 0),
            is_active=data.get('is_active', True)
        )
        return JsonResponse({
            'status': 'success',
            'note': {
                'id': note.id,
                'title': note.title,
                'note_text': note.note_text,
                'display_order': note.display_order,
                'is_active': note.is_active,
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@csrf_exempt
@login_required_json
@require_http_methods(["PUT"])
def api_update_admission_note(request, note_id):
    """Update an admission note"""
    try:
        note = get_object_or_404(AdmissionNote, id=note_id)
        data = json.loads(request.body)
        
        if 'title' in data:
            note.title = data.get('title', '').strip()
        if 'note_text' in data:
            note.note_text = data.get('note_text', '').strip()
        if 'display_order' in data:
            note.display_order = data.get('display_order', 0)
        if 'is_active' in data:
            note.is_active = data.get('is_active', True)
        
        note.save()
        
        return JsonResponse({
            'status': 'success',
            'note': {
                'id': note.id,
                'title': note.title,
                'note_text': note.note_text,
                'display_order': note.display_order,
                'is_active': note.is_active,
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@csrf_exempt
@login_required_json
@require_http_methods(["DELETE"])
def api_delete_admission_note(request, note_id):
    """Delete an admission note"""
    try:
        note = get_object_or_404(AdmissionNote, id=note_id)
        note.delete()
        return JsonResponse({
            'status': 'success',
            'message': 'Admission note deleted successfully'
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


# Admin-only CRUD operations for News
@require_http_methods(["GET"])
@login_required
def api_admin_news(request):
    """Get all news for admin (including inactive)"""
    try:
        news_list = News.objects.all().order_by('display_order', '-date')
        news_data = []
        for news in news_list:
            news_item = {
                'id': news.id,
                'title': news.title,
                'date': news.date.isoformat(),
                'body': news.body,
                'details': news.details,
                'is_active': news.is_active,
                'display_order': news.display_order,
                'created_at': news.created_at.isoformat(),
                'updated_at': news.updated_at.isoformat()
            }
            if news.image:
                news_item['image'] = build_safe_media_url(request, news)
            else:
                news_item['image'] = None
            news_data.append(news_item)
        
        return JsonResponse({
            'status': 'success',
            'news': news_data,
            'count': len(news_data)
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching news: {str(e)}'
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
@login_required
@permission_required('portal.add_news', raise_exception=True)
def api_create_news(request):
    """Create a new news article (Admin only)"""
    try:
        # Handle multipart/form-data for file upload
        if request.content_type and 'multipart/form-data' in request.content_type:
            title = sanitize_input(request.POST.get('title', ''), max_length=200)
            date = request.POST.get('date')
            body = sanitize_input(request.POST.get('body', ''))
            details = sanitize_input(request.POST.get('details', ''))
            is_active = request.POST.get('is_active', 'true').lower() == 'true'
            display_order = int(request.POST.get('display_order', 0))
            image = request.FILES.get('image')
            
            # Validate image upload if provided
            if image:
                is_valid, error_msg = validate_file_upload(image, max_size_mb=10)
                if not is_valid:
                    return JsonResponse({
                        'status': 'error',
                        'message': error_msg
                    }, status=400)
        else:
            # Handle JSON (for backward compatibility, though image won't work)
            data = json.loads(request.body)
            title = sanitize_input(data.get('title', ''), max_length=200)
            date = data.get('date')
            body = sanitize_input(data.get('body', ''))
            details = sanitize_input(data.get('details', ''))
            is_active = data.get('is_active', True)
            display_order = data.get('display_order', 0)
            image = None
        
        # Validate required fields
        if not title or not date or not body:
            return JsonResponse({
                'status': 'error',
                'message': 'Fields "title", "date", and "body" are required'
            }, status=400)
        
        # Create the news article
        news = News.objects.create(
            title=title,
            date=_parse_date(date),
            body=body,
            details=details,
            is_active=is_active,
            display_order=display_order
        )
        
        # Handle image upload if provided
        if image:
            news.image = image
            news.save()
        
        news_data = {
            'id': news.id,
            'title': news.title,
            'date': news.date.isoformat(),
            'body': news.body,
            'details': news.details,
            'is_active': news.is_active,
            'display_order': news.display_order,
            'created_at': news.created_at.isoformat(),
            'updated_at': news.updated_at.isoformat()
        }
        news_data['image'] = build_safe_media_url(request, news)
        
        return JsonResponse({
            'status': 'success',
            'message': 'News created successfully',
            'news': news_data
        }, status=201)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error creating news: {str(e)}'
        }, status=500)


@require_http_methods(["PUT", "PATCH", "POST"])
@csrf_exempt
@login_required
@permission_required('portal.change_news', raise_exception=True)
def api_update_news(request, news_id):
    """Update a news article (Admin only)"""
    try:
        news = get_object_or_404(News, id=news_id)
        
        # Handle multipart/form-data for file upload
        # Check if this is a POST request with method override (for multipart data)
        # or a regular PUT/PATCH request
        is_post_with_override = (request.method == 'POST' and 
                                (request.META.get('HTTP_X_HTTP_METHOD_OVERRIDE') == 'PUT' or 
                                 request.POST.get('_method') == 'PUT'))
        
        if request.content_type and 'multipart/form-data' in request.content_type:
            # For multipart data, use POST (Django parses this correctly)
            if 'title' in request.POST:
                news.title = request.POST.get('title')
            if 'date' in request.POST:
                news.date = _parse_date(request.POST.get('date'))
            if 'body' in request.POST:
                news.body = request.POST.get('body')
            if 'details' in request.POST:
                news.details = request.POST.get('details', '')
            if 'is_active' in request.POST:
                news.is_active = request.POST.get('is_active', 'true').lower() == 'true'
            if 'display_order' in request.POST:
                news.display_order = int(request.POST.get('display_order', 0))
            
            image = request.FILES.get('image') if hasattr(request, 'FILES') else None
            remove_image = request.POST.get('remove_image', 'false').lower() == 'true'
            
            # Handle image
            if remove_image:
                if news.image:
                    news.image.delete()
                news.image = None
            elif image:
                # Delete old image if exists
                if news.image:
                    news.image.delete()
                news.image = image
        else:
            # Handle JSON
            data = json.loads(request.body)
            
            # Update fields
            if 'title' in data:
                news.title = data.get('title')
            if 'date' in data:
                news.date = _parse_date(data.get('date'))
            if 'body' in data:
                news.body = data.get('body')
            if 'details' in data:
                news.details = data.get('details', '')
            if 'is_active' in data:
                news.is_active = data.get('is_active')
            if 'display_order' in data:
                news.display_order = data.get('display_order')
            
            image = None
            remove_image = data.get('remove_image', False)
            
            if remove_image:
                if news.image:
                    news.image.delete()
                news.image = None
        
        news.save()
        
        news_data = {
            'id': news.id,
            'title': news.title,
            'date': news.date.isoformat(),
            'body': news.body,
            'details': news.details,
            'is_active': news.is_active,
            'display_order': news.display_order,
            'created_at': news.created_at.isoformat(),
            'updated_at': news.updated_at.isoformat()
        }
        news_data['image'] = build_safe_media_url(request, news)
        
        return JsonResponse({
            'status': 'success',
            'message': 'News updated successfully',
            'news': news_data
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error updating news: {str(e)}'
        }, status=500)


@require_http_methods(["DELETE"])
@csrf_exempt
@login_required
@permission_required('portal.delete_news', raise_exception=True)
def api_delete_news(request, news_id):
    """Delete a news article (Admin only)"""
    try:
        news = get_object_or_404(News, id=news_id)
        # Delete associated image if exists
        if news.image:
            news.image.delete()
        news.delete()
        return JsonResponse({
            'status': 'success',
            'message': 'News deleted successfully'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error deleting news: {str(e)}'
        }, status=500)


# Public API endpoint for News
@require_http_methods(["GET"])
def api_news(request):
    """Get all active news articles"""
    try:
        news_list = News.objects.filter(is_active=True).order_by('display_order', '-date')
        news_data = []
        for news in news_list:
            news_item = {
                'id': news.id,
                'title': news.title,
                'date': news.date.isoformat(),
                'body': news.body,
                'details': news.details if news.details else news.body
            }
            if news.image:
                news_item['image'] = build_safe_media_url(request, news)
            news_data.append(news_item)
        
        return JsonResponse({
            'status': 'success',
            'news': news_data,
            'count': len(news_data)
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching news: {str(e)}'
        }, status=500)


# Institutional Info API endpoints

@require_http_methods(["GET"])
def api_institutional_info(request):
    """Get active institutional information (Mission, Vision, Goals, Core Values)"""
    try:
        info = InstitutionalInfo.objects.filter(is_active=True).first()
        if not info:
            # Return default empty structure if no active info exists
            return JsonResponse({
                'status': 'success',
                'institutional_info': {
                    'id': None,
                    'vision': '',
                    'mission': '',
                    'goals': '',
                    'core_values': ''
                }
            })
        
        return JsonResponse({
            'status': 'success',
            'institutional_info': {
                'id': info.id,
                'vision': info.vision,
                'mission': info.mission,
                'goals': info.goals,
                'core_values': info.core_values,
                'updated_at': info.updated_at.isoformat()
            }
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching institutional information: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
@login_required_json
def api_admin_institutional_info(request):
    """Get institutional information for admin (includes inactive)"""
    try:
        info = InstitutionalInfo.objects.first()
        if not info:
            return JsonResponse({
                'status': 'success',
                'institutional_info': None
            })
        
        return JsonResponse({
            'status': 'success',
            'institutional_info': {
                'id': info.id,
                'vision': info.vision,
                'mission': info.mission,
                'goals': info.goals,
                'core_values': info.core_values,
                'is_active': info.is_active,
                'created_at': info.created_at.isoformat(),
                'updated_at': info.updated_at.isoformat()
            }
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching institutional information: {str(e)}'
        }, status=500)


@require_http_methods(["POST", "PUT"])
@csrf_exempt
@login_required_json
def api_update_institutional_info(request):
    """Create or update institutional information (Admin only)"""
    try:
        data = json.loads(request.body)
        
        # Get existing record or create new
        info, created = InstitutionalInfo.objects.get_or_create(
            defaults={
                'vision': data.get('vision', ''),
                'mission': data.get('mission', ''),
                'goals': data.get('goals', ''),
                'core_values': data.get('core_values', ''),
                'is_active': data.get('is_active', True)
            }
        )
        
        if not created:
            # Update existing record
            info.vision = data.get('vision', info.vision)
            info.mission = data.get('mission', info.mission)
            info.goals = data.get('goals', info.goals)
            info.core_values = data.get('core_values', info.core_values)
            info.is_active = data.get('is_active', info.is_active)
            info.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Institutional information saved successfully',
            'institutional_info': {
                'id': info.id,
                'vision': info.vision,
                'mission': info.mission,
                'goals': info.goals,
                'core_values': info.core_values,
                'is_active': info.is_active,
                'updated_at': info.updated_at.isoformat()
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error saving institutional information: {str(e)}'
        }, status=500)


def _send_brevo_template(to_email: str, template_id: str, merge_data: dict) -> bool:
    try:
        from anymail.message import AnymailMessage
        if not template_id:
            return False
        msg = AnymailMessage(to=[to_email])
        msg.template_id = template_id
        # Brevo uses global merge data
        msg.merge_global_data = merge_data
        # ensure from email if configured
        if getattr(settings, 'DEFAULT_FROM_EMAIL', None):
            msg.from_email = settings.DEFAULT_FROM_EMAIL
        msg.send(fail_silently=False)
        return True
    except Exception:
        return False


# Admin-only CRUD operations for Downloads
@require_http_methods(["GET"])
@csrf_exempt
@login_required_json
def api_admin_downloads(request):
    """Get all downloads including inactive ones (Admin only)"""
    try:
        downloads = Download.objects.all().order_by('category', 'display_order', 'title')
        downloads_list = []
        
        for download in downloads:
            downloads_list.append({
                'id': download.id,
                'title': download.title,
                'description': download.description,
                'category': download.category,
                'category_display': download.get_category_display(),
                'file_url': build_safe_media_url(request, download.file) if download.file else None,
                'file_type': download.file_type or 'FILE',
                'is_active': download.is_active,
                'display_order': download.display_order,
                'created_at': download.created_at.isoformat(),
                'updated_at': download.updated_at.isoformat()
            })
        
        return JsonResponse({
            'status': 'success',
            'downloads': downloads_list
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error fetching downloads: {str(e)}'
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
@login_required_json
def api_create_download(request):
    """
    Admin API endpoint to create a new download entry.
    
    Accepts multipart/form-data for file uploads. Validates file type and size
    before saving. Supports common document formats: PDF, DOC, DOCX, XLS, XLSX, ZIP, RAR.
    Maximum file size: 50MB.
    
    Required fields:
        - title: Display name for the download
        - file: The file to be uploaded
    
    Optional fields:
        - description: Brief description
        - category: Download category (default: 'other')
        - is_active: Whether visible on public site (default: True)
        - display_order: Ordering within category (default: 0)
    
    Returns:
        JSON response with created download object or error message
    """
    try:
        # Handle multipart/form-data for file upload
        if request.content_type and 'multipart/form-data' in request.content_type:
            title = sanitize_input(request.POST.get('title', ''), max_length=200)
            description = sanitize_input(request.POST.get('description', ''))
            category = request.POST.get('category', 'other')
            is_active = request.POST.get('is_active', 'true').lower() == 'true'
            display_order = int(request.POST.get('display_order', 0))
            file = request.FILES.get('file')
            
            # Validate file upload if provided
            if file:
                # Allow common document types for downloads
                allowed_document_types = [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.ms-word',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/msexcel',
                    'application/zip',
                    'application/x-zip-compressed',
                    'application/x-rar-compressed',
                    'application/vnd.rar',
                ]
                is_valid, error_msg = validate_file_upload(file, allowed_types=allowed_document_types, max_size_mb=50)
                if not is_valid:
                    return JsonResponse({
                        'status': 'error',
                        'message': error_msg
                    }, status=400)
        else:
            # Handle JSON (for backward compatibility, though file won't work)
            data = json.loads(request.body)
            title = sanitize_input(data.get('title', ''), max_length=200)
            description = sanitize_input(data.get('description', ''))
            category = data.get('category', 'other')
            is_active = data.get('is_active', True)
            display_order = data.get('display_order', 0)
            file = None
        
        # Validate required fields
        if not title:
            return JsonResponse({
                'status': 'error',
                'message': 'Field "title" is required'
            }, status=400)
        
        if not file:
            return JsonResponse({
                'status': 'error',
                'message': 'File is required'
            }, status=400)
        
        # Create the download
        download = Download.objects.create(
            title=title,
            description=description,
            category=category,
            file=file,
            is_active=is_active,
            display_order=display_order
        )
        
        return JsonResponse({
            'status': 'success',
            'message': 'Download created successfully',
            'download': {
                'id': download.id,
                'title': download.title,
                'description': download.description,
                'category': download.category,
                'category_display': download.get_category_display(),
                'file_url': build_safe_media_url(request, download.file) if download.file else None,
                'file_type': download.file_type or 'FILE',
                'is_active': download.is_active,
                'display_order': download.display_order
            }
        }, status=201)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error creating download: {str(e)}'
        }, status=500)


@require_http_methods(["PUT", "PATCH", "POST"])
@csrf_exempt
@login_required_json
def api_update_download(request, download_id):
    """
    Admin API endpoint to update an existing download entry.
    
    Supports both JSON and multipart/form-data requests. When updating with a new file,
    the old file is automatically deleted. File upload is optional for updates.
    
    Parameters:
        download_id: ID of the download to update
    
    Returns:
        JSON response with updated download object or error message
    """
    try:
        download = get_object_or_404(Download, id=download_id)
        
        # Handle multipart/form-data for file upload
        # Check if this is a POST request with method override (for multipart data)
        is_post_with_override = (request.method == 'POST' and
                                (request.META.get('HTTP_X_HTTP_METHOD_OVERRIDE') == 'PUT' or
                                 request.POST.get('_method') == 'PUT'))
        
        if request.content_type and 'multipart/form-data' in request.content_type:
            # For multipart data, use POST (Django parses this correctly)
            if 'title' in request.POST:
                download.title = sanitize_input(request.POST.get('title'), max_length=200)
            if 'description' in request.POST:
                download.description = sanitize_input(request.POST.get('description'))
            if 'category' in request.POST:
                download.category = request.POST.get('category')
            if 'is_active' in request.POST:
                download.is_active = request.POST.get('is_active', 'true').lower() == 'true'
            if 'display_order' in request.POST:
                download.display_order = int(request.POST.get('display_order', 0))
            
            file = request.FILES.get('file') if hasattr(request, 'FILES') else None
            remove_file = request.POST.get('remove_file', 'false').lower() == 'true'
            
            # Handle file
            if remove_file:
                if download.file:
                    download.file.delete()
                download.file = None
            elif file:
                # Validate file upload
                # Allow common document types for downloads
                allowed_document_types = [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.ms-word',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/msexcel',
                    'application/zip',
                    'application/x-zip-compressed',
                    'application/x-rar-compressed',
                    'application/vnd.rar',
                ]
                is_valid, error_msg = validate_file_upload(file, allowed_types=allowed_document_types, max_size_mb=50)
                if not is_valid:
                    return JsonResponse({
                        'status': 'error',
                        'message': error_msg
                    }, status=400)
                # Delete old file if exists
                if download.file:
                    download.file.delete()
                download.file = file
        else:
            # Handle JSON
            data = json.loads(request.body)
            
            # Update fields
            if 'title' in data:
                download.title = sanitize_input(data.get('title'), max_length=200)
            if 'description' in data:
                download.description = sanitize_input(data.get('description'))
            if 'category' in data:
                download.category = data.get('category')
            if 'is_active' in data:
                download.is_active = data.get('is_active', True)
            if 'display_order' in data:
                download.display_order = data.get('display_order', 0)
        
        download.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Download updated successfully',
            'download': {
                'id': download.id,
                'title': download.title,
                'description': download.description,
                'category': download.category,
                'category_display': download.get_category_display(),
                'file_url': build_safe_media_url(request, download.file) if download.file else None,
                'file_type': download.file_type or 'FILE',
                'is_active': download.is_active,
                'display_order': download.display_order
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error updating download: {str(e)}'
        }, status=500)


@require_http_methods(["DELETE"])
@csrf_exempt
@login_required_json
def api_delete_download(request, download_id):
    """
    Admin API endpoint to delete a download entry.
    
    Permanently removes the download record and its associated file from storage.
    This action cannot be undone.
    
    Parameters:
        download_id: ID of the download to delete
    
    Returns:
        JSON response with success/error message
    """
    try:
        download = get_object_or_404(Download, id=download_id)
        # Delete associated file if exists
        if download.file:
            download.file.delete()
        download.delete()
        return JsonResponse({
            'status': 'success',
            'message': 'Download deleted successfully'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error deleting download: {str(e)}'
        }, status=500)


def handle_hot_update(request):
    """Handle webpack hot-update requests to suppress 404 errors in logs.
    These files are served by webpack-dev-server on port 3000, not Django.
    """
    from django.http import HttpResponse
    return HttpResponse(status=204)  # No Content - silently ignore