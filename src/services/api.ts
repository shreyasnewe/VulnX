import axios from 'axios';
import {
  DashboardMetrics,
  Target,
  Scan,
  Finding,
  SystemSimpleStatus,
  User,
  ReportItem
} from '../types';

export const TOKEN_KEY = 'vulnx_auth_token';
export const USER_KEY = 'vulnx_auth_user';

const api = axios.create({
  baseURL: '/api',
  timeout: 70000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected routes, broadcast event
      window.dispatchEvent(new Event('vulnx-unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const loginUser = async (credentials: { email: string; password: string }): Promise<{ token: string; user: User }> => {
  const res = await api.post('/auth/login', credentials);
  if (res.data.token) {
    localStorage.setItem(TOKEN_KEY, res.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
  }
  return res.data;
};

export const registerUser = async (data: { name: string; email: string; password: string }): Promise<{ token: string; user: User }> => {
  const res = await api.post('/auth/register', data);
  if (res.data.token) {
    localStorage.setItem(TOKEN_KEY, res.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
  }
  return res.data;
};

export const logoutUser = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('vulnx-logout'));
};

export const getStoredAuth = (): { token: string | null; user: User | null } => {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  let user: User | null = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      user = null;
    }
  }
  return { token, user };
};

export const fetchCurrentUser = async (): Promise<User> => {
  const res = await api.get('/auth/me');
  return res.data.user;
};

// Dashboard & Targets
export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const res = await api.get('/dashboard/metrics');
  return res.data.data;
};

export const fetchTargets = async (): Promise<Target[]> => {
  const res = await api.get('/targets');
  return res.data.data;
};

export const createTarget = async (data: {
  name: string;
  url: string;
  authorizationConfirmed: boolean;
}): Promise<Target> => {
  const res = await api.post('/targets', data);
  return res.data.data;
};

export const deleteTarget = async (id: string): Promise<boolean> => {
  const res = await api.delete(`/targets/${id}`);
  return res.data.success;
};

// Scans
export const fetchScans = async (): Promise<Scan[]> => {
  const res = await api.get('/scans');
  return res.data.data;
};

export const fetchScanById = async (id: string): Promise<Scan> => {
  const res = await api.get(`/scans/${id}`);
  return res.data.data;
};

export const executeNewScan = async (params: {
  url: string;
  targetId?: string;
  targetName?: string;
}): Promise<Scan> => {
  const res = await api.post('/scans', params);
  return res.data.data;
};

export const deleteScan = async (id: string): Promise<boolean> => {
  const res = await api.delete(`/scans/${id}`);
  return res.data.success;
};

// Findings
export const fetchFindings = async (
  severity?: string,
  category?: string,
  status?: string,
  search?: string
): Promise<Finding[]> => {
  const params: Record<string, string> = {};
  if (severity && severity !== 'All') params.severity = severity;
  if (category && category !== 'All') params.category = category;
  if (status && status !== 'All') params.status = status;
  if (search && search.trim()) params.search = search.trim();
  const res = await api.get('/findings', { params });
  return res.data.data;
};

export const updateFindingStatus = async (id: string, status: string): Promise<Finding> => {
  const res = await api.put(`/findings/${id}/status`, { status });
  return res.data.data;
};

// Reports
export const fetchReports = async (): Promise<ReportItem[]> => {
  const res = await api.get('/reports');
  return res.data.data;
};

export const downloadReportPdf = async (scanId: string, filename?: string): Promise<void> => {
  const response = await api.get(`/reports/${scanId}/pdf`, {
    responseType: 'blob'
  });
  
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `VulnX-Report-${scanId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const fetchSimpleSystemStatus = async (): Promise<SystemSimpleStatus> => {
  const res = await api.get('/settings/system-status');
  return res.data;
};

export default api;
