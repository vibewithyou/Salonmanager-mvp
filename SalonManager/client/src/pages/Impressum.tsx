import { useEffect, useState } from 'react';

export default function ImpressumPage(){
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (import.meta.env.VITE_LEGAL_FROM_API === 'true') {
      fetch('/api/v1/legal/impressum')
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
      <h1 className="text-2xl font-semibold mb-4">Impressum</h1>
      <section className="space-y-2 text-sm leading-relaxed">
        <p><strong>SalonManager (MVP Demo)</strong></p>
        <p>Verantwortlich i.S.d. §5 TMG:<br/>Max Mustermann<br/>Musterstraße 1<br/>09599 Freiberg</p>
        <p>E-Mail: <a className="underline" href="mailto:legal@salonmanager.app">legal@salonmanager.app</a></p>
        <p>USt-IdNr.: DE000000000 (Demo)</p>
        <hr className="my-4 border-[var(--border)]"/>
        <p className="opacity-70">Hinweis: Dies ist eine Demo-Anwendung (MVP). Inhalte können Platzhalter sein.</p>
      </section>
    </main>
  );
}
