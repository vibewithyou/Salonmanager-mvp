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

      <section className="py-16 bg-[var(--surface)] text-[var(--on-surface)]">
        <div className="max-w-6xl mx-auto px-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Tile 1 */}
          <div className="p-6 rounded-lg border border-[var(--border)] shadow-sm bg-[var(--bg)]">
            <div className="text-3xl mb-4">💇‍♂️</div>
            <h3 className="text-xl font-semibold mb-2">Schnelle Terminbuchung</h3>
            <p className="opacity-80 text-sm">
              Wähle Service & Uhrzeit in wenigen Klicks – direkt online buchen.
            </p>
          </div>

          {/* Tile 2 */}
          <div className="p-6 rounded-lg border border-[var(--border)] shadow-sm bg-[var(--bg)]">
            <div className="text-3xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-2">Salons finden & vergleichen</h3>
            <p className="opacity-80 text-sm">
              Finde Salons auf der Karte, sieh dir Details & Leistungen sofort an.
            </p>
          </div>

          {/* Tile 3 */}
          <div className="p-6 rounded-lg border border-[var(--border)] shadow-sm bg-[var(--bg)]">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Immer dabei (PWA)</h3>
            <p className="opacity-80 text-sm">
              Installierbar auf Smartphone & Desktop – wie eine native App.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
