import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, Loader2, ChefHat, Palette, Lightbulb, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Recommendation {
  cateringRecommendation: {
    packageId: string;
    packageName: string;
    reason: string;
    estimatedCost: number;
  };
  decorationRecommendation: {
    packageId: string;
    packageName: string;
    reason: string;
    estimatedCost: number;
  };
  summary: string;
  tips: string[];
}

interface AIPackageRecommenderProps {
  guestCount: number;
  onSelectCatering?: (packageId: string) => void;
  onSelectDecoration?: (packageId: string) => void;
}

const eventTypes = [
  "Wedding Reception",
  "Corporate Event",
  "Birthday Party",
  "Anniversary Celebration",
  "Graduation Party",
  "Baby Shower",
  "Engagement Party",
  "Gala Dinner",
  "Conference",
  "Other",
];

const AIPackageRecommender = ({
  guestCount,
  onSelectCatering,
  onSelectDecoration,
}: AIPackageRecommenderProps) => {
  const [eventType, setEventType] = useState("");
  const [budget, setBudget] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getRecommendations = async () => {
    if (!eventType) {
      toast({
        title: "Select event type",
        description: "Please choose your event type to get personalized recommendations.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRecommendation(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-package-recommender", {
        body: {
          eventType,
          guestCount: guestCount || 50,
          budget,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setRecommendation(data);
    } catch (error) {
      console.error("Recommendation error:", error);
      toast({
        title: "Could not get recommendations",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyRecommendations = () => {
    if (!recommendation) return;

    if (recommendation.cateringRecommendation?.packageId && onSelectCatering) {
      onSelectCatering(recommendation.cateringRecommendation.packageId);
    }
    if (recommendation.decorationRecommendation?.packageId && onSelectDecoration) {
      onSelectDecoration(recommendation.decorationRecommendation.packageId);
    }

    toast({
      title: "Recommendations applied!",
      description: "We've selected the AI-recommended packages for you.",
    });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                AI Package Assistant
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </CardTitle>
              <CardDescription className="font-body">
                Get personalized recommendations based on your event
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? "Hide" : "Show"}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-6">
              {/* Input Section */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Budget (Optional)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 500000"
                    value={budget || ""}
                    onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Recommending for {guestCount || 50} guests</span>
              </div>

              <Button
                onClick={getRecommendations}
                disabled={isLoading || !eventType}
                className="w-full"
                variant="gold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing your event...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Get AI Recommendations
                  </>
                )}
              </Button>

              {/* Recommendations Section */}
              <AnimatePresence>
                {recommendation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {/* Summary */}
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm font-body text-foreground">{recommendation.summary}</p>
                    </div>

                    {/* Catering Recommendation */}
                    <div className="p-4 rounded-lg bg-card border border-border">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
                          <ChefHat className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-display font-semibold text-foreground">
                            {recommendation.cateringRecommendation.packageName}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {recommendation.cateringRecommendation.reason}
                          </p>
                          <p className="text-sm font-medium text-primary mt-2">
                            Estimated: {formatPrice(recommendation.cateringRecommendation.estimatedCost)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Decoration Recommendation */}
                    <div className="p-4 rounded-lg bg-card border border-border">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                          <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-display font-semibold text-foreground">
                            {recommendation.decorationRecommendation.packageName}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {recommendation.decorationRecommendation.reason}
                          </p>
                          <p className="text-sm font-medium text-primary mt-2">
                            Estimated: {formatPrice(recommendation.decorationRecommendation.estimatedCost)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tips */}
                    {recommendation.tips && recommendation.tips.length > 0 && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-foreground">Pro Tips</span>
                        </div>
                        <ul className="space-y-2">
                          {recommendation.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Apply Button */}
                    <Button onClick={applyRecommendations} className="w-full" variant="outline">
                      <Check className="h-4 w-4 mr-2" />
                      Apply These Recommendations
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default AIPackageRecommender;
