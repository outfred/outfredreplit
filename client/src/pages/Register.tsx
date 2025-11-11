import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t("auth.passwordMismatch", "Passwords don't match"),
        description: t("auth.passwordMismatchDesc", "Please make sure both passwords match"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name);
      toast({
        title: t("auth.registerSuccess", "Registration successful"),
        description: t("auth.welcomeMessage", "Welcome to Outfred!"),
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: t("auth.registerFailed", "Registration failed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            {t("auth.register", "Register")}
          </h1>
          <p className="text-muted-foreground">
            {t("auth.registerSubtitle", "Create your Outfred account")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("auth.name", "Name")}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t("auth.namePlaceholder", "Your name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              data-testid="input-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email", "Email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("auth.emailPlaceholder", "your@email.com")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password", "Password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("auth.passwordPlaceholder", "••••••••")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              data-testid="input-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("auth.confirmPassword", "Confirm Password")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t("auth.passwordPlaceholder", "••••••••")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              data-testid="input-confirm-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid="button-register"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("auth.registerButton", "Create Account")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            {t("auth.hasAccount", "Already have an account?")}{" "}
            <Link href="/login">
              <a className="text-primary hover:underline" data-testid="link-login">
                {t("auth.login", "Login")}
              </a>
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
