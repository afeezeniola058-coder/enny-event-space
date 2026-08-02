import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BookingStatusHistory from '@/components/booking/BookingStatusHistory';
import { toast } from 'sonner';
import { format, differenceInHours } from 'date-fns';
import { Calendar, Users, DollarSign, Clock, RefreshCw, CheckSquare, XSquare, CheckCircle, ShieldAlert, AlertTriangle, History } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type BookingStatus = Database['public']['Enums']['booking_status'];
type PaymentStatus = Database['public']['Enums']['payment_status'];

interface ForceCancel {
  bookingId: string;
  eventName: string;
  eventDate: string;
  customerName: string;
}

const BookingsManagement = () => {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BookingStatus | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [forceCancelTarget, setForceCancelTarget] = useState<ForceCancel | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [timelineTarget, setTimelineTarget] = useState<{ id: string; eventName: string } | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          halls(name),
          catering_packages(name),
          decoration_packages(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(bookingsData.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return bookingsData.map(booking => ({
        ...booking,
        profile: profileMap.get(booking.user_id) || null,
      }));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status, sendEmail }: { bookingId: string; status: BookingStatus; sendEmail: boolean }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      if (sendEmail && (status === 'confirmed' || status === 'cancelled')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.functions.invoke('send-booking-notification', {
            body: { booking_id: bookingId, new_status: status },
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success('Booking status updated');
      setUpdatingId(null);
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
      setUpdatingId(null);
    },
  });

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    const sendEmail = newStatus === 'confirmed' || newStatus === 'cancelled';
    setUpdatingId(bookingId);
    updateStatusMutation.mutate({ bookingId, status: newStatus, sendEmail });
  };

  // Check if a booking is within the 72-hour policy window
  const isWithin72Hours = (eventDate: string, startTime: string) => {
    const eventDateTime = new Date(`${eventDate}T${startTime}`);
    const now = new Date();
    const hours = differenceInHours(eventDateTime, now);
    return hours >= 0 && hours < 72;
  };

  const getHoursUntilEvent = (eventDate: string, startTime: string) => {
    const eventDateTime = new Date(`${eventDate}T${startTime}`);
    const now = new Date();
    return Math.max(0, Math.floor((eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)));
  };

  // Force cancel mutation (admin override)
  const forceCancelMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const adminNote = `[ADMIN OVERRIDE] Cancelled within 72-hour window. Reason: ${reason}`;
      
      const { data: existing } = await supabase
        .from('bookings')
        .select('notes')
        .eq('id', bookingId)
        .single();
      
      const updatedNotes = existing?.notes 
        ? `${existing.notes}\n\n${adminNote}` 
        : adminNote;

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' as const, notes: updatedNotes })
        .eq('id', bookingId);

      if (error) throw error;

      // Send notification email
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke('send-booking-notification', {
          body: { booking_id: bookingId, new_status: 'cancelled' },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success('Booking force-cancelled successfully');
      setForceCancelTarget(null);
      setOverrideReason('');
    },
    onError: (error) => {
      toast.error('Failed to cancel booking: ' + error.message);
    },
  });

  const toggleBookingSelection = (bookingId: string) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const toggleSelectAll = () => {
    if (!bookings) return;
    if (selectedBookings.size === bookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(bookings.map(b => b.id)));
    }
  };

  const handleBulkAction = (status: BookingStatus) => {
    if (selectedBookings.size === 0) {
      toast.error('Please select at least one booking');
      return;
    }
    setBulkAction(status);
    setShowBulkConfirm(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedBookings.size === 0) return;
    
    setIsBulkUpdating(true);
    const bookingIds = Array.from(selectedBookings);
    const sendEmail = bulkAction === 'confirmed' || bulkAction === 'cancelled';
    
    try {
      // Update all selected bookings
      const { error } = await supabase
        .from('bookings')
        .update({ status: bulkAction })
        .in('id', bookingIds);

      if (error) throw error;

      // Send emails for confirmed/cancelled status changes
      if (sendEmail) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Send emails in parallel
          await Promise.allSettled(
            bookingIds.map(bookingId =>
              supabase.functions.invoke('send-booking-notification', {
                body: { booking_id: bookingId, new_status: bulkAction },
              })
            )
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success(`${bookingIds.length} booking(s) updated to ${bulkAction}`);
      setSelectedBookings(new Set());
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to update bookings: ' + errorMessage);
    } finally {
      setIsBulkUpdating(false);
      setShowBulkConfirm(false);
      setBulkAction(null);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      confirmed: 'default',
      cancelled: 'destructive',
      completed: 'outline',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      paid: 'default',
      failed: 'destructive',
      refunded: 'outline',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter(b => b.status === 'pending').length || 0,
    confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
    totalRevenue: bookings?.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + Number(b.total_amount), 0) || 0,
  };

  const isAllSelected = bookings && bookings.length > 0 && selectedBookings.size === bookings.length;
  const isSomeSelected = selectedBookings.size > 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {isSomeSelected && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium">
                {selectedBookings.size} booking(s) selected
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleBulkAction('confirmed')}
                  disabled={isBulkUpdating}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Confirm All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('completed')}
                  disabled={isBulkUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Completed
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction('cancelled')}
                  disabled={isBulkUpdating}
                >
                  <XSquare className="h-4 w-4 mr-2" />
                  Cancel All
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedBookings(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all bookings"
                      />
                    </TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hall</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const within72h = (booking.status === 'pending' || booking.status === 'confirmed') &&
                      isWithin72Hours(booking.event_date, booking.start_time);
                    const hoursLeft = getHoursUntilEvent(booking.event_date, booking.start_time);

                    return (
                      <TableRow 
                        key={booking.id}
                        className={selectedBookings.has(booking.id) ? 'bg-primary/5' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedBookings.has(booking.id)}
                            onCheckedChange={() => toggleBookingSelection(booking.id)}
                            aria-label={`Select booking ${booking.event_name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{booking.event_name}</div>
                          {within72h && (
                            <Badge variant="outline" className="mt-1 text-xs border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {hoursLeft}h left — locked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{booking.profile?.full_name || 'N/A'}</div>
                            <div className="text-muted-foreground">{booking.profile?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(booking.event_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{booking.halls?.name || 'N/A'}</TableCell>
                        <TableCell>{formatPrice(Number(booking.total_amount))}</TableCell>
                        <TableCell>{getPaymentBadge(booking.payment_status)}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Select
                              value={booking.status}
                              onValueChange={(value: BookingStatus) => handleStatusChange(booking.id, value)}
                              disabled={updatingId === booking.id}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            {within72h && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-[130px] text-xs border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                onClick={() => setForceCancelTarget({
                                  bookingId: booking.id,
                                  eventName: booking.event_name,
                                  eventDate: booking.event_date,
                                  customerName: booking.profile?.full_name || 'Unknown',
                                })}
                              >
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Force Cancel
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-[130px] text-xs"
                              onClick={() => setTimelineTarget({ id: booking.id, eventName: booking.event_name })}
                            >
                              <History className="h-3 w-3 mr-1" />
                              Timeline
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No bookings found.</p>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of {selectedBookings.size} booking(s) to "{bulkAction}"?
              {(bulkAction === 'confirmed' || bulkAction === 'cancelled') && (
                <span className="block mt-2 text-primary font-medium">
                  Email notifications will be sent to affected customers.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction} disabled={isBulkUpdating}>
              {isBulkUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Force Cancel Override Dialog */}
      <AlertDialog open={!!forceCancelTarget} onOpenChange={(open) => { if (!open) { setForceCancelTarget(null); setOverrideReason(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Admin Policy Override
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to cancel a booking that is within the <strong>72-hour cancellation window</strong>.
                  The customer cannot cancel this themselves.
                </p>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <p className="font-medium text-amber-600 dark:text-amber-400">Booking Details</p>
                  <p className="mt-1 text-muted-foreground">
                    <strong>Event:</strong> {forceCancelTarget?.eventName}<br />
                    <strong>Date:</strong> {forceCancelTarget ? format(new Date(forceCancelTarget.eventDate), 'MMM dd, yyyy') : ''}<br />
                    <strong>Customer:</strong> {forceCancelTarget?.customerName}
                  </p>
                </div>
                <div>
                  <label htmlFor="override-reason" className="text-sm font-medium text-foreground">
                    Reason for override <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="override-reason"
                    placeholder="e.g. Customer emergency, venue issue, safety concern..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={forceCancelMutation.isPending}>
              Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (forceCancelTarget) {
                  forceCancelMutation.mutate({
                    bookingId: forceCancelTarget.bookingId,
                    reason: overrideReason,
                  });
                }
              }}
              disabled={!overrideReason.trim() || forceCancelMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {forceCancelMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Force Cancel
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Booking Timeline Dialog */}
      <Dialog open={!!timelineTarget} onOpenChange={(open) => { if (!open) setTimelineTarget(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {timelineTarget?.eventName} — Status Timeline
            </DialogTitle>
          </DialogHeader>
          {timelineTarget && <BookingStatusHistory bookingId={timelineTarget.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingsManagement;
