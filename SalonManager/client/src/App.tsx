import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import Landing from "@/pages/landing";
import About from "@/pages/about";
import Salons from "@/pages/salons";
import SalonDetail from "@/pages/salon-detail";
import SalonBooking from "@/pages/salon-booking";
import Profile from "@/pages/profile";
import MyBookings from "@/pages/my-bookings";
import AdminTodayPage from "@/pages/admin-today";
import AdminServicesPage from "@/pages/admin-services";
import AdminStylistsPage from "@/pages/admin-stylists";
import AdminWorkHoursPage from "@/pages/admin-workhours";
import AdminAbsencesPage from "@/pages/admin-absences";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/about" component={About} />
            <Route path="/salons" component={Salons} />
            <Route path="/salon/:id" component={SalonDetail} />
            <Route path="/salon/:id/book" component={SalonBooking} />
            <Route path="/profile" component={Profile} />
            <Route path="/me/bookings" component={MyBookings} />
            <Route path="/admin/today" component={AdminTodayPage} />
            <Route path="/admin/services" component={AdminServicesPage} />
            <Route path="/admin/stylists" component={AdminStylistsPage} />
            <Route path="/admin/workhours" component={AdminWorkHoursPage} />
            <Route path="/admin/absences" component={AdminAbsencesPage} />
            <Route>{() => <div style={{ padding: 24 }}>404 – Seite nicht gefunden</div>}</Route>
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
