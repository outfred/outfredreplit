import { Link, useLocation } from "wouter";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Moon, Sun, User, Menu, X, Languages, LogOut, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavLink = {
  id: string;
  labelEn: string;
  labelAr: string;
  path: string;
  isExternal: boolean;
};

export function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: dbNavLinks = [] } = useQuery<NavLink[]>({
    queryKey: ["/api/nav-links"],
  });

  const fallbackLinks = [
    { path: "/", labelEn: "Home", labelAr: "الرئيسية", isExternal: false },
    { path: "/search", labelEn: "Search", labelAr: "البحث", isExternal: false },
    { path: "/outfit-builder", labelEn: "Outfit Builder", labelAr: "مصمم الأزياء", isExternal: false },
  ];

  const navLinks = dbNavLinks.length > 0 ? dbNavLinks : fallbackLinks;

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed top-0 start-0 end-0 z-50 px-4 pt-4">
      <GlassCard className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Outfred
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <Button
                  variant={isActive(link.path) ? "secondary" : "ghost"}
                  className={cn(
                    "rounded-xl",
                    isActive(link.path) && "bg-white/10 dark:bg-white/5"
                  )}
                  data-testid={`link-${link.path.slice(1) || "home"}`}
                >
                  {language === "ar" ? link.labelAr : link.labelEn}
                </Button>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-xl"
                  data-testid="button-language-toggle"
                >
                  <Languages className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl border-popover-border">
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className={cn(language === "en" && "bg-accent")}
                  data-testid="button-lang-en"
                >
                  English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("ar")}
                  className={cn(language === "ar" && "bg-accent")}
                  data-testid="button-lang-ar"
                >
                  العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              className="rounded-xl"
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-xl"
                  data-testid="button-user-menu"
                >
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl border-popover-border">
                {user ? (
                  <>
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {user.name}
                    </div>
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      {user.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" data-testid="link-profile">
                        <User className="w-4 h-4 mr-2" />
                        {t("profile")}
                      </Link>
                    </DropdownMenuItem>
                    {(user.role === "merchant" || user.role === "admin" || user.role === "owner") && (
                      <DropdownMenuItem asChild>
                        <Link href="/merchant" data-testid="link-merchant">
                          {t("merchant")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {(user.role === "admin" || user.role === "owner") && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" data-testid="link-admin">
                          {t("admin")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} data-testid="button-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("logout")}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login" data-testid="link-login">
                        <LogIn className="w-4 h-4 mr-2" />
                        {t("auth.login", "Login")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register" data-testid="link-register">
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t("auth.register", "Register")}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 px-6 py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.path} href={link.path}>
                  <Button
                    variant={isActive(link.path) ? "secondary" : "ghost"}
                    className="w-full justify-start rounded-xl"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-link-${link.path.slice(1) || "home"}`}
                  >
                    {language === "ar" ? link.labelAr : link.labelEn}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </nav>
  );
}
