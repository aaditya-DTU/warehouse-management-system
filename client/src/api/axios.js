import axios from "axios";

const AUTH_STORAGE_KEY = "wms-auth";

const normalizeApiBaseUrl = (rawValue) => {
  if (!rawValue) {
    return null;
  }

  const cleanedValue = String(rawValue).trim().replace(/[;,\s]+$/, "");

  if (!cleanedValue) {
    return null;
  }

  if (cleanedValue.endsWith("/api")) {
    return cleanedValue;
  }

  return `${cleanedValue.replace(/\/+$/, "")}/api`;
};

const configuredApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
const resolvedBaseUrl =
  import.meta.env.DEV
    ? "/api"
    : configuredApiBaseUrl || "/api";

export const getStoredAuth = () => {
  try {
    const storedValue = localStorage.getItem(AUTH_STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
};

export const setStoredAuth = (authData) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

const api = axios.create({
  baseURL: resolvedBaseUrl,
});

api.interceptors.request.use((config) => {
  const auth = getStoredAuth();

  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }

  return config;
});

export default api;
