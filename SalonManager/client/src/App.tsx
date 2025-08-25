import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import About from "@/pages/about";
import Salons from "@/pages/salons";
import SalonDetail from "@/pages/salon-detail";
import SalonBooking from "@/pages/salon-booking";
import Profile from "@/pages/profile";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      ) : (
        <>
          {/* Public routes - available for everyone */}
          <Route path="/" component={isAuthenticated ? Home : Landing} />
          <Route path="/about" component={About} />
          <Route path="/salons" component={Salons} />
          <Route path="/salon/:slug" component={SalonDetail} />
          <Route path="/salon/:slug/book" component={SalonBooking} />
          
          {/* Protected routes - only for authenticated users */}
          {isAuthenticated && (
            <>
              <Route path="/profile" component={Profile} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/admin" component={Admin} />
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
