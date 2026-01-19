# City College of Bayawan (CCB) Web Portal

A comprehensive web application for the City College of Bayawan featuring a modern React frontend and Django backend. This portal serves as the official digital presence for the college, providing information about academic programs, admissions, faculty, news, and administrative services.

## 🏛️ About City College of Bayawan

City College of Bayawan opened its doors on **June 30, 2025**, marking a new chapter in Bayawan's educational journey. The college is committed to providing quality education and empowering youth to become future leaders, with the motto: **"Honus et Excellentia Ad Summum Bonum"** (Honor and Excellence for the Highest Good).

## 🚀 Key Features

### Public Features
- **🏠 Homepage**: Dynamic landing page with video background, mayor's welcome message, and latest news carousel
- **📚 Academic Programs**: Comprehensive program listings with detailed information about courses, requirements, and career prospects
- **🎓 Admissions**: Complete admission process information, requirements, and application steps
- **👥 Faculty & Staff**: Directory of faculty and staff organized by departments with contact information
- **📰 News & Events**: Dynamic content management for announcements, school events, and achievements
- **📄 Downloads**: Access to forms, documents, academic calendar, and student resources
- **📞 Contact Us**: Email verification-based contact form system
- **🔍 Search**: Site-wide search functionality across all content

### Administrative Features
- **🔐 Admin Panel**: Secure authentication system for content management
- **📝 Content Management**: Full CRUD operations for all content types
- **📊 Dashboard**: Overview of all college content and activities
- **👤 User Management**: Role-based access control for administrators

## 🛠️ Technology Stack

### Frontend
- **React.js 18.2.0** - Modern UI framework with hooks
- **React Router DOM 7.8.2** - Client-side routing
- **CSS3** - Responsive design with modern styling
- **JavaScript ES6+** - Interactive functionality and API integration

### Backend
- **Django 5.2.5** - Python web framework
- **Django REST Framework** - API development and serialization
- **MySQL** - Database management via XAMPP
- **Django CORS Headers** - Cross-origin resource sharing
- **Django Anymail** - Email service integration
- **Gunicorn** - WSGI HTTP server for production

### Database & Development Environment
- **XAMPP** - Local development environment with MySQL database
- **MySQL Connector Python** - Database connectivity
- **phpMyAdmin** - Database administration interface (via XAMPP)

### Additional Tools
- **Whitenoise** - Static file serving
- **Poetry** - Dependency management

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **Python** (v3.8 or higher)
- **pip** (Python package manager)
- **npm** (Node package manager)
- **XAMPP** (v8.0 or higher) - For MySQL database and phpMyAdmin

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ccbweb-main
```

### 2. XAMPP Setup
```bash
# Start XAMPP Control Panel
# Start Apache and MySQL services
# Access phpMyAdmin at: http://localhost/phpmyadmin
# Create a new database for the project (e.g., 'ccb_portal')
```

### 3. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure database settings in ccb_portal_backend/settings.py
# Update DATABASES configuration to use MySQL:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.mysql',
#         'NAME': 'ccb_portal',
#         'USER': 'root',
#         'PASSWORD': '',
#         'HOST': 'localhost',
#         'PORT': '3306',
#     }
# }

# Run migrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser

# Start Django server (default port 8000)
python manage.py runserver

# Or start Django on a custom port
python manage.py runserver 8080
```

### 4. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm start
```

### 5. Start Both Servers Together (Recommended)
```bash
# Start both Django and React servers with default port (8000)
python start_development.py

# Start with a custom Django port
python start_development.py --port 8080
# or short form:
python start_development.py -p 8080

# Or use environment variable
# Windows PowerShell:
$env:DJANGO_PORT="8080"; python start_development.py
# Windows CMD:
set DJANGO_PORT=8080 && python start_development.py
# Linux/Mac:
export DJANGO_PORT=8080 && python start_development.py
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000 (default, or your custom port)
- **Admin Panel**: http://localhost:8000/admin (default, or your custom port)
- **phpMyAdmin**: http://localhost/phpmyadmin

**Note**: The Django backend port is configurable. Check the startup script output to see which port is being used. The port number will be displayed when you start the servers.

## 📁 Project Structure

```
ccbweb-main/
├── src/                           # React frontend source code
│   ├── components/                # Reusable React components
│   │   ├── Navbar.js             # Main navigation component
│   │   ├── Navbar.css            # Navigation styling
│   │   ├── footer.js             # Footer component
│   │   └── ScrollToTop.js        # Scroll to top functionality
│   ├── services/                 # API service functions
│   │   └── api.js                # Centralized API service
│   ├── admin/                    # Admin panel components
│   │   ├── admin.js              # Admin dashboard
│   │   ├── admin.css             # Admin styling
│   │   ├── login.js              # Admin login
│   │   └── login.css             # Login styling
│   ├── *.js                      # Page components
│   └── *.css                     # Component-specific styles
├── portal/                       # Django app for portal functionality
│   ├── models.py                 # Database models
│   ├── views.py                  # API views and business logic
│   ├── urls.py                   # URL routing
│   ├── admin.py                  # Django admin configuration
│   └── migrations/               # Database migrations
├── ccb_portal_backend/           # Django project settings
│   ├── settings.py              # Project configuration
│   ├── urls.py                  # Main URL routing
│   └── wsgi.py                  # WSGI configuration
├── static/                      # Static files
├── templates/                   # Django templates
├── public/                      # Public assets
│   └── images/                  # Images and media files
├── migrations/                  # Database migrations
├── requirements.txt             # Python dependencies
├── package.json                 # Node.js dependencies
└── manage.py                    # Django management script
```

