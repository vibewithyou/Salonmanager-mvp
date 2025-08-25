import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import NavigationHeader from "@/components/navigation-header";
import BookingWizard from "@/components/booking-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SalonWithDetails } from "@shared/schema";

export default function SalonDetail() {
  const { slug } = useParams();
  const [showBookingModal, setShowBookingModal] = useState(false);

  const { data: salon, isLoading } = useQuery<SalonWithDetails>({
    queryKey: [`/api/v1/salons/${slug}`],
  });

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Salon nicht gefunden
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Der angeforderte Salon konnte nicht gefunden werden.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Salon Header */}
        <div className="mb-8">
          <div className="relative h-64 rounded-xl overflow-hidden mb-6">
            <img 
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400"
              alt={salon.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-4xl font-bold mb-2" data-testid="text-salon-name">{salon.name}</h1>
              <p className="text-xl" data-testid="text-salon-address">{salon.address}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <div className="flex items-center space-x-1">
                  <svg className="w-5 h-5 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <span className="font-semibold">4.8</span>
                  <span className="text-gray-600 dark:text-gray-400">(127 Bewertungen)</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span data-testid="text-salon-phone">{salon.phone}</span>
                <span data-testid="text-salon-email">{salon.email}</span>
              </div>
            </div>
            <Button
              className="bg-gold-500 hover:bg-gold-600 text-dark-900 px-8 py-3 text-lg font-semibold"
              onClick={() => setShowBookingModal(true)}
              data-testid="button-book-appointment"
            >
              Termin buchen
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Services */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Services</h2>
                <div className="space-y-4">
                  {salon.services.map((service) => (
                    <div 
                      key={service.id} 
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gold-400 transition-colors"
                      data-testid={`service-${service.id}`}
                    >
                      <div>
                        <h3 className="font-semibold text-lg" data-testid="text-service-title">{service.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Dauer: {service.durationMin} Min
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gold-500" data-testid="text-service-price">
                          {(service.priceCents / 100).toFixed(2)} €
                        </span>
                        {service.active && (
                          <Badge variant="secondary" className="ml-2">
                            Verfügbar
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stylists */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Unser Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {salon.stylists.map((stylist) => (
                    <div 
                      key={stylist.id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      data-testid={`stylist-${stylist.id}`}
                    >
                      <div className="w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center">
                        <span className="text-dark-900 font-semibold text-lg">
                          {stylist.displayName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold" data-testid="text-stylist-name">{stylist.displayName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {stylist.isApprentice ? 'Azubi' : 'Stylist'}
                        </p>
                        <div className="flex items-center mt-1">
                          <div className="flex text-gold-500">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                              </svg>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">4.9</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Opening Hours */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Öffnungszeiten</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Montag - Freitag</span>
                    <span>09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Samstag</span>
                    <span>10:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sonntag</span>
                    <span className="text-red-500">Geschlossen</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Kontakt</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    <span>{salon.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <span>{salon.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>{salon.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
