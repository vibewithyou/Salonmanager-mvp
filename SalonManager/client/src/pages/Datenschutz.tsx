import { useEffect, useState } from 'react';

export default function DatenschutzPage(){
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (import.meta.env.VITE_LEGAL_FROM_API === 'true') {
      fetch('/api/v1/legal/datenschutz')
        .then(r => (r.ok ? r.text() : ''))
        .then(txt => { if (txt) setHtml(txt); })
        .catch(() => {});
    }
  }, []);

  if (html) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10 text-[var(--on-surface)]" dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 text-[var(--on-surface)]">
      <h1 className="text-2xl font-semibold mb-4">Datenschutzerklärung (MVP)</h1>
      <section className="space-y-4 text-sm leading-relaxed">
        <p>Wir verarbeiten personenbezogene Daten nur zum Betrieb dieser Demo-App (Terminbuchung, E-Mail-Benachrichtigungen bei Opt-in).</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Datenarten:</strong> Name, E-Mail (optional), Buchungsdaten.</li>
          <li><strong>Zwecke:</strong> Terminverwaltung, E-Mail-Info (bei Einwilligung).</li>
          <li><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertrag), lit. a (Einwilligung).</li>
          <li><strong>Speicherdauer:</strong> Bis zur Löschung des Kontos oder Widerruf.</li>
          <li><strong>Betroffenenrechte:</strong> Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch.</li>
        </ul>
        <p>Kontakt: <a className="underline" href="mailto:privacy@salonmanager.app">privacy@salonmanager.app</a></p>
      </section>
    </main>
  );
}
