import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import SalonMap from "@/components/salon-map";
import SalonGrid from "@/components/salon-grid";
import BookingWizard from "@/components/booking-wizard";
import { Button } from "@/components/ui/button";
import type { Salon } from "@shared/schema";

export default function Home() {
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app text-on">
      <NavigationHeader />
      
      {/* Hero Section */}
      <section className="relative bg-[var(--surface)] text-[var(--on-surface)] py-16">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?ixlib=rb-4.0.3&auto=format&fit=crop&w=2048&h=1024')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Finden Sie Ihren <span className="text-[var(--primary)]">perfekten</span> Friseur
          </h2>
          <p className="text-xl md:text-2xl text-[var(--on-surface)]/70 mb-8 max-w-3xl mx-auto">
            Entdecken Sie die besten Salons in Freiberg und buchen Sie Ihren Termin online
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/salons">
              <Button
                className="bg-[var(--primary)] hover:opacity-90 text-black px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
                data-testid="button-book-now"
              >
                Jetzt Termin buchen
              </Button>
            </Link>
            <Link href="/salons">
              <Button
                variant="outline"
                className="border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-black px-8 py-4 rounded-xl font-semibold text-lg transition-all"
                data-testid="button-discover-salons"
              >
                Salons entdecken
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* View Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Salons in Freiberg</h3>
          <div className="flex bg-gray-100 dark:bg-dark-800 rounded-xl p-1">
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'map' 
                  ? 'bg-gold-500 text-dark-900' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
                  ? 'bg-gold-500 text-dark-900' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
