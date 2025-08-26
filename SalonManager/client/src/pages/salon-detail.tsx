import { useParams, useLocation } from 'wouter';
import { useSalon } from '../hooks/useApi';

function useTab(): [string, (t: 'info' | 'services' | 'team') => void] {
  const [, navigate] = useLocation();
  const search = new URLSearchParams(window.location.search);
  const tab = (search.get('tab') as 'info' | 'services' | 'team') ?? 'info';
  const setTab = (t: 'info' | 'services' | 'team') => {
    const base = window.location.pathname;
    navigate(`${base}?tab=${t}`);
  };
  return [tab, setTab];
}

function formatPriceCents(cents: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
    cents / 100,
  );
}

export default function SalonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data, isLoading, isError, error, refetch } = useSalon(id!);
  const [tab, setTab] = useTab();

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

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/salons')}
            className="px-4 py-2 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
          >
            Zurück zur Übersicht
          </button>
          <button
            onClick={() => navigate(`/salon/${s.id}/book`)}
            className="px-4 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
            aria-label={`Termin bei ${s.name} buchen`}
          >
            Jetzt buchen
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Salon Tabs"
        className="mb-4 flex gap-2 border-b border-[var(--border)]"
      >
        {(['info', 'services', 'team'] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 -mb-[1px] border-b-2 ${
              tab === key
                ? 'border-[var(--primary)] font-semibold'
                : 'border-transparent opacity-80 hover:opacity-100'
            }`}
          >
            {key === 'info' ? 'Info' : key === 'services' ? 'Leistungen' : 'Team'}
          </button>
        ))}
      </div>

      {/* Info Panel */}
      <div role="tabpanel" hidden={tab !== 'info'}>
        <h2 className="text-xl font-semibold mb-3">Über den Salon</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div className="font-medium mb-1">Adresse</div>
            <div className="opacity-80">{s.address ?? '—'}</div>
          </div>
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div className="font-medium mb-1">Kontakt</div>
            <div className="opacity-80 text-sm">
              {s.phone ? `Tel: ${s.phone}` : '—'}
              <br />
              {s.email ?? '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Services Panel */}
      <div role="tabpanel" hidden={tab !== 'services'}>
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
          <div className="opacity-80">Keine Leistungen erfasst.</div>
        )}
      </div>

      {/* Team Panel */}
      <div role="tabpanel" hidden={tab !== 'team'}>
        <h2 className="text-xl font-semibold mb-3">Team</h2>
        {s.stylists?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.stylists.map((st) => (
              <div
                key={st.id}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="font-medium">{st.display_name}</div>
                {st.avatar_url && (
                  <img
                    src={st.avatar_url}
                    alt={st.display_name}
                    className="mt-2 w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="text-xs opacity-70 mt-1">
                  {st.active ? 'Aktiv' : 'Inaktiv'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="opacity-80">Noch keine Teammitglieder hinterlegt.</div>
        )}
      </div>
    </section>
  );
}

