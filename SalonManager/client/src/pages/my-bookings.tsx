import { useLocation } from 'wouter';
import { useMyBookings, BookingDto } from '../hooks/useApi';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
function fmtPrice(cents: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function StatusBadge({ status }: { status: BookingDto['status'] }) {
  const map: Record<BookingDto['status'], { label: string; cls: string }> = {
    requested: { label: 'Angefragt', cls: 'bg-[var(--muted)] text-[var(--on-surface)]' },
    confirmed: { label: 'Bestätigt', cls: 'bg-green-500/20 text-green-600 dark:text-green-300' },
    declined: { label: 'Abgelehnt', cls: 'bg-red-500/20 text-red-600 dark:text-red-300' },
    cancelled: { label: 'Storniert', cls: 'bg-gray-500/20 text-gray-600 dark:text-gray-300' },
  };
  const { label, cls } = map[status];
  return <span className={`px-2 py-1 text-xs rounded ${cls}`}>{label}</span>;
}

export default function MyBookingsPage() {
  const [, navigate] = useLocation();
  const { data, isLoading, isError, error, refetch } = useMyBookings();

  return (
    <section className="max-w-5xl mx-auto px-4 py-8 text-[var(--on-surface)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Meine Buchungen</h1>
        <button
          onClick={() => refetch()}
          className="px-3 py-2 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
        >
          Aktualisieren
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              <div className="h-4 w-40 bg-[var(--muted)] rounded mb-2" />
              <div className="h-4 w-64 bg-[var(--muted)] rounded" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="p-4 rounded border border-[var(--border)] bg-[var(--surface)]">
          <div className="text-red-600 mb-2">Fehler beim Laden.</div>
          <pre className="text-xs opacity-80 whitespace-pre-wrap">{(error as Error).message}</pre>
          <button
            onClick={() => refetch()}
            className="mt-2 px-3 py-2 rounded border border-[var(--on-surface)]/30"
          >
            Erneut laden
          </button>
        </div>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="text-lg font-medium mb-1">Noch keine Buchungen</div>
          <p className="opacity-80 text-sm mb-4">
            Du scheinst aktuell nicht angemeldet zu sein oder hast noch keine Termine gebucht.
          </p>
          <button
            onClick={() => navigate('/salons')}
            className="px-4 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90"
          >
            Salons entdecken
          </button>
        </div>
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div className="space-y-3">
          {data!.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm opacity-70">
                    {fmtDate(b.starts_at)} · {fmtTime(b.starts_at)}–{fmtTime(b.ends_at)}
                  </div>
                  <div className="text-lg font-medium">
                    {b.service.title}{' '}
                    <span className="opacity-70">· {fmtPrice(b.service.price_cents)}</span>
                  </div>
                  <div className="text-sm opacity-80">
                    Salon #{b.salon_id}
                    {b.stylist?.display_name ? ` · Stylist: ${b.stylist.display_name}` : ''}
                  </div>
                  {b.note && <div className="text-sm opacity-80 mt-1">Notiz: {b.note}</div>}
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigate(`/salon/${b.salon_id}`)}
                  className="px-3 py-2 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)] text-sm"
                >
                  Details
                </button>
                <button
                  onClick={() => navigate(`/salon/${b.salon_id}/book`)}
                  className="px-3 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90 text-sm"
                >
                  Neu buchen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
