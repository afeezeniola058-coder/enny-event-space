import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, MousePointer, Eye, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface EmailTrackingEvent {
  id: string;
  booking_id: string | null;
  email_type: string;
  recipient_email: string;
  event_type: string;
  link_url: string | null;
  created_at: string;
}

interface AnalyticsSummary {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
}

export function EmailAnalytics() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["email-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_tracking")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EmailTrackingEvent[];
    },
  });

  const summary: AnalyticsSummary = {
    totalSent: events?.filter((e) => e.event_type === "sent").length || 0,
    totalOpened: events?.filter((e) => e.event_type === "opened").length || 0,
    totalClicked: events?.filter((e) => e.event_type === "clicked").length || 0,
    openRate: 0,
    clickRate: 0,
  };

  // Calculate unique opens/clicks per booking for accurate rates
  if (events && events.length > 0) {
    const sentBookings = new Set(
      events.filter((e) => e.event_type === "sent").map((e) => e.booking_id)
    );
    const openedBookings = new Set(
      events.filter((e) => e.event_type === "opened").map((e) => e.booking_id)
    );
    const clickedBookings = new Set(
      events.filter((e) => e.event_type === "clicked").map((e) => e.booking_id)
    );

    const sentCount = sentBookings.size || 1;
    summary.openRate = Math.round((openedBookings.size / sentCount) * 100);
    summary.clickRate = Math.round((clickedBookings.size / sentCount) * 100);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSent}</div>
            <p className="text-xs text-muted-foreground">Total notifications sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Opens</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOpened}</div>
            <p className="text-xs text-muted-foreground">Total email opens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalClicked}</div>
            <p className="text-xs text-muted-foreground">Total link clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.openRate}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.clickRate}% click-through rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Events</CardTitle>
          <CardDescription>Track opens and clicks for booking notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge
                        variant={
                          event.event_type === "sent"
                            ? "secondary"
                            : event.event_type === "opened"
                            ? "default"
                            : "outline"
                        }
                      >
                        {event.event_type === "sent" && <Mail className="mr-1 h-3 w-3" />}
                        {event.event_type === "opened" && <Eye className="mr-1 h-3 w-3" />}
                        {event.event_type === "clicked" && (
                          <MousePointer className="mr-1 h-3 w-3" />
                        )}
                        {event.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {event.recipient_email}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {event.booking_id?.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {event.link_url || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(event.created_at), "MMM d, h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No email tracking events yet</p>
              <p className="text-sm text-muted-foreground/70">
                Events will appear here after booking notifications are sent
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
