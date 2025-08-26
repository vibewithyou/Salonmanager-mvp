import { useParams, useLocation } from 'wouter';
import { useSalon } from '../hooks/useApi';

function formatPriceCents(cents: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function SalonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data, isLoading, isError, error, refetch } = useSalon(id!);

  if (isLoading) return <div className="p-6">Lade Salon…</div>;
  if (isError)
    return (
      <div className="p-6">
        <p className="text-red-500 mb-2">Fehler: {(error as Error).message}</p>
        <button onClick={() => refetch()} className="px-3 py-2 border rounded">
          Erneut laden
        </button>
      </div>
    );
  if (!data) return <div className="p-6">Salon nicht gefunden.</div>;

  const s = data;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 text-[var(--on-surface)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">{s.name}</h1>
          {s.address && <p className="opacity-80">{s.address}</p>}
          {(s.phone || s.email) && (
            <p className="opacity-80 text-sm mt-1">
              {s.phone ? `Tel: ${s.phone}` : ''}
              {s.phone && s.email ? ' · ' : ''}
              {s.email ?? ''}
            </p>
          )}
        </div>

        {/* (Haupt-CTA kommt in Prompt 18, hier noch zurückhaltend) */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/salons')}
            className="px-4 py-2 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>

      {/* Services */}
      <h2 className="text-xl font-semibold mb-3">Leistungen</h2>
      {s.services?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.services.map((sv) => (
            <div
              key={sv.id}
              className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
            >
              <div className="font-medium">{sv.title}</div>
              <div className="text-sm opacity-80 mt-1">Dauer: {sv.duration_min} min</div>
              <div className="mt-2 font-semibold">{formatPriceCents(sv.price_cents)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="opacity-80">Für diesen Salon sind noch keine Leistungen erfasst.</div>
      )}

      {/* Team (Stub – echte Tabs in Prompt 17) */}
      <h2 className="text-xl font-semibold mt-8 mb-3">Team (Vorschau)</h2>
      {s.stylists?.length ? (
        <div className="flex flex-wrap gap-3">
          {s.stylists.map((st) => (
            <div
              key={st.id}
              className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
            >
              {st.display_name}
            </div>
          ))}
        </div>
      ) : (
        <div className="opacity-80">Keine Stylist:innen hinterlegt.</div>
      )}
    </section>
  );
}

