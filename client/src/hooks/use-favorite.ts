import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export function useFavorite(productId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  // Check if product is favorited
  const { data: favoriteStatus } = useQuery<{ isFavorite: boolean }>({
    queryKey: ["/api/favorites", productId],
    queryFn: async () => {
      const res = await fetch(`/api/favorites/${productId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check favorite");
      return res.json();
    },
    enabled: !!user && !!productId,
  });

  const isFavorite = favoriteStatus?.isFavorite || false;

  // Add to favorites
  const addMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/favorites", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", user?.id] });
      toast({
        title: language === "ar" ? "تمت الإضافة إلى المفضلة" : "Added to favorites",
      });
    },
    onError: () => {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشلت إضافة المنتج إلى المفضلة" : "Failed to add to favorites",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites
  const removeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/favorites/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", user?.id] });
      toast({
        title: language === "ar" ? "تمت الإزالة من المفضلة" : "Removed from favorites",
      });
    },
    onError: () => {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشلت إزالة المنتج من المفضلة" : "Failed to remove from favorites",
        variant: "destructive",
      });
    },
  });

  // Toggle favorite
  const toggleFavorite = () => {
    if (!user) {
      toast({
        title: language === "ar" ? "يرجى تسجيل الدخول" : "Please login",
        description: language === "ar" ? "يجب تسجيل الدخول لحفظ المفضلة" : "You need to login to save favorites",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    if (isFavorite) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  return {
    isFavorite,
    toggleFavorite,
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}
