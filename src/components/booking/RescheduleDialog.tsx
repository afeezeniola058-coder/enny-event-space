import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, MapPin, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  const { data: halls = [] } = useHalls();

  const form = useForm<RescheduleFormValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      eventDate: new Date(booking.event_date + "T00:00:00"),
      startTime: booking.start_time,
      endTime: booking.end_time,
      hallId: booking.hall_id || "",
    },
  });

  const selectedHallId = form.watch("hallId");

  // Reset form when booking changes
  useEffect(() => {
    form.reset({
      eventDate: new Date(booking.event_date + "T00:00:00"),
      startTime: booking.start_time,
      endTime: booking.end_time,
      hallId: booking.hall_id || "",
    });
  }, [booking, form]);

  // Fetch booked dates when hall is selected
  useEffect(() => {
    const fetchBookedDates = async () => {
      if (!selectedHallId) {
        setBookedDates([]);
        return;
      }

      const { data } = await supabase
        .from("bookings")
        .select("event_date")
        .eq("hall_id", selectedHallId)
        .neq("status", "cancelled")
        .neq("id", booking.id); // Exclude current booking

      if (data) {
        const dates = data.map((b) => new Date(b.event_date + "T00:00:00"));
        setBookedDates(dates);
      }
    };

    fetchBookedDates();
  }, [selectedHallId, booking.id]);

  // Calculate new total based on hall and time changes
  const calculateNewTotal = async () => {
    const hallId = form.getValues("hallId");
    const startTime = form.getValues("startTime");
    const endTime = form.getValues("endTime");

    const selectedHall = halls.find((h) => h.id === hallId);
    if (!selectedHall || !startTime || !endTime) return booking.total_amount;

    const [startH] = startTime.split(":").map(Number);
    const [endH] = endTime.split(":").map(Number);
    const hours = Math.max(0, endH - startH);

    let total = selectedHall.price_per_hour * hours;

    // Add catering cost if exists
    if (booking.catering_package_id) {
      const { data: catering } = await supabase
        .from("catering_packages")
        .select("price_per_person")
        .eq("id", booking.catering_package_id)
        .single();
      if (catering) {
        total += catering.price_per_person * booking.guest_count;
      }
    }

    // Add decoration cost if exists
    if (booking.decoration_package_id) {
      const { data: decoration } = await supabase
        .from("decoration_packages")
        .select("price")
        .eq("id", booking.decoration_package_id)
        .single();
      if (decoration) {
        total += decoration.price;
      }
    }

    return total;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const onSubmit = async (data: RescheduleFormValues) => {
    setIsSubmitting(true);

    try {
      const formattedDate = format(data.eventDate, "yyyy-MM-dd");

      // Check if the new date/hall combination is available
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("id")
        .eq("hall_id", data.hallId)
        .eq("event_date", formattedDate)
        .neq("status", "cancelled")
        .neq("id", booking.id)
        .maybeSingle();

      if (existingBooking) {
        toast({
          title: "Date not available",
          description: "This venue is already booked for the selected date. Please choose a different date or venue.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Calculate new total
      const newTotal = await calculateNewTotal();

      // Update booking
      const { error } = await supabase
        .from("bookings")
        .update({
          event_date: formattedDate,
          start_time: data.startTime,
          end_time: data.endTime,
          hall_id: data.hallId,
          total_amount: newTotal,
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast({
        title: "Booking rescheduled",
        description: "Your booking has been successfully updated.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Reschedule error:", error);
      toast({
        title: "Reschedule failed",
        description: error instanceof Error ? error.message : "Could not reschedule your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reschedule Booking</DialogTitle>
          <DialogDescription>
            Change the date, time, or venue for your event. Price may be adjusted based on your changes.
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
                  <FormLabel>Event Date</FormLabel>
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
                          if (date < new Date()) return true;
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="gold" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
