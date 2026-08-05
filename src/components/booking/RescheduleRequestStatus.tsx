import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarClock, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const statusVariant: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  approved: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function RescheduleRequestStatus({ bookingId }: { bookingId: string }) {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["reschedule-requests", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reschedule_requests")
        .select("*, halls:requested_hall_id(name)")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("cancel_reschedule_request", { _request_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Request withdrawn", description: "Your reschedule request has been cancelled." });
      queryClient.invalidateQueries({ queryKey: ["reschedule-requests", bookingId] });
    },
    onError: (e: Error) =>
      toast({ title: "Could not withdraw request", description: e.message, variant: "destructive" }),
  });

  if (isLoading || requests.length === 0) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5 text-primary" />
          Reschedule Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((r: any) => (
          <div key={r.id} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">
                  {format(new Date(r.current_date_snapshot + "T00:00:00"), "PPP")} →{" "}
                  {format(new Date(r.requested_date + "T00:00:00"), "PPP")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {r.requested_start_time?.slice(0, 5)} – {r.requested_end_time?.slice(0, 5)}
                  {r.halls?.name ? ` · ${r.halls.name}` : ""}
                </p>
              </div>
              <Badge variant="outline" className={statusVariant[r.status]}>
                {r.status}
              </Badge>
            </div>
            {r.reason && (
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Your reason:</span> {r.reason}
              </p>
            )}
            {r.admin_note && (
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Team note:</span> {r.admin_note}
              </p>
            )}
            {r.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => cancelMutation.mutate(r.id)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5 mr-2" />
                )}
                Withdraw request
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
