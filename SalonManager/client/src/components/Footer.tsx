import { Link } from 'wouter';

export default function Footer(){
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="opacity-70">&copy; {new Date().getFullYear()} SalonManager · MVP</div>
        <nav className="flex gap-4">
          <Link href="/impressum" className="underline hover:opacity-80">Impressum</Link>
          <Link href="/datenschutz" className="underline hover:opacity-80">Datenschutz</Link>
        </nav>
      </div>
    </footer>
  );
}
