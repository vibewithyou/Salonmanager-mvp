import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiGet } from '../lib/api';

export type SalonListItem = {
  id: number;
  name: string;
  slug: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  services: Array<{ id: number; title: string; price_cents: number }>;
};

export type SalonDetail = {
  id: number;
  name: string;
  slug: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  email?: string | null;
  open_hours_json?: any | null;
  services: Array<{
    id: number;
    title: string;
    duration_min: number;
    price_cents: number;
    active: boolean;
  }>;
  stylists: Array<{
    id: number;
    display_name: string;
    avatar_url: string | null;
    active: boolean;
  }>;
};

export function useSalons(): UseQueryResult<SalonListItem[]> {
  return useQuery({
    queryKey: ['salons'],
    queryFn: () => apiGet<SalonListItem[]>('/api/v1/salons'),
    staleTime: 60_000,
  });
}

export function useSalon(id: string | number): UseQueryResult<SalonDetail> {
  return useQuery({
    queryKey: ['salon', String(id)],
    queryFn: () => apiGet<SalonDetail>(`/api/v1/salons/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export type BookingDto = {
  id: number;
  salon_id: number;
  service: { id: number; title: string; duration_min: number; price_cents: number };
  stylist: { id: number; display_name: string | null };
  customer: { id: number | null; name: string | null };
  starts_at: string;
  ends_at: string;
  status: 'requested' | 'confirmed' | 'declined' | 'cancelled';
  note: string | null;
};

export function useMyBookings(params?: { from?: string; to?: string; status?: string }) {
  const qs = new URLSearchParams({ scope: 'me' });
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  if (params?.status) qs.set('status', params.status);

  return useQuery({
    queryKey: ['bookings', 'me', params],
    queryFn: async () => {
      const r = await fetch(`/api/v1/bookings?` + qs.toString(), { credentials: 'include' });
      if (!r.ok) throw new Error(await r.text());
      return (await r.json()) as BookingDto[];
    },
    staleTime: 30_000,
  });
}
