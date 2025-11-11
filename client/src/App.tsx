import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Search from "@/pages/Search";
import Brands from "@/pages/Brands";
import BrandDetails from "@/pages/BrandDetails";
import ProductPage from "@/pages/ProductPage";
import OutfitBuilder from "@/pages/OutfitBuilder";
import Profile from "@/pages/Profile";
import MerchantDashboard from "@/pages/merchant/MerchantDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import MerchantStore from "@/pages/MerchantStore";
import NotFound from "@/pages/not-found";
import StaticPage from "@/pages/StaticPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/search" component={Search} />
      <Route path="/brands" component={Brands} />
      <Route path="/brand/:id" component={BrandDetails} />
      <Route path="/store/:id" component={MerchantStore} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/pages/:slug" component={StaticPage} />
      <Route path="/outfit-builder">
        {() => (
          <ProtectedRoute>
            <OutfitBuilder />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/merchant">
        {() => (
          <ProtectedRoute roles={["merchant", "admin", "owner"]}>
            <MerchantDashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <ProtectedRoute roles={["admin", "owner"]}>
            <AdminDashboard />
          </ProtectedRoute>
        )}
      </Route>
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
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1">
                  <Router />
                </main>
                <Footer />
              </div>
              <Toaster />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
