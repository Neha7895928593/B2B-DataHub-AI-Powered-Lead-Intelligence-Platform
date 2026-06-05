import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "login" | "signup";

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, signup, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "admin" ? "/admin/dashboard" : "/", { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const intendedPath =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "";
      const authenticatedUser =
        mode === "signup"
          ? await signup({ fullName, email, password })
          : await login({ email, password });

      if (mode === "signup") {
        toast({
          title: "Account created",
          description: "Your account is ready.",
        });
      } else {
        toast({
          title: "Login successful",
          description: "Welcome back to B2B DataHub.",
        });
      }

      const nextPath = authenticatedUser.role === "admin" ? "/admin/dashboard" : "/";

      navigate(nextPath, { replace: true });
    } catch (error) {
      const message = ((error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      })?.response?.data?.message) || "Please try again.";

      toast({
        title: mode === "signup" ? "Signup failed" : "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">B2B DataHub Access</h1>

          </div>
        </div>



        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-4">
            <div className="inline-flex rounded-lg border border-border bg-muted p-1">
              <Button
                type="button"
                variant={mode === "login" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setMode("login")}
              >
                Login
              </Button>
              <Button
                type="button"
                variant={mode === "signup" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setMode("signup")}
              >
                Sign up
              </Button>
            </div>
            <div className="text-center">


            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Neha Sharma"
                    className="h-11"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading
                  ? mode === "signup"
                    ? "Creating account..."
                    : "Signing in..."
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>

            <div className="pt-3 text-center">
              <Button asChild variant="link" className="h-auto p-0 text-primary underline">
                <Link to="/forgot-password">Forgot password?</Link>
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
