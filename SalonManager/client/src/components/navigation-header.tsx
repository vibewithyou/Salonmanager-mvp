import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import type { User } from "@shared/schema";

export default function NavigationHeader() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/90 text-[var(--on-surface)] backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-[var(--primary)] cursor-pointer" data-testid="logo">
                  SalonManager
                </h1>
              </Link>
            </div>
            {isAuthenticated && (
              <nav className="hidden md:ml-8 md:flex space-x-8">
                <Link href="/salons">
                  <a
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      location === "/salons"
                        ? "text-[var(--primary)]"
                        : "text-[var(--on-surface)]/80 hover:text-[var(--primary)]"
                    }`}
                    data-testid="nav-salons"
                  >
                    Salons
                  </a>
                </Link>
                <Link href={user?.role === 'customer' ? '/me/bookings' : '/dashboard'}>
                  <a
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      location === (user?.role === 'customer' ? '/me/bookings' : '/dashboard')
                        ? "text-[var(--primary)]"
                        : "text-[var(--on-surface)]/80 hover:text-[var(--primary)]"
                    }`}
                    data-testid="nav-dashboard"
                  >
                    {user?.role === 'customer' ? 'Meine Termine' : 'Dashboard'}
                  </a>
                </Link>
                {(user?.role === 'salon_owner' || user?.role === 'owner') && (
                  <Link href="/admin">
                    <a
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        location === "/admin"
                          ? "text-[var(--primary)]"
                          : "text-[var(--on-surface)]/80 hover:text-[var(--primary)]"
                      }`}
                      data-testid="nav-admin"
                    >
                      Verwaltung
                    </a>
                  </Link>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
              data-testid="button-theme-toggle"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-[var(--on-surface)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-[var(--on-surface)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
              )}
            </Button>

            {isAuthenticated && user ? (
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/profile')}
                    aria-label="Profil öffnen"
                    className="w-8 h-8 bg-[var(--primary)] text-black rounded-full flex items-center justify-center hover:opacity-90 transition-colors"
                    data-testid="button-profile-icon"
                  >
                    <span className="font-semibold text-sm" data-testid="text-user-initials">
                      {getInitials(user?.firstName, user?.lastName)}
                    </span>
                  </button>
                  <span className="hidden md:block font-medium" data-testid="text-user-name">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="text-sm"
                    data-testid="button-logout"
                  >
                    Abmelden
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="bg-[var(--primary)] hover:opacity-90 text-black"
                data-testid="button-login"
              >
                Anmelden
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
