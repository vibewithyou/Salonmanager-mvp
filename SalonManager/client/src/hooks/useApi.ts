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
