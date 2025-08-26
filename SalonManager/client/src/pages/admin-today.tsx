import { useLocation } from 'wouter';
import { useSalonBookingsToday, BookingDto, useUpdateBookingStatus } from '../hooks/useApi';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
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

export default function AdminTodayPage() {
  const [, navigate] = useLocation();
  const url = new URL(window.location.href);
  const salonId = Number(url.searchParams.get('s') ?? 1);

  const { data, isLoading, isError, error, refetch } = useSalonBookingsToday(salonId);
  const mut = useUpdateBookingStatus(salonId);

  function askReason(defaultText: string) {
    const t = prompt(defaultText + ' (optional Grund):', '');
    return t ?? '';
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 text-[var(--on-surface)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Heute-Board · Salon #{salonId}</h1>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={salonId}
            onChange={(e) => {
              const v = e.currentTarget.value || '1';
              const base = window.location.pathname;
              navigate(`${base}?s=${v}`);
            }}
            className="w-28 px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
            aria-label="Salon-ID"
          />
          <button
            onClick={() => refetch()}
            className="px-3 py-2 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded border border-[var(--border)] bg-[var(--surface)]" />
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

      {!isLoading && !isError && (
        <>
          {(data?.length ?? 0) === 0 ? (
            <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              <div className="text-lg font-medium mb-1">Heute keine Buchungen</div>
              <p className="opacity-80 text-sm">
                Sobald Termine für heute vorliegen, erscheinen sie hier automatisch.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="min-w-full text-sm bg-[var(--surface)]">
                <thead className="border-b border-[var(--border)]">
                  <tr className="text-left">
                    <th className="px-3 py-2">Zeit</th>
                    <th className="px-3 py-2">Kunde</th>
                    <th className="px-3 py-2">Service</th>
                    <th className="px-3 py-2">Stylist</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Notiz</th>
                    <th className="px-3 py-2">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.map((b) => (
                    <tr key={b.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {fmtDate(b.starts_at)} · {fmtTime(b.starts_at)}–{fmtTime(b.ends_at)}
                      </td>
                      <td className="px-3 py-2">{b.customer?.name ?? '—'}</td>
                      <td className="px-3 py-2">{b.service.title}</td>
                      <td className="px-3 py-2">{b.stylist?.display_name ?? `#${b.stylist?.id}`}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-3 py-2 max-w-[240px] truncate" title={b.note ?? ''}>
                        {b.note ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          {b.status === 'requested' && (
                            <>
                              <button
                                onClick={() =>
                                  mut.mutate({ bookingId: b.id, status: 'confirmed' })
                                }
                                disabled={mut.isPending}
                                className="px-3 py-1 rounded bg-[var(--primary)] text-black text-sm hover:opacity-90 disabled:opacity-50"
                              >
                                Bestätigen
                              </button>
                              <button
                                onClick={() =>
                                  mut.mutate({
                                    bookingId: b.id,
                                    status: 'declined',
                                    reason: askReason('Ablehnen'),
                                  })
                                }
                                disabled={mut.isPending}
                                className="px-3 py-1 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)] text-sm"
                              >
                                Ablehnen
                              </button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => {
                                if (confirm('Termin wirklich stornieren?')) {
                                  mut.mutate({
                                    bookingId: b.id,
                                    status: 'cancelled',
                                    reason: askReason('Stornieren'),
                                  });
                                }
                              }}
                              disabled={mut.isPending}
                              className="px-3 py-1 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)] text-sm"
                            >
                              Stornieren
                            </button>
                          )}
                          {(b.status === 'declined' || b.status === 'cancelled') && (
                            <span className="text-xs opacity-70">keine Aktionen</span>
                          )}
                          <button
                            onClick={() => navigate(`/salon/${b.salon_id}`)}
                            className="px-3 py-1 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
                          >
                            Salon
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
