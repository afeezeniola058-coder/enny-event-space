import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bell, MapPin, CalendarDays, Trash2, BellRing } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MyWaitlistProps {
  userId: string | undefined;
}

interface WaitlistRow {
  id: string;
  hall_id: string;
  event_date: string;
  guest_count: number | null;
  notes: string | null;
  notified_at: string | null;
  created_at: string;
  halls: { id: string; name: string; image_url: string | null } | null;
}

const MyWaitlist = ({ userId }: MyWaitlistProps) => {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["my-waitlist", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("waitlist")
        .select("id, hall_id, event_date, guest_count, notes, notified_at, created_at, halls(id, name, image_url)")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as WaitlistRow[];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waitlist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-waitlist", userId] });
      toast({
        title: "Removed from waitlist",
        description: "You will no longer be notified about this date.",
      });
    },
    onError: (err) => {
      toast({
        title: "Could not remove",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!userId) return null;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">My Waitlist</h2>
        </div>
        {entries.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-secondary/50 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            You're not on any waitlists yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            When a date is fully booked, you can join the waitlist to be notified if a slot opens up.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const hallName = entry.halls?.name ?? "Unknown venue";
            const dateLabel = format(new Date(entry.event_date + "T00:00:00"), "EEE, MMM d, yyyy");
            const isNotified = !!entry.notified_at;

            return (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-secondary/50 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="font-medium truncate">{hallName}</p>
                    {isNotified && (
                      <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15 gap-1">
                        <BellRing className="h-3 w-3" />
                        Notified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{dateLabel}</span>
                    {entry.guest_count ? <span>· {entry.guest_count} guests</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  {isNotified && entry.halls?.id && (
                    <Button asChild variant="gold" size="sm">
                      <Link
                        to={`/book?hall=${entry.halls.id}&date=${entry.event_date}`}
                      >
                        Book now
                      </Link>
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label="Remove from waitlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove from waitlist?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You won't be notified if {hallName} becomes available on {dateLabel}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep on waitlist</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMutation.mutate(entry.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyWaitlist;
