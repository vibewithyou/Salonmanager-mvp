import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import type { BookingWithDetails } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: bookings = [], isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ['/api/v1/me/stylist/bookings'],
  });

  const { data: userBookings = [] } = useQuery<BookingWithDetails[]>({
    queryKey: ['/api/v1/me/bookings'],
  });

  const todayBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.startsAt).toDateString();
    const today = new Date().toDateString();
    return bookingDate === today;
  });

  const confirmedCount = todayBookings.filter(b => b.status === 'confirmed').length;
  const pendingCount = todayBookings.filter(b => b.status === 'requested').length;
  const todayRevenue = confirmedCount * 60; // Simplified calculation

  const handleBookingAction = async (bookingId: string, status: 'confirmed' | 'declined') => {
    try {
      await fetch(`/api/v1/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      // Invalidate and refetch bookings
      window.location.reload();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Willkommen zurück, <span data-testid="text-user-name">{user?.firstName || 'User'}</span>
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gold-100 dark:bg-gold-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Heutige Termine</p>
                  <p className="text-2xl font-bold" data-testid="stats-today-appointments">{todayBookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bestätigt</p>
                  <p className="text-2xl font-bold" data-testid="stats-confirmed-appointments">{confirmedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Umsatz heute</p>
                  <p className="text-2xl font-bold" data-testid="stats-today-revenue">{todayRevenue},00 €</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Wartend</p>
                  <p className="text-2xl font-bold" data-testid="stats-pending-appointments">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardContent className="p-6">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
              <h3 className="text-xl font-bold">Heutiger Terminplan</h3>
            </div>
            
            {todayBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">Keine Termine für heute</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayBookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                    data-testid={`booking-${booking.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">
                          {new Date(booking.startsAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-gray-400">60min</div>
                      </div>
                      <div className="w-px h-12 bg-gold-400"></div>
                      <div>
                        <h4 className="font-semibold" data-testid="text-customer-name">
                          {booking.customer.firstName} {booking.customer.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-service-name">
                          {booking.service.title}
                        </p>
                        {booking.note && (
                          <p className="text-xs text-gray-500" data-testid="text-booking-note">{booking.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' :
                        booking.status === 'requested' ? 'secondary' :
                        booking.status === 'declined' ? 'destructive' : 'outline'
                      }>
                        {booking.status === 'confirmed' && 'Bestätigt'}
                        {booking.status === 'requested' && 'Wartend'}
                        {booking.status === 'declined' && 'Abgelehnt'}
                        {booking.status === 'cancelled' && 'Storniert'}
                      </Badge>
                      {booking.status === 'requested' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                            onClick={() => handleBookingAction(booking.id, 'confirmed')}
                            data-testid="button-confirm-booking"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                            onClick={() => handleBookingAction(booking.id, 'declined')}
                            data-testid="button-decline-booking"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User's Bookings (if customer) */}
        {user?.role === 'customer' && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                <h3 className="text-xl font-bold">Meine Termine</h3>
              </div>
              
              {userBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">Keine Termine vorhanden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBookings.slice(0, 5).map((booking) => (
                    <div 
                      key={booking.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {new Date(booking.startsAt).toLocaleDateString('de-DE')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(booking.startsAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="w-px h-12 bg-gold-400"></div>
                        <div>
                          <h4 className="font-semibold">{booking.salon.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{booking.service.title}</p>
                          {booking.stylist && (
                            <p className="text-xs text-gray-500">mit {booking.stylist.displayName}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' :
                        booking.status === 'requested' ? 'secondary' :
                        booking.status === 'declined' ? 'destructive' : 'outline'
                      }>
                        {booking.status === 'confirmed' && 'Bestätigt'}
                        {booking.status === 'requested' && 'Wartend'}
                        {booking.status === 'declined' && 'Abgelehnt'}
                        {booking.status === 'cancelled' && 'Storniert'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
