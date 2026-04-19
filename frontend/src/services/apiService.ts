import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Interfaces for API responses
export interface PaginatedResponse<T> {
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string;
  full_name?: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface Class {
  id: number;
  name: string;
}

export interface Section {
  id: number;
  name?: string;
  section?: string; // Adjust based on backend field
}

export interface Student {
  id: number;
  user: {
    id: number;
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  };
  roll_number: string;
  class_assigned_id?: number;
  section_id?: number;
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const newToken = response.data.access;
          localStorage.setItem('access_token', newToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    // Log error for debugging
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      console.error('Network Error - No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw new Error('Authentication failed');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Authentication APIs
export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  register: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    return response.json();
  },

  getProfile: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/auth/profile/`);
  },
};

// Academic APIs
export const academicAPI = {
  getClasses: async (): Promise<AxiosResponse<PaginatedResponse<Class>>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Class>>('/core/classes/');
      console.log('Classes API Response:', response);
      return response;
    } catch (error) {
      console.error('getClasses error:', error);
      throw error;
    }
  },

  getSections: async (): Promise<AxiosResponse<PaginatedResponse<Section>>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Section>>('/core/sections/');
      console.log('Sections API Response:', response);
      return response;
    } catch (error) {
      console.error('getSections error:', error);
      throw error;
    }
  },

  getSubjects: async () => {
    try {
      const response = await apiClient.get('/academic/subjects/');
      console.log('Subjects API Response:', response);
      return response.data.results;
    } catch (error) {
      console.error('getSubjects error:', error);
      throw error;
    }
  },

  getStudents: async (classId: number, sectionId?: number): Promise<AxiosResponse<PaginatedResponse<Student>>> => {
    try {
      const queryParams = sectionId ? `?class_assigned=${classId}&section=${sectionId}` : `?class_assigned=${classId}`;
      const response = await apiClient.get<PaginatedResponse<Student>>(`/core/students/${queryParams}`);
      console.log('Students API Response:', response);
      return response;
    } catch (error) {
      console.error('getStudents error:', error);
      throw error;
    }
  },
};

// Attendance APIs
export const attendanceAPI = {
  getStatuses: async () => {
    const response = await apiClient.get('/attendance/statuses/');
    return response.data;
  },

  getAttendance: async (filters?: any) => {
    const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
    const response = await apiClient.get(`/attendance/attendance/${queryParams}`);
    return response.data;
  },

  markAttendance: async (attendanceData: any) => {
    const response = await apiClient.post('/attendance/attendance/', attendanceData);
    return response.data;
  },

  bulkMarkAttendance: async (attendanceData: any) => {
    const response = await apiClient.post('/attendance/attendance/bulk_mark/', attendanceData);
    return response.data;
  },

  getAttendanceStats: async (filters?: any) => {
    const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
    const response = await apiClient.get(`/attendance/attendance/statistics/${queryParams}`);
    return response.data;
  },

  getClassReport: async (classId: string, date?: string, sectionId?: string) => {
    const queryParams = new URLSearchParams();
    if (classId) queryParams.append('class_id', classId);
    if (sectionId) queryParams.append('section_id', sectionId);
    if (date) queryParams.append('date', date);
    const response = await apiClient.get(`/attendance/attendance/class_report/?${queryParams.toString()}`);
    return response.data;
  },

  getSummary: async (filters?: any) => {
    const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
    const response = await apiClient.get(`/attendance/attendance/summary/${queryParams}`);
    return response.data;
  },
};

// Assignments APIs
export const assignmentsAPI = {
  getAssignments: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/assignments/assignments/`);
  },

  createAssignment: async (assignmentData: any) => {
    const formData = new FormData();
    Object.keys(assignmentData).forEach((key) => {
      if (assignmentData[key] instanceof File) {
        formData.append(key, assignmentData[key]);
      } else {
        formData.append(key, assignmentData[key]);
      }
    });

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/assignments/assignments/`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return response.json();
  },

  submitAssignment: async (assignmentId: string, submissionData: any) => {
    const formData = new FormData();
    Object.keys(submissionData).forEach((key) => {
      if (submissionData[key] instanceof File) {
        formData.append(key, submissionData[key]);
      } else {
        formData.append(key, submissionData[key]);
      }
    });

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/assignments/assignments/${assignmentId}/submit/`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return response.json();
  },

  getSubmissions: async (assignmentId: string) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/assignments/assignments/${assignmentId}/submissions/`);
  },

  gradeSubmission: async (submissionId: string, gradeData: any) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/assignments/submissions/${submissionId}/grade/`, {
      method: 'POST',
      body: JSON.stringify(gradeData),
    });
  },
};

