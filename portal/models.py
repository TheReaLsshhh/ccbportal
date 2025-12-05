from django.db import models
from django.utils import timezone

# Create your models here.

class AcademicProgram(models.Model):
    """Model for academic programs offered by CCB"""
    
    PROGRAM_TYPES = [
        ('BS', 'Bachelor of Science'),
        ('BA', 'Bachelor of Arts'),
        ('MA', 'Master of Arts'),
        ('MS', 'Master of Science'),
    ]
    
    title = models.CharField(max_length=200, help_text="Full program title (e.g., Bachelor of Science in Information Technology)")
    short_title = models.CharField(max_length=100, help_text="Short version of the title")
    program_type = models.CharField(max_length=2, choices=PROGRAM_TYPES, default='BS')
    description = models.TextField(help_text="Brief description of the program")
    duration_years = models.PositiveIntegerField(default=4, help_text="Duration in years")
    total_units = models.PositiveIntegerField(default=120, help_text="Total number of units")
    with_enhancements = models.PositiveIntegerField(default=0, help_text="Number of enhancements")
    
    # Program Details
    program_overview = models.TextField(blank=True, help_text="Detailed program overview and objectives")
    core_courses = models.TextField(blank=True, help_text="Core courses (one per line)")
    career_prospects = models.TextField(blank=True, help_text="Career prospects and opportunities")
    
    # Metadata
    is_active = models.BooleanField(default=True, help_text="Whether this program is currently offered")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Display order
    display_order = models.PositiveIntegerField(default=0, help_text="Order for display on website")
    
    class Meta:
        ordering = ['display_order', 'title']
        verbose_name = "Academic Program"
        verbose_name_plural = "Academic Programs"
    
    def __str__(self):
        return self.title
    
    @property
    def duration_text(self):
        """Return duration as formatted text"""
        return f"{self.duration_years} {'Year' if self.duration_years == 1 else 'Years'}"
    
    @property
    def units_text(self):
        """Return units as formatted text"""
        return f"{self.total_units} Units"
    
    @property
    def enhancements_text(self):
        """Return enhancements as formatted text"""
        if self.with_enhancements == 0:
            return "No Enhancements"
        elif self.with_enhancements == 1:
            return "With 1 Enhancement"
        else:
            return f"With {self.with_enhancements} Enhancements"

class ProgramSpecialization(models.Model):
    """Model for program specializations"""
    
    program = models.ForeignKey(AcademicProgram, on_delete=models.CASCADE, related_name='specializations')
    name = models.CharField(max_length=100, help_text="Specialization name")
    description = models.TextField(blank=True, help_text="Description of the specialization")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = "Program Specialization"
        verbose_name_plural = "Program Specializations"
    
    def __str__(self):
        return f"{self.program.short_title} - {self.name}"


class Announcement(models.Model):
    """News & Events announcements shown on the site."""
    title = models.CharField(max_length=200)
    date = models.DateField()
    body = models.TextField()
    details = models.TextField(blank=True, help_text="Full details shown in modal; falls back to body if empty")
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-date', 'title']
        verbose_name = 'Announcement'
        verbose_name_plural = 'Announcements'

    def __str__(self):
        return f"{self.title} ({self.date})"


class Event(models.Model):
    """School Events and Activities shown on the site."""
    title = models.CharField(max_length=200, help_text="Event title")
    description = models.TextField(help_text="Brief description of the event")
    details = models.TextField(blank=True, help_text="Full details shown in modal; falls back to description if empty")
    event_date = models.DateField(help_text="Date of the event")
    start_time = models.TimeField(help_text="Start time of the event")
    end_time = models.TimeField(help_text="End time of the event")
    location = models.CharField(max_length=200, blank=True, help_text="Event location")
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0, help_text="Order for display on website")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'event_date', 'start_time', 'title']
        verbose_name = 'Event'
        verbose_name_plural = 'Events'

    def __str__(self):
        return f"{self.title} ({self.event_date})"
    
    @property
    def formatted_time(self):
        """Return formatted time range"""
        return f"{self.start_time.strftime('%I:%M %p')} - {self.end_time.strftime('%I:%M %p')}"
    
    @property
    def formatted_date(self):
        """Return formatted date for display"""
        return self.event_date.strftime('%d %b').upper()


