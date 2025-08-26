import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-app text-on">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2048&h=1024')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-[var(--on-surface)]">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Dein Salon. Deine Buchung. Dein Style.
          </h1>
          <p className="text-lg sm:text-xl opacity-90 mb-8">
            Finde den passenden Salon in Freiberg und buche deinen Termin direkt online.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/salons')}
              className="px-6 py-3 rounded-md bg-[var(--primary)] text-black font-medium hover:opacity-90"
            >
              Salons entdecken
            </button>
            <button
              onClick={() => navigate('/about')}
              className="px-6 py-3 rounded-md border border-[var(--on-surface)] text-[var(--on-surface)] hover:bg-[var(--muted)]"
            >
              Mehr erfahren
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[var(--on-surface)] mb-4">
              Warum SalonManager?
            </h2>
            <p className="text-xl text-[var(--on-surface)]/70 max-w-3xl mx-auto">
              Die moderne Lösung für Terminbuchungen und Salon-Verwaltung
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Online Terminbuchung</h3>
                <p className="text-[var(--on-surface)]/70">
                  Buchen Sie Ihren Termin einfach und bequem online, 24/7 verfügbar
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Salon-Finder</h3>
                <p className="text-[var(--on-surface)]/70">
                  Finden Sie den perfekten Salon in Ihrer Nähe mit unserer interaktiven Karte
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Mobile App</h3>
                <p className="text-[var(--on-surface)]/70">
                  Installieren Sie unsere PWA für eine App-ähnliche Erfahrung auf allen Geräten
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
