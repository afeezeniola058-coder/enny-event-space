import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Send, Clock, CheckCircle, AlertCircle, Bell, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface EmailReminder {
  id: string;
  booking_id: string;
  reminder_type: string;
  sent_at: string;
  created_at: string;
  booking?: {
    event_name: string;
    event_date: string;
    profiles?: {
      full_name: string;
      email: string;
    };
  };
}

const RemindersManagement = () => {
  const queryClient = useQueryClient();
  const [isTriggering, setIsTriggering] = useState(false);

  // Fetch sent reminders
  const { data: reminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['email-reminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_reminders')
        .select(`
          id,
          booking_id,
          reminder_type,
          sent_at,
          created_at
        `)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch booking details separately
      const bookingIds = [...new Set(data?.map(r => r.booking_id) || [])];
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, event_name, event_date, user_id')
        .in('id', bookingIds);

      // Fetch profiles for bookings
      const userIds = [...new Set(bookings?.map(b => b.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      // Combine data
      return data?.map(reminder => {
        const booking = bookings?.find(b => b.id === reminder.booking_id);
        const profile = profiles?.find(p => p.user_id === booking?.user_id);
        return {
          ...reminder,
          booking: booking ? {
            event_name: booking.event_name,
            event_date: booking.event_date,
            profiles: profile
          } : undefined
        };
      }) as EmailReminder[];
    },
  });

  // Fetch upcoming events that will receive reminders
  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['upcoming-reminder-events'],
    queryFn: async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const oneWeekFromNow = new Date(today);
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Get bookings for tomorrow and one week from now
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          event_name,
          event_date,
          user_id,
          status
        `)
        .in('event_date', [formatDate(tomorrow), formatDate(oneWeekFromNow)])
        .eq('status', 'confirmed');

      if (error) throw error;

      // Check which already have reminders
      const bookingIds = data?.map(b => b.id) || [];
      const { data: existingReminders } = await supabase
        .from('email_reminders')
        .select('booking_id, reminder_type')
        .in('booking_id', bookingIds);

      return data?.map(booking => {
        const tomorrowDate = formatDate(tomorrow);
        const weekDate = formatDate(oneWeekFromNow);
        
        let pendingReminder = null;
        if (booking.event_date === tomorrowDate) {
          const hasReminder = existingReminders?.some(
            r => r.booking_id === booking.id && r.reminder_type === 'one_day'
          );
          if (!hasReminder) pendingReminder = 'one_day';
        } else if (booking.event_date === weekDate) {
          const hasReminder = existingReminders?.some(
            r => r.booking_id === booking.id && r.reminder_type === 'one_week'
          );
          if (!hasReminder) pendingReminder = 'one_week';
        }

        return {
          ...booking,
          pendingReminder
        };
      }).filter(b => b.pendingReminder);
    },
  });

  // Trigger reminders manually
  const triggerReminders = async () => {
    setIsTriggering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('send-event-reminders', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      const results = response.data?.results;
      
      toast({
        title: "Reminders Processed",
        description: `One-day: ${results?.oneDayReminders?.sent || 0} sent, ${results?.oneDayReminders?.skipped || 0} skipped. One-week: ${results?.oneWeekReminders?.sent || 0} sent, ${results?.oneWeekReminders?.skipped || 0} skipped.`,
      });

      queryClient.invalidateQueries({ queryKey: ['email-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminder-events'] });
    } catch (error: any) {
      console.error('Error triggering reminders:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to trigger reminders",
        variant: "destructive",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const getReminderTypeBadge = (type: string) => {
    if (type === 'one_day') {
      return <Badge variant="destructive">1 Day Before</Badge>;
    }
    return <Badge variant="secondary">1 Week Before</Badge>;
  };

  const stats = {
    totalSent: reminders?.length || 0,
    oneDayCount: reminders?.filter(r => r.reminder_type === 'one_day').length || 0,
    oneWeekCount: reminders?.filter(r => r.reminder_type === 'one_week').length || 0,
    pendingCount: upcomingEvents?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.totalSent}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">1 Day Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats.oneDayCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">1 Week Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.oneWeekCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.pendingCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Trigger Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Manual Trigger
          </CardTitle>
          <CardDescription>
            Manually trigger the reminder email job. This will send reminders for events happening tomorrow and in one week.
            The automated job runs daily at 9 AM UTC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={triggerReminders} 
              disabled={isTriggering}
              className="flex items-center gap-2"
            >
              {isTriggering ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isTriggering ? 'Sending...' : 'Send Reminders Now'}
            </Button>
            
            {upcomingEvents && upcomingEvents.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {upcomingEvents.length} reminder(s) pending
              </span>
            )}
          </div>

          {/* Pending Reminders */}
          {upcomingEvents && upcomingEvents.length > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Pending Reminders:</h4>
              <ul className="space-y-1 text-sm">
                {upcomingEvents.map(event => (
                  <li key={event.id} className="flex items-center gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{event.event_name}</span>
                    <span className="text-muted-foreground">
                      ({format(new Date(event.event_date), 'MMM d, yyyy')})
                    </span>
                    {getReminderTypeBadge(event.pendingReminder!)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sent Reminders History */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder History</CardTitle>
          <CardDescription>
            Recent email reminders that have been sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {remindersLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reminders && reminders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Reminder Type</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">
                      {reminder.booking?.event_name || 'Unknown Event'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{reminder.booking?.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-muted-foreground">{reminder.booking?.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {reminder.booking?.event_date 
                        ? format(new Date(reminder.booking.event_date), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {getReminderTypeBadge(reminder.reminder_type)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(reminder.sent_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No reminders have been sent yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RemindersManagement;
