import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Database } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link to="/" className="flex-shrink-0 flex items-center group">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div className="ml-3">
              <span className="block text-lg font-black text-foreground tracking-tight leading-none">B2B DATA<span className="text-primary italic">HUB</span></span>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Intelligence Engine</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="max-w-56">
                    <span className="truncate">{user?.fullName || "User"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled>
                    {user?.role === "admin" ? "Admin account" : "Buyer account"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
