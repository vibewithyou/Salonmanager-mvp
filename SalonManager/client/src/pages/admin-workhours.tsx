import { useLocation } from 'wouter';
import { useState, useMemo } from 'react';
import {
  useStylists,
  useWorkHours,
  useCreateWorkHour,
  useUpdateWorkHour,
  useDeleteWorkHour,
  WorkHourDto,
  StylistDto,
} from '../hooks/useApi';

const WEEKDAYS = ['So','Mo','Di','Mi','Do','Fr','Sa'];

function HHmmInput({value,onChange}:{value:string; onChange:(v:string)=>void}){
  return (
    <input
      type="time" step={900} value={value}
      onChange={(e)=> onChange(e.currentTarget.value)}
      className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
    />
  );
}

export default function AdminWorkHoursPage(){
  const [, navigate] = useLocation();
  const url = new URL(window.location.href);
  const salonId = Number(url.searchParams.get('s') ?? 1);
  const stylistId = Number(url.searchParams.get('stylist') ?? 0);

  const { data: stylists } = useStylists(salonId);
  const { data, isLoading, isError, error, refetch } = useWorkHours(salonId, stylistId);

  const createMut = useCreateWorkHour(salonId, stylistId);
  const updateMut = useUpdateWorkHour(salonId, stylistId);
  const deleteMut = useDeleteWorkHour(salonId, stylistId);

  const currentStylist = useMemo(()=> stylists?.find(s=>s.id===stylistId) ?? null, [stylists, stylistId]);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 text-[var(--on-surface)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Dienstzeiten · Salon #{salonId}</h1>
        <div className="flex gap-2">
          <select
            value={String(stylistId || '')}
            onChange={(e)=> {
              const v = e.currentTarget.value;
              navigate(`/admin/workhours?s=${salonId}&stylist=${v}`);
            }}
            className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
            aria-label="Stylist wählen"
          >
            <option value="" disabled>Stylist wählen…</option>
            {stylists?.map(st => <option key={st.id} value={st.id}>{st.display_name}</option>)}
          </select>

          <input
            type="number" min={1} value={salonId}
            onChange={(e)=> navigate(`/admin/workhours?s=${e.currentTarget.value||1}&stylist=${stylistId||''}`)}
            className="w-28 px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
            aria-label="Salon-ID"
          />
          <button onClick={()=>refetch()} className="px-3 py-2 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]">
            Aktualisieren
          </button>
        </div>
      </div>

      {!currentStylist && (
        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          Bitte oben einen <strong>Stylisten</strong> auswählen.
        </div>
      )}

      {currentStylist && (
        <>
          <div className="mb-3 text-sm opacity-80">Dienstzeiten für: <strong>{currentStylist.display_name}</strong></div>

          {isLoading && <div>Regeln werden geladen…</div>}
          {isError && (
            <div className="p-4 rounded border border-[var(--border)] bg-[var(--surface)]">
              <div className="text-red-600 mb-2">Fehler beim Laden.</div>
              <pre className="text-xs opacity-80 whitespace-pre-wrap">{(error as Error).message}</pre>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Liste vorhandener Regeln */}
              <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="min-w-full text-sm bg-[var(--surface)]">
                  <thead className="border-b border-[var(--border)]">
                    <tr className="text-left">
                      <th className="px-3 py-2">Tag</th>
                      <th className="px-3 py-2">Start</th>
                      <th className="px-3 py-2">Ende</th>
                      <th className="px-3 py-2">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.map(r => (
                      <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-3 py-2">{WEEKDAYS[r.weekday]}</td>
                        <td className="px-3 py-2">{r.start}</td>
                        <td className="px-3 py-2">{r.end}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={async ()=>{
                                const start = prompt('Neue Startzeit (HH:mm, 15-min)', r.start) || r.start;
                                const end = prompt('Neue Endzeit (HH:mm, 15-min)', r.end) || r.end;
                                updateMut.mutate({ id: r.id, start, end }, { onError:(e:any)=>alert(e.message||'Fehler') });
                              }}
                              className="px-3 py-1 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
                            >
                              Bearbeiten
                            </button>
                            <button
                              onClick={()=>{ if (confirm('Regel löschen?')) deleteMut.mutate(r.id, { onError:(e:any)=>alert(e.message||'Fehler') }); }}
                              className="px-3 py-1 rounded border border-[var(--on-surface)]/30 hover:bg-[var(--muted)]"
                            >
                              Löschen
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!data || data.length===0) && (
                      <tr><td className="px-3 py-6 opacity-70" colSpan={4}>Noch keine Regeln.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Neue Regel anlegen */}
              <NewRuleCard onCreate={(payload)=> createMut.mutate(payload, { onError:(e:any)=> alert(e.message||'Fehler beim Anlegen') })} />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function NewRuleCard({ onCreate }:{ onCreate:(v:{weekday:number; start:string; end:string})=>void }){
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');

  return (
    <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <div className="text-lg font-medium mb-3">Neue Wochenregel</div>
      <div className="grid gap-3">
        <div>
          <label className="text-sm opacity-80">Wochentag</label>
          <select
            value={weekday}
            onChange={(e)=> setWeekday(Number(e.currentTarget.value))}
            className="mt-1 w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface)]"
          >
            {WEEKDAYS.map((w,idx)=> <option key={idx} value={idx}>{w}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm opacity-80">Start</label>
            <HHmmInput value={start} onChange={setStart} />
          </div>
          <div>
            <label className="text-sm opacity-80">Ende</label>
            <HHmmInput value={end} onChange={setEnd} />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={()=> onCreate({ weekday, start, end })}
            className="px-3 py-2 rounded bg-[var(--primary)] text-black font-medium hover:opacity-90"
          >
            Regel anlegen
          </button>
        </div>
        <div className="text-xs opacity-70">
          Raster: 15-Minuten. Überlappende Regeln sind nicht erlaubt.
        </div>
      </div>
    </div>
  );
}
