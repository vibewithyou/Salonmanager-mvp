import SalonCard from '../components/salon-card';
import { useSalons } from '../hooks/useApi';
import SalonMap from '../components/salon-map';

export default function SalonsPage() {
  const { data, isLoading, isError, error, refetch } = useSalons();

  if (isLoading) {
    return <div className="p-6">Lade Salons…</div>;
  }

  if (isError) {
    return (
      <div className="p-6">
        <p className="mb-3 text-red-500">Fehler: {(error as Error).message}</p>
        <button
          onClick={() => refetch()}
          className="px-3 py-2 rounded border border-[var(--border)]"
        >
          Erneut laden
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="p-6">Keine Salons gefunden.</div>;
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Salons in deiner Nähe</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((salon) => (
          <SalonCard
            key={salon.id}
            id={salon.id}
            name={salon.name}
            address={salon.address}
            services={salon.services}
          />
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-3">Karte</h2>
      <SalonMap />
    </section>
  );
}
