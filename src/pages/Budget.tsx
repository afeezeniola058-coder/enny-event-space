import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Users, Building2, UtensilsCrossed, Palette, Sparkles, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";

const Budget = () => {
  const [guestCount, setGuestCount] = useState(100);
  const [venueHours, setVenueHours] = useState(6);
  const [venueTier, setVenueTier] = useState<"basic" | "standard" | "premium">("standard");
  const [cateringTier, setCateringTier] = useState<"basic" | "standard" | "premium">("standard");
  const [decorationTier, setDecorationTier] = useState<"basic" | "standard" | "premium">("standard");

  const venuePrices = { basic: 75000, standard: 120000, premium: 200000 };
  const cateringPrices = { basic: 5000, standard: 8500, premium: 15000 };
  const decorationPrices = { basic: 150000, standard: 280000, premium: 500000 };

  const venueCost = venuePrices[venueTier] * venueHours;
  const cateringCost = cateringPrices[cateringTier] * guestCount;
  const decorationCost = decorationPrices[decorationTier];
  const miscCost = (venueCost + cateringCost + decorationCost) * 0.1;
  const totalCost = venueCost + cateringCost + decorationCost + miscCost;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const costBreakdown = [
    { name: "Venue", amount: venueCost, percentage: (venueCost / totalCost) * 100, icon: Building2, color: "bg-amber-500" },
    { name: "Catering", amount: cateringCost, percentage: (cateringCost / totalCost) * 100, icon: UtensilsCrossed, color: "bg-rose-500" },
    { name: "Decoration", amount: decorationCost, percentage: (decorationCost / totalCost) * 100, icon: Palette, color: "bg-violet-500" },
    { name: "Miscellaneous", amount: miscCost, percentage: (miscCost / totalCost) * 100, icon: Sparkles, color: "bg-emerald-500" },
  ];

  const TierButton = ({
    tier,
    currentTier,
    setTier,
    label,
  }: {
    tier: "basic" | "standard" | "premium";
    currentTier: string;
    setTier: (tier: "basic" | "standard" | "premium") => void;
    label: string;
  }) => (
    <button
      onClick={() => setTier(tier)}
      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
        currentTier === tier
          ? "bg-primary text-primary-foreground shadow-soft"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Header */}
        <section className="bg-gradient-hero py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Smart Planning</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Event Budget
                <span className="text-gradient-gold block">Calculator</span>
              </h1>
              <p className="text-muted-foreground font-body text-lg">
                Plan your perfect event within your budget. Adjust the sliders to see real-time cost estimates.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Calculator */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Input Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Guest Count */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Label className="font-display text-lg">Number of Guests</Label>
                      <p className="text-sm text-muted-foreground">How many guests are you expecting?</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Slider
                      value={[guestCount]}
                      onValueChange={(value) => setGuestCount(value[0])}
                      min={50}
                      max={500}
                      step={10}
                      className="py-4"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">50 guests</span>
                      <span className="font-display text-2xl font-bold text-primary">{guestCount}</span>
                      <span className="text-sm text-muted-foreground">500 guests</span>
                    </div>
                  </div>
                </div>

                {/* Venue Hours */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Label className="font-display text-lg">Event Duration</Label>
                      <p className="text-sm text-muted-foreground">How long will your event last?</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Slider
                      value={[venueHours]}
                      onValueChange={(value) => setVenueHours(value[0])}
                      min={2}
                      max={12}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">2 hours</span>
                      <span className="font-display text-2xl font-bold text-primary">{venueHours} hrs</span>
                      <span className="text-sm text-muted-foreground">12 hours</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <TierButton tier="basic" currentTier={venueTier} setTier={setVenueTier} label="Basic" />
                    <TierButton tier="standard" currentTier={venueTier} setTier={setVenueTier} label="Standard" />
                    <TierButton tier="premium" currentTier={venueTier} setTier={setVenueTier} label="Premium" />
                  </div>
                </div>

                {/* Catering Tier */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <UtensilsCrossed className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Label className="font-display text-lg">Catering Package</Label>
                      <p className="text-sm text-muted-foreground">Select your catering tier</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <TierButton tier="basic" currentTier={cateringTier} setTier={setCateringTier} label={`Basic (${formatPrice(cateringPrices.basic)}/person)`} />
                    <TierButton tier="standard" currentTier={cateringTier} setTier={setCateringTier} label={`Standard (${formatPrice(cateringPrices.standard)}/person)`} />
                    <TierButton tier="premium" currentTier={cateringTier} setTier={setCateringTier} label={`Premium (${formatPrice(cateringPrices.premium)}/person)`} />
                  </div>
                </div>

                {/* Decoration Tier */}
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Label className="font-display text-lg">Decoration Package</Label>
                      <p className="text-sm text-muted-foreground">Choose your decoration style</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <TierButton tier="basic" currentTier={decorationTier} setTier={setDecorationTier} label={`Basic (${formatPrice(decorationPrices.basic)})`} />
                    <TierButton tier="standard" currentTier={decorationTier} setTier={setDecorationTier} label={`Standard (${formatPrice(decorationPrices.standard)})`} />
                    <TierButton tier="premium" currentTier={decorationTier} setTier={setDecorationTier} label={`Premium (${formatPrice(decorationPrices.premium)})`} />
                  </div>
                </div>
              </motion.div>

              {/* Summary Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:sticky lg:top-32 h-fit"
              >
                <div className="bg-card rounded-2xl p-8 border border-border shadow-elegant">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                      <PieChart className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold text-foreground">Budget Summary</h2>
                      <p className="text-sm text-muted-foreground">Estimated total cost breakdown</p>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="space-y-4 mb-8">
                    {costBreakdown.map((item) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-body text-sm text-foreground">{item.name}</span>
                          </div>
                          <span className="font-body text-sm font-medium text-foreground">
                            {formatPrice(item.amount)}
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`h-full ${item.color} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-border pt-6 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-display text-xl font-semibold text-foreground">Total Estimate</span>
                      <span className="font-display text-3xl font-bold text-primary">
                        {formatPrice(totalCost)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      *Includes 10% miscellaneous costs for unexpected expenses
                    </p>
                  </div>

                  <Button variant="hero" size="xl" className="w-full" asChild>
                    <Link to="/auth?mode=signup">Start Planning Your Event</Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Budget;
