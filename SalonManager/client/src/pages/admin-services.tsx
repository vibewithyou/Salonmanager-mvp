import { useLocation } from 'wouter';
import { useState } from 'react';
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  ServiceDto,
} from '../hooks/useApi';

function fmtPrice(cents: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function ServiceForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ServiceDto>;
  onSubmit: (v: {
    title: string;
    duration_min: number;
    price_cents: number;
    active: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [duration, setDuration] = useState(initial?.duration_min ?? 60);
  const [price, setPrice] = useState((initial?.price_cents ?? 6000) / 100);
  const [active, setActive] = useState(initial?.active ?? true);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm opacity-80">Titel</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm opacity-80">Dauer (Minuten)</label>
          <input
            type="number"
            min={10}
            max={240}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
          />
        </div>
        <div>
          <label className="text-sm opacity-80">Preis (€)</label>
          <input
            type="number"
            min={0}
            step="0.5"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Aktiv
      </label>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
        >
          Abbrechen
        </button>
        <button
          onClick={() =>
            onSubmit({
              title,
              duration_min: duration,
              price_cents: Math.round(price * 100),
              active,
            })
          }
          className="px-3 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90"
        >
          Speichern
        </button>
      </div>
    </div>
  );
}

export default function AdminServicesPage() {
  const [, navigate] = useLocation();
  const url = new URL(window.location.href);
  const salonId = Number(url.searchParams.get('s') ?? 1);

  const { data, isLoading, isError, error, refetch } = useServices(salonId);
  const createMut = useCreateService(salonId);
  const updateMut = useUpdateService(salonId);
  const deleteMut = useDeleteService(salonId);

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const editing = data?.find((x) => x.id === editId);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 text-[var(--on-surface)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Leistungen · Salon #{salonId}</h1>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={salonId}
            onChange={(e) =>
              navigate(`/admin/services?s=${e.currentTarget.value || 1}`)
            }
            className="w-28 px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
            aria-label="Salon-ID"
          />
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90"
          >
            Neue Leistung
          </button>
          <button
            onClick={() => refetch()}
            className="px-3 py-2 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {isLoading && <div>Leistungen werden geladen…</div>}
      {isError && (
        <div className="p-4 rounded border border-[var(--border)] bg-[var(--surface)]">
          <div className="text-red-600 mb-2">Fehler beim Laden.</div>
          <pre className="text-xs opacity-80 whitespace-pre-wrap">
            {(error as Error).message}
          </pre>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="min-w-full text-sm bg-[var(--surface)]">
            <thead className="border-b border-[var(--border)]">
              <tr className="text-left">
                <th className="px-3 py-2">Titel</th>
                <th className="px-3 py-2">Dauer</th>
                <th className="px-3 py-2">Preis</th>
                <th className="px-3 py-2">Aktiv</th>
                <th className="px-3 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((s) => (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2">{s.title}</td>
                  <td className="px-3 py-2">{s.duration_min} min</td>
                  <td className="px-3 py-2">{fmtPrice(s.price_cents)}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => updateMut.mutate({ id: s.id, active: !s.active })}
                      className={`px-2 py-1 rounded text-xs border ${
                        s.active
                          ? 'border-green-600 text-green-600'
                          : 'border-gray-500 text-gray-500'
                      }`}
                    >
                      {s.active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditId(s.id)}
                        className="px-3 py-1 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Leistung wirklich löschen?'))
                            deleteMut.mutate(s.id);
                        }}
                        className="px-3 py-1 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data || data.length === 0) && (
                <tr>
                  <td className="px-3 py-6 opacity-70" colSpan={5}>
                    Keine Leistungen vorhanden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[92%] max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="text-lg font-semibold mb-3">Neue Leistung</h3>
            <ServiceForm
              onCancel={() => setShowCreate(false)}
              onSubmit={(v) => {
                createMut.mutate(v, {
                  onSuccess: () => setShowCreate(false),
                  onError: async (e: any) => {
                    alert(e.message || 'Fehler beim Anlegen');
                  },
                });
              }}
            />
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[92%] max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="text-lg font-semibold mb-3">Leistung bearbeiten</h3>
            <ServiceForm
              initial={editing}
              onCancel={() => setEditId(null)}
              onSubmit={(v) => {
                updateMut.mutate(
                  { id: editing.id, ...v },
                  {
                    onSuccess: () => setEditId(null),
                    onError: async (e: any) => {
                      alert(e.message || 'Fehler beim Speichern');
                    },
                  },
                );
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

