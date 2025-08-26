import { useLocation } from 'wouter';
import { useState } from 'react';
import { useStylists, useAbsences, useCreateAbsence, useUpdateAbsence, useDeleteAbsence } from '../hooks/useApi';

function isoLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export default function AdminAbsencesPage() {
  const [, navigate] = useLocation();
  const url = new URL(window.location.href);
  const salonId = Number(url.searchParams.get('s') ?? 1);
  const stylistId = Number(url.searchParams.get('stylist') ?? 0);

  const { data: stylists } = useStylists(salonId);
  const { data, isLoading, isError, error, refetch } = useAbsences(salonId, stylistId);

  const createMut = useCreateAbsence(salonId, stylistId);
  const updateMut = useUpdateAbsence(salonId, stylistId);
  const deleteMut = useDeleteAbsence(salonId, stylistId);

  const [start, setStart] = useState(isoLocal(new Date()));
  const [end, setEnd] = useState(isoLocal(new Date(Date.now() + 2 * 60 * 60 * 1000)));
  const [reason, setReason] = useState('');

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 text-[var(--on-surface)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Abwesenheiten · Salon #{salonId}</h1>
        <div className="flex gap-2">
          <select
            value={String(stylistId || '')}
            onChange={(e) => navigate(`/admin/absences?s=${salonId}&stylist=${e.currentTarget.value}`)}
            className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
          >
            <option value="" disabled>
              Stylist wählen…
            </option>
            {stylists?.map((st) => (
              <option key={st.id} value={st.id}>
                {st.display_name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={salonId}
            onChange={(e) =>
              navigate(`/admin/absences?s=${e.currentTarget.value || 1}&stylist=${stylistId || ''}`)
            }
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

      {!stylistId && (
        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          Bitte zuerst einen <strong>Stylisten</strong> wählen.
        </div>
      )}

      {stylistId !== 0 && (
        <>
          {isLoading && <div>Abwesenheiten werden geladen…</div>}
          {isError && (
            <div className="p-4 rounded border border-[var(--border)] bg-[var(--surface)]">
              <div className="text-red-600 mb-2">Fehler beim Laden.</div>
              <pre className="text-xs opacity-80 whitespace-pre-wrap">{(error as Error).message}</pre>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="min-w-full text-sm bg-[var(--surface)]">
                  <thead className="border-b border-[var(--border)]">
                    <tr className="text-left">
                      <th className="px-3 py-2">Von</th>
                      <th className="px-3 py-2">Bis</th>
                      <th className="px-3 py-2">Grund</th>
                      <th className="px-3 py-2">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.map((a) => (
                      <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-3 py-2">
                          {new Date(a.starts_at).toLocaleString('de-DE', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-3 py-2">
                          {new Date(a.ends_at).toLocaleString('de-DE', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-3 py-2 max-w-[240px] truncate" title={a.reason ?? ''}>
                          {a.reason ?? '—'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const ns =
                                  prompt(
                                    'Neuer Start (ISO-local, z.B. 2025-09-01T09:00)',
                                    isoLocal(new Date(a.starts_at))
                                  ) || isoLocal(new Date(a.starts_at));
                                const ne =
                                  prompt(
                                    'Neues Ende (ISO-local, z.B. 2025-09-01T17:00)',
                                    isoLocal(new Date(a.ends_at))
                                  ) || isoLocal(new Date(a.ends_at));
                                const nr =
                                  prompt('Grund (optional, max 200)', a.reason ?? '') ?? a.reason ?? '';
                                updateMut.mutate(
                                  {
                                    id: a.id,
                                    starts_at: ns,
                                    ends_at: ne,
                                    reason: nr,
                                  },
                                  { onError: (e: any) => alert(e.message || 'Fehler') }
                                );
                              }}
                              className="px-3 py-1 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
                            >
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Abwesenheit löschen?'))
                                  deleteMut.mutate(a.id, {
                                    onError: (e: any) => alert(e.message || 'Fehler'),
                                  });
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
                        <td className="px-3 py-6 opacity-70" colSpan={4}>
                          Noch keine Abwesenheiten.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-lg font-medium mb-3">Neue Abwesenheit</div>
                <div className="grid gap-3">
                  <div>
                    <label className="text-sm opacity-80">Von</label>
                    <input
                      type="datetime-local"
                      value={start}
                      onChange={(e) => setStart(e.currentTarget.value)}
                      className="mt-1 w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
                    />
                  </div>
                  <div>
                    <label className="text-sm opacity-80">Bis</label>
                    <input
                      type="datetime-local"
                      value={end}
                      onChange={(e) => setEnd(e.currentTarget.value)}
                      className="mt-1 w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
                    />
                  </div>
                  <div>
                    <label className="text-sm opacity-80">Grund (optional)</label>
                    <input
                      type="text"
                      value={reason}
                      maxLength={200}
                      onChange={(e) => setReason(e.currentTarget.value)}
                      className="mt-1 w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
                      placeholder="Urlaub, Krank…"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        createMut.mutate(
                          {
                            starts_at: new Date(start).toISOString(),
                            ends_at: new Date(end).toISOString(),
                            reason: reason.trim() || null,
                          },
                          {
                            onError: (e: any) => alert(e.message || 'Fehler beim Anlegen'),
                          }
                        )
                      }
                      className="px-3 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90"
                    >
                      Anlegen
                    </button>
                  </div>
                  <div className="text-xs opacity-70">
                    Hinweise: Zeiten dürfen sich nicht überschneiden. ISO-Zeitformat (lokale Auswahl wird in ISO
                    umgewandelt).
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

