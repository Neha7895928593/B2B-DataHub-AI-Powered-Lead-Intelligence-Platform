import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { requestPasswordReset } from "@/api/apiHub";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await requestPasswordReset({ email });
      toast({
        title: "Reset link generated",
        description: "Check your inbox for the password reset email.",
      });
    } catch (error) {
      const message = ((error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      })?.response?.data?.message) || "Unable to generate reset link. Please try again.";

      toast({
        title: "Unable to generate reset link",
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
            <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
            <p className="text-sm text-muted-foreground">
              Enter the account email to generate a reset link.
            </p>
          </div>
        </div>

        <Alert className="border-border bg-card/70">
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-sm leading-6">
            The reset email is sent through SMTP and should arrive in your inbox.
            <span className="ml-1 inline-block">
              <Button asChild variant="link" className="h-auto p-0 text-primary underline">
                <Link to="/login">Back to login</Link>
              </Button>
            </span>
          </AlertDescription>
        </Alert>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Forgot your password?</CardTitle>
            <CardDescription>Request a one-time reset link for your account email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate reset link"}
              </Button>
            </form>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
