import { useParams } from 'wouter';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSalon } from '../hooks/useApi';

type ChosenService = {
  id: number;
  title: string;
  duration_min: number;
  price_cents: number;
};

type ChosenSlot = { start: string; end: string; stylistId?: number | null };

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

export default function SalonBookingWizard() {
  const { id } = useParams<{ id: string }>();
  const { data: salon, isLoading, isError, error, refetch } = useSalon(id!);
  const [step, setStep] = useState(0);
  const [service, setService] = useState<ChosenService | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [slot, setSlot] = useState<ChosenSlot | null>(null);

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

            {/* Datumsauswahl */}
            <div className="mb-4 flex items-center gap-3">
              <label
                htmlFor="booking-date"
                className="text-sm opacity-80"
              >
                Datum
              </label>
              <input
                id="booking-date"
                type="date"
                value={date}
                onChange={e => {
                  setDate(e.target.value);
                  setSlot(null);
                }}
                className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
                aria-label="Datum auswählen"
              />
            </div>

            {/* Slots */}
            {!service && (
              <div className="text-sm text-amber-600">
                Bitte zuerst in Schritt 1 einen Service wählen.
              </div>
            )}

            {service && slotsLoading && (
              <div>Verfügbare Zeiten werden geladen…</div>
            )}

            {service && slotsError && (
              <div className="p-3 rounded border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-red-600 text-sm mb-2">
                  Konnte Slots nicht laden.
                </div>
                <pre className="text-xs opacity-80 whitespace-pre-wrap">
                  {(slotsErr as Error).message}
                </pre>
                <button
                  onClick={() => refetchSlots()}
                  className="mt-2 px-3 py-2 rounded border border-[var(--on-surface)]/30"
                >
                  Erneut laden
                </button>
                <div className="text-xs opacity-70 mt-2">
                  Hinweis: Falls die Slots-API (Prompt 22) noch nicht implementiert ist,
                  erscheint dieser Fehler.
                </div>
              </div>
            )}

            {service && !slotsLoading && !slotsError && (
              <>
                {!slots || slots.length === 0 ? (
                  <div className="opacity-80">
                    Keine freien Zeiten für dieses Datum.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((sl, idx) => {
                      const active =
                        slot?.start === sl.start && slot?.end === sl.end;
                      const start = new Date(sl.start);
                      const label = start.toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
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
                          className={`px-3 py-2 rounded border text-sm ${
                            active
                              ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/40'
                              : 'border-[var(--border)] hover:bg-[var(--muted)]'
                          }`}
                          aria-pressed={active}
                          aria-label={`Zeit ${label} wählen`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {slot && (
                  <div className="mt-3 text-sm opacity-90">
                    Gewählt:{' '}
                    <strong>
                      {new Date(slot.start).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </div>
                )}
              </>
            )}
          </>
        )}
        {step === 2 && <div>Step 3 (Bestätigen) – kommt in Prompt 24–26</div>}
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
        <button
          onClick={next}
          disabled={!canNext}
          className="px-4 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === steps.length - 1 ? 'Fertig' : 'Weiter'}
        </button>
      </div>
    </section>
  );
}
