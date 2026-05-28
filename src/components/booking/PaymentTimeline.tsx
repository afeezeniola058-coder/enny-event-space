import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarPlus,
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Receipt,
  CalendarCheck,
  PartyPopper,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TimelineBooking {
  created_at: string;
  updated_at: string;
  status: string;
  payment_status: string;
  payment_reference: string | null;
  total_amount: number;
  event_date: string;
}

interface PaymentTimelineProps {
  booking: TimelineBooking;
}

type TimelineEvent = {
  icon: LucideIcon;
  title: string;
  description: string;
  date: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

const toneStyles: Record<TimelineEvent["tone"], { dot: string; ring: string; badge: string }> = {
  neutral: {
    dot: "bg-muted text-muted-foreground",
    ring: "ring-muted",
    badge: "bg-muted text-muted-foreground border-border",
  },
  info: {
    dot: "bg-primary/15 text-primary",
    ring: "ring-primary/30",
    badge: "bg-primary/10 text-primary border-primary/30",
  },
  success: {
    dot: "bg-green-500/15 text-green-600 dark:text-green-400",
    ring: "ring-green-500/30",
    badge: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
  },
  warning: {
    dot: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    ring: "ring-yellow-500/30",
    badge: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  },
  danger: {
    dot: "bg-red-500/15 text-red-700 dark:text-red-400",
    ring: "ring-red-500/30",
    badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  },
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);

const PaymentTimeline = ({ booking }: PaymentTimelineProps) => {
  const events: TimelineEvent[] = [];

  // 1. Booking created
  events.push({
    icon: CalendarPlus,
    title: "Booking created",
    description: `Reservation submitted for ${formatPrice(booking.total_amount)}.`,
    date: booking.created_at,
    tone: "info",
  });

  // 2. Payment initiated (when a reference exists)
  if (booking.payment_reference) {
    events.push({
      icon: CreditCard,
      title: "Payment initiated",
      description: `Checkout started via Paystack (ref: ${booking.payment_reference}).`,
      date: booking.updated_at,
      tone: "info",
    });
  } else if (booking.payment_status === "pending") {
    events.push({
      icon: Clock,
      title: "Awaiting payment",
      description: "Complete payment to confirm your booking.",
      date: booking.updated_at,
      tone: "warning",
    });
  }

  // 3. Payment outcome
  if (booking.payment_status === "paid") {
    events.push({
      icon: Receipt,
      title: "Payment received",
      description: `${formatPrice(booking.total_amount)} confirmed by Paystack.`,
      date: booking.updated_at,
      tone: "success",
    });
  } else if (booking.payment_status === "failed") {
    events.push({
      icon: XCircle,
      title: "Payment failed",
      description: "The most recent payment attempt did not go through.",
      date: booking.updated_at,
      tone: "danger",
    });
  } else if (booking.payment_status === "refunded") {
    events.push({
      icon: RefreshCw,
      title: "Refund processed",
      description: "Your payment has been refunded.",
      date: booking.updated_at,
      tone: "warning",
    });
  }

  // 4. Booking status outcome
  if (booking.status === "confirmed") {
    events.push({
      icon: CalendarCheck,
      title: "Booking confirmed",
      description: "Your event is locked in. We'll see you on the day!",
      date: booking.updated_at,
      tone: "success",
    });
  } else if (booking.status === "cancelled") {
    events.push({
      icon: XCircle,
      title: "Booking cancelled",
      description: "This booking has been cancelled.",
      date: booking.updated_at,
      tone: "danger",
    });
  } else if (booking.status === "completed") {
    events.push({
      icon: PartyPopper,
      title: "Event completed",
      description: "Hope your event was wonderful — share a review!",
      date: booking.updated_at,
      tone: "success",
    });
  }

  // De-dup events that share identical title/date
  const seen = new Set<string>();
  const ordered = events
    .filter((e) => {
      const key = `${e.title}|${e.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Payment Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-6 border-l border-border pl-6">
          {ordered.map((event, idx) => {
            const Icon = event.icon;
            const styles = toneStyles[event.tone];
            const isLast = idx === ordered.length - 1;
            return (
              <li key={`${event.title}-${idx}`} className="relative">
                <span
                  className={`absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full ring-4 ${styles.dot} ${styles.ring} ring-background`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-foreground">{event.title}</h4>
                  <Badge variant="outline" className={styles.badge}>
                    {formatDateTime(event.date)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                {isLast && (
                  <p className="text-xs text-muted-foreground/70 mt-2 italic">Latest update</p>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
};

export default PaymentTimeline;
