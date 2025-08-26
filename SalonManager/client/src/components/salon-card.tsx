import { useLocation } from 'wouter';

type Service = { id: number; title: string; price_cents: number };

type Props = {
  id: number;
  name: string;
  address?: string | null;
  services: Service[];
};

export default function SalonCard({ id, name, address, services }: Props) {
  const [, navigate] = useLocation();
  const chips = services.slice(0, 3).map((s) => s.title);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--on-surface)] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          {address && <p className="text-sm opacity-80">{address}</p>}
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-black font-bold flex items-center justify-center">
          {name.slice(0, 1).toUpperCase()}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((t, i) => (
          <span
            key={i}
            className="px-2 py-1 text-xs rounded-full border border-[var(--on-surface)]/25"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-1">
        <button
          onClick={() => navigate(`/salon/${id}/book`)}
          className="inline-flex items-center px-4 py-2 rounded-md bg-[var(--primary)] text-black font-medium hover:opacity-90"
          aria-label={`Termin bei ${name} buchen`}
        >
          Termin buchen
        </button>
      </div>
    </div>
  );
}