// Resources APIs
export const resourcesAPI = {
  getResources: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/resources/study-resources/`);
  },

  uploadResource: async (resourceData: any) => {
    const formData = new FormData();
    Object.keys(resourceData).forEach((key) => {
      if (resourceData[key] instanceof File) {
        formData.append(key, resourceData[key]);
      } else {
        formData.append(key, resourceData[key]);
      }
    });

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/resources/study-resources/`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return response.json();
  },

  downloadResource: async (resourceId: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/resources/study-resources/${resourceId}/download/`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.blob();
  },
};

// Fees APIs
export const feesAPI = {
  getFeeStructures: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/fees/structures/`);
  },

  getFeePayments: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/fees/payments/`);
  },

  createFeePayment: async (paymentData: any) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/fees/payments/`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
};

// Notices APIs
export const noticesAPI = {
  getNotices: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/notices/notices/`);
  },

  createNotice: async (noticeData: any) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/notices/notices/`, {
      method: 'POST',
      body: JSON.stringify(noticeData),
    });
  },

  markNoticeAsRead: async (noticeId: string) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/notices/notices/${noticeId}/mark_read/`, {
      method: 'POST',
    });
  },
};

// Behavior APIs
export const behaviorAPI = {
  getBehaviorLogs: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/behavior/logs/`);
  },

  createBehaviorLog: async (logData: any) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/behavior/logs/`, {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  },
};

// Timetable APIs
export const timetableAPI = {
  getTimetables: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/timetable/timetables/`);
  },

  createTimetable: async (timetableData: any) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/timetable/timetables/`, {
      method: 'POST',
      body: JSON.stringify(timetableData),
    });
  },

  getTimeSlots: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/timetable/time-slots/`);
  },

  getTeacherAvailability: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/timetable/teacher-availability/`);
  },
};

// Communications APIs
export const communicationsAPI = {
  getMessages: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/communications/messages/`);
  },

  sendMessage: async (messageData: any) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/communications/messages/`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  getMeetings: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/communications/meetings/`);
  },

  scheduleMeeting: async (meetingData: any) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/communications/meetings/`, {
      method: 'POST',
      body: JSON.stringify(meetingData),
    });
  },

  getChatRooms: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/communications/chat-rooms/`);
  },

  getChatMessages: async (roomId: string) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/communications/chat-messages/?room=${roomId}`);
  },
};

// Payments APIs
export const paymentsAPI = {
  getPaymentPlans: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/payments/payment-plans/`);
  },

  getTransactions: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/payments/transactions/`);
  },

  initiatePayment: async (paymentData: any) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/payments/transactions/initiate_payment/`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  verifyPayment: async (transactionId: string, verificationData: any) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/payments/transactions/${transactionId}/verify_payment/`, {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  },
};

// Users APIs
export const usersAPI = {
  getUsers: async (role?: string) => {
    const queryParams = role ? `?role=${role}` : '';
    return makeAuthenticatedRequest(`${API_BASE_URL}/core/users/${queryParams}`);
  },

  createUser: async (userData: any) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/core/users/`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (userId: string, userData: any) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/core/users/${userId}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (userId: string) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/core/users/${userId}/`, {
      method: 'DELETE',
    });
  },

  getTeachers: async () => {
    try {
      const response = await apiClient.get('/core/teachers/');
      return response;
    } catch (error) {
      console.error('getTeachers error:', error);
      throw error;
    }
  },

  getStudents: async () => {
    try {
      const response = await apiClient.get('/core/students/');
      return response;
    } catch (error) {
      console.error('getStudents error:', error);
      throw error;
    }
  },

  getParents: async () => {
    try {
      const response = await apiClient.get('/core/parents/');
      return response;
    } catch (error) {
      console.error('getParents error:', error);
      throw error;
    }
  },
};

// Dashboard APIs
export const dashboardAPI = {
  getDashboardStats: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/core/dashboard/stats/`);
  },

  getRecentActivities: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/core/dashboard/recent-activities/`);
  },
};

export default {
  auth: authAPI,
  academic: academicAPI,
  attendance: attendanceAPI,
  assignments: assignmentsAPI,
  resources: resourcesAPI,
  fees: feesAPI,
  notices: noticesAPI,
  behavior: behaviorAPI,
  timetable: timetableAPI,
  communications: communicationsAPI,
  payments: paymentsAPI,
  users: usersAPI,
  dashboard: dashboardAPI,
};