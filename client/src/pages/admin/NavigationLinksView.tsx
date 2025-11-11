import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertNavLinkSchema, type NavLink } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, ChevronUp, ChevronDown, Edit, Trash2, Loader2 } from "lucide-react";

const navLinkFormSchema = insertNavLinkSchema.extend({
  order: z.number().int().min(0).optional(),
});

export function NavigationLinksView() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<NavLink | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    linkId?: string;
    linkLabel?: string;
  }>({ open: false });

  // Fetch nav links
  const { data: navLinks = [], isLoading } = useQuery<NavLink[]>({
    queryKey: ["/api/admin/nav-links"],
  });

  // Create mutation
  const createLink = useMutation({
    mutationFn: async (data: z.infer<typeof navLinkFormSchema>) => {
      await apiRequest("POST", "/api/admin/nav-links", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nav-links"] });
      toast({ title: "Success", description: "Navigation link created" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create link", variant: "destructive" });
    },
  });

  // Update mutation
  const updateLink = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof navLinkFormSchema> }) => {
      await apiRequest("PATCH", `/api/admin/nav-links/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nav-links"] });
      toast({ title: "Success", description: "Navigation link updated" });
      setDialogOpen(false);
      setEditingLink(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update link", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/nav-links/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nav-links"] });
      toast({ title: "Success", description: "Navigation link deleted" });
      setDeleteConfirm({ open: false });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete link", variant: "destructive" });
    },
  });

  // Reorder mutation
  const reorderLinks = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      await apiRequest("PATCH", "/api/admin/nav-links/batch/reorder", { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nav-links"] });
      toast({ title: "Success", description: "Links reordered" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reorder links", variant: "destructive" });
    },
  });

  // Move link up/down
  const moveLink = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === navLinks.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const sorted = [...navLinks].sort((a, b) => a.order - b.order);
    
    // Swap orders
    const updates = [
      { id: sorted[index].id, order: sorted[newIndex].order },
      { id: sorted[newIndex].id, order: sorted[index].order },
    ];

    reorderLinks.mutate(updates);
  };

  const form = useForm<z.infer<typeof navLinkFormSchema>>({
    resolver: zodResolver(navLinkFormSchema),
    defaultValues: {
      labelEn: "",
      labelAr: "",
      path: "",
      order: navLinks.length,
    },
  });

  const onSubmit = (data: z.infer<typeof navLinkFormSchema>) => {
    if (editingLink) {
      updateLink.mutate({ id: editingLink.id, data });
    } else {
      createLink.mutate(data);
    }
  };

  const handleAddClick = () => {
    form.reset({
      labelEn: "",
      labelAr: "",
      path: "",
      order: navLinks.length,
    });
    setEditingLink(null);
    setDialogOpen(true);
  };

  const handleEditClick = (link: NavLink) => {
    form.reset({
      labelEn: link.labelEn,
      labelAr: link.labelAr,
      path: link.path,
      order: link.order,
    });
    setEditingLink(link);
    setDialogOpen(true);
  };

  const sortedLinks = [...navLinks].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Navigation Management</h2>
        <GlowButton variant="primary" onClick={handleAddClick} data-testid="button-add-nav-link">
          <Plus className="w-4 h-4 me-2" />
          Add Link
        </GlowButton>
      </div>

      <GlassCard className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Loading navigation links...</div>
        ) : sortedLinks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No navigation links yet. Click "Add Link" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label (English)</TableHead>
                <TableHead>Label (Arabic)</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLinks.map((link, index) => (
                <TableRow key={link.id} data-testid={`row-nav-link-${link.id}`}>
                  <TableCell>{link.labelEn}</TableCell>
                  <TableCell dir="rtl">{link.labelAr}</TableCell>
                  <TableCell className="font-mono text-sm">{link.path}</TableCell>
                  <TableCell>{link.order}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveLink(index, "up")}
                        disabled={index === 0 || reorderLinks.isPending}
                        data-testid={`button-move-up-${link.id}`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveLink(index, "down")}
                        disabled={index === sortedLinks.length - 1 || reorderLinks.isPending}
                        data-testid={`button-move-down-${link.id}`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditClick(link)}
                        data-testid={`button-edit-${link.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteConfirm({ open: true, linkId: link.id, linkLabel: link.labelEn })}
                        data-testid={`button-delete-${link.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-card-border">
          <DialogHeader>
            <DialogTitle>{editingLink ? "Edit Navigation Link" : "Create Navigation Link"}</DialogTitle>
            <DialogDescription>
              {editingLink ? "Update the navigation link details" : "Add a new link to the navigation menu"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="labelEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label (English)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Home" data-testid="input-label-en" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="labelAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label (Arabic)</FormLabel>
                    <FormControl>
                      <Input {...field} dir="rtl" placeholder="الرئيسية" data-testid="input-label-ar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Path</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="/home" data-testid="input-path" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-order" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-nav-dialog"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLink.isPending || updateLink.isPending}
                  data-testid="button-submit-nav-dialog"
                >
                  {(createLink.isPending || updateLink.isPending) && <Loader2 className="w-4 h-4 animate-spin me-2" />}
                  {editingLink ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-card-border">
          <DialogHeader>
            <DialogTitle>Delete Navigation Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm.linkLabel}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ open: false })}
              disabled={deleteLink.isPending}
              data-testid="button-cancel-delete-nav"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm.linkId && deleteLink.mutate(deleteConfirm.linkId)}
              disabled={deleteLink.isPending}
              data-testid="button-confirm-delete-nav"
            >
              {deleteLink.isPending && <Loader2 className="w-4 h-4 animate-spin me-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
