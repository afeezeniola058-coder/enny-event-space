import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { z } from "zod";

type AuthMode = "signin" | "signup" | "forgot-password";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const getInitialMode = (): AuthMode => {
    const mode = searchParams.get("mode");
    if (mode === "signup") return "signup";
    if (mode === "forgot-password") return "forgot-password";
    return "signin";
  };

  const [authMode, setAuthMode] = useState<AuthMode>(getInitialMode());
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const validateForm = () => {
    try {
      if (authMode === "forgot-password") {
        z.object({ email: z.string().email("Please enter a valid email address") }).parse({ email: formData.email });
      } else if (authMode === "signup") {
        authSchema.parse(formData);
      } else {
        authSchema.omit({ fullName: true }).parse(formData);
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setResetEmailSent(true);
      toast({
        title: "Reset email sent!",
        description: "Check your inbox for a link to reset your password.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (authMode === "forgot-password") {
      return handleForgotPassword();
    }
    
    setIsLoading(true);

    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: formData.fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to Eventify! You can now start planning your events.",
          });
          navigate("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrors({});
    setResetEmailSent(false);
  };

  const getTitle = () => {
    switch (authMode) {
      case "signup":
        return "Create an Account";
      case "forgot-password":
        return "Reset Password";
      default:
        return "Welcome Back";
    }
  };

  const getSubtitle = () => {
    switch (authMode) {
      case "signup":
        return "Start planning your perfect event today";
      case "forgot-password":
        return "Enter your email and we'll send you a reset link";
      default:
        return "Sign in to manage your events";
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Please wait...";
    switch (authMode) {
      case "signup":
        return "Create Account";
      case "forgot-password":
        return "Send Reset Link";
      default:
        return "Sign In";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="bg-card rounded-2xl shadow-elegant border border-border p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="font-display text-2xl font-bold text-foreground">Eventify</span>
            </Link>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {getTitle()}
            </h1>
            <p className="text-muted-foreground font-body text-sm mt-2">
              {getSubtitle()}
            </p>
          </div>

          {authMode === "forgot-password" && resetEmailSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Check your email
              </h2>
              <p className="text-muted-foreground font-body text-sm">
                We've sent a password reset link to <strong>{formData.email}</strong>. 
                Please check your inbox and follow the instructions.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => switchMode("signin")}
                className="mt-4"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {authMode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-body">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="font-body">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {authMode !== "forgot-password" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-body">Password</Label>
                    {authMode === "signin" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot-password")}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              )}

              <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isLoading || isGoogleLoading}>
                {getButtonText()}
              </Button>

              {authMode !== "forgot-password" && (
                <>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full"
                    disabled={isLoading || isGoogleLoading}
                    onClick={async () => {
                      setIsGoogleLoading(true);
                      try {
                        const result = await lovable.auth.signInWithOAuth("google", {
                          redirect_uri: window.location.origin,
                        });
                        if (result.error) {
                          toast({
                            title: "Google sign-in failed",
                            description: result.error.message || "An error occurred during Google sign-in.",
                            variant: "destructive",
                          });
                        }
                        if (result.redirected) return;
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to sign in with Google.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsGoogleLoading(false);
                      }
                    }}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {isGoogleLoading ? "Signing in..." : "Google"}
                  </Button>
                </>
              )}
            </form>
          )}

          <div className="mt-6 text-center space-y-2">
            {authMode === "forgot-password" && !resetEmailSent ? (
              <p className="text-sm text-muted-foreground font-body">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : authMode !== "forgot-password" && (
              <p className="text-sm text-muted-foreground font-body">
                {authMode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => switchMode(authMode === "signup" ? "signin" : "signup")}
                  className="text-primary font-medium hover:underline"
                >
                  {authMode === "signup" ? "Sign In" : "Sign Up"}
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
