import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { User, Merchant, Brand } from "@shared/schema";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  Store,
  Sparkles,
  Settings,
  BarChart3,
  ShieldCheck,
  ShieldBan,
  Edit,
  Trash2,
  Mail,
  Database,
  Image as ImageIcon,
  BookOpen,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<
    "users" | "merchants" | "brands" | "ai" | "metrics" | "config"
  >("users");

  // Fetch Users
  const { data: usersData = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: activeView === "users",
  });

  // Fetch Merchants
  const { data: merchantsData = [], isLoading: merchantsLoading } = useQuery<Merchant[]>({
    queryKey: ["/api/admin/merchants"],
    enabled: activeView === "merchants",
  });

  // Fetch Brands
  const { data: brandsData = [], isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
    enabled: activeView === "brands",
  });

  // Fetch Metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery<{
    endpoints: Array<{ route: string; p95: number; p99: number; count: number }>;
    indexSize: string;
    lastCron: string;
    cronStatus: string;
  }>({
    queryKey: ["/api/admin/metrics"],
    enabled: activeView === "metrics",
  });

  // Fetch Config
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["/api/admin/config"],
    enabled: activeView === "config" || activeView === "ai",
  });

  // Update User Mutation
  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: t("success"), description: "User updated successfully" });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to update user", variant: "destructive" });
    },
  });

  // Update Merchant Mutation
  const updateMerchant = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Merchant> }) => {
      const res = await apiRequest("PATCH", `/api/admin/merchants/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/merchants"] });
      toast({ title: t("success"), description: "Merchant updated successfully" });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to update merchant", variant: "destructive" });
    },
  });

  // Delete Merchant Mutation
  const deleteMerchant = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/merchants/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/merchants"] });
      toast({ title: t("success"), description: "Merchant deleted successfully" });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to delete merchant", variant: "destructive" });
    },
  });

  const users = usersData;
  const merchants = merchantsData;
  const brands = brandsData;
  const metrics = metricsData || {
    endpoints: [],
    indexSize: "0 GB",
    lastCron: "N/A",
    cronStatus: "unknown",
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t("admin")} {t("dashboard")}</h1>
          <p className="text-muted-foreground">Manage users, merchants, and system configuration</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button
            variant={activeView === "users" ? "default" : "ghost"}
            onClick={() => setActiveView("users")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-users"
          >
            <Users className="w-4 h-4 me-2" />
            {t("users")}
          </Button>
          <Button
            variant={activeView === "merchants" ? "default" : "ghost"}
            onClick={() => setActiveView("merchants")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-merchants"
          >
            <Store className="w-4 h-4 me-2" />
            {t("merchants")}
          </Button>
          <Button
            variant={activeView === "brands" ? "default" : "ghost"}
            onClick={() => setActiveView("brands")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-brands"
          >
            <Sparkles className="w-4 h-4 me-2" />
            {t("brands")}
          </Button>
          <Button
            variant={activeView === "ai" ? "default" : "ghost"}
            onClick={() => setActiveView("ai")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-ai"
          >
            <Sparkles className="w-4 h-4 me-2" />
            {t("aiControls")}
          </Button>
          <Button
            variant={activeView === "metrics" ? "default" : "ghost"}
            onClick={() => setActiveView("metrics")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-metrics"
          >
            <BarChart3 className="w-4 h-4 me-2" />
            {t("systemMetrics")}
          </Button>
          <Button
            variant={activeView === "config" ? "default" : "ghost"}
            onClick={() => setActiveView("config")}
            className="rounded-xl whitespace-nowrap"
            data-testid="button-nav-config"
          >
            <Settings className="w-4 h-4 me-2" />
            {t("configuration")}
          </Button>
        </div>

        {/* Users View */}
        {activeView === "users" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("users")}</h2>
              <GlowButton variant="primary" data-testid="button-add-user">
                <Users className="w-4 h-4 me-2" />
                Add User
              </GlowButton>
            </div>
            <GlassCard className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-white/10" data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" data-testid={`button-edit-user-${user.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" data-testid={`button-delete-user-${user.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>
          </div>
        )}

        {/* Merchants View */}
        {activeView === "merchants" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("merchants")}</h2>
              <GlowButton variant="primary" data-testid="button-add-merchant">
                <Store className="w-4 h-4 me-2" />
                Add Merchant
              </GlowButton>
            </div>
            <GlassCard className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>{t("city")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants.map((merchant) => (
                    <TableRow key={merchant.id} className="border-white/10" data-testid={`row-merchant-${merchant.id}`}>
                      <TableCell className="font-medium">{merchant.name}</TableCell>
                      <TableCell>{merchant.ownerUserId}</TableCell>
                      <TableCell>{merchant.city}</TableCell>
                      <TableCell>
                        <Badge variant={merchant.status === "active" ? "default" : "secondary"}>
                          {merchant.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-2">
                          {merchant.status === "pending" && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => updateMerchant.mutate({ id: merchant.id, data: { status: "active" } })}
                              disabled={updateMerchant.isPending}
                              data-testid={`button-approve-${merchant.id}`}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => updateMerchant.mutate({ id: merchant.id, data: { status: "banned" } })}
                            disabled={updateMerchant.isPending}
                            data-testid={`button-ban-${merchant.id}`}
                          >
                            <ShieldBan className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>
          </div>
        )}

        {/* Brands View */}
        {activeView === "brands" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t("brands")}</h2>
              <GlowButton variant="primary" data-testid="button-add-brand">
                <Sparkles className="w-4 h-4 me-2" />
                Add Brand
              </GlowButton>
            </div>
            <GlassCard className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("city")}</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id} className="border-white/10" data-testid={`row-brand-${brand.id}`}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell>{brand.city}</TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" data-testid={`button-edit-brand-${brand.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" data-testid={`button-delete-brand-${brand.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>
          </div>
        )}

        {/* AI Controls View */}
        {activeView === "ai" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t("aiControls")}</h2>
            <div className="grid gap-6 max-w-2xl">
              {/* Embeddings Provider */}
              <GlassCard className="p-6">
                <Label className="mb-3 block">{t("embeddingsProvider")}</Label>
                <Select defaultValue="local">
                  <SelectTrigger data-testid="select-embeddings-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="huggingface">Hugging Face</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </GlassCard>

              {/* Image Generation */}
              <GlassCard className="p-6">
                <Label className="mb-3 block">{t("imageGeneration")}</Label>
                <Select defaultValue="off">
                  <SelectTrigger data-testid="select-image-generation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="huggingface">Hugging Face (Stable Diffusion)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </GlassCard>

              {/* Feature Flags */}
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4">{t("featureFlags")}</h3>
                <div className="space-y-4">
                  {[
                    { id: "outfit_ai", label: "Outfit AI" },
                    { id: "image_search", label: "Image Search" },
                    { id: "multilingual", label: "Multilingual Support" },
                    { id: "spell_correction", label: "Spell Correction" },
                    { id: "analytics_stream", label: "Analytics Stream" },
                  ].map((flag) => (
                    <div key={flag.id} className="flex items-center justify-between">
                      <Label htmlFor={flag.id}>{flag.label}</Label>
                      <Switch id={flag.id} defaultChecked data-testid={`switch-${flag.id}`} />
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Index Settings */}
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4">Similarity Index Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dimension">Dimension</Label>
                    <Input id="dimension" type="number" defaultValue="384" data-testid="input-dimension" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metric">Metric</Label>
                    <Select defaultValue="cosine">
                      <SelectTrigger id="metric" data-testid="select-metric">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-xl border-popover-border">
                        <SelectItem value="cosine">Cosine</SelectItem>
                        <SelectItem value="euclidean">Euclidean</SelectItem>
                        <SelectItem value="dot">Dot Product</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topK">Top K Results</Label>
                    <Input id="topK" type="number" defaultValue="20" data-testid="input-topk" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rerank">Enable Re-ranking</Label>
                    <Switch id="rerank" data-testid="switch-rerank" />
                  </div>
                </div>
              </GlassCard>

              {/* Spell Correction */}
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4">{t("spellCorrection")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage synonym dictionary for Arabic and English
                </p>
                <Button variant="outline" data-testid="button-manage-dictionary">
                  <BookOpen className="w-4 h-4 me-2" />
                  Manage Dictionary
                </Button>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Metrics View */}
        {activeView === "metrics" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t("systemMetrics")}</h2>
            
            {/* Endpoint Latency */}
            <GlassCard className="overflow-hidden mb-6">
              <div className="p-6">
                <h3 className="font-semibold mb-4">Endpoint Latency (ms)</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>Route</TableHead>
                    <TableHead>P95</TableHead>
                    <TableHead>P99</TableHead>
                    <TableHead>Requests</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.endpoints.map((endpoint: any) => (
                    <TableRow key={endpoint.route} className="border-white/10">
                      <TableCell className="font-mono text-sm">{endpoint.route}</TableCell>
                      <TableCell>
                        <span className={endpoint.p95 > 250 ? "text-destructive" : "text-primary"}>
                          {endpoint.p95}ms
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={endpoint.p99 > 250 ? "text-destructive" : "text-primary"}>
                          {endpoint.p99}ms
                        </span>
                      </TableCell>
                      <TableCell>{endpoint.count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>

            {/* System Status */}
            <div className="grid md:grid-cols-3 gap-6">
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Index Size</h3>
                </div>
                <p className="text-2xl font-bold" data-testid="text-index-size">{metrics.indexSize}</p>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Last Cron Run</h3>
                </div>
                <p className="text-2xl font-bold" data-testid="text-last-cron">{metrics.lastCron}</p>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Cron Status</h3>
                </div>
                <Badge variant="default" className="text-base" data-testid="badge-cron-status">
                  {metrics.cronStatus}
                </Badge>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Configuration View */}
        {activeView === "config" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">{t("configuration")}</h2>
            <div className="grid gap-6 max-w-2xl">
              {/* SMTP Settings */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{t("smtpSettings")}</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">Host</Label>
                      <Input id="smtp-host" placeholder="smtp.example.com" data-testid="input-smtp-host" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input id="smtp-port" type="number" placeholder="587" data-testid="input-smtp-port" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">Username</Label>
                    <Input id="smtp-user" placeholder="user@example.com" data-testid="input-smtp-user" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-pass">Password</Label>
                    <Input id="smtp-pass" type="password" placeholder="••••••••" data-testid="input-smtp-pass" />
                  </div>
                </div>
              </GlassCard>

              {/* Provider Keys */}
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4">Provider API Keys</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hf-key">Hugging Face API Key</Label>
                    <Input id="hf-key" type="password" placeholder="hf_••••••••" data-testid="input-hf-key" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <Input id="openai-key" type="password" placeholder="sk-••••••••" data-testid="input-openai-key" />
                  </div>
                </div>
              </GlassCard>

              <GlowButton variant="primary" className="w-full" data-testid="button-save-config">
                Save Configuration
              </GlowButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
