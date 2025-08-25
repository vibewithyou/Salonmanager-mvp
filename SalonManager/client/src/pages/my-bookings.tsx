import NavigationHeader from "@/components/navigation-header";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BookingWithDetails } from "@shared/schema";

export default function MyBookings() {
  const { data: bookings = [] } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/v1/bookings", "me"],
    queryFn: async () => {
      const res = await fetch("/api/v1/bookings?scope=me", { credentials: "include" });
      if (!res.ok) throw new Error("failed to load");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <h2 className="text-3xl font-bold mb-4">Meine Termine</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Keine Termine vorhanden</p>
        ) : (
          bookings.map(b => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{b.service.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(b.startsAt).toLocaleString("de-DE")}
                  </div>
                  <div className="text-sm text-gray-500">{b.salon.name}</div>
                </div>
                <Badge>
                  {b.status === "confirmed" && "Bestätigt"}
                  {b.status === "requested" && "Wartend"}
                  {b.status === "declined" && "Abgelehnt"}
                  {b.status === "cancelled" && "Storniert"}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
