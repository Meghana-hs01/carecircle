import axios from 'axios';
import {
  AuthResponse,
  User,
  ElderlyProfile,
  CareCircleMember,
  Invitation,
  Medication,
  MedicationDose,
  Appointment,
  CareActivity,
  TimelineEvent,
  NotificationItem,
  NotificationPreference,
  AdherenceStats
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('carecircle_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle unauthenticated 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      localStorage.removeItem('carecircle_token');
      localStorage.removeItem('carecircle_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    phone_number?: string;
  }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', userData);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('carecircle_token');
    localStorage.removeItem('carecircle_user');
    localStorage.removeItem('carecircle_active_profile_id');
  }
};

export const profileService = {
  listProfiles: async (): Promise<ElderlyProfile[]> => {
    const res = await api.get<ElderlyProfile[]>('/profiles');
    return res.data;
  },
  getProfile: async (id: number): Promise<ElderlyProfile> => {
    const res = await api.get<ElderlyProfile>(`/profiles/${id}`);
    return res.data;
  },
  createOrUpdateProfile: async (data: Partial<ElderlyProfile>): Promise<ElderlyProfile> => {
    const res = await api.post<ElderlyProfile>('/profiles', data);
    return res.data;
  },
  updateProfile: async (id: number, data: Partial<ElderlyProfile>): Promise<ElderlyProfile> => {
    const res = await api.put<ElderlyProfile>(`/profiles/${id}`, data);
    return res.data;
  }
};

export const careCircleService = {
  createInvitation: async (data: {
    profile_id: number;
    role: string;
    relationship_title: string;
    recipient_email?: string;
    can_view_health: boolean;
    can_manage_care: boolean;
    expiry_days?: number;
  }): Promise<Invitation> => {
    const res = await api.post<Invitation>('/invitations', data);
    return res.data;
  },
  acceptInvitation: async (invitation_code: string): Promise<CareCircleMember> => {
    const res = await api.post<CareCircleMember>('/invitations/accept', { invitation_code });
    return res.data;
  },
  listMembers: async (profileId: number): Promise<CareCircleMember[]> => {
    const res = await api.get<CareCircleMember[]>(`/profiles/${profileId}/members`);
    return res.data;
  },
  revokeMember: async (memberId: number): Promise<void> => {
    await api.delete(`/care-circle/${memberId}`);
  }
};

export const medicationService = {
  listMedications: async (profileId: number, activeOnly = false): Promise<Medication[]> => {
    const res = await api.get<Medication[]>(`/profiles/${profileId}/medications`, {
      params: { active_only: activeOnly }
    });
    return res.data;
  },
  createMedication: async (profileId: number, data: any): Promise<Medication> => {
    const res = await api.post<Medication>(`/profiles/${profileId}/medications`, data);
    return res.data;
  },
  updateMedication: async (medicationId: number, data: any): Promise<Medication> => {
    const res = await api.put<Medication>(`/medications/${medicationId}`, data);
    return res.data;
  },
  discontinueMedication: async (medicationId: number): Promise<void> => {
    await api.delete(`/medications/${medicationId}`);
  },
  listDoses: async (profileId: number, dateFilter?: string, daysSpan = 7): Promise<MedicationDose[]> => {
    const res = await api.get<MedicationDose[]>(`/profiles/${profileId}/doses`, {
      params: { date_filter: dateFilter, days_span: daysSpan }
    });
    return res.data;
  },
  recordDose: async (doseId: number, status: 'TAKEN' | 'SKIPPED' | 'MISSED', notes?: string): Promise<MedicationDose> => {
    const res = await api.post<MedicationDose>(`/doses/${doseId}/record`, { status, notes });
    return res.data;
  },
  getSafetyAnalysis: async (profileId: number): Promise<any> => {
    const res = await api.get(`/profiles/${profileId}/medications/safety-analysis`);
    return res.data;
  }
};

export const appointmentService = {
  listAppointments: async (profileId: number, statusFilter?: string): Promise<Appointment[]> => {
    const res = await api.get<Appointment[]>(`/profiles/${profileId}/appointments`, {
      params: { status_filter: statusFilter }
    });
    return res.data;
  },
  createAppointment: async (profileId: number, data: any): Promise<Appointment> => {
    const res = await api.post<Appointment>(`/profiles/${profileId}/appointments`, data);
    return res.data;
  },
  updateAppointment: async (appointmentId: number, data: any): Promise<Appointment> => {
    const res = await api.put<Appointment>(`/appointments/${appointmentId}`, data);
    return res.data;
  },
  deleteAppointment: async (appointmentId: number): Promise<void> => {
    await api.delete(`/appointments/${appointmentId}`);
  }
};

export const careActivityService = {
  listActivities: async (profileId: number): Promise<CareActivity[]> => {
    const res = await api.get<CareActivity[]>(`/profiles/${profileId}/activities`);
    return res.data;
  },
  logActivity: async (profileId: number, data: any): Promise<CareActivity> => {
    const res = await api.post<CareActivity>(`/profiles/${profileId}/activities`, data);
    return res.data;
  }
};

export const timelineService = {
  getTimeline: async (profileId: number, daysBack = 7, daysForward = 7): Promise<TimelineEvent[]> => {
    const res = await api.get<TimelineEvent[]>(`/profiles/${profileId}/timeline`, {
      params: { days_back: daysBack, days_forward: daysForward }
    });
    return res.data;
  }
};

export const notificationService = {
  listNotifications: async (limit = 50): Promise<NotificationItem[]> => {
    const res = await api.get<NotificationItem[]>('/notifications', { params: { limit } });
    return res.data;
  },
  markRead: async (notificationId: number): Promise<NotificationItem> => {
    const res = await api.put<NotificationItem>(`/notifications/${notificationId}/read`);
    return res.data;
  },
  triggerEscalationJob: async (): Promise<any> => {
    const res = await api.post('/internal/jobs/process-reminders', {}, {
      headers: { 'X-Cron-Secret': 'CareCircleCron2026!' }
    });
    return res.data;
  },
  markAllRead: async (): Promise<void> => {
    await api.put('/notifications/mark-all-read');
  },
  getPreferences: async (): Promise<NotificationPreference> => {
    const res = await api.get<NotificationPreference>('/notification-preferences');
    return res.data;
  },
  updatePreferences: async (data: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const res = await api.put<NotificationPreference>('/notification-preferences', data);
    return res.data;
  }
};

export const analyticsService = {
  getAdherence: async (profileId: number, days = 14): Promise<AdherenceStats> => {
    const res = await api.get<AdherenceStats>(`/profiles/${profileId}/adherence`, {
      params: { days }
    });
    return res.data;
  }
};

export const aiService = {
  query: async (profileId: number, query: string): Promise<{
    answer: string;
    suggested_actions: string[];
    context_data: Record<string, any>;
  }> => {
    const res = await api.post('/ai/query', { profile_id: profileId, query });
    return res.data;
  },
  getWeeklySummary: async (profileId: number): Promise<{
    profile_id: number;
    patient_name: string;
    generated_at: string;
    adherence_rate: number;
    executive_summary: string;
    medication_status: string;
    vitals_assessment: string;
    upcoming_events_notice: string;
    recommendations: string[];
  }> => {
    const res = await api.get(`/ai/summary/${profileId}`);
    return res.data;
  }
};

export const schedulerService = {
  triggerReminders: async (): Promise<any> => {
    const res = await api.post('/internal/jobs/process-reminders', {}, {
      headers: {
        Authorization: 'Bearer carecircle-internal-job-token-2026'
      }
    });
    return res.data;
  }
};

export default api;
