import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    
    // Don't add auth headers for public endpoints
    const publicEndpoints = ['/auth/register/', '/auth/login/', '/auth/token/refresh/'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('[API] Request:', {
      url: config.url,
      hasToken: !!token,
      isPublic: isPublicEndpoint,
      willAddAuth: !!token && !isPublicEndpoint
    });
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.log('[API] Response error:', {
      status: error.response?.status,
      url: originalRequest?.url,
      retry: originalRequest?._retry
    });
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      console.log('[API] Attempting token refresh, has refresh token:', !!refreshToken);
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
          const newToken = response.data.access;
          console.log('[API] Token refreshed successfully');
          localStorage.setItem('access_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.log('[API] Token refresh failed, clearing auth');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Redirect to login only if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        console.log('[API] No refresh token available, redirecting to login');
        // Redirect to login only if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: { username: string; password: string }) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/', { refresh: localStorage.getItem('refresh_token') }),
  register: (userData: any) => api.post('/auth/register/', userData),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data: any) => api.patch('/auth/profile/', data),
};

export const coreAPI = {
  users: {
    list: (params?: any) => api.get('/core/users/', { params }),
    create: (data: any) => api.post('/core/users/', data),
    retrieve: (id: number) => api.get(`/core/users/${id}/`),
    update: (id: number, data: any) => api.patch(`/core/users/${id}/`, data),
    delete: (id: number) => api.delete(`/core/users/${id}/`),
  },
  schools: {
    list: () => api.get('/core/schools/'),
    create: (data: any) => api.post('/core/schools/', data),
    retrieve: (id: number) => api.get(`/core/schools/${id}/`),
    update: (id: number, data: any) => api.patch(`/core/schools/${id}/`, data),
  },
  classes: {
    list: () => api.get('/core/classes/'),
    create: (data: any) => api.post('/core/classes/', data),  
    retrieve: (id: number) => api.get(`/core/classes/${id}/`),
    update: (id: number, data: any) => api.patch(`/core/classes/${id}/`, data),
  },
  sections: {
    list: () => api.get('/core/sections/'),
    create: (data: any) => api.post('/core/sections/', data),
  },
  subjects: {
    list: () => api.get('/core/subjects/'),
    create: (data: any) => api.post('/core/subjects/', data),
  },
  dashboard: () => api.get('/core/dashboard/'),
};

export const academicAPI = {
  examTypes: {
    list: () => api.get('/academic/exam-types/'),
    create: (data: any) => api.post('/academic/exam-types/', data),
  },
  exams: {
    list: (params?: any) => api.get('/academic/exams/', { params }),
    create: (data: any) => api.post('/academic/exams/', data),
    retrieve: (id: number) => api.get(`/academic/exams/${id}/`),
    update: (id: number, data: any) => api.patch(`/academic/exams/${id}/`, data),
  },
  marks: {
    list: (params?: any) => api.get('/academic/marks/', { params }),
    create: (data: any) => api.post('/academic/marks/', data),
    studentPerformance: (studentId: number) => api.get(`/academic/marks/student_performance/?student_id=${studentId}`),
  },
  academicYears: {
    list: () => api.get('/academic/academic-years/'),
    create: (data: any) => api.post('/academic/academic-years/', data),
  },
  classSubjects: {
    list: () => api.get('/academic/class-subjects/'),
    create: (data: any) => api.post('/academic/class-subjects/', data),
  },
  getClasses: () => api.get('/academic/classes/'),
  getSubjects: () => api.get('/academic/subjects/'),
  getAcademicYears: () => api.get('/academic/academic-years/'),
  getSessions: () => api.get('/academic/sessions/'),
  getGradingSchemes: () => api.get('/academic/grading-schemes/'),
};

