import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import type { User } from "@shared/schema";

export default function NavigationHeader() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-dark-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-gold-500 cursor-pointer" data-testid="logo">
                  SalonManager
                </h1>
              </Link>
            </div>
            {isAuthenticated && (
              <nav className="hidden md:ml-8 md:flex space-x-8">
                <Link href="/">
                  <a className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location === "/" 
                      ? "text-gold-500" 
                      : "text-gray-700 dark:text-gray-300 hover:text-gold-500"
                  }`} data-testid="nav-salons">
                    Salons
                  </a>
                </Link>
                <Link href="/dashboard">
                  <a className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location === "/dashboard" 
                      ? "text-gold-500" 
                      : "text-gray-700 dark:text-gray-300 hover:text-gold-500"
                  }`} data-testid="nav-dashboard">
                    {user?.role === 'customer' ? 'Meine Termine' : 'Dashboard'}
                  </a>
                </Link>
                {(user?.role === 'salon_owner' || user?.role === 'owner') && (
                  <Link href="/admin">
                    <a className={`px-3 py-2 text-sm font-medium transition-colors ${
                      location === "/admin" 
                        ? "text-gold-500" 
                        : "text-gray-700 dark:text-gray-300 hover:text-gold-500"
                    }`} data-testid="nav-admin">
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
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              data-testid="button-theme-toggle"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
              )}
            </Button>

            {isAuthenticated && user ? (
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <Link href="/profile">
                    <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-gold-600 transition-colors" data-testid="button-profile-icon">
                      <span className="text-dark-900 font-semibold text-sm" data-testid="text-user-initials">
                        {getInitials(user?.firstName, user?.lastName)}
                      </span>
                    </div>
                  </Link>
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
                className="bg-gold-500 hover:bg-gold-600 text-dark-900"
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
