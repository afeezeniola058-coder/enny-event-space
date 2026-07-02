import { useState } from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AppliedPromo {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount: number | null;
}

interface PromoCodeInputProps {
  subtotal: number;
  applied: AppliedPromo | null;
  onApply: (promo: AppliedPromo) => void;
  onRemove: () => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(price);

export const calculateDiscount = (subtotal: number, promo: AppliedPromo): number => {
  let discount = 0;
  if (promo.discount_type === "percentage") {
    discount = subtotal * (promo.discount_value / 100);
    if (promo.max_discount !== null && discount > promo.max_discount) {
      discount = promo.max_discount;
    }
  } else {
    discount = promo.discount_value;
  }
  return Math.min(discount, subtotal);
};

const PromoCodeInput = ({ subtotal, applied, onApply, onRemove }: PromoCodeInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast({
        title: "Enter a code",
        description: "Please enter a promo code to apply.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Server-side validation via SECURITY DEFINER RPC — does not expose
      // internal counters, limits, or validity windows of other codes.
      const { data, error } = await supabase.rpc("redeem_promo_code", { _code: trimmed });

      if (error) {
        toast({
          title: "Invalid code",
          description: error.message || "That promo code isn't valid right now.",
          variant: "destructive",
        });
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        toast({
          title: "Invalid code",
          description: "That promo code doesn't exist or is no longer active.",
          variant: "destructive",
        });
        return;
      }

      onApply({
        id: row.id,
        code: row.code,
        description: row.description,
        discount_type: row.discount_type as "percentage" | "fixed",
        discount_value: Number(row.discount_value),
        max_discount: row.max_discount !== null ? Number(row.max_discount) : null,
      });
      setCode("");
      toast({
        title: "Promo applied!",
        description: `Code ${row.code} has been applied to your booking.`,
      });
    } catch (err) {
      toast({
        title: "Could not apply code",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    const discount = calculateDiscount(subtotal, applied);
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
          <Check className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">
            {applied.code} applied
          </p>
          <p className="text-xs text-muted-foreground">
            You save {formatPrice(discount)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label="Remove promo code"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Promo code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="pl-10 uppercase"
          maxLength={50}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
        />
      </div>
      <Button type="button" variant="outline" onClick={handleApply} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
      </Button>
    </div>
  );
};

export default PromoCodeInput;
