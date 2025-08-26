import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import BookingWizard from "@/components/booking-wizard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { SalonWithDetails } from "@shared/schema";

export default function SalonBooking() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [showBookingModal, setShowBookingModal] = useState(true);

  const { data: salon, isLoading } = useQuery<SalonWithDetails>({
    queryKey: [`/api/v1/salons/${id}`],
    enabled: !!id,
  });

  useEffect(() => {
    if (!showBookingModal) {
      // Navigate back to salon detail when booking modal closes
      setLocation(`/salon/${id}`);
    }
  }, [showBookingModal, id, setLocation]);

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

  if (!salon) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Salon nicht gefunden</h1>
            <p className="text-muted-foreground mb-6">
              Der gewünschte Salon konnte nicht gefunden werden.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/salons">
                <Button data-testid="button-back-salons">Alle Salons</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" data-testid="button-back-home">Zur Startseite</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      {/* Fallback content if booking modal is not shown */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            Termin buchen bei <span className="text-gold-500">{salon.name}</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Wählen Sie Ihre gewünschte Leistung und buchen Sie Ihren Termin
          </p>
          <Button 
            onClick={() => setShowBookingModal(true)}
            className="bg-gold-500 hover:bg-gold-600 text-dark-900"
            data-testid="button-start-booking"
          >
            Buchung starten
          </Button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingWizard
          salon={salon}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
}