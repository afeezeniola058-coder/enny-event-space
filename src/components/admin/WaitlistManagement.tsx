import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BellRing, Trash2, Users, CalendarDays, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useState, useMemo } from "react";

interface WaitlistRow {
  id: string;
  user_id: string;
  hall_id: string;
  event_date: string;
  guest_count: number | null;
  notes: string | null;
  notified_at: string | null;
  created_at: string;
  halls: { id: string; name: string } | null;
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
}

const WaitlistManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data: waitlist, error } = await supabase
        .from("waitlist")
        .select("id, user_id, hall_id, event_date, guest_count, notes, notified_at, created_at, halls(id, name)")
        .order("event_date", { ascending: true });
      if (error) throw error;

      const userIds = Array.from(new Set((waitlist ?? []).map((w: any) => w.user_id)));
      let profilesByUser: Record<string, { full_name: string | null; email: string | null; phone: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, phone")
          .in("user_id", userIds);
        (profiles ?? []).forEach((p: any) => {
          profilesByUser[p.user_id] = { full_name: p.full_name, email: p.email, phone: p.phone };
        });
      }

      return ((waitlist ?? []) as any[]).map((w) => ({
        ...w,
        profiles: profilesByUser[w.user_id] ?? null,
      })) as WaitlistRow[];
    },
    staleTime: 30 * 1000,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waitlist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] });
      toast({ title: "Entry removed", description: "The waitlist entry has been cleared." });
    },
    onError: (err) => {
      toast({
        title: "Could not remove",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearGroupMutation = useMutation({
    mutationFn: async ({ hall_id, event_date }: { hall_id: string; event_date: string }) => {
      const { error } = await supabase
        .from("waitlist")
        .delete()
        .eq("hall_id", hall_id)
        .eq("event_date", event_date);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] });
      toast({ title: "Group cleared", description: "All waitlist entries for that hall/date were removed." });
    },
    onError: (err) => {
      toast({
        title: "Could not clear group",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      return (
        e.halls?.name?.toLowerCase().includes(q) ||
        e.profiles?.full_name?.toLowerCase().includes(q) ||
        e.profiles?.email?.toLowerCase().includes(q) ||
        e.event_date.includes(q)
      );
    });
  }, [entries, search]);

  // Group counts per hall+date
  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      const key = `${e.hall_id}|${e.event_date}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [entries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Waitlist</h2>
          <p className="text-sm text-muted-foreground">
            See who is waiting on which hall and date. Clear entries when needed.
          </p>
        </div>
        <Input
          placeholder="Search by hall, name, email, or date…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-secondary/50 animate-pulse rounded-md" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {entries.length === 0 ? "No one is currently on a waitlist." : "No entries match your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hall</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => {
                  const key = `${entry.hall_id}|${entry.event_date}`;
                  const groupCount = groupCounts.get(key) ?? 1;
                  const dateLabel = format(new Date(entry.event_date + "T00:00:00"), "MMM d, yyyy");
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{entry.halls?.name ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{dateLabel}</span>
                          {groupCount > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {groupCount} waiting
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {entry.profiles?.full_name ?? "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {entry.profiles?.email ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{entry.guest_count ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(entry.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {entry.notified_at ? (
                          <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15 gap-1">
                            <BellRing className="h-3 w-3" />
                            Notified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Waiting</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {groupCount > 1 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-xs">
                                  Clear group
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Clear all waitlist entries?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove all {groupCount} entries for {entry.halls?.name} on {dateLabel}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      clearGroupMutation.mutate({
                                        hall_id: entry.hall_id,
                                        event_date: entry.event_date,
                                      })
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Clear all
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                aria-label="Remove entry"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove waitlist entry?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This removes {entry.profiles?.full_name ?? "this user"} from the waitlist for{" "}
                                  {entry.halls?.name} on {dateLabel}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitlistManagement;
