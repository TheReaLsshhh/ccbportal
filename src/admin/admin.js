import React, { useState, useEffect, useCallback } from 'react';
import './admin.css';
import apiService from '../services/api';
import AdminLogin from './login';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Removed unused success state
  
  // CRUD Alert states
  const [alerts, setAlerts] = useState([]);
  const [alertId, setAlertId] = useState(0);
  
  // Removed welcome message popup states

  // Viewport responsiveness
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data states
  const [academicPrograms, setAcademicPrograms] = useState([]);
  const [events, setEvents] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [personnel, setPersonnel] = useState([]);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [programsRes, eventsRes, achievementsRes, announcementsRes, departmentsRes, personnelRes] = await Promise.all([
        apiService.getAdminAcademicPrograms(),
        apiService.getAdminEvents(),
        apiService.getAdminAchievements(),
        apiService.getAdminAnnouncements(),
        apiService.getAdminDepartments(),
        apiService.getAdminPersonnel()
      ]);

      setAcademicPrograms(programsRes.programs || []);
      setEvents(eventsRes.events || []);
      setAchievements(achievementsRes.achievements || []);
      setAnnouncements(announcementsRes.announcements || []);
      setDepartments(departmentsRes.departments || []);
      setPersonnel(personnelRes.personnel || []);
      
      showAlert('info', 'Data Loaded', 'All data has been loaded successfully.');
    } catch (err) {
      showAlert('error', 'Data Load Failed', `Failed to load data: ${err.message}`);
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Load all data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  // Determine viewport size (mobile/tablet)
  useEffect(() => {
    const evaluateViewport = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
      setIsMobile(width <= 600);
      setIsTablet(width > 600 && width <= 1024);
    };

    evaluateViewport();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', evaluateViewport);
      return () => window.removeEventListener('resize', evaluateViewport);
    }
  }, []);

  // Close mobile menu when tab changes (user clicked a nav item)
  useEffect(() => {
    if (isMobile || isTablet) {
      setIsMobileMenuOpen(false);
    }
  }, [activeTab, isMobile, isTablet]);

  const checkAuthentication = async () => {
    try {
      // Check localStorage first
      const storedUser = localStorage.getItem('admin_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        setCheckingAuth(false);
        return;
      }

      // Check with server
      const response = await apiService.checkAuth();
      if (response.status === 'success' && response.authenticated) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('admin_user', JSON.stringify(response.user));
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_user');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
      localStorage.removeItem('admin_user');
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    showAlert('success', 'Welcome back!', `Welcome back, ${userData.username}!`);
  };

  // CRUD Alert functions
  const showAlert = (type, title, message, duration = 5000) => {
    const newAlert = {
      id: alertId,
      type,
      title,
      message,
      timestamp: new Date(),
      duration
    };
    
    setAlerts(prev => [...prev, newAlert]);
    setAlertId(prev => prev + 1);
    
    // Auto-remove alert after duration
    setTimeout(() => {
      removeAlert(newAlert.id);
    }, duration);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('admin_user');
      showAlert('info', 'Logged out', 'You have been successfully logged out.');
    }
  };


  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    setShowForm(true);
    showAlert('info', 'Create Mode', `Creating new ${activeTab.replace('-', ' ')}`);
  };

  const handleEdit = (item) => {
    console.log('Editing item:', item);
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
    showAlert('info', 'Edit Mode', `Editing ${activeTab.replace('-', ' ')}: ${item.title || item.name || item.full_name || 'Item'}`);
  };

  const handleDelete = async (item, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log(`Attempting to delete ${type} with ID:`, item.id);
      
      switch (type) {
        case 'academic-programs':
          await apiService.deleteAcademicProgram(item.id);
          setAcademicPrograms(prev => prev.filter(p => p.id !== item.id));
          break;
        case 'events':
          await apiService.deleteEvent(item.id);
          setEvents(prev => prev.filter(e => e.id !== item.id));
          break;
        case 'achievements':
          await apiService.deleteAchievement(item.id);
          setAchievements(prev => prev.filter(a => a.id !== item.id));
          break;
        case 'announcements':
          await apiService.deleteAnnouncement(item.id);
          setAnnouncements(prev => prev.filter(a => a.id !== item.id));
          break;
        // removed 'admissions-dates' case
        case 'departments':
          await apiService.deleteDepartment(item.id);
          setDepartments(prev => prev.filter(d => d.id !== item.id));
          break;
        case 'personnel':
          await apiService.deletePersonnel(item.id);
          setPersonnel(prev => prev.filter(p => p.id !== item.id));
          break;
        default:
          throw new Error(`Unknown type: ${type}`);
      }
      
      console.log(`Successfully deleted ${type}`);
      showAlert('success', 'Deleted Successfully', `${type.replace('-', ' ')} has been deleted successfully!`);
    } catch (err) {
      console.error(`Delete error for ${type}:`, err);
      showAlert('error', 'Delete Failed', `Failed to delete ${type.replace('-', ' ')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isEditing = !!editingItem;
      console.log('Form data being submitted:', formData);
      let result;

      switch (activeTab) {
        case 'academic-programs':
          // Prepare academic program data with proper formatting
          const programData = {
            ...formData,
            // Ensure numeric values are properly converted
            duration_years: Number(formData.duration_years) || 4,
            total_units: Number(formData.total_units) || 120,
            with_enhancements: Number(formData.with_enhancements) || 0,
            // Convert boolean values
            is_active: !!formData.is_active,
            display_order: Number(formData.display_order) || 0
          };
          
          if (isEditing) {
            result = await apiService.updateAcademicProgram(editingItem.id, programData);
            setAcademicPrograms(prev => prev.map(p => p.id === editingItem.id ? result.program : p));
          } else {
            result = await apiService.createAcademicProgram(programData);
            setAcademicPrograms(prev => [...prev, result.program]);
          }
          break;
        case 'events':
          // Prepare event data with proper date/time formatting
          const eventData = {
            ...formData,
            // Ensure date is in YYYY-MM-DD format
            event_date: formData.event_date || '',
            // Ensure time is in HH:MM format
            start_time: formData.start_time || '',
            end_time: formData.end_time || '',
            // Convert boolean values
            is_active: !!formData.is_active,
            display_order: Number(formData.display_order) || 0
          };
          
          if (isEditing) {
            result = await apiService.updateEvent(editingItem.id, eventData);
            setEvents(prev => prev.map(e => e.id === editingItem.id ? result.event : e));
          } else {
            result = await apiService.createEvent(eventData);
            setEvents(prev => [...prev, result.event]);
          }
          break;
        case 'achievements':
          // Prepare achievement data with proper date formatting
          const achievementData = {
            ...formData,
            // Ensure date is in YYYY-MM-DD format
            achievement_date: formData.achievement_date || '',
            // Convert boolean values
            is_active: !!formData.is_active,
            display_order: Number(formData.display_order) || 0
          };
          
          if (isEditing) {
            result = await apiService.updateAchievement(editingItem.id, achievementData);
            setAchievements(prev => prev.map(a => a.id === editingItem.id ? result.achievement : a));
          } else {
            result = await apiService.createAchievement(achievementData);
            setAchievements(prev => [...prev, result.achievement]);
          }
          break;
        case 'announcements':
          // Prepare announcement data with proper date formatting
          const announcementData = {
            ...formData,
            // Ensure date is in YYYY-MM-DD format
            date: formData.date || '',
            // Convert boolean values
            is_active: !!formData.is_active,
            display_order: Number(formData.display_order) || 0
          };
          
          console.log('Creating/updating announcement with data:', announcementData);
          if (isEditing) {
            result = await apiService.updateAnnouncement(editingItem.id, announcementData);
            setAnnouncements(prev => prev.map(a => a.id === editingItem.id ? result.announcement : a));
          } else {
            result = await apiService.createAnnouncement(announcementData);
            setAnnouncements(prev => [...prev, result.announcement]);
          }
          console.log('Announcement operation result:', result);
          break;
        // removed 'admissions-dates' case
        case 'departments': {
          // Prepare payload with sensible defaults and coercions
          const payload = {
            name: (formData.name || '').trim(),
            department_type: formData.department_type || 'academic',
            description: formData.description || '',
            office_location: formData.office_location || '',
            phone: formData.phone || '',
            email: formData.email || '',
            head_name: formData.head_name || '',
            head_title: formData.head_title || '',
            display_order: Number.isFinite(Number(formData.display_order)) ? Number(formData.display_order) : 0,
            is_active: !!formData.is_active,
          };

          if (!payload.name) {
            throw new Error('Name is required');
          }

          if (isEditing) {
            result = await apiService.updateDepartment(editingItem.id, payload);
            setDepartments(prev => prev.map(d => d.id === editingItem.id ? result.department : d));
          } else {
            result = await apiService.createDepartment(payload);
            setDepartments(prev => [...prev, result.department]);
          }
          break; }
        case 'personnel':
          // Prepare personnel data with proper formatting
          const personnelData = {
            ...formData,
            // Ensure department_id is a number
            department_id: Number(formData.department_id) || null,
            // Convert boolean values
            is_active: !!formData.is_active,
            display_order: Number(formData.display_order) || 0
          };
          
          if (isEditing) {
            result = await apiService.updatePersonnel(editingItem.id, personnelData);
            setPersonnel(prev => prev.map(p => p.id === editingItem.id ? result.personnel : p));
          } else {
            result = await apiService.createPersonnel(personnelData);
            setPersonnel(prev => [...prev, result.personnel]);
          }
          break;
        default:
          throw new Error(`Unknown active tab: ${activeTab}`);
      }

      showAlert('success', `${isEditing ? 'Updated' : 'Created'} Successfully`, `${activeTab.replace('-', ' ')} has been ${isEditing ? 'updated' : 'created'} successfully!`);
      // Refresh data from server to ensure the page reflects persisted values
      await loadAllData();

      setShowForm(false);
      setEditingItem(null);
      setFormData({});
    } catch (err) {
      showAlert('error', 'Save Failed', `Failed to save ${activeTab.replace('-', ' ')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <div className="table-header is-centered">
        <h3>Admin Dashboard</h3>
      </div>
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-graduation-cap"></i></div>
          <div className="stat-content">
            <h3>{academicPrograms.length}</h3>
            <p>Academic Programs</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-calendar-alt"></i></div>
          <div className="stat-content">
            <h3>{events.length}</h3>
            <p>Events</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-trophy"></i></div>
          <div className="stat-content">
            <h3>{achievements.length}</h3>
            <p>Achievements</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-bullhorn"></i></div>
          <div className="stat-content">
            <h3>{announcements.length}</h3>
            <p>Announcements</p>
          </div>
        </div>
        {/* Removed Admissions Dates stat card */}
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-building"></i></div>
          <div className="stat-content">
            <h3>{departments.length}</h3>
            <p>Departments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-users"></i></div>
          <div className="stat-content">
            <h3>{personnel.length}</h3>
            <p>Personnel</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataTable = (data, type) => {
    const isCompact = isMobile || isTablet;
    const titleText = type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

    const headers = getTableHeaders(type);

    const renderItemCard = (item) => {
      const values = getTableCells(item, type);
      return (
        <div key={item.id} className="data-card">
          <div className="data-card-body">
            {headers.map((label, idx) => (
              <div key={label} className="data-card-row">
                <div className="data-card-label">{label}</div>
                <div className="data-card-value">{values[idx]}</div>
              </div>
            ))}
          </div>
          <div className="data-card-actions">
            <button 
              className="btn btn-sm btn-secondary" 
              onClick={() => handleEdit(item)}
            >
              Edit
            </button>
            <button 
              className="btn btn-sm btn-danger" 
              onClick={() => handleDelete(item, type)}
            >
              Delete
            </button>
          </div>
        </div>
      );
    };

    return (
      <div className="data-table-container">
        <div className="table-header">
          <h3>{titleText}</h3>
          <button className="btn btn-primary" onClick={handleCreate}>
            <span className="btn-icon"><i className="fas fa-plus"></i></span>
            Add New
          </button>
        </div>

        {data.length === 0 ? (
          <div className="empty-state">
            <p>No {type.replace('-', ' ')} found. Click "Add New" to create one.</p>
          </div>
        ) : isCompact ? (
          <div className="card-list">
            {data.map(item => renderItemCard(item))}
          </div>
        ) : (
          <div className={`table-wrapper ${!isCompact && data.length > 4 ? 'is-scrollable' : ''}`}>
            <table className="data-table">
              <thead>
                <tr>
                  {headers.map(header => (
                    <th key={header}>{header}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.id}>
                    {getTableCells(item, type).map((cell, index) => (
                      <td key={index}>{cell}</td>
                    ))}
                    <td className="actions-cell">
                      <button 
                        className="btn btn-sm btn-secondary" 
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDelete(item, type)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const getTableHeaders = (type) => {
    switch (type) {
      case 'academic-programs':
        return ['Title', 'Short Title', 'Duration', 'Units', 'Status'];
      case 'events':
        return ['Title', 'Date', 'Time', 'Location', 'Status'];
      case 'achievements':
        return ['Title', 'Date', 'Category', 'Status'];
      case 'announcements':
        return ['Title', 'Date', 'Status'];
      // removed 'admissions-dates'
      case 'departments':
        return ['Name', 'Type', 'Head', 'Office', 'Status'];
      case 'personnel':
        return ['Name', 'Department', 'Title', 'Position Type', 'Status'];
      default:
        return [];
    }
  };

  const getTableCells = (item, type) => {
    switch (type) {
      case 'academic-programs':
        return [
          item.title || 'N/A',
          item.short_title || 'N/A',
          item.duration_years ?? 'N/A',
          item.total_units ?? 'N/A',
          item.is_active ? 'Active' : 'Inactive'
        ];
      case 'events':
        return [
          item.title || 'N/A',
          item.event_date || 'N/A',
          `${item.start_time || 'N/A'} - ${item.end_time || 'N/A'}`,
          item.location || 'TBA',
          item.is_active ? 'Active' : 'Inactive'
        ];
      case 'achievements':
        return [
          item.title || 'N/A',
          item.achievement_date || 'N/A',
          item.category || 'N/A',
          item.is_active ? 'Active' : 'Inactive'
        ];
      case 'announcements':
        return [
          item.title || 'N/A',
          item.date || 'N/A',
          item.is_active ? 'Active' : 'Inactive'
        ];
      // removed 'admissions-dates'
      case 'departments':
        return [
          item.name || 'N/A',
          item.department_type === 'academic' ? 'Academic' : 'Administrative',
          item.head_name || 'N/A',
          item.office_location || 'N/A',
          item.is_active ? 'Active' : 'Inactive'
        ];
      case 'personnel':
        return [
          item.full_name || 'N/A',
          item.department_name || 'N/A',
          item.title || 'N/A',
          item.position_type === 'faculty' ? 'Faculty' : 
            item.position_type === 'administrative' ? 'Administrative' : 'Support',
          item.is_active ? 'Active' : 'Inactive'
        ];
      default:
        return [];
    }
  };

  const renderForm = () => {
    if (!showForm) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>{editingItem ? 'Edit' : 'Create'} {activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
            <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
          </div>
          <form onSubmit={handleSubmit} className="admin-form">
            {renderFormFields()}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderTopNav = () => {
    const navItems = [
      { key: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie' },
      { key: 'academic-programs', label: 'Academic Programs', icon: 'fas fa-graduation-cap' },
      { key: 'events', label: 'Events', icon: 'fas fa-calendar-alt' },
      { key: 'achievements', label: 'Achievements', icon: 'fas fa-trophy' },
      { key: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn' },
      { key: 'departments', label: 'Departments', icon: 'fas fa-building' },
      { key: 'personnel', label: 'Personnel', icon: 'fas fa-users' }
    ];

    return (
      <div className="content-top-nav">
        <nav className="top-nav" role="navigation" aria-label="Admin navigation">
          {navItems.map(item => (
            <button 
              key={item.key}
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
              aria-current={activeTab === item.key ? 'page' : undefined}
              title={item.label}
            >
              <span className="nav-icon" aria-hidden="true">
                <i className={item.icon}></i>
                <span className="icon-fallback" style={{ display: 'none' }}>{item.fallback}</span>
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'academic-programs':
        return (
          <>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Short Title *</label>
              <input
                type="text"
                name="short_title"
                value={formData.short_title || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Program Type *</label>
              <select
                name="program_type"
                value={formData.program_type || 'BS'}
                onChange={handleInputChange}
                required
              >
                <option value="BS">Bachelor of Science</option>
                <option value="BA">Bachelor of Arts</option>
                <option value="MA">Master of Arts</option>
                <option value="MS">Master of Science</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                required
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Duration (Years) *</label>
                <input
                  type="number"
                  name="duration_years"
                  value={formData.duration_years || 4}
                  onChange={handleInputChange}
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Total Units *</label>
                <input
                  type="number"
                  name="total_units"
                  value={formData.total_units || 120}
                  onChange={handleInputChange}
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Enhancements</label>
                <input
                  type="number"
                  name="with_enhancements"
                  value={formData.with_enhancements || 0}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Program Overview</label>
              <textarea
                name="program_overview"
                value={formData.program_overview || ''}
                onChange={handleInputChange}
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Core Courses (one per line)</label>
              <textarea
                name="core_courses"
                value={formData.core_courses || ''}
                onChange={handleInputChange}
                rows="6"
                placeholder="Enter each course on a new line"
              />
            </div>
            <div className="form-group">
              <label>Career Prospects</label>
              <textarea
                name="career_prospects"
                value={formData.career_prospects || ''}
                onChange={handleInputChange}
                rows="4"
              />
            </div>
            <div className="form-row-inline">
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order || 0}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active || false}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
            </div>
          </>
        );
      case 'events':
        return (
          <>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                required
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Details</label>
              <textarea
                name="details"
                value={formData.details || ''}
                onChange={handleInputChange}
                rows="4"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Event Date *</label>
                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Time *</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Time *</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-row-inline">
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order || 0}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active || false}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
            </div>
          </>
        );
      case 'achievements':
        return (
          <>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                required
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Details</label>
              <textarea
                name="details"
                value={formData.details || ''}
                onChange={handleInputChange}
                rows="4"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Achievement Date *</label>
                <input
                  type="date"
                  name="achievement_date"
                  value={formData.achievement_date || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category || 'Achievement'}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row-inline">
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order || 0}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active || false}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
            </div>
          </>
        );
      case 'announcements':
        return (
          <>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Body *</label>
              <textarea
                name="body"
                value={formData.body || ''}
                onChange={handleInputChange}
                required
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Details</label>
              <textarea
                name="details"
                value={formData.details || ''}
                onChange={handleInputChange}
                rows="4"
              />
            </div>
            <div className="form-row-inline">
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order || 0}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active || false}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
            </div>
          </>
        );
      case 'admissions-dates':
        return (
          <>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row-inline">
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order || 0}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active || false}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
            </div>
          </>
        );
      case 'departments':
        return (
          <>
            <div className="form-group">
              <label>Department Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Department Type *</label>
              <select
                name="department_type"
                value={formData.department_type || 'academic'}
                onChange={handleInputChange}
                required
              >
                <option value="academic">Academic Department</option>
                <option value="administrative">Administrative Office</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Office Location</label>
              <input
                type="text"
                name="office_location"
                value={formData.office_location || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Head Name</label>
                <input
                  type="text"
                  name="head_name"
                  value={formData.head_name || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Head Title</label>
                <input
                  type="text"
                  name="head_title"
                  value={formData.head_title || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row-inline">
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order || 0}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active || false}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
            </div>
          </>
        );
      case 'personnel':
        return (
          <>
            <div className="form-group">
              <label>Department *</label>
              <select
                name="department_id"
                value={formData.department_id || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Position Type *</label>
              <select
                name="position_type"
                value={formData.position_type || 'faculty'}
                onChange={handleInputChange}
                required
              >
                <option value="faculty">Faculty</option>
                <option value="administrative">Administrative Staff</option>
                <option value="support">Support Staff</option>
              </select>
            </div>
            <div className="form-group">
              <label>Title/Position *</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Office Location</label>
                <input
                  type="text"
                  name="office_location"
                  value={formData.office_location || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Qualifications</label>
              <textarea
                name="qualifications"
                value={formData.qualifications || ''}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            <div className="form-row-inline">
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order || 0}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active || false}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // Removed welcome message component

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="admin-page">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div className="header-content">
            <div className="header-text">
              <h1>CCB Portal Administration</h1>
              <p>Manage your website content</p>
            </div>
            <div className="header-actions">
            {(isMobile || isTablet) && false && (
                <button
                  className={`btn btn-secondary btn-sm mobile-menu-button`}
                  onClick={() => setIsMobileMenuOpen(prev => !prev)}
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  <span className="btn-icon"><i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i></span>
                  Menu
                </button>
              )}
              {user && (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <span className="btn-icon"><i className="fas fa-sign-out-alt"></i></span>
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Removed success alert since setSuccess is no longer used */}

        {/* CRUD Alert Container */}
        <div className="alert-container">
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`alert-popup alert-${alert.type}`}
              onClick={() => removeAlert(alert.id)}
            >
              <div className="alert-content">
                <div className="alert-icon">
                  {alert.type === 'success' && <i className="fas fa-check-circle"></i>}
                  {alert.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                  {alert.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                  {alert.type === 'info' && <i className="fas fa-info-circle"></i>}
                </div>
                <div className="alert-body">
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-message">{alert.message}</div>
                </div>
                <button 
                  className="alert-close" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAlert(alert.id);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="alert-progress">
                <div className="alert-progress-bar"></div>
              </div>
            </div>
          ))}
          
          {alerts.length > 0 && (
            <button 
              className="alert-clear-all" 
              onClick={clearAllAlerts}
              title="Clear all alerts"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          )}
        </div>

        {renderTopNav()}

        <div className={`admin-layout ${isMobile || isTablet ? 'is-compact' : ''}`}>

          <div className="admin-content">
            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
            )}

            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'academic-programs' && renderDataTable(academicPrograms, 'academic-programs')}
            {activeTab === 'events' && renderDataTable(events, 'events')}
            {activeTab === 'achievements' && renderDataTable(achievements, 'achievements')}
            {activeTab === 'announcements' && renderDataTable(announcements, 'announcements')}
            {activeTab === 'departments' && renderDataTable(departments, 'departments')}
            {activeTab === 'personnel' && renderDataTable(personnel, 'personnel')}
          </div>
        </div>

        {renderForm()}
      </div>
    </div>
  );
};

export default AdminPage;
