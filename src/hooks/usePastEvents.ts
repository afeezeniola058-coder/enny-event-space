import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PastEvent {
  id: string;
  title: string;
  venue: string;
  event_date: string;
  guest_count: number | null;
  category: string;
  description: string | null;
  images: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PastEventInsert {
  title: string;
  venue: string;
  event_date: string;
  guest_count?: number | null;
  category: string;
  description?: string | null;
  images?: string[];
  is_published?: boolean;
}

export function usePastEvents(includeUnpublished = false) {
  return useQuery({
    queryKey: ['past-events', includeUnpublished],
    queryFn: async () => {
      let query = supabase
        .from('past_events')
        .select('*')
        .order('event_date', { ascending: false });
      
      if (!includeUnpublished) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PastEvent[];
    },
  });
}

export function useCreatePastEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: PastEventInsert) => {
      const { data, error } = await supabase
        .from('past_events')
        .insert(event)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['past-events'] });
      toast.success('Event created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create event: ' + error.message);
    },
  });
}

export function useUpdatePastEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PastEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('past_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['past-events'] });
      toast.success('Event updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update event: ' + error.message);
    },
  });
}

export function useDeletePastEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('past_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['past-events'] });
      toast.success('Event deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete event: ' + error.message);
    },
  });
}

export async function uploadEventImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `events/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('event-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('event-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteEventImage(imageUrl: string): Promise<void> {
  const path = imageUrl.split('/event-images/')[1];
  if (!path) return;

  const { error } = await supabase.storage
    .from('event-images')
    .remove([path]);

  if (error) throw error;
}
