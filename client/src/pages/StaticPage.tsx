import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Helmet } from "react-helmet-async";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function StaticPage() {
  const [, params] = useRoute("/pages/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug;

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["/api/pages", slug],
    queryFn: async () => {
      const res = await fetch(`/api/pages/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch page");
      return res.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation("/")} data-testid="button-go-home">
            Go Home
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{page.title} - Outfred</title>
        {page.metaDescription && <meta name="description" content={page.metaDescription} />}
      </Helmet>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <GlassCard className="p-8">
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
            data-testid="static-page-content"
          />
        </GlassCard>
      </div>
    </div>
  );
}
