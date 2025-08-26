import { useQuery, UseQueryResult, useQueryClient, useMutation } from '@tanstack/react-query';
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

export function useSalonBookingsToday(salonId: number) {
  const tzToday = new Date().toISOString().slice(0, 10);
  const qs = new URLSearchParams({
    scope: 'salon',
    salon_id: String(salonId),
    from: tzToday,
    to: tzToday,
    limit: '200',
  });

  return useQuery({
    queryKey: ['bookings', 'salon', 'today', salonId, tzToday],
    queryFn: async () => {
      const r = await fetch(`/api/v1/bookings?` + qs.toString(), {
        credentials: 'include',
      });
      if (!r.ok) throw new Error(await r.text());
      return (await r.json()) as BookingDto[];
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useUpdateBookingStatus(salonId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      bookingId: number;
      status: 'confirmed' | 'declined' | 'cancelled';
      reason?: string;
    }) => {
      const r = await fetch(`/api/v1/bookings/${input.bookingId}?salon_id=${salonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: input.status, reason: input.reason ?? null }),
      });
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings', 'salon'] });
      qc.invalidateQueries({ queryKey: ['bookings', 'salon', 'today'] });
    },
  });
}

// ---- Services Admin CRUD ----
export type ServiceDto = {
  id: number;
  salon_id: number;
  title: string;
  duration_min: number;
  price_cents: number;
  active: boolean;
};

export function useServices(salonId: number) {
  return useQuery({
    queryKey: ['services', salonId],
    queryFn: async () => {
      const r = await fetch(`/api/v1/salons/${salonId}/services`, {
        credentials: 'include',
      });
      if (!r.ok) throw new Error(await r.text());
      return (await r.json()) as ServiceDto[];
    },
    staleTime: 30_000,
  });
}

export function useCreateService(salonId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      duration_min: number;
      price_cents: number;
      active?: boolean;
    }) => {
      const r = await fetch(`/api/v1/salons/${salonId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['services', salonId] }),
  });
}

export function useUpdateService(salonId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number } & Partial<ServiceDto>) => {
      const { id, ...patch } = input;
      const r = await fetch(`/api/v1/services/${id}?salon_id=${salonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['services', salonId] }),
  });
}

export function useDeleteService(salonId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/v1/services/${id}?salon_id=${salonId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['services', salonId] }),
  });
}

// ---- Stylists CRUD ----
export type StylistDto = {
  id: number;
  salon_id: number;
  display_name: string;
  avatar_url: string | null;
  active: boolean;
};

export function useStylists(salonId: number) {
  return useQuery({
    queryKey: ['stylists', salonId],
    queryFn: async () => {
      const r = await fetch(`/api/v1/salons/${salonId}/stylists`, {
        credentials: 'include',
      });
      if (!r.ok) throw new Error(await r.text());
      return (await r.json()) as StylistDto[];
    },
    staleTime: 30_000,
  });
}

export function useCreateStylist(salonId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      display_name: string;
      avatar_url?: string | null;
      active?: boolean;
    }) => {
      const r = await fetch(`/api/v1/salons/${salonId}/stylists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['stylists', salonId] }),
  });
}

export function useUpdateStylist(salonId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number } & Partial<StylistDto>) => {
      const { id, ...patch } = input;
      const r = await fetch(`/api/v1/stylists/${id}?salon_id=${salonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['stylists', salonId] }),
  });
}

export function useDeleteStylist(salonId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/v1/stylists/${id}?salon_id=${salonId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['stylists', salonId] }),
  });
}

// ---- Work Hours CRUD ----
export type WorkHourDto = {
  id: number;
  salon_id: number;
  stylist_id: number;
  weekday: number;
  start: string;
  end: string;
};

export function useWorkHours(salonId: number, stylistId: number) {
  return useQuery({
    queryKey: ['work-hours', salonId, stylistId],
    queryFn: async () => {
      const r = await fetch(
        `/api/v1/salons/${salonId}/stylists/${stylistId}/work-hours`,
        { credentials: 'include' },
      );
      if (!r.ok) throw new Error(await r.text());
      return (await r.json()) as WorkHourDto[];
    },
    enabled: !!salonId && !!stylistId,
    staleTime: 30_000,
  });
}

// ---- Absences ----
export type AbsenceDto = {
  id: number;
  salon_id: number;
  stylist_id: number;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

export function useAbsences(salonId: number, stylistId: number) {
  return useQuery({
    queryKey: ['absences', salonId, stylistId],
    queryFn: async () => {
      const r = await fetch(`/api/v1/salons/${salonId}/stylists/${stylistId}/absences`, { credentials: 'include' });
      if (!r.ok) throw new Error(await r.text());
      return (await r.json()) as AbsenceDto[];
    },
    enabled: !!salonId && !!stylistId,
    staleTime: 30_000,
  });
}

export function useCreateAbsence(salonId: number, stylistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { starts_at: string; ends_at: string; reason?: string | null }) => {
      const r = await fetch(`/api/v1/salons/${salonId}/stylists/${stylistId}/absences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences', salonId, stylistId] }),
  });
}

export function useUpdateAbsence(salonId: number, stylistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number; starts_at?: string; ends_at?: string; reason?: string | null }) => {
      const r = await fetch(`/api/v1/absences/${input.id}?salon_id=${salonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ starts_at: input.starts_at, ends_at: input.ends_at, reason: input.reason }),
      });
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences', salonId, stylistId] }),
  });
}

export function useDeleteAbsence(salonId: number, stylistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/v1/absences/${id}?salon_id=${salonId}`, { method: 'DELETE', credentials: 'include' });
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences', salonId, stylistId] }),
  });
}

export function useCreateWorkHour(salonId: number, stylistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      weekday: number;
      start: string;
      end: string;
    }) => {
      const r = await fetch(
        `/api/v1/salons/${salonId}/stylists/${stylistId}/work-hours`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['work-hours', salonId, stylistId] }),
  });
}

export function useUpdateWorkHour(salonId: number, stylistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: number;
      weekday?: number;
      start?: string;
      end?: string;
    }) => {
      const r = await fetch(
        `/api/v1/work-hours/${input.id}?salon_id=${salonId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            weekday: input.weekday,
            start: input.start,
            end: input.end,
          }),
        },
      );
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['work-hours', salonId, stylistId] }),
  });
}

export function useDeleteWorkHour(salonId: number, stylistId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(
        `/api/v1/work-hours/${id}?salon_id=${salonId}`,
        { method: 'DELETE', credentials: 'include' },
      );
      if (!r.ok) throw new Error(await r.text());
      return await r.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['work-hours', salonId, stylistId] }),
  });
}
