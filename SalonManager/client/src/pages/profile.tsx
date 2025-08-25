import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import NavigationHeader from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Nicht angemeldet",
        description: "Sie werden zur Anmeldung weitergeleitet...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Nicht angemeldet</h1>
            <p className="text-muted-foreground mb-6">
              Sie werden automatisch zur Anmeldung weitergeleitet...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'Plattform-Administrator';
      case 'salon_owner':
        return 'Salon-Besitzer';
      case 'stylist':
        return 'Stylist';
      case 'customer':
        return 'Kunde';
      default:
        return 'Benutzer';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mein Profil</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Kontoeinstellungen und Präferenzen
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Persönliche Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center">
                    <span className="text-dark-900 font-bold text-xl" data-testid="text-user-initials">
                      {getInitials(user?.firstName, user?.lastName)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" data-testid="text-user-name">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-muted-foreground" data-testid="text-user-role">
                      {getRoleDisplayName(user?.role)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">E-Mail</label>
                    <p className="font-medium" data-testid="text-user-email">{user?.email || 'Nicht angegeben'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mitglied seit</label>
                    <p className="font-medium" data-testid="text-user-created">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('de-DE') : 'Unbekannt'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meine Aktivitäten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Meine Termine</span>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" data-testid="button-view-bookings">
                      Termine anzeigen
                    </Button>
                  </Link>
                </div>
                {(user?.role === 'salon_owner' || user?.role === 'owner') && (
                  <div className="flex items-center justify-between">
                    <span>Salon-Verwaltung</span>
                    <Link href="/admin">
                      <Button variant="outline" size="sm" data-testid="button-view-admin">
                        Verwaltung öffnen
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Einstellungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Design</p>
                    <p className="text-sm text-muted-foreground">
                      {theme === 'dark' ? 'Dunkles Design' : 'Helles Design'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTheme}
                    data-testid="button-toggle-theme"
                  >
                    Wechseln
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    data-testid="button-settings-placeholder"
                  >
                    Weitere Einstellungen (Demo)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Konto</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full"
                  data-testid="button-logout"
                >
                  Abmelden
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}