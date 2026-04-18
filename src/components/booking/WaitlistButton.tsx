import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BellPlus, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface WaitlistButtonProps {
  hallId: string;
  eventDate: string; // YYYY-MM-DD
  guestCount?: number;
  className?: string;
}

const WaitlistButton = ({ hallId, eventDate, guestCount, className }: WaitlistButtonProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const { data } = await supabase
          .from("waitlist")
          .select("id")
          .eq("user_id", uid)
          .eq("hall_id", hallId)
          .eq("event_date", eventDate)
          .maybeSingle();
        if (active) setOnWaitlist(!!data);
      }
      if (active) setChecking(false);
    };
    check();
    return () => {
      active = false;
    };
  }, [hallId, eventDate]);

  const handleJoin = async () => {
    if (!userId) {
      navigate(`/auth?redirect=/halls`);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("waitlist").insert({
        user_id: userId,
        hall_id: hallId,
        event_date: eventDate,
        guest_count: guestCount ?? null,
      });
      if (error) throw error;
      setOnWaitlist(true);
      toast({
        title: "You're on the waitlist!",
        description: "We'll notify you immediately if a spot opens up.",
      });
    } catch (err: any) {
      const msg = err?.code === "23505"
        ? "You're already on the waitlist for this date."
        : err instanceof Error ? err.message : "Could not join waitlist.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("waitlist")
        .delete()
        .eq("user_id", userId)
        .eq("hall_id", hallId)
        .eq("event_date", eventDate);
      if (error) throw error;
      setOnWaitlist(false);
      toast({ title: "Removed from waitlist", description: "You won't be notified for this date." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not leave waitlist.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Button variant="outline" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Checking...
      </Button>
    );
  }

  if (onWaitlist) {
    return (
      <Button variant="outline" onClick={handleLeave} disabled={loading} className={className}>
        <BellRing className="h-4 w-4 mr-2 text-primary" />
        {loading ? "Removing..." : "On waitlist — Leave"}
      </Button>
    );
  }

  return (
    <Button variant="gold" onClick={handleJoin} disabled={loading} className={className}>
      <BellPlus className="h-4 w-4 mr-2" />
      {loading ? "Joining..." : "Join Waitlist"}
    </Button>
  );
};

export default WaitlistButton;
