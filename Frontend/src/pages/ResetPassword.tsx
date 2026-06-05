import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { confirmPasswordReset } from "@/api/apiHub";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please re-enter the same password in both fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset({ token, email, password });
      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      const message = ((error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      })?.response?.data?.message) || "Please try again.";

      toast({
        title: "Reset failed",
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
            <h1 className="text-2xl font-bold text-foreground">Set New Password</h1>
            <p className="text-sm text-muted-foreground">Create a new password for your account.</p>
          </div>
        </div>

        <Alert className="border-border bg-card/70">
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-sm leading-6">
            The reset link is tied to the email shown in the URL. If the token expires, request a new one.
            <span className="ml-1 inline-block">
              <Button asChild variant="link" className="h-auto p-0 text-primary underline">
                <Link to="/forgot-password">Request new link</Link>
              </Button>
            </span>
          </AlertDescription>
        </Alert>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Reset password</CardTitle>
            <CardDescription>{email ? `Reset for ${email}` : "Missing reset email in link."}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading || !token || !email}>
                {isLoading ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
