// API service for communicating with Django backend

const API_BASE_URL = '/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const isFormData = options.body instanceof FormData;
        const headers = isFormData
            ? { ...(options.headers || {}) } // let browser set Content-Type for FormData
            : { 'Content-Type': 'application/json', ...(options.headers || {}) };

        const config = {
            headers,
            credentials: 'include', // Include cookies for authentication
            ...options,
        };

        try {
            const response = await fetch(url, config);

            // Try to parse JSON even on error responses to surface backend messages
            let data = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try { data = await response.json(); } catch (_) { /* ignore */ }
            }

            if (!response.ok) {
                const message = (data && (data.message || data.detail || data.error)) || `HTTP error! status: ${response.status}`;
                const err = new Error(message);
                err.status = response.status;
                err.data = data;
                throw err;
            }

            // Successful
            if (data !== null) return data;
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Test API connection
    async testConnection() {
        return this.makeRequest('/test/');
    }

    // Get academic programs
    async getAcademicPrograms() {
        return this.makeRequest('/academic-programs/');
    }

    // Get news and events
    async getNewsEvents() {
        return this.makeRequest('/news-events/');
    }

    // Get announcements
    async getAnnouncements() {
        return this.makeRequest('/announcements/');
    }

    // Get events
    async getEvents() {
        return this.makeRequest('/events/');
    }

    // Get achievements
    async getAchievements() {
        return this.makeRequest('/achievements/');
    }

    // Get news
    async getNews() {
        return this.makeRequest('/news/');
    }

    // Dynamic search across all content
    async search(query) {
        return this.makeRequest(`/search/?q=${encodeURIComponent(query)}`);
    }

    // Admin: Announcements CRUD
    async createAnnouncement(payload) {
        console.log('API: Creating announcement with payload:', payload);
        return this.makeRequest('/admin/announcements/create/', {
            method: 'POST',
            body: payload instanceof FormData ? payload : JSON.stringify(payload),
        });
    }

    async updateAnnouncement(announcementId, payload) {
        return this.makeRequest(`/admin/announcements/${announcementId}/`, {
            method: 'PUT',
            body: payload instanceof FormData ? payload : JSON.stringify(payload),
        });
    }

    async deleteAnnouncement(announcementId) {
        return this.makeRequest(`/admin/announcements/${announcementId}/delete/`, {
            method: 'DELETE',
        });
    }

    // Get admissions information
    async getAdmissionsInfo() {
        return this.makeRequest('/admissions-info/');
    }

    // Admin: Admission Requirements CRUD
    async getAdminAdmissionRequirements() {
        return this.makeRequest('/admin/admission-requirements/');
    }

    async createAdmissionRequirement(payload) {
        return this.makeRequest('/admin/admission-requirements/create/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateAdmissionRequirement(requirementId, payload) {
        return this.makeRequest(`/admin/admission-requirements/${requirementId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async deleteAdmissionRequirement(requirementId) {
        return this.makeRequest(`/admin/admission-requirements/${requirementId}/delete/`, {
            method: 'DELETE',
        });
    }

    // Admin: Enrollment Process Steps CRUD
    async getAdminEnrollmentSteps() {
        return this.makeRequest('/admin/enrollment-steps/');
    }

    async createEnrollmentStep(payload) {
        return this.makeRequest('/admin/enrollment-steps/create/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateEnrollmentStep(stepId, payload) {
        return this.makeRequest(`/admin/enrollment-steps/${stepId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async deleteEnrollmentStep(stepId) {
        return this.makeRequest(`/admin/enrollment-steps/${stepId}/delete/`, {
            method: 'DELETE',
        });
    }

    // Admin: Admission Notes CRUD
    async getAdminAdmissionNotes() {
        return this.makeRequest('/admin/admission-notes/');
    }

    async createAdmissionNote(payload) {
        return this.makeRequest('/admin/admission-notes/create/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateAdmissionNote(noteId, payload) {
        return this.makeRequest(`/admin/admission-notes/${noteId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async deleteAdmissionNote(noteId) {
        return this.makeRequest(`/admin/admission-notes/${noteId}/delete/`, {
            method: 'DELETE',
        });
    }

    // Removed admissions important dates public API

    // Get downloads
    async getDownloads() {
        return this.makeRequest('/downloads/');
    }

    // Submit contact form
    async submitContactForm(formData) {
        return this.makeRequest('/contact-form/', {
            method: 'POST',
            body: JSON.stringify(formData),
        });
    }

    // Admin login
    async login(username, password) {
        return this.makeRequest('/admin/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    }

    // Admin authentication check
    async checkAuth() {
        return this.makeRequest('/admin/auth-check/');
    }

    // Admin logout
    async logout() {
        return this.makeRequest('/admin/logout/', {
            method: 'POST',
        });
    }

    // Admin: Get all academic programs (including inactive)
    async getAdminAcademicPrograms() {
        return this.makeRequest('/admin/academic-programs/');
    }

    // Admin: Get all events (including inactive)
    async getAdminEvents() {
        return this.makeRequest('/admin/events/');
    }

    // Admin: Get all achievements (including inactive)
    async getAdminAchievements() {
        return this.makeRequest('/admin/achievements/');
    }

    // Admin: Get all announcements (including inactive)
    async getAdminAnnouncements() {
        return this.makeRequest('/admin/announcements/');
    }

    // Admin: Get all news (including inactive)
    async getAdminNews() {
        return this.makeRequest('/admin/news/');
    }

    // Removed admissions important dates functionality

    // Admin: Academic Programs CRUD
    async createAcademicProgram(payload) {
        return this.makeRequest('/admin/academic-programs/create/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateAcademicProgram(programId, payload) {
        return this.makeRequest(`/admin/academic-programs/${programId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async deleteAcademicProgram(programId) {
        return this.makeRequest(`/admin/academic-programs/${programId}/delete/`, {
            method: 'DELETE',
        });
    }

    // Admin: Events CRUD
    async createEvent(formData) {
        // Use FormData for file uploads (supports image uploads)
        const url = `${this.baseURL}/admin/events/create/`;
        const config = {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateEvent(eventId, formData) {
        // Use FormData for file uploads (supports image uploads)
        const url = `${this.baseURL}/admin/events/${eventId}/`;
        const config = {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async deleteEvent(eventId) {
        return this.makeRequest(`/admin/events/${eventId}/delete/`, {
            method: 'DELETE',
        });
    }

    // Admin: Achievements CRUD
    async createAchievement(payload) {
        return this.makeRequest('/admin/achievements/create/', {
            method: 'POST',
            body: payload instanceof FormData ? payload : JSON.stringify(payload),
        });
    }

    async updateAchievement(achievementId, payload) {
        return this.makeRequest(`/admin/achievements/${achievementId}/`, {
            method: 'PUT',
            body: payload instanceof FormData ? payload : JSON.stringify(payload),
        });
    }

    async deleteAchievement(achievementId) {
        return this.makeRequest(`/admin/achievements/${achievementId}/delete/`, {
            method: 'DELETE',
        });
    }

    // Removed admissions important dates CRUD functionality

    // Get departments
    async getDepartments() {
        return this.makeRequest('/departments/');
    }

    // Get personnel
    async getPersonnel() {
        return this.makeRequest('/personnel/');
    }

    // Admin: Departments CRUD
    async getAdminDepartments() {
        return this.makeRequest('/admin/departments/');
    }

    async createDepartment(payload) {
        return this.makeRequest('/admin/departments/create/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateDepartment(departmentId, payload) {
        return this.makeRequest(`/admin/departments/${departmentId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async deleteDepartment(departmentId) {
        return this.makeRequest(`/admin/departments/${departmentId}/delete/`, {
            method: 'DELETE',
        });
    }

    // Admin: Personnel CRUD
    async getAdminPersonnel() {
        return this.makeRequest('/admin/personnel/');
    }

    async createPersonnel(payload) {
        return this.makeRequest('/admin/personnel/create/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updatePersonnel(personnelId, payload) {
        return this.makeRequest(`/admin/personnel/${personnelId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async deletePersonnel(personnelId) {
        return this.makeRequest(`/admin/personnel/${personnelId}/delete/`, {
            method: 'DELETE',
        });
    }

    // Admin: News CRUD
    async createNews(formData) {
        // Use FormData for file uploads
        const url = `${this.baseURL}/admin/news/create/`;
        const config = {
            method: 'POST',
            body: formData,
            credentials: 'include',
            // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
        };

        try {
            const response = await fetch(url, config);
            let data = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try { data = await response.json(); } catch (_) { /* ignore */ }
            }

            if (!response.ok) {
                const message = (data && (data.message || data.detail || data.error)) || `HTTP error! status: ${response.status}`;
                const err = new Error(message);
                err.status = response.status;
                err.data = data;
                throw err;
            }

            return data || await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async updateNews(newsId, formData) {
        // Use FormData for file uploads
        const url = `${this.baseURL}/admin/news/${newsId}/`;
        const config = {
            method: 'PUT',
            body: formData,
            credentials: 'include',
            // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
        };

        try {
            const response = await fetch(url, config);
            let data = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try { data = await response.json(); } catch (_) { /* ignore */ }
            }

            if (!response.ok) {
                const message = (data && (data.message || data.detail || data.error)) || `HTTP error! status: ${response.status}`;
                const err = new Error(message);
                err.status = response.status;
                err.data = data;
                throw err;
            }

            return data || await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async deleteNews(newsId) {
        return this.makeRequest(`/admin/news/${newsId}/delete/`, {
            method: 'DELETE',
        });
    }

    // Get institutional information (public)
    async getInstitutionalInfo() {
        return this.makeRequest('/institutional-info/');
    }

    // Admin: Get institutional information
    async getAdminInstitutionalInfo() {
        return this.makeRequest('/admin/institutional-info/');
    }

    // Admin: Update institutional information
    async updateInstitutionalInfo(payload) {
        return this.makeRequest('/admin/institutional-info/update/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService; 