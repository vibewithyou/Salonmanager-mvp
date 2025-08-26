import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Service } from "@shared/schema";

export default function Admin() {
  const [activeTab, setActiveTab] = useState('services');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // For demo purposes, we'll use the first salon
  const salonId = "barbers-freiberg"; // This should come from user context

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: [`/api/v1/salons/${salonId}/services`],
  });

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: { title: string; durationMin: number; priceCents: number }) => {
      return await apiRequest('POST', `/api/v1/salons/${salonId}/services`, serviceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/salons/${salonId}/services`] });
      setShowServiceModal(false);
      setEditingService(null);
      toast({
        title: "Service erstellt",
        description: "Der Service wurde erfolgreich erstellt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Service konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      return await apiRequest('PATCH', `/api/v1/services/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/salons/${salonId}/services`] });
      setShowServiceModal(false);
      setEditingService(null);
      toast({
        title: "Service aktualisiert",
        description: "Der Service wurde erfolgreich aktualisiert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Service konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/v1/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/salons/${salonId}/services`] });
      toast({
        title: "Service gelöscht",
        description: "Der Service wurde erfolgreich gelöscht.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Service konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const handleServiceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const serviceData = {
      title: formData.get('title') as string,
      durationMin: parseInt(formData.get('durationMin') as string),
      priceCents: Math.round(parseFloat(formData.get('price') as string) * 100),
    };

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data: serviceData });
    } else {
      createServiceMutation.mutate(serviceData);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceModal(true);
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Service löschen möchten?')) {
      deleteServiceMutation.mutate(serviceId);
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
            <h2 className="text-3xl font-bold">Salon-Verwaltung</h2>
            <p className="text-gray-600 dark:text-gray-400">Verwalten Sie Services, Mitarbeiter und Einstellungen</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'services'
                  ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('services')}
              data-testid="tab-services"
            >
              Services
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'staff'
                  ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('staff')}
              data-testid="tab-staff"
            >
              Mitarbeiter
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'hours'
                  ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('hours')}
              data-testid="tab-hours"
            >
              Arbeitszeiten
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('settings')}
              data-testid="tab-settings"
            >
              Einstellungen
            </button>
          </nav>
        </div>

        {/* Services Management */}
        {activeTab === 'services' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Services verwalten</h3>
                <Button
                  className="bg-gold-500 hover:bg-gold-600 text-dark-900"
                  onClick={() => {
                    setEditingService(null);
                    setShowServiceModal(true);
                  }}
                  data-testid="button-new-service"
                >
                  Neuer Service
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Dauer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Preis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--surface)] divide-y divide-[var(--border)]">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-dark-700" data-testid={`service-row-${service.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium" data-testid="text-service-title">{service.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {service.durationMin} Min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold">
                          {(service.priceCents / 100).toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={service.active ? "default" : "secondary"}>
                            {service.active ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditService(service)}
                            data-testid="button-edit-service"
                          >
                            Bearbeiten
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteService(service.id)}
                            data-testid="button-delete-service"
                          >
                            Löschen
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other tabs placeholder */}
        {activeTab !== 'services' && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h3 className="text-xl font-bold mb-4">Coming Soon</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Diese Funktion wird in einer zukünftigen Version verfügbar sein.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Modal */}
      <Dialog open={showServiceModal} onOpenChange={setShowServiceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Service bearbeiten' : 'Neuen Service erstellen'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleServiceSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Service Name</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingService?.title || ''}
                required
                data-testid="input-service-title"
              />
            </div>
            <div>
              <Label htmlFor="durationMin">Dauer (Minuten)</Label>
              <Input
                id="durationMin"
                name="durationMin"
                type="number"
                defaultValue={editingService?.durationMin || 60}
                required
                data-testid="input-service-duration"
              />
            </div>
            <div>
              <Label htmlFor="price">Preis (€)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                defaultValue={editingService ? (editingService.priceCents / 100).toFixed(2) : '60.00'}
                required
                data-testid="input-service-price"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowServiceModal(false)}
                data-testid="button-cancel"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                className="bg-gold-500 hover:bg-gold-600 text-dark-900"
                disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                data-testid="button-save-service"
              >
                {editingService ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
