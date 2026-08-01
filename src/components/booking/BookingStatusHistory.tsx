import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, CalendarPlus, CircleDot, CreditCard, CalendarClock, Bot, ShieldCheck, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  bookingId: string;
}

type HistoryRow = {
  id: string;
  field: string;
  old_value: string | null;
  new_value: string;
  reason: string | null;
  actor: string;
  created_at: string;
};

const fieldMeta: Record<string, { label: string; icon: typeof CircleDot }> = {
  created: { label: "Booking created", icon: CalendarPlus },
  status: { label: "Booking status changed", icon: CircleDot },
  payment_status: { label: "Payment status changed", icon: CreditCard },
  event_date: { label: "Event date changed", icon: CalendarClock },
};

const actorMeta: Record<string, { label: string; icon: typeof User }> = {
  admin: { label: "Staff", icon: ShieldCheck },
  customer: { label: "Customer", icon: User },
  system: { label: "System", icon: Bot },
};

const toneFor = (value: string) => {
  switch (value) {
    case "confirmed":
    case "paid":
    case "completed":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
    case "cancelled":
    case "failed":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
    case "refunded":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
    default:
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
  }
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

const BookingStatusHistory = ({ bookingId }: Props) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["booking-status-history", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_status_history")
        .select("id, field, old_value, new_value, reason, actor, created_at")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as HistoryRow[];
    },
    enabled: !!bookingId,
  });

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Status History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
        ) : (
          <ol className="relative space-y-6 border-l border-border pl-6">
            {history.map((entry) => {
              const meta = fieldMeta[entry.field] ?? { label: entry.field, icon: CircleDot };
              const Icon = meta.icon;
              const actor = actorMeta[entry.actor] ?? actorMeta.system;
              const ActorIcon = actor.icon;
              return (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground ring-4 ring-background">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold text-foreground">{meta.label}</h4>
                    <span className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {entry.old_value && (
                      <>
                        <Badge variant="outline" className={toneFor(entry.old_value)}>
                          {entry.old_value}
                        </Badge>
                        <span className="text-muted-foreground text-xs">→</span>
                      </>
                    )}
                    <Badge variant="outline" className={toneFor(entry.new_value)}>
                      {entry.new_value}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ActorIcon className="h-3 w-3" />
                      {actor.label}
                    </span>
                  </div>
                  {entry.reason && (
                    <p className="mt-1.5 text-sm text-muted-foreground italic">Reason: {entry.reason}</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingStatusHistory;
