import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefundTier {
  minDays: number;
  maxDays: number | null;
  label: string;
  refundPercent: number;
  description: string;
  icon: React.ElementType;
}

const refundTiers: RefundTier[] = [
  {
    minDays: 30,
    maxDays: null,
    label: "30+ days before event",
    refundPercent: 90,
    description: "Full refund minus 10% processing fee",
    icon: CheckCircle,
  },
  {
    minDays: 15,
    maxDays: 29,
    label: "15–29 days before event",
    refundPercent: 50,
    description: "Half of your booking amount",
    icon: Clock,
  },
  {
    minDays: 7,
    maxDays: 14,
    label: "7–14 days before event",
    refundPercent: 25,
    description: "Quarter of your booking amount",
    icon: AlertTriangle,
  },
  {
    minDays: 3,
    maxDays: 6,
    label: "3–6 days before event",
    refundPercent: 0,
    description: "No refund available",
    icon: XCircle,
  },
];

function getDaysUntilEvent(eventDate: string): number {
  const event = new Date(eventDate);
  const now = new Date();
  event.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getActiveTierIndex(daysUntil: number): number {
  return refundTiers.findIndex(
    (tier) =>
      daysUntil >= tier.minDays &&
      (tier.maxDays === null || daysUntil <= tier.maxDays)
  );
}

const tierStyles = [
  {
    active: "border-green-500/50 bg-green-500/10",
    badge: "bg-green-500/20 text-green-600 dark:text-green-400",
    icon: "text-green-500",
  },
  {
    active: "border-yellow-500/50 bg-yellow-500/10",
    badge: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    icon: "text-yellow-500",
  },
  {
    active: "border-orange-500/50 bg-orange-500/10",
    badge: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
    icon: "text-orange-500",
  },
  {
    active: "border-red-500/50 bg-red-500/10",
    badge: "bg-red-500/20 text-red-600 dark:text-red-400",
    icon: "text-red-500",
  },
];

interface RefundTierDisplayProps {
  eventDate: string;
  totalAmount: number;
  formatPrice: (amount: number) => string;
  compact?: boolean;
}

const RefundTierDisplay = ({
  eventDate,
  totalAmount,
  formatPrice,
  compact = false,
}: RefundTierDisplayProps) => {
  const daysUntil = getDaysUntilEvent(eventDate);
  const activeTierIndex = getActiveTierIndex(daysUntil);
  const activeTier = activeTierIndex >= 0 ? refundTiers[activeTierIndex] : null;
  const refundAmount = activeTier
    ? (totalAmount * activeTier.refundPercent) / 100
    : 0;

  if (compact && activeTier) {
    const style = tierStyles[activeTierIndex];
    const Icon = activeTier.icon;
    return (
      <div className={cn("rounded-lg border p-4", style.active)}>
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5 shrink-0", style.icon)} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              Estimated Refund: {formatPrice(refundAmount)}{" "}
              <span className="font-normal text-muted-foreground">
                ({activeTier.refundPercent}%)
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeTier.description} • {daysUntil} day{daysUntil !== 1 ? "s" : ""} until event
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Refund Schedule</p>
      <div className="space-y-2">
        {refundTiers.map((tier, index) => {
          const isActive = index === activeTierIndex;
          const style = tierStyles[index];
          const Icon = tier.icon;
          const tierRefund = (totalAmount * tier.refundPercent) / 100;

          return (
            <div
              key={tier.label}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                isActive ? style.active : "border-border/50 opacity-50"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? style.icon : "text-muted-foreground"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", isActive && "text-foreground")}>
                  {tier.label}
                </p>
                <p className="text-xs text-muted-foreground">{tier.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={cn(
                    "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
                    isActive ? style.badge : "bg-muted text-muted-foreground"
                  )}
                >
                  {tier.refundPercent}%
                </span>
                {isActive && (
                  <p className="text-xs font-medium mt-0.5">{formatPrice(tierRefund)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {activeTier && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          Your event is in <strong>{daysUntil} day{daysUntil !== 1 ? "s" : ""}</strong> — you'd
          receive approximately <strong>{formatPrice(refundAmount)}</strong> back.
        </p>
      )}
    </div>
  );
};

export default RefundTierDisplay;
