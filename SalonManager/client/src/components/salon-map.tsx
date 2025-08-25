import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import type { Salon } from "@shared/schema";

// Leaflet types
declare global {
  interface Window {
    L: any;
  }
}

interface SalonMapProps {
  salons: Salon[];
  onBookNow: (salon: Salon) => void;
}

export default function SalonMap({ salons, onBookNow }: SalonMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Load Leaflet dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Initialize map
      const L = window.L;
      const map = L.map(mapRef.current).setView([50.9159, 13.3422], 14);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add salon markers
      salons.forEach((salon) => {
        const marker = L.marker([parseFloat(salon.lat), parseFloat(salon.lng)]).addTo(map);
        
        const popupContent = `
          <div class="p-3 min-w-[200px]">
            <h3 class="font-semibold text-lg mb-2">${salon.name}</h3>
            <p class="text-sm text-gray-600 mb-3">${salon.address}</p>
            <button 
              class="w-full bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              onclick="window.dispatchEvent(new CustomEvent('salon-book', { detail: '${salon.id}' }))"
            >
              Termin buchen
            </button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
      });

      // Listen for booking events from popups
      const handleBookingEvent = (event: any) => {
        const salonId = event.detail;
        const salon = salons.find(s => s.id === salonId);
        if (salon) {
          onBookNow(salon);
        }
      };

      window.addEventListener('salon-book', handleBookingEvent);

      return () => {
        window.removeEventListener('salon-book', handleBookingEvent);
      };
    };

    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [salons, onBookNow]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-96 rounded-xl shadow-lg mb-8 bg-gray-100 dark:bg-dark-800"
      data-testid="salon-map"
    />
  );
}