export const assignmentAPI = {
  assignments: {
    list: (params?: any) => api.get('/assignments/assignments/', { params }),
    create: (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return api.post('/assignments/assignments/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    retrieve: (id: number) => api.get(`/assignments/assignments/${id}/`),
    update: (id: number, data: any) => api.patch(`/assignments/assignments/${id}/`, data),
    uploadResource: (id: number, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/assignments/assignments/${id}/upload_resource/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    submissions: (id: number) => api.get(`/assignments/assignments/${id}/submissions/`),
    statistics: (id: number) => api.get(`/assignments/assignments/${id}/statistics/`),
  },
  submissions: {
    list: (params?: any) => api.get('/assignments/submissions/', { params }),
    create: (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return api.post('/assignments/submissions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    grade: (id: number, data: any) => api.post(`/assignments/submissions/${id}/grade/`, data),
  },
};

export const attendanceAPI = {
  records: {
    list: (params?: any) => api.get('/attendance/', { params }),  // Updated from /attendance/records/
    create: (data: any) => api.post('/attendance/', data),
    bulkMark: (data: any) => api.post('/attendance/bulk_mark/', data),  // Corrected endpoint
    statistics: (studentId: number, params?: any) =>
      api.get(`/attendance/statistics/?student_id=${studentId}`, { params }),
    classReport: (params: any) => api.get('/attendance/class_report/', { params }),  // Corrected endpoint
  },
  statuses: {
    list: () => api.get('/attendance/statuses/'),
  },
};

export const resourceAPI = {
  resources: {
    list: (params?: any) => api.get('/resources/resources/', { params }),
    create: (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return api.post('/resources/resources/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    retrieve: (id: number) => api.get(`/resources/resources/${id}/`),
    download: (id: number) => api.get(`/resources/resources/${id}/download/`, { responseType: 'blob' }),
  },
  categories: {
    list: () => api.get('/resources/categories/'),
    create: (data: any) => api.post('/resources/categories/', data),
  },
};

export const noticeAPI = {
  notices: {
    list: (params?: any) => api.get('/notices/notices/', { params }),
    create: (data: any) => api.post('/notices/notices/', data),
    retrieve: (id: number) => api.get(`/notices/notices/${id}/`),
    update: (id: number, data: any) => api.patch(`/notices/notices/${id}/`, data),
    uploadAttachment: (id: number, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/notices/notices/${id}/upload_attachment/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    markAsRead: (noticeId: number) => api.post(`/notices/notices/${noticeId}/mark_read/`),
  },
  categories: {
    list: () => api.get('/notices/categories/'),
    create: (data: any) => api.post('/notices/categories/', data),
  },
};

export const behaviorAPI = {
  logs: {
    list: (params?: any) => api.get('/behavior/logs/', { params }),
    create: (data: any) => api.post('/behavior/logs/', data),
    studentSummary: (studentId: number) => api.get(`/behavior/logs/student_summary/?student_id=${studentId}`),
  },
  categories: {
    list: () => api.get('/behavior/categories/'),
    create: (data: any) => api.post('/behavior/categories/', data),
  },
};

export const feeAPI = {
  types: {
    list: () => api.get('/fees/types/'),
    create: (data: any) => api.post('/fees/types/', data),
  },
  structures: {
    list: () => api.get('/fees/structures/'),
    create: (data: any) => api.post('/fees/structures/', data),
  },
  records: {
    list: (params?: any) => api.get('/fees/records/', { params }),
    create: (data: any) => api.post('/fees/records/', data),
    makePayment: (id: number, data: any) => api.post(`/fees/records/${id}/make_payment/`, data),
    dashboardStats: () => api.get('/fees/records/dashboard_stats/'),
    getFeeSummary: () => api.get('/fees/records/summary/'),
  },
  payments: {
    list: (params?: any) => api.get('/fees/payments/', { params }),
  },
};

export const timetableAPI = {
  timeSlots: {
    list: () => api.get('/timetable/time-slots/'),
    create: (data: any) => api.post('/timetable/time-slots/', data),
  },
  timetables: {
    list: (params?: any) => api.get('/timetable/timetables/', { params }),
    create: (data: any) => api.post('/timetable/timetables/', data),
    retrieve: (id: number) => api.get(`/timetable/timetables/${id}/`),
    weeklySchedule: (id: number) => api.get(`/timetable/timetables/${id}/weekly_schedule/`),
  },
};

export default api;