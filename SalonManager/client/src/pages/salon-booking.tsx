import { useParams } from 'wouter';
import { useState } from 'react';

export default function SalonBookingWizard() {
  const { id } = useParams<{ id: string }>();
  const [step, setStep] = useState(0);

  const steps = ['Service wählen', 'Datum & Uhrzeit', 'Bestätigen'];

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

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
        {step === 0 && <div>Step 1 (Service wählen) – kommt in Prompt 20</div>}
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
          className="px-4 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90"
        >
          {step === steps.length - 1 ? 'Fertig' : 'Weiter'}
        </button>
      </div>
    </section>
  );
}
