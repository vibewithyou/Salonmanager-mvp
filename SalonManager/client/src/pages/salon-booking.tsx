import { useParams, useLocation } from 'wouter';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSalon } from '../hooks/useApi';
import { apiPost } from '../lib/api';

type ChosenService = {
  id: number;
  title: string;
  duration_min: number;
  price_cents: number;
};

type ChosenSlot = { start: string; end: string; stylistId?: number | null };

type BookingPayload = {
  service_id: number;
  stylist_id?: number | null;
  starts_at: string;
  note?: string | null;
};

type ApiFieldErrors = Record<string, string[]>;

function todayISO() {
  const now = new Date();
  const tz = 'Europe/Berlin';
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(now);
}

function groupSlotsByHour(
  slots: Array<{ start: string; end: string; stylistId?: number }>
) {
  const map = new Map<string, Array<typeof slots[number]>>();
  for (const s of slots) {
    const d = new Date(s.start);
    const key =
      d.toLocaleTimeString('de-DE', { hour: '2-digit' }) + ':00';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function labelTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function addDaysISO(baseISO: string, days: number) {
  const d = new Date(baseISO + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function useIsAuthenticated(): boolean {
  // MVP-Stub: später durch echte Session prüfen.
  // Zum Testen kann dieser Wert angepasst werden.
  return false;
}

export default function SalonBookingWizard() {
  const { id } = useParams<{ id: string }>();
  const { data: salon, isLoading, isError, error, refetch } = useSalon(id!);
  const [step, setStep] = useState(0);
  const [service, setService] = useState<ChosenService | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [slot, setSlot] = useState<ChosenSlot | null>(null);
  const [note, setNote] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isAuthed = useIsAuthenticated();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});

  const minDate = todayISO();
  const maxDate = addDaysISO(minDate, 30);

  const steps = ['Service wählen', 'Datum & Uhrzeit', 'Bestätigen'];

  const canNext = useMemo(() => {
    if (step === 0) return !!service;
    if (step === 1) return !!slot;
    return true;
  }, [step, service, slot]);

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  function formatPriceCents(cents: number) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  }

  const {
    data: slots,
    isLoading: slotsLoading,
    isError: slotsError,
    error: slotsErr,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: ['slots', id, service?.id, date],
    queryFn: async () => {
      if (!service) return [];
      const qs = new URLSearchParams({
        service_id: String(service.id),
        date,
      });
      const r = await fetch(`/api/v1/salons/${id}/slots?` + qs.toString(), {
        credentials: 'include',
      });
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg || `HTTP ${r.status}`);
      }
      return (await r.json()) as Array<{ start: string; end: string; stylistId?: number }>;
    },
    enabled: step === 1 && !!service && !!date,
    staleTime: 30_000,
  });

  const [, navigate] = useLocation();

  async function handleBookClick() {
    if (!salon || !service || !slot) return;
    if (!isAuthed) {
      setShowLoginModal(true);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    const payload: BookingPayload = {
      service_id: service.id,
      stylist_id: slot.stylistId ?? null,
      starts_at: slot.start,
      note: note.trim() ? note.trim() : null,
    };

    try {
      await apiPost<{ booking_id: number }>(
        `/api/v1/salons/${salon.id}/bookings`,
        payload
      );
      alert('Buchung angelegt!');
      navigate('/me/bookings');
    } catch (e: any) {
      try {
        const msg = e.message ?? 'Fehler';
        const maybe = JSON.parse(msg);
        if (maybe?.errors) {
          setFieldErrors(maybe.errors as ApiFieldErrors);
        } else {
          setSubmitError(msg);
        }
      } catch {
        setSubmitError(e.message ?? 'Unbekannter Fehler');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 text-[var(--on-surface)]">
      <h1 className="text-2xl font-semibold mb-4">Termin buchen</h1>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((label, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                i === step
                  ? 'bg-[var(--primary)] text-black'
                  : 'bg-[var(--muted)] text-[var(--on-surface)]'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs mt-1 ${i === step ? 'font-semibold' : 'opacity-70'}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[200px] border border-[var(--border)] rounded-lg p-6 mb-20 bg-[var(--surface)]">
        {isLoading && <div>Lade Salon…</div>}
        {isError && (
          <div>
            <p className="text-red-500 mb-2">Fehler: {(error as Error).message}</p>
            <button onClick={() => refetch()} className="px-3 py-2 border rounded">
              Erneut laden
            </button>
          </div>
        )}
        {!isLoading && !isError && !salon && <div>Salon nicht gefunden.</div>}

        {step === 0 && salon && (
          <>
            <h2 className="text-lg font-semibold mb-4">1) Service wählen</h2>
            {salon.services?.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {salon.services.map(sv => {
                  const active = service?.id === sv.id;
                  return (
                    <button
                      key={sv.id}
                      onClick={() =>
                        setService({
                          id: sv.id,
                          title: sv.title,
                          duration_min: sv.duration_min,
                          price_cents: sv.price_cents,
                        })
                      }
                      className={`text-left p-4 rounded-lg border transition ${
                        active
                          ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/40'
                          : 'border-[var(--border)] hover:bg-[var(--muted)]'
                      }`}
                      aria-pressed={active}
                      aria-label={`Service ${sv.title} wählen`}
                    >
                      <div className="font-medium">{sv.title}</div>
                      <div className="text-sm opacity-80 mt-1">
                        Dauer: {sv.duration_min} min
                      </div>
                      <div className="mt-2 font-semibold">
                        {formatPriceCents(sv.price_cents)}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="opacity-80">
                Für diesen Salon sind noch keine Leistungen erfasst.
              </div>
            )}
            {service && (
              <div className="mt-4 text-sm opacity-90">
                Ausgewählt: <strong>{service.title}</strong> · {service.duration_min} min ·{' '}
                {formatPriceCents(service.price_cents)}
              </div>
            )}
          </>
        )}

        
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold mb-4">2) Datum & Uhrzeit</h2>

            {/* Datum */}
            <div className="mb-4 flex items-center gap-3">
              <label htmlFor="booking-date" className="text-sm opacity-80">
                Datum
              </label>
              <input
                id="booking-date"
                type="date"
                value={date}
                min={minDate}
                max={maxDate}
                onChange={e => {
                  setDate(e.target.value);
                  setSlot(null);
                }}
                className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
                aria-label="Datum auswählen"
              />
              <button
                onClick={() => refetchSlots()}
                className="px-3 py-2 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)] text-sm"
                aria-label="Slots neu laden"
              >
                Aktualisieren
              </button>
            </div>

            {!service && (
              <div className="text-sm text-amber-600">
                Bitte zuerst einen Service in Schritt 1 wählen.
              </div>
            )}

            {service && slotsLoading && (
              <div className="space-y-2">
                <div className="h-4 w-40 bg-[var(--muted)] rounded" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-9 w-20 rounded bg-[var(--muted)]" />
                  ))}
                </div>
              </div>
            )}

            {service && slotsError && (
              <div className="p-3 rounded border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-red-600 text-sm mb-1">Konnte Slots nicht laden.</div>
                <pre className="text-xs opacity-80 whitespace-pre-wrap">
                  {(slotsErr as Error).message}
                </pre>
                <button
                  onClick={() => refetchSlots()}
                  className="mt-2 px-3 py-2 rounded border border-[var(--on-surface)]/30"
                >
                  Erneut laden
                </button>
              </div>
            )}

            {service && !slotsLoading && !slotsError && (
              <>
                {!slots || slots.length === 0 ? (
                  <div className="opacity-80">
                    Keine freien Zeiten für dieses Datum. Bitte anderen Tag wählen.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupSlotsByHour(slots!).map(([hour, list]) => (
                      <div key={hour}>
                        <div className="text-sm font-medium mb-2 opacity-80">{hour}</div>
                        <div className="flex flex-wrap gap-2">
                          {list.map((sl, idx) => {
                            const active =
                              slot?.start === sl.start && slot?.end === sl.end;
                            const label = labelTime(sl.start);
                            return (
                              <button
                                key={idx}
                                onClick={() =>
                                  setSlot({
                                    start: sl.start,
                                    end: sl.end,
                                    stylistId: sl.stylistId,
                                  })
                                }
                                className={`px-3 py-2 rounded border text-sm transition ${
                                  active
                                    ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/40'
                                    : 'border-[var(--border)] hover:bg-[var(--muted)]'
                                }`}
                                aria-pressed={active}
                                aria-label={'Zeit ' + label + ' wählen' + (sl.stylistId ? ', Stylist-ID ' + sl.stylistId : '')}
                                title={sl.stylistId ? 'Stylist: ' + sl.stylistId : 'Beliebiger Stylist'}
                              >
                                {label}
                                {sl.stylistId ? ` · #${sl.stylistId}` : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {slot && (
                  <div className="mt-3 text-sm opacity-90">
                    Gewählt: <strong>{labelTime(slot.start)}</strong>
                    {slot.stylistId ? ` · Stylist #${slot.stylistId}` : ' · beliebiger Stylist'}
                  </div>
                )}
              </>
            )}
          </>
        )}
        {step === 2 && salon && service && slot && (
          <>
            <h2 className="text-lg font-semibold mb-4">3) Bestätigen</h2>

            <div className="grid gap-3 mb-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-sm opacity-70 mb-1">Salon</div>
                <div className="font-medium">{salon.name}</div>
                {salon.address && (
                  <div className="text-sm opacity-80">{salon.address}</div>
                )}
              </div>

              <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-sm opacity-70 mb-1">Service</div>
                <div className="font-medium">{service.title}</div>
                <div className="text-sm opacity-80">
                  Dauer: {service.duration_min} min · Preis:{' '}
                  {formatPriceCents(service.price_cents)}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-sm opacity-70 mb-1">Datum & Uhrzeit</div>
                <div className="font-medium">
                  {new Date(slot.start).toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-sm opacity-80">
                  {labelTime(slot.start)} – {labelTime(slot.end)}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-sm opacity-70 mb-1">Stylist</div>
                <div className="font-medium">
                  {slot.stylistId ? `#${slot.stylistId}` : 'Beliebig (wird zugewiesen)'}
                </div>
              </div>
            </div>

            <div className="mb-2 text-sm opacity-80">Notiz (optional)</div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="z. B. Seiten kurz, Kontur sauber"
              className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
            />

            {Object.keys(fieldErrors).length > 0 && (
              <div className="mt-3 p-3 rounded border border-red-300/50 bg-red-50/50 text-red-700 dark:text-red-300 text-sm">
                <div className="font-medium mb-1">Bitte prüfe folgende Felder:</div>
                <ul className="list-disc ml-5">
                  {Object.entries(fieldErrors).map(([k, arr]) => (
                    <li key={k}>
                      <strong>{k}</strong>: {arr.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {submitError && (
              <div className="mt-3 p-3 rounded border border-amber-300/50 bg-amber-50/50 text-amber-800 dark:text-amber-300 text-sm">
                {submitError}
              </div>
            )}

            {!isAuthed && (
              <div className="mt-4 p-3 rounded border border-amber-300/40 bg-amber-50/40 text-amber-800 dark:text-amber-300 text-sm">
                Du bist derzeit als <strong>Gast</strong> unterwegs. Zum Buchen bitte kurz
                einloggen (oder später registrieren).
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 flex justify-between">
        <button
          onClick={prev}
          disabled={step === 0}
          className="px-4 py-2 rounded border border-[var(--on-surface)]/30 disabled:opacity-50"
        >
          Zurück
        </button>
        {step < 2 ? (
          <button
            onClick={() => setStep(s => Math.min(s + 1, 2))}
            disabled={!canNext}
            className="px-4 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Weiter
          </button>
        ) : (
          <button
            onClick={handleBookClick}
            disabled={submitting}
            className="px-4 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={submitting}
            aria-label="Buchung absenden"
          >
            {submitting ? 'Buchen…' : 'Buchen'}
          </button>
        )}
      </div>

      {/* Login-Modal (Stub) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[92%] max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="text-lg font-semibold mb-2">Anmelden erforderlich</h3>
            <p className="text-sm opacity-80 mb-4">
              Bitte melde dich an, um den Termin zu buchen. Du kannst dich später jederzeit
              registrieren.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-3 py-2 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                }}
                className="px-3 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90"
              >
                Jetzt anmelden
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
