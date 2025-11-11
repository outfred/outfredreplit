import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStaticPageSchema } from "@shared/schema";
import type { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type StaticPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaDescription: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function StaticPagesView() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);

  const { data: pages = [], isLoading } = useQuery<StaticPage[]>({
    queryKey: ["/api/admin/pages"],
  });

  const form = useForm<z.infer<typeof insertStaticPageSchema>>({
    resolver: zodResolver(insertStaticPageSchema),
    defaultValues: {
      slug: "",
      title: "",
      content: "",
      metaDescription: "",
      isPublished: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertStaticPageSchema>) => {
      return await apiRequest("POST", "/api/admin/pages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: "Page created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create page", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StaticPage> }) => {
      return await apiRequest("PATCH", `/api/admin/pages/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: "Page updated successfully" });
      setIsDialogOpen(false);
      setEditingPage(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update page", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: "Page deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete page", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (page: StaticPage) => {
    setEditingPage(page);
    form.reset({
      slug: page.slug,
      title: page.title,
      content: page.content,
      metaDescription: page.metaDescription || "",
      isPublished: page.isPublished,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: z.infer<typeof insertStaticPageSchema>) => {
    if (editingPage) {
      updateMutation.mutate({ id: editingPage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Static Pages</h2>
          <p className="text-muted-foreground">Manage privacy policy, contact, and other static pages</p>
        </div>
        <Button onClick={() => { setEditingPage(null); form.reset(); setIsDialogOpen(true); }} data-testid="button-create-page">
          <Plus className="w-4 h-4 mr-2" />
          Create Page
        </Button>
      </div>

      <div className="grid gap-4">
        {pages.map((page) => (
          <GlassCard key={page.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{page.title}</h3>
                <p className="text-sm text-muted-foreground">/pages/{page.slug}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {page.isPublished ? "✓ Published" : "× Draft"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(page)} data-testid={`button-edit-${page.slug}`}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(page.id)} data-testid={`button-delete-${page.slug}`}>
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? "Edit Page" : "Create Page"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL path)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="privacy-policy" disabled={!!editingPage} data-testid="input-slug" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Privacy Policy" data-testid="input-title" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content (HTML)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={8} placeholder="<h1>...</h1>" className="font-mono text-sm" data-testid="input-content" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="SEO description" data-testid="input-meta-description" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormLabel>Published</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-published" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-page">
                  {editingPage ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
