// API service for communicating with Django backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ccbeacademyportal-backend.onrender.com/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
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

    // Admin: Announcements CRUD
    async createAnnouncement(payload) {
        return this.makeRequest('/admin/announcements/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateAnnouncement(announcementId, payload) {
        return this.makeRequest(`/admin/announcements/${announcementId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
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

    // Get admissions important dates
    async getAdmissionsImportantDates() {
        return this.makeRequest('/admissions-important-dates/');
    }

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

    // Admin: Get all admissions important dates (including inactive)
    async getAdminAdmissionsImportantDates() {
        return this.makeRequest('/admin/admissions-important-dates/');
    }

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
    async createEvent(payload) {
        return this.makeRequest('/admin/events/create/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateEvent(eventId, payload) {
        return this.makeRequest(`/admin/events/${eventId}/`, {
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
            body: JSON.stringify(payload),
        });
    }

    async updateAchievement(achievementId, payload) {
        return this.makeRequest(`/admin/achievements/${achievementId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async deleteAchievement(achievementId) {
        return this.makeRequest(`/admin/achievements/${achievementId}/delete/`, {
            method: 'DELETE',
        });
    }

    // Admin: Admissions Important Dates CRUD
    async createAdmissionsImportantDate(payload) {
        return this.makeRequest('/admin/admissions-important-dates/create/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateAdmissionsImportantDate(dateId, payload) {
        return this.makeRequest(`/admin/admissions-important-dates/${dateId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async deleteAdmissionsImportantDate(dateId) {
        return this.makeRequest(`/admin/admissions-important-dates/${dateId}/delete/`, {
            method: 'DELETE',
        });
    }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService; 