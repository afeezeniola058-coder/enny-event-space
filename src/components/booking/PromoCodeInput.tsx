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
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("promo_codes")
        .select("id, code, description, discount_type, discount_value, max_discount, valid_until, valid_from, usage_limit, used_count, is_active")
        .eq("code", trimmed)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Invalid code",
          description: "That promo code doesn't exist or is no longer active.",
          variant: "destructive",
        });
        return;
      }
      if (data.valid_from && data.valid_from > nowIso) {
        toast({ title: "Not yet valid", description: "This code is not yet active.", variant: "destructive" });
        return;
      }
      if (data.valid_until && data.valid_until < nowIso) {
        toast({ title: "Code expired", description: "This promo code has expired.", variant: "destructive" });
        return;
      }
      if (data.usage_limit !== null && data.used_count >= data.usage_limit) {
        toast({ title: "Code unavailable", description: "This promo code has reached its usage limit.", variant: "destructive" });
        return;
      }

      onApply({
        id: data.id,
        code: data.code,
        description: data.description,
        discount_type: data.discount_type as "percentage" | "fixed",
        discount_value: Number(data.discount_value),
        max_discount: data.max_discount !== null ? Number(data.max_discount) : null,
      });
      setCode("");
      toast({
        title: "Promo applied!",
        description: `Code ${data.code} has been applied to your booking.`,
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
