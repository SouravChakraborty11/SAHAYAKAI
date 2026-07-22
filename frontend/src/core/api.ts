/**
 * Central API layer for SAHAYAK AI.
 * Reads JWT from localStorage and injects Authorization header on every request.
 * Exports typed helpers for all major endpoints.
 */

const BASE = 'http://127.0.0.1:8000/api/v1';

// ── Token helpers ──────────────────────────────────────────────────────────────
export const getToken = (): string | null => localStorage.getItem('access_token');
export const setToken = (t: string) => localStorage.setItem('access_token', t);
export const removeToken = () => localStorage.removeItem('access_token');

export const setUserCache = (u: UserProfile) => localStorage.setItem('user_profile', JSON.stringify(u));
export const getUserCache = (): UserProfile | null => {
  const raw = localStorage.getItem('user_profile');
  return raw ? JSON.parse(raw) : null;
};
export const removeUserCache = () => localStorage.removeItem('user_profile');

// ── Types ──────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  theme: string;
  high_contrast: boolean;
  font_scale: string;
  language: string;
  notif_email: boolean;
  notif_push: boolean;
  notif_sms: boolean;
}

export interface Application {
  id: number;
  reference_number: string;
  scheme_name: string;
  applicant_name: string;
  phone_number: string;
  status: string;
  receipt_file: string | null;
  screenshot_file: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationsData {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Application[];
}

// ── Fetch wrapper ──────────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export async function apiRegister(
  email: string, password: string, full_name?: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name }),
  }, false);
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);
}

// ── Users ──────────────────────────────────────────────────────────────────────
export async function apiGetMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me');
}

export async function apiPatchProfile(data: {
  full_name?: string | null;
  phone?: string | null;
}): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiPatchSettings(data: {
  theme?: string;
  language?: string;
  notif_email?: boolean;
  notif_push?: boolean;
  notif_sms?: boolean;
  high_contrast?: boolean;
  font_scale?: string;
}): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export const apiUploadProfilePhoto = async (file: File): Promise<UserProfile> => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${BASE}/users/me/profile-photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || `Error ${res.status}`);
  }
  return res.json();
};

export const apiDeleteProfilePhoto = async (): Promise<UserProfile> => {
  return apiFetch<UserProfile>('/users/me/profile-photo', {
    method: 'DELETE',
  });
};

export interface DashboardStatsData {
  welcome_message: string;
  stats: {
    active_applications: number;
    eligible_schemes: number;
  };
}

export async function apiGetDashboardStats(): Promise<DashboardStatsData> {
  return apiFetch<DashboardStatsData>('/users/dashboard');
}

// ── Applications ───────────────────────────────────────────────────────────────
export interface ApplicationsParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export async function apiGetApplications(params: ApplicationsParams = {}): Promise<ApplicationsData> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));
  if (params.search) q.set('search', params.search);
  if (params.status && params.status !== 'All') q.set('status', params.status);
  if (params.sort_by) q.set('sort_by', params.sort_by);
  if (params.sort_order) q.set('sort_order', params.sort_order);
  return apiFetch<ApplicationsData>(`/applications/?${q}`, {}, true);
}

export async function apiGetApplication(id: number): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}`, {}, true);
}

export interface AutomationLog {
  id?: number;
  message?: string;
  [key: string]: any;
}

export async function apiGetAutomationLogs(): Promise<AutomationLog[]> {
  return apiFetch<AutomationLog[]>('/automation/logs');
}

// ── Schemes ────────────────────────────────────────────────────────────────────
export interface SchemeSearchResponse {
  query: string;
  answer: string;
}

export async function apiSearchSchemes(query: string): Promise<SchemeSearchResponse> {
  const q = new URLSearchParams({ q: query });
  return apiFetch<SchemeSearchResponse>(`/schemes/search?${q}`, {}, true);
}

export interface EligibilityResponse {
  result: string;
}

export async function apiCheckEligibility(profile: Record<string, any>): Promise<EligibilityResponse> {
  return apiFetch<EligibilityResponse>('/schemes/check-eligibility', {
    method: 'POST',
    body: JSON.stringify({ profile }),
  }, true);
}
