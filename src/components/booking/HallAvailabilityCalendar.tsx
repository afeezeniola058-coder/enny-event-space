import { useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface HallAvailabilityCalendarProps {
  selectedHallId: string;
  hallName?: string;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

const HallAvailabilityCalendar = ({
  selectedHallId,
  hallName,
  onDateSelect,
  selectedDate,
}: HallAvailabilityCalendarProps) => {
  // Fetch all non-cancelled bookings for the selected hall
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["hall-availability", selectedHallId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("event_date, status")
        .eq("hall_id", selectedHallId)
        .neq("status", "cancelled");

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedHallId,
  });

  // Build lookup maps for date status
  const { bookedDates, confirmedDates, pendingDates } = useMemo(() => {
    const confirmed = new Set<string>();
    const pending = new Set<string>();
    const all = new Set<string>();

    bookings.forEach((b) => {
      all.add(b.event_date);
      if (b.status === "confirmed" || b.status === "completed") {
        confirmed.add(b.event_date);
      } else if (b.status === "pending") {
        pending.add(b.event_date);
      }
    });

    return {
      bookedDates: all,
      confirmedDates: confirmed,
      pendingDates: pending,
    };
  }, [bookings]);

  const isBooked = (date: Date) => {
    const key = date.toISOString().split("T")[0];
    return bookedDates.has(key);
  };

  const isConfirmed = (date: Date) => {
    const key = date.toISOString().split("T")[0];
    return confirmedDates.has(key);
  };

  const isPending = (date: Date) => {
    const key = date.toISOString().split("T")[0];
    return pendingDates.has(key);
  };

  if (!selectedHallId) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">
            Select a venue above to view date availability
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Availability Calendar
        </CardTitle>
        <CardDescription className="font-body">
          {hallName ? `Showing availability for ${hallName}` : "Check available dates"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-green-500/80" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500/80" />
            <span className="text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-destructive/80" />
            <span className="text-muted-foreground">Booked</span>
          </div>
        </div>

        {/* Calendar */}
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date && !isBooked(date)) {
              onDateSelect?.(date);
            }
          }}
          disabled={(date) => {
            if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
            return isBooked(date);
          }}
          modifiers={{
            booked: (date) => isConfirmed(date),
            pending: (date) => isPending(date),
          }}
          modifiersClassNames={{
            booked: "!bg-destructive/20 !text-destructive line-through",
            pending: "!bg-amber-500/20 !text-amber-600 dark:!text-amber-400",
          }}
          className={cn("p-3 pointer-events-auto w-full")}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4 w-full",
            table: "w-full border-collapse",
            head_row: "flex w-full",
            head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "relative w-full p-0 text-center text-sm focus-within:relative",
            day: cn(
              "h-9 w-full rounded-md p-0 font-normal",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:bg-accent focus:text-accent-foreground"
            ),
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground font-bold",
            day_disabled: "text-muted-foreground/40 hover:bg-transparent",
          }}
        />

        {/* Summary stats */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            {bookedDates.size === 0
              ? "All dates are currently available for this venue."
              : `${bookedDates.size} date${bookedDates.size > 1 ? "s" : ""} already booked. Select an available date to proceed.`}
          </p>
        </div>

        {/* Quick stats badges */}
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            {confirmedDates.size} confirmed
          </Badge>
          <Badge variant="outline" className="text-xs">
            {pendingDates.size} pending
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default HallAvailabilityCalendar;
