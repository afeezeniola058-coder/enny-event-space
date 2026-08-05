import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarClock, Check, Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const statusVariant: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  approved: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function RescheduleRequestsManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [reviewing, setReviewing] = useState<{ id: string; approve: boolean } | null>(null);
  const [note, setNote] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-reschedule-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reschedule_requests")
        .select(
          "*, bookings:booking_id(event_name, event_date, user_id), halls:requested_hall_id(name)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, approve, adminNote }: { id: string; approve: boolean; adminNote: string }) => {
      const { error } = await supabase.rpc("review_reschedule_request", {
        _request_id: id,
        _approve: approve,
        _admin_note: adminNote || null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast({
        title: vars.approve ? "Request approved" : "Request declined",
        description: vars.approve
          ? "The booking has been moved and the customer notified."
          : "The customer has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-reschedule-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      setReviewing(null);
      setNote("");
    },
    onError: (e: Error) =>
      toast({ title: "Review failed", description: e.message, variant: "destructive" }),
  });

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      r.bookings?.event_name?.toLowerCase().includes(q) ||
      r.halls?.name?.toLowerCase().includes(q) ||
      r.status.includes(q)
    );
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Reschedule Requests
          {pendingCount > 0 && (
            <Badge variant="outline" className={statusVariant.pending}>
              {pendingCount} pending
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Review customer requests to move an event. Approving updates the booking and notifies the
          customer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search event, venue or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading requests…</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">No reschedule requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Current date</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.bookings?.event_name ?? "—"}</TableCell>
                    <TableCell>
                      {format(new Date(r.current_date_snapshot + "T00:00:00"), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(r.requested_date + "T00:00:00"), "MMM d, yyyy")}
                      <span className="block text-xs text-muted-foreground">
                        {r.requested_start_time?.slice(0, 5)} – {r.requested_end_time?.slice(0, 5)}
                      </span>
                    </TableCell>
                    <TableCell>{r.halls?.name ?? "—"}</TableCell>
                    <TableCell className="max-w-[220px] truncate" title={r.reason ?? ""}>
                      {r.reason ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusVariant[r.status]}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNote("");
                              setReviewing({ id: r.id, approve: true });
                            }}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setNote("");
                              setReviewing({ id: r.id, approve: false });
                            }}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {r.reviewed_at ? format(new Date(r.reviewed_at), "MMM d, yyyy") : "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{reviewing?.approve ? "Approve request" : "Decline request"}</DialogTitle>
            <DialogDescription>
              {reviewing?.approve
                ? "The booking will be moved to the requested date, time and venue."
                : "The booking stays unchanged. Let the customer know why."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Note to the customer (optional)"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReviewing(null)}>
              Cancel
            </Button>
            <Button
              variant={reviewing?.approve ? "gold" : "destructive"}
              disabled={reviewMutation.isPending}
              onClick={() =>
                reviewing &&
                reviewMutation.mutate({ id: reviewing.id, approve: reviewing.approve, adminNote: note })
              }
            >
              {reviewMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {reviewing?.approve ? "Approve & move booking" : "Decline request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