class Achievement(models.Model):
    """Achievements and Press Releases shown on the site."""
    title = models.CharField(max_length=200, help_text="Achievement title")
    description = models.TextField(help_text="Brief description of the achievement")
    details = models.TextField(blank=True, help_text="Full details shown in modal; falls back to description if empty")
    achievement_date = models.DateField(help_text="Date of the achievement")
    category = models.CharField(max_length=50, default='Achievement', help_text="Category (e.g., Achievement, Press Release, Award)")
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0, help_text="Order for display on website")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-achievement_date', 'title']
        verbose_name = 'Achievement'
        verbose_name_plural = 'Achievements'

    def __str__(self):
        return f"{self.title} ({self.achievement_date})"
    
    @property
    def formatted_date(self):
        """Return formatted date for display"""
        return self.achievement_date.strftime('%B %d, %Y')


class ContactSubmission(models.Model):
    SUBJECT_CHOICES = [
        ('admissions', 'Admissions Inquiry'),
        ('academics', 'Academic Programs'),
        ('student-services', 'Student Services'),
        ('faculty', 'Faculty & Staff'),
        ('general', 'General Information'),
        ('complaint', 'Complaint'),
        ('suggestion', 'Suggestion'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('replied', 'Replied'),
        ('closed', 'Closed'),
    ]

    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES)
    message = models.TextField()
    verification_token = models.CharField(max_length=64, unique=True, blank=True)
    is_verified = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Contact Submission'
        verbose_name_plural = 'Contact Submissions'

    def __str__(self):
        return f"{self.name} <{self.email}> ({self.subject})"


class EmailVerification(models.Model):
    email = models.EmailField()
    token = models.CharField(max_length=64, unique=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Email Verification'
        verbose_name_plural = 'Email Verifications'

    def __str__(self):
        return f"{self.email} ({'used' if self.is_used else 'new'})"


class Department(models.Model):
    """Model for academic departments and administrative offices"""
    
    DEPARTMENT_TYPES = [
        ('academic', 'Academic Department'),
        ('administrative', 'Administrative Office'),
    ]
    
    name = models.CharField(max_length=200, help_text="Department or office name")
    department_type = models.CharField(max_length=20, choices=DEPARTMENT_TYPES, default='academic')
    description = models.TextField(blank=True, help_text="Brief description of the department")
    
    # Contact Information
    office_location = models.CharField(max_length=200, blank=True, help_text="Office location/room")
    phone = models.CharField(max_length=20, blank=True, help_text="Phone number")
    email = models.EmailField(blank=True, help_text="Email address")
    
    # Head/Dean Information
    head_name = models.CharField(max_length=100, blank=True, help_text="Department head/dean name")
    head_title = models.CharField(max_length=100, blank=True, help_text="Title (Dean, Director, etc.)")
    
    # Display settings
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0, help_text="Order for display on website")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['department_type', 'display_order', 'name']
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
    
    def __str__(self):
        return self.name


class Personnel(models.Model):
    """Model for faculty and staff members"""
    
    POSITION_TYPES = [
        ('faculty', 'Faculty'),
        ('administrative', 'Administrative Staff'),
        ('support', 'Support Staff'),
    ]
    
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='personnel')
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True)
    position_type = models.CharField(max_length=20, choices=POSITION_TYPES, default='faculty')
    title = models.CharField(max_length=100, help_text="Job title or position")
    specialization = models.CharField(max_length=200, blank=True, help_text="Area of specialization or expertise")
    
    # Contact Information
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    office_location = models.CharField(max_length=100, blank=True)
    
    # Additional Information
    bio = models.TextField(blank=True, help_text="Brief biography or background")
    qualifications = models.TextField(blank=True, help_text="Educational qualifications")
    
    # Display settings
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['department', 'position_type', 'display_order', 'last_name', 'first_name']
        verbose_name = 'Personnel'
        verbose_name_plural = 'Personnel'
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.title}"
    
    @property
    def full_name(self):
        """Return full name"""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"
    
    @property
    def display_title(self):
        """Return formatted title with specialization"""
        if self.specialization:
            return f"{self.title} - {self.specialization}"
        return self.title