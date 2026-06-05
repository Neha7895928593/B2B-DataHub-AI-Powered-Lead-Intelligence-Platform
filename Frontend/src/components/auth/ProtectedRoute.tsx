import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
  allowedRoles?: string[];
  unauthenticatedRedirectTo?: string;
  roleMismatchRedirectTo?: string;
};

export default function ProtectedRoute({
  allowedRoles,
  unauthenticatedRedirectTo = "/admin",
  roleMismatchRedirectTo = "/admin",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading your workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={unauthenticatedRedirectTo} replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to={roleMismatchRedirectTo} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
