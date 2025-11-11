import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Navbar } from "@/components/layout/Navbar";

import Home from "@/pages/Home";
import Search from "@/pages/Search";
import ProductPage from "@/pages/ProductPage";
import OutfitBuilder from "@/pages/OutfitBuilder";
import Profile from "@/pages/Profile";
import MerchantDashboard from "@/pages/merchant/MerchantDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/outfit-builder" component={OutfitBuilder} />
      <Route path="/profile" component={Profile} />
      <Route path="/merchant" component={MerchantDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LanguageProvider>
            <Navbar />
            <Router />
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
