import { MapContainer, TileLayer, Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { useSalons } from '../hooks/useApi';

const FREIBERG: [number, number] = [50.9159, 13.3422];

function goldMarker(label: string) {
  return L.divIcon({
    className: 'sm-marker',
    html: `
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:#FFD700;border:2px solid #000;
        display:flex;align-items:center;justify-content:center;
        font-weight:700;font-size:12px;color:#000;
      ">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    tooltipAnchor: [0, -28],
    popupAnchor: [0, -28],
  });
}

export default function SalonMap() {
  const [, navigate] = useLocation();
  const { data, isLoading, isError, error } = useSalons();

  if (isLoading) return <div className="p-4">Karte lädt…</div>;
  if (isError)
    return (
      <div className="p-4 text-red-500">Fehler: {(error as Error).message}</div>
    );
  if (!data || data.length === 0)
    return <div className="p-4">Keine Salons vorhanden.</div>;

  const center = useMemo<[number, number]>(() => {
    const first = data.find((s) => s.lat && s.lng);
    return first ? [first.lat as number, first.lng as number] : FREIBERG;
  }, [data]);

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: 420, width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {data.map((s, i) => {
          if (s.lat == null || s.lng == null) return null;
          const icon = goldMarker(String(i + 1));
          return (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={icon}>
              <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
                <div className="text-[13px]">
                  <div className="font-semibold">{s.name}</div>
                  {s.address && <div className="opacity-80">{s.address}</div>}
                </div>
              </Tooltip>
              <Popup closeButton={true} autoPan={true} className="!p-0">
                <div className="min-w-[220px] p-3 text-[var(--on-surface)]">
                  <div className="font-semibold text-sm mb-1">{s.name}</div>
                  {s.address && (
                    <div className="text-xs opacity-80 mb-3">{s.address}</div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/salon/${s.id}`)}
                      className="px-3 py-2 text-xs rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
                      aria-label={`${s.name} Details öffnen`}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => navigate(`/salon/${s.id}/book`)}
                      className="px-3 py-2 text-xs rounded bg-[var(--primary)] text-black font-medium hover:opacity-90"
                      aria-label={`Termin bei ${s.name} buchen`}
                    >
                      Buchen
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
