import { useParams } from 'wouter';
import { useState, useMemo } from 'react';
import { useSalon } from '../hooks/useApi';

type ChosenService = {
  id: number;
  title: string;
  duration_min: number;
  price_cents: number;
};

export default function SalonBookingWizard() {
  const { id } = useParams<{ id: string }>();
  const { data: salon, isLoading, isError, error, refetch } = useSalon(id!);
  const [step, setStep] = useState(0);
  const [service, setService] = useState<ChosenService | null>(null);

  const steps = ['Service wählen', 'Datum & Uhrzeit', 'Bestätigen'];

  const canNext = useMemo(() => {
    if (step === 0) return !!service;
    return true;
  }, [step, service]);

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  function formatPriceCents(cents: number) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
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

        {step === 1 && <div>Step 2 (Datum & Uhrzeit) – kommt in Prompt 21–23</div>}
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
