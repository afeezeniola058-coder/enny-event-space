import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, MapPin, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useHalls } from "@/hooks/useHalls";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const rescheduleSchema = z.object({
  eventDate: z.date({ required_error: "Event date is required" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  hallId: z.string().min(1, "Please select a venue"),
  reason: z.string().max(500, "Reason must be 500 characters or fewer").optional(),
});

type RescheduleFormValues = z.infer<typeof rescheduleSchema>;

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
];

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    event_date: string;
    start_time: string;
    end_time: string;
    hall_id: string | null;
    guest_count: number;
    total_amount: number;
    catering_package_id: string | null;
    decoration_package_id: string | null;
  };
  onSuccess: () => void;
}

export function RescheduleDialog({ open, onOpenChange, booking, onSuccess }: RescheduleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<"free" | "taken" | null>(null);
  const { data: halls = [] } = useHalls();

  const form = useForm<RescheduleFormValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      eventDate: new Date(booking.event_date + "T00:00:00"),
      startTime: booking.start_time?.slice(0, 5) ?? "",
      endTime: booking.end_time?.slice(0, 5) ?? "",
      hallId: booking.hall_id || "",
      reason: "",
    },
  });

  const selectedHallId = form.watch("hallId");
  const selectedDate = form.watch("eventDate");

  useEffect(() => {
    form.reset({
      eventDate: new Date(booking.event_date + "T00:00:00"),
      startTime: booking.start_time?.slice(0, 5) ?? "",
      endTime: booking.end_time?.slice(0, 5) ?? "",
      hallId: booking.hall_id || "",
      reason: "",
    });
    setAvailability(null);
  }, [booking, form]);

  // Publicly readable availability table — safe for any signed-in user
  useEffect(() => {
    const fetchBookedDates = async () => {
      if (!selectedHallId) {
        setBookedDates([]);
        return;
      }

      const { data } = await supabase
        .from("hall_availability")
        .select("event_date")
        .eq("hall_id", selectedHallId);

      if (data) {
        setBookedDates(
          data
            .map((b) => b.event_date)
            .filter((d) => d !== booking.event_date)
            .map((d) => new Date(d + "T00:00:00"))
        );
      }
    };

    fetchBookedDates();
  }, [selectedHallId, booking.event_date]);

  // Live availability check for the exact hall + date combination
  useEffect(() => {
    const check = async () => {
      if (!selectedHallId || !selectedDate) {
        setAvailability(null);
        return;
      }
      setChecking(true);
      const formatted = format(selectedDate, "yyyy-MM-dd");
      const { data } = await supabase
        .from("hall_availability")
        .select("event_date")
        .eq("hall_id", selectedHallId)
        .eq("event_date", formatted)
        .maybeSingle();

      const isOwnCurrentSlot =
        selectedHallId === booking.hall_id && formatted === booking.event_date;
      setAvailability(data && !isOwnCurrentSlot ? "taken" : "free");
      setChecking(false);
    };

    check();
  }, [selectedHallId, selectedDate, booking.hall_id, booking.event_date]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const onSubmit = async (data: RescheduleFormValues) => {
    if (data.endTime <= data.startTime) {
      form.setError("endTime", { message: "End time must be after start time" });
      return;
    }
    if (availability === "taken") {
      toast({
        title: "Date not available",
        description: "That venue is already booked on the selected date. Pick another date or venue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc("request_booking_reschedule", {
        _booking_id: booking.id,
        _requested_date: format(data.eventDate, "yyyy-MM-dd"),
        _requested_start_time: data.startTime,
        _requested_end_time: data.endTime,
        _requested_hall_id: data.hallId,
        _reason: data.reason || null,
      });

      if (error) throw error;

      toast({
        title: "Request submitted",
        description: "Our team will review your reschedule request and notify you shortly.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Reschedule request error:", error);
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Could not submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a Reschedule</DialogTitle>
          <DialogDescription>
            Choose a new date, time or venue. Your request is reviewed by our team before it takes
            effect — you'll be notified as soon as it's approved.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Hall Selection */}
            <FormField
              control={form.control}
              name="hallId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Select a venue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {halls.map((hall) => (
                        <SelectItem key={hall.id} value={hall.id}>
                          {hall.name} (Capacity: {hall.capacity}) - {formatPrice(hall.price_per_hour)}/hr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Selection */}
            <FormField
              control={form.control}
              name="eventDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>New Event Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                          return bookedDates.some(
                            (bookedDate) => bookedDate.toDateString() === date.toDateString()
                          );
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Live availability feedback */}
            {selectedHallId && selectedDate && (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-3 text-sm",
                  checking
                    ? "border-border bg-muted/40 text-muted-foreground"
                    : availability === "free"
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-destructive/40 bg-destructive/10 text-destructive"
                )}
              >
                {checking ? (
                  <>
                    <Loader2 className="h-4 w-4 mt-0.5 animate-spin shrink-0" />
                    Checking availability…
                  </>
                ) : availability === "free" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    This venue is available on {format(selectedDate, "PPP")}.
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    This venue is already booked on {format(selectedDate, "PPP")}. Please choose
                    another date or venue.
                  </>
                )}
              </div>
            )}

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Start" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="End" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Let us know why you need to move your event…"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                disabled={isSubmitting || checking || availability === "taken"}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
