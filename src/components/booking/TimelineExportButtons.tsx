import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  exportStatusHistoryCSV,
  exportStatusHistoryPDF,
  type TimelineEntry,
} from '@/utils/exportStatusHistory';

interface Props {
  bookingId: string;
  eventName: string;
  customerName?: string | null;
  eventDate?: string | null;
}

const TimelineExportButtons = ({ bookingId, eventName, customerName, eventDate }: Props) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['booking-status-history', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_status_history')
        .select('id, field, old_value, new_value, reason, actor, created_at')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as TimelineEntry[];
    },
    enabled: !!bookingId,
  });

  const meta = { bookingId, eventName, customerName, eventDate };

  const handleExport = (kind: 'csv' | 'pdf') => {
    if (history.length === 0) {
      toast.error('No status history to export yet');
      return;
    }
    try {
      if (kind === 'csv') exportStatusHistoryCSV(history, meta);
      else exportStatusHistoryPDF(history, meta);
      toast.success(`Timeline exported as ${kind.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isLoading}
        onClick={() => handleExport('csv')}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isLoading}
        onClick={() => handleExport('pdf')}
      >
        <FileDown className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
};

export default TimelineExportButtons;
