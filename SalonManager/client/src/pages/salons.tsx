import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import SalonMap from "@/components/salon-map";
import SalonGrid from "@/components/salon-grid";
import BookingWizard from "@/components/booking-wizard";
import { Button } from "@/components/ui/button";
import type { Salon } from "@shared/schema";

export default function Salons() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);

  const { data: salons = [], isLoading } = useQuery<Salon[]>({
    queryKey: ['/api/v1/salons'],
  });

  const handleBookNow = (salon: Salon) => {
    setSelectedSalon(salon);
    setShowBookingModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app">
        <NavigationHeader />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--primary)]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app text-on">
      <NavigationHeader />

      {/* Header Section */}
      <div className="bg-[var(--surface)] text-[var(--on-surface)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Salons in <span className="text-[var(--primary)]">Freiberg</span>
            </h1>
            <p className="text-xl text-[var(--on-surface)]/70 mb-6">
              Entdecken Sie {salons.length} Salons und buchen Sie Ihren perfekten Termin
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Alle Salons</h2>
          <div className="flex bg-[var(--muted)] rounded-xl p-1">
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'map'
                  ? 'bg-[var(--primary)] text-black'
                  : 'text-[var(--on-surface)]/70 hover:text-[var(--on-surface)]'
              }`}
              onClick={() => setViewMode('map')}
              data-testid="button-map-view"
            >
              Kartenansicht
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-[var(--primary)] text-black'
                  : 'text-[var(--on-surface)]/70 hover:text-[var(--on-surface)]'
              }`}
              onClick={() => setViewMode('list')}
              data-testid="button-list-view"
            >
              Listenansicht
            </Button>
          </div>
        </div>

        {/* Map or List View */}
        {viewMode === 'map' ? (
          <div className="animate-fade-in">
            <SalonMap salons={salons} onBookNow={handleBookNow} />
          </div>
        ) : (
          <div className="animate-fade-in">
            <SalonGrid salons={salons} onBookNow={handleBookNow} />
          </div>
        )}

        {/* Empty State */}
        {salons.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-2xl font-bold text-[var(--on-surface)]/60 mb-4">Keine Salons gefunden</h3>
            <p className="text-[var(--on-surface)]/70 mb-6">
              Zur Zeit sind keine Salons in dieser Region verfügbar.
            </p>
            <Link href="/">
              <Button variant="outline" data-testid="button-back-home">
                Zurück zur Startseite
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSalon && (
        <BookingWizard
          salon={selectedSalon}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedSalon(null);
          }}
        />
      )}
    </div>
  );
}