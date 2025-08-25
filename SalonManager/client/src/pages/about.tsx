import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import NavigationHeader from "@/components/navigation-header";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Über <span className="text-gold-500">SalonManager</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Die moderne Lösung für Terminbuchungen und Salon-Verwaltung in Deutschland
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">Unser Ziel</h2>
            <p className="text-lg text-muted-foreground mb-6">
              SalonManager wurde entwickelt, um die Brücke zwischen modernen Friseursalons 
              und ihren Kunden zu schlagen. Wir glauben, dass Terminbuchungen einfach, 
              transparent und bequem sein sollten.
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              Unsere Plattform ermöglicht es Kunden, ihre Lieblingssalons zu entdecken, 
              Leistungen zu vergleichen und Termine online zu buchen - 24/7 verfügbar.
            </p>
          </div>
          <div className="bg-gold-500/10 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4 text-gold-500">Warum SalonManager?</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-gold-500 mr-2">✓</span>
                Einfache Online-Terminbuchung
              </li>
              <li className="flex items-start">
                <span className="text-gold-500 mr-2">✓</span>
                Übersichtliche Salon-Suche
              </li>
              <li className="flex items-start">
                <span className="text-gold-500 mr-2">✓</span>
                Transparente Preise und Leistungen
              </li>
              <li className="flex items-start">
                <span className="text-gold-500 mr-2">✓</span>
                Mobile-first Design
              </li>
              <li className="flex items-start">
                <span className="text-gold-500 mr-2">✓</span>
                Für Salon-Besitzer und Kunden
              </li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Für Kunden</h3>
              <p className="text-muted-foreground">
                Entdecken Sie Salons in Ihrer Nähe und buchen Sie Termine online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Für Salons</h3>
              <p className="text-muted-foreground">
                Verwalten Sie Termine, Kunden und Leistungen an einem Ort
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Analytics</h3>
              <p className="text-muted-foreground">
                Verstehen Sie Ihre Kunden besser mit detaillierter Auswertung
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Bereit zu starten?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Entdecken Sie die besten Salons in Freiberg und buchen Sie Ihren nächsten Termin
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/salons">
              <Button size="lg" className="bg-gold-500 hover:bg-gold-600 text-dark-900" data-testid="button-explore-salons">
                Salons entdecken
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" data-testid="button-back-home">
                Zur Startseite
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}