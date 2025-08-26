import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Salon, Service, Stylist, User } from "@shared/schema";

interface BookingWizardProps {
  salon: Salon;
  isOpen: boolean;
  onClose: () => void;
}

interface TimeSlot {
  time: string;
  stylistId: string;
}

export default function BookingWizard({ salon, isOpen, onClose }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [note, setNote] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: [`/api/v1/salons/${salon.id}/services`],
    enabled: isOpen,
  });

  const { data: stylists = [] } = useQuery<(Stylist & { user: User })[]>({
    queryKey: [`/api/v1/salons/${salon.id}/stylists`],
    enabled: isOpen,
  });

  const { data: availableSlots = [] } = useQuery<TimeSlot[]>({
    queryKey: [`/api/v1/salons/${salon.id}/slots`, selectedService?.id, selectedDate, selectedStylist],
    enabled: !!selectedService && !!selectedDate,
    queryFn: async () => {
      const params = new URLSearchParams({
        service_id: selectedService!.id,
        date: selectedDate,
        ...(selectedStylist && selectedStylist !== 'any' ? { stylist_id: selectedStylist } : {})
      });
      
      const response = await fetch(`/api/v1/salons/${salon.id}/slots?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return await apiRequest('POST', `/api/v1/salons/${salon.id}/bookings`, bookingData);
    },
    onSuccess: () => {
      toast({
        title: "Termin erfolgreich gebucht",
        description: "Ihr Termin wurde erfolgreich gebucht und wartet auf Bestätigung.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/me/bookings'] });
      handleClose();
      window.location.href = '/me/bookings';
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Anmeldung erforderlich",
          description: "Sie müssen sich anmelden, um einen Termin zu buchen.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
        return;
      }
      toast({
        title: "Fehler beim Buchen",
        description: "Der Termin konnte nicht gebucht werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedService(null);
    setSelectedStylist(undefined);
    setSelectedDate('');
    setSelectedTime(null);
    setNote('');
    onClose();
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!selectedService || !selectedTime || !selectedDate) {
      toast({
        title: "Unvollständige Auswahl",
        description: "Bitte wählen Sie alle erforderlichen Optionen aus.",
        variant: "destructive",
      });
      return;
    }

    const bookingDateTime = new Date(`${selectedDate}T${selectedTime.time}`);
    
    createBookingMutation.mutate({
      serviceId: selectedService.id,
      stylistId: selectedTime.stylistId !== 'any' ? selectedTime.stylistId : null,
      startsAt: bookingDateTime.toISOString(),
      note: note || null,
    });
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden" data-testid="booking-wizard">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Termin buchen</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
              data-testid="button-close-booking"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </Button>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center mt-4 space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep >= 1 ? 'bg-[var(--primary)] text-black' : 'bg-[var(--muted)]'
              }`}>
                1
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= 1 ? '' : 'text-[var(--on-surface)]/50'}`}>
                Service
              </span>
            </div>
            <div className="flex-1 h-px bg-[var(--border)]"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep >= 2 ? 'bg-[var(--primary)] text-black' : 'bg-[var(--muted)]'
              }`}>
                2
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= 2 ? '' : 'text-[var(--on-surface)]/50'}`}>
                Stylist
              </span>
            </div>
            <div className="flex-1 h-px bg-[var(--border)]"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep >= 3 ? 'bg-[var(--primary)] text-black' : 'bg-[var(--muted)]'
              }`}>
                3
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= 3 ? '' : 'text-[var(--on-surface)]/50'}`}>
                Termin
              </span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <div data-testid="booking-step-1">
              <h4 className="text-lg font-semibold mb-4">Wählen Sie einen Service</h4>
              <div className="space-y-3">
                {services.map((service) => (
                  <label key={service.id} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="service"
                      value={service.id}
                      checked={selectedService?.id === service.id}
                      onChange={() => setSelectedService(service)}
                      className="sr-only"
                      data-testid={`radio-service-${service.id}`}
                    />
                    <div className={`p-4 border-2 rounded-lg transition-all ${
                      selectedService?.id === service.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--primary)]'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold" data-testid="text-service-title">{service.title}</h5>
                          <p className="text-sm text-[var(--on-surface)]/70">
                            Professionelle Friseurdienstleistung
                          </p>
                          <p className="text-sm text-[var(--on-surface)]/70 mt-1">
                            Dauer: {service.durationMin} Min
                          </p>
                        </div>
                        <span className="text-xl font-bold text-[var(--primary)]" data-testid="text-service-price">
                          {(service.priceCents / 100).toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Stylist Selection */}
          {currentStep === 2 && (
            <div data-testid="booking-step-2">
              <h4 className="text-lg font-semibold mb-4">Wählen Sie einen Stylisten (Optional)</h4>
              <div className="space-y-3">
                {/* Any stylist option */}
                <label className="block cursor-pointer">
                  <input
                    type="radio"
                    name="stylist"
                    value="any"
                    checked={selectedStylist === 'any'}
                    onChange={() => setSelectedStylist('any')}
                    className="sr-only"
                    data-testid="radio-stylist-any"
                  />
                  <div className={`p-4 border-2 rounded-lg transition-all ${
                    selectedStylist === 'any'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--border)] hover:border-[var(--primary)]'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[var(--primary)] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold">Beliebiger Stylist</h5>
                        <p className="text-sm text-[var(--on-surface)]/70">
                          Lassen Sie uns den besten verfügbaren Stylisten für Sie auswählen
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Individual stylists */}
                {stylists.map((stylist) => (
                  <label key={stylist.id} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="stylist"
                      value={stylist.id}
                      checked={selectedStylist === stylist.id}
                      onChange={() => setSelectedStylist(stylist.id)}
                      className="sr-only"
                      data-testid={`radio-stylist-${stylist.id}`}
                    />
                    <div className={`p-4 border-2 rounded-lg transition-all ${
                      selectedStylist === stylist.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--primary)]'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[var(--primary)] rounded-full flex items-center justify-center">
                          <span className="text-black font-semibold text-lg">
                            {stylist.displayName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold" data-testid="text-stylist-name">{stylist.displayName}</h5>
                          <p className="text-sm text-[var(--on-surface)]/70">
                            {stylist.isApprentice ? 'Azubi' : 'Stylist'}
                          </p>
                          <div className="flex items-center mt-1">
                            <div className="flex text-[var(--primary)]">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-[var(--on-surface)]/70">4.9</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Date & Time Selection */}
          {currentStep === 3 && (
            <div data-testid="booking-step-3">
              <h4 className="text-lg font-semibold mb-4">Wählen Sie Datum und Uhrzeit</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="booking-date" className="block text-sm font-medium mb-2">
                    Datum auswählen
                  </Label>
                  <Input
                    id="booking-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className="w-full"
                    data-testid="input-booking-date"
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium mb-2">Verfügbare Zeiten</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                    {selectedDate && availableSlots.length === 0 && (
                      <div className="col-span-2 text-center py-4 text-[var(--on-surface)]/70">
                        Keine verfügbaren Termine für dieses Datum
                      </div>
                    )}
                    {availableSlots.map((slot, index) => (
                      <label key={index} className="block cursor-pointer">
                        <input
                          type="radio"
                          name="time-slot"
                          value={`${slot.time}-${slot.stylistId}`}
                          checked={selectedTime?.time === slot.time && selectedTime?.stylistId === slot.stylistId}
                          onChange={() => setSelectedTime(slot)}
                          className="sr-only"
                          data-testid={`radio-time-${slot.time}`}
                        />
                        <div className={`p-2 text-center border rounded-lg text-sm transition-all ${
                          selectedTime?.time === slot.time && selectedTime?.stylistId === slot.stylistId
                            ? 'border-gold-400 bg-gold-50 dark:bg-gold-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gold-400'
                        }`}>
                          {slot.time}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="booking-note" className="block text-sm font-medium mb-2">
                  Notiz (Optional)
                </Label>
                <Textarea
                  id="booking-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Besondere Wünsche oder Anmerkungen..."
                  data-testid="textarea-booking-note"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
            data-testid="button-booking-prev"
          >
            Zurück
          </Button>
          <div className="space-x-3">
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !selectedService) ||
                  (currentStep === 2 && !selectedStylist)
                }
                className="bg-gold-500 hover:bg-gold-600 text-dark-900"
                data-testid="button-booking-next"
              >
                Weiter
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!selectedService || !selectedTime || !selectedDate || createBookingMutation.isPending}
                className="bg-gold-500 hover:bg-gold-600 text-dark-900"
                data-testid="button-booking-submit"
              >
                {createBookingMutation.isPending ? 'Wird gebucht...' : 'Termin buchen'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