## 🗄️ Database Models

### Core Models
- **AcademicProgram**: Program information, courses, requirements, and career prospects
- **ProgramSpecialization**: Program specializations and tracks
- **Announcement**: College announcements and news
- **Event**: School events and activities with date/time information
- **Achievement**: Achievements, awards, and press releases
- **Department**: Academic and administrative departments
- **Personnel**: Faculty and staff information with department associations
- **ContactSubmission**: Contact form submissions with email verification
- **EmailVerification**: Email verification tokens and status

### Model Features
- **Soft Deletes**: `is_active` fields for content management
- **Display Ordering**: Custom ordering for content presentation
- **Rich Text Support**: Detailed descriptions and content
- **Audit Trails**: Created/updated timestamps
- **Email Integration**: Built-in email verification system

## 🔌 API Endpoints

### Public Endpoints
- `GET /api/academic-programs/` - List all active academic programs
- `GET /api/academic-programs/{id}/` - Get specific program details
- `GET /api/announcements/` - List active announcements
- `GET /api/events/` - List active events
- `GET /api/achievements/` - List active achievements
- `GET /api/departments/` - List departments with personnel
- `GET /api/personnel/` - List all personnel
- `GET /api/admissions-info/` - Admission requirements and process
- `GET /api/downloads/` - Available downloads and documents
- `POST /api/contact-form/` - Submit contact form with email verification

### Admin Endpoints (Authentication Required)
- `POST /api/admin/login/` - Admin authentication
- `GET /api/admin/auth-check/` - Check authentication status
- `POST /api/admin/logout/` - Admin logout

#### Admin CRUD Operations
- **Academic Programs**: Create, Read, Update, Delete
- **Announcements**: Create, Read, Update, Delete
- **Events**: Create, Read, Update, Delete
- **Achievements**: Create, Read, Update, Delete
- **Departments**: Create, Read, Update, Delete
- **Personnel**: Create, Read, Update, Delete

## 🎨 Frontend Architecture

### Component Structure
- **App.js**: Main application with routing configuration
- **HomePage.js**: Dynamic homepage with video background and news carousel
- **Navbar.js**: Responsive navigation with search functionality
- **Admin Components**: Complete admin interface for content management

### Key Features
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dynamic Content**: Real-time data fetching from Django API
- **Search Functionality**: Site-wide search across all content
- **Carousel System**: Automated news and announcements display
- **Email Verification**: Integrated contact form verification system

### API Service
- **Centralized API Management**: Single service class for all API calls
- **Error Handling**: Comprehensive error management and user feedback
- **Authentication**: Session-based authentication for admin features
- **Request/Response Interceptors**: Automatic error handling and status management

## 🔧 Development

### Running Tests
```bash
# Backend tests
python manage.py test

# Frontend tests
npm test
```

### Building for Production
```bash
# Build React app
npm run build

# Collect static files
python manage.py collectstatic
```

### Development Scripts
```bash
# Start development environment
python start_development.py

# Individual services
npm start          # Frontend development server
python manage.py runserver  # Backend development server
```

## 🔐 Security Features

- **Email Verification**: All contact submissions require email verification
- **CSRF Protection**: Django CSRF tokens for form submissions
- **Authentication Required**: Admin endpoints require proper authentication
- **Permission-Based Access**: Role-based permissions for different admin functions
- **Input Validation**: Server-side validation for all user inputs
- **SQL Injection Protection**: Django ORM prevents SQL injection attacks

## 📧 Email Integration

The application includes a comprehensive email system:
- **Contact Form Verification**: Users must verify their email before submission
- **Admin Notifications**: Administrators receive contact form submissions
- **Email Templates**: Professional email templates for verification
- **SMTP Configuration**: Configurable email backend (Brevo/Anymail)

## 🌐 Deployment Considerations

### Environment Variables
- `PUBLIC_BASE_URL`: Base URL for email verification links
- `FRONTEND_BASE_URL`: Frontend application URL
- `CONTACT_INBOX`: Email address for contact form submissions
- `DEFAULT_FROM_EMAIL`: Default sender email address
- `OPENAI_API_KEY`: API key for the chatbot AI fallback
- `OPENAI_CHAT_MODEL`: Optional model override for chatbot (default: `gpt-4o-mini`)

### Database Options
- **MySQL via XAMPP**: Current development setup
- **MySQL**: Production database option
- **PostgreSQL**: Alternative production database
- **SQLite**: Fallback for simple deployments

### Static Files
- **Whitenoise**: Handles static file serving in production
- **CDN Ready**: Static files can be served from CDN
- **Media Files**: Image and document uploads supported

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**City College of Bayawan** - Empowering students through technology and business education.

*"Ibayaw ang Bayawan! Kita ang Bayawan!"* - Mayor John T. Raymond Jr.
