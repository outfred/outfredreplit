import { useQuery } from "@tanstack/react-query";
import { Instagram, Facebook, Twitter, Youtube, Linkedin } from "lucide-react";
import { SiTiktok } from "react-icons/si";

interface FooterConfig {
  id: string;
  copyrightText: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
  };
  updatedAt: Date;
}

export default function Footer() {
  const { data: config } = useQuery<FooterConfig>({
    queryKey: ["/api/footer-config"],
  });

  const socialLinks = config?.socialLinks || {};
  const hasSocialLinks = Object.values(socialLinks).some((link) => link);

  return (
    <footer className="border-t border-white/10 bg-card/50 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright Text */}
          <p className="text-sm text-muted-foreground text-center md:text-start" data-testid="text-copyright">
            {config?.copyrightText || "© 2025 Outfred. All rights reserved."}
          </p>

          {/* Social Media Links */}
          {hasSocialLinks && (
            <div className="flex items-center gap-3" data-testid="container-social-links">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-background/50 hover-elevate active-elevate-2 flex items-center justify-center transition-colors"
                  data-testid="link-social-instagram"
                >
                  <Instagram className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-background/50 hover-elevate active-elevate-2 flex items-center justify-center transition-colors"
                  data-testid="link-social-facebook"
                >
                  <Facebook className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-background/50 hover-elevate active-elevate-2 flex items-center justify-center transition-colors"
                  data-testid="link-social-twitter"
                >
                  <Twitter className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-background/50 hover-elevate active-elevate-2 flex items-center justify-center transition-colors"
                  data-testid="link-social-tiktok"
                >
                  <SiTiktok className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-background/50 hover-elevate active-elevate-2 flex items-center justify-center transition-colors"
                  data-testid="link-social-youtube"
                >
                  <Youtube className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-background/50 hover-elevate active-elevate-2 flex items-center justify-center transition-colors"
                  data-testid="link-social-linkedin"
                >
                  <Linkedin className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
