import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import api from "@/api/api";
import { getStoredToken, setStoredToken } from "@/lib/authStorage";

type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  createdAt?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<AuthUser>;
  signup: (payload: { fullName: string; email: string; password: string }) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  const persistToken = useCallback((nextToken: string | null) => {
    setStoredToken(nextToken);
    setToken(nextToken);
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = getStoredToken();
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
      setToken(savedToken);
    } catch (_error) {
      persistToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [persistToken]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const response = await api.post("/auth/login", payload);
    persistToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }, [persistToken]);

  const signup = useCallback(async (payload: {
    fullName: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post("/auth/signup", payload);
    persistToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }, [persistToken]);

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
  }, [persistToken]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === "admin",
      isLoading,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
