import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Salon } from "@shared/schema";

interface SalonGridProps {
  salons: Salon[];
  onBookNow: (salon: Salon) => void;
}

export default function SalonGrid({ salons, onBookNow }: SalonGridProps) {
  const getSalonImage = (salonName: string) => {
    // Different images for each salon based on name
    if (salonName.includes('BARBERs')) {
      return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400';
    } else if (salonName.includes('Haarschneiderei')) {
      return 'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400';
    } else {
      return 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400';
    }
  };

  if (salons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Keine Salons gefunden
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Es sind derzeit keine Salons verfügbar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="salon-grid">
      {salons.map((salon) => (
        <Card 
          key={salon.id} 
          className="border-0 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          data-testid={`salon-card-${salon.id}`}
        >
          <img 
            src={getSalonImage(salon.name)}
            alt={`${salon.name} Salon Interior`}
            className="w-full h-48 object-cover rounded-t-xl"
          />
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-xl font-bold" data-testid="text-salon-name">
                {salon.name}
              </h4>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">4.8</span>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4" data-testid="text-salon-address">
              {salon.address}
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Herrenhaarschnitt</span>
                <span className="font-semibold">60,00 €</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Damenschnitt</span>
                <span className="font-semibold">60,00 €</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Färben</span>
                <span className="font-semibold">60,00 €</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                className="flex-1 bg-gold-500 hover:bg-gold-600 text-dark-900 font-semibold transition-all"
                onClick={() => onBookNow(salon)}
                data-testid="button-book-appointment"
              >
                Termin buchen
              </Button>
              <Button 
                variant="outline"
                className="px-4 py-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
                onClick={() => window.open(`/salon/${salon.slug}`, '_blank')}
                data-testid="button-salon-details"
              >
                Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
