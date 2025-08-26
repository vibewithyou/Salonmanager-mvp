import { useLocation } from 'wouter';
import { useState } from 'react';
import {
  useStylists,
  useCreateStylist,
  useUpdateStylist,
  useDeleteStylist,
  StylistDto,
} from '../hooks/useApi';

function Avatar({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--muted)] flex items-center justify-center">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs opacity-70">{alt[0] ?? '?'}</span>
      )}
    </div>
  );
}

function StylistForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<StylistDto>;
  onSubmit: (v: {
    display_name: string;
    avatar_url?: string | null;
    active: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.display_name ?? '');
  const [avatar, setAvatar] = useState<string>(initial?.avatar_url ?? '');
  const [active, setActive] = useState<boolean>(initial?.active ?? true);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm opacity-80">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
        />
      </div>
      <div>
        <label className="text-sm opacity-80">Avatar-URL (optional)</label>
        <input
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
          placeholder="https://…"
        />
        {avatar && (
          <div className="mt-2">
            <div className="text-xs opacity-70 mb-1">Vorschau</div>
            <Avatar src={avatar} alt={name || 'Avatar'} />
          </div>
        )}
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
              display_name: name,
              avatar_url: avatar.trim() || null,
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

export default function AdminStylistsPage() {
  const [, navigate] = useLocation();
  const url = new URL(window.location.href);
  const salonId = Number(url.searchParams.get('s') ?? 1);

  const { data, isLoading, isError, error, refetch } = useStylists(salonId);
  const createMut = useCreateStylist(salonId);
  const updateMut = useUpdateStylist(salonId);
  const deleteMut = useDeleteStylist(salonId);

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const editing = data?.find((x) => x.id === editId);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 text-[var(--on-surface)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Team · Salon #{salonId}</h1>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={salonId}
            onChange={(e) => navigate(`/admin/stylists?s=${e.currentTarget.value || 1}`)}
            className="w-28 px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
            aria-label="Salon-ID"
          />
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90"
          >
            Neue/r Stylist:in
          </button>
          <button
            onClick={() => refetch()}
            className="px-3 py-2 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {isLoading && <div>Team wird geladen…</div>}
      {isError && (
        <div className="p-4 rounded border border-[var(--border)] bg-[var(--surface)]">
          <div className="text-red-600 mb-2">Fehler beim Laden.</div>
          <pre className="text-xs opacity-80 whitespace-pre-wrap">{(error as Error).message}</pre>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="min-w-full text-sm bg-[var(--surface)]">
            <thead className="border-b border-[var(--border)]">
              <tr className="text-left">
                <th className="px-3 py-2">Avatar</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Aktiv</th>
                <th className="px-3 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((st) => (
                <tr key={st.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2">
                    <Avatar src={st.avatar_url} alt={st.display_name} />
                  </td>
                  <td className="px-3 py-2">{st.display_name}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => updateMut.mutate({ id: st.id, active: !st.active })}
                      className={`px-2 py-1 rounded text-xs border ${
                        st.active
                          ? 'border-green-600 text-green-600'
                          : 'border-gray-500 text-gray-500'
                      }`}
                    >
                      {st.active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditId(st.id)}
                        className="px-3 py-1 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              'Stylist:in wirklich löschen?\n(Hinweis: nur möglich, wenn keine zukünftigen Buchungen bestehen)'
                            )
                          ) {
                            deleteMut.mutate(st.id, {
                              onError: async (e: any) =>
                                alert(e.message || 'Löschen fehlgeschlagen'),
                            });
                          }
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
                    Noch keine Teammitglieder.
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
            <h3 className="text-lg font-semibold mb-3">Neue/r Stylist:in</h3>
            <StylistForm
              onCancel={() => setShowCreate(false)}
              onSubmit={(v) =>
                createMut.mutate(v, {
                  onSuccess: () => setShowCreate(false),
                  onError: (e: any) => alert(e.message || 'Fehler beim Anlegen'),
                })
              }
            />
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[92%] max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="text-lg font-semibold mb-3">Stylist:in bearbeiten</h3>
            <StylistForm
              initial={editing}
              onCancel={() => setEditId(null)}
              onSubmit={(v) =>
                updateMut.mutate({ id: editing.id, ...v }, {
                  onSuccess: () => setEditId(null),
                  onError: (e: any) => alert(e.message || 'Fehler beim Speichern'),
                })
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}

