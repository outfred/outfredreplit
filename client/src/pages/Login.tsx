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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: t("auth.loginSuccess", "Login successful"),
        description: t("auth.welcomeBack", "Welcome back!"),
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: t("auth.loginFailed", "Login failed"),
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
            {t("auth.login", "Login")}
          </h1>
          <p className="text-muted-foreground">
            {t("auth.loginSubtitle", "Welcome back to Outfred")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              data-testid="input-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid="button-login"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("auth.loginButton", "Login")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            {t("auth.noAccount", "Don't have an account?")}{" "}
            <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
              {t("auth.register", "Register")}
            </Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs">
          <p className="font-semibold mb-1">Demo Credentials:</p>
          <p>Owner: owner@outfred.com / Owner#123</p>
          <p>Merchant: merchant1@outfred.com / Demo#123</p>
          <p>User: user@outfred.com / Demo#123</p>
        </div>
      </GlassCard>
    </div>
  );
}
