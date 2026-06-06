import axios from 'axios';
import { getStoredToken } from "@/lib/authStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 25000,
  headers: { "Content-Type": "application/json" },
});

const isRetriableNetworkError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;

  const typedError = error as {
    code?: string;
    message?: string;
    response?: { status?: number };
  };

  const status = typedError.response?.status;
  if (status && status >= 500 && status < 600) return true;
  if (typedError.code === "ECONNABORTED") return true;
  return typedError.message === "Network Error";
};

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(undefined, async (error) => {
  const config = error.config as ({ __retryCount?: number } & Record<string, unknown>) | undefined;

  if (!config || !isRetriableNetworkError(error)) {
    return Promise.reject(error);
  }

  const retryCount = Number(config.__retryCount || 0);
  if (retryCount >= 2) {
    return Promise.reject(error);
  }

  config.__retryCount = retryCount + 1;
  const delay = 700 * Math.pow(2, retryCount);

  await new Promise((resolve) => setTimeout(resolve, delay));
  return api(config);
});

export default api;
