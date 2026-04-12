import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { Hall } from "@/hooks/useHalls";

export interface HallFilters {
  capacityRange: [number, number];
  priceRange: [number, number];
  selectedAmenities: string[];
}

interface HallFiltersProps {
  halls: Hall[];
  filters: HallFilters;
  onChange: (filters: HallFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const getDefaultFilters = (halls: Hall[]): HallFilters => {
  const capacities = halls.map((h) => h.capacity);
  const prices = halls.map((h) => h.price_per_hour);
  return {
    capacityRange: [
      Math.min(...(capacities.length ? capacities : [0])),
      Math.max(...(capacities.length ? capacities : [1000])),
    ],
    priceRange: [
      Math.min(...(prices.length ? prices : [0])),
      Math.max(...(prices.length ? prices : [200000])),
    ],
    selectedAmenities: [],
  };
};

export const getActiveFilterCount = (filters: HallFilters, halls: Hall[]): number => {
  const defaults = getDefaultFilters(halls);
  let count = 0;
  if (
    filters.capacityRange[0] !== defaults.capacityRange[0] ||
    filters.capacityRange[1] !== defaults.capacityRange[1]
  )
    count++;
  if (
    filters.priceRange[0] !== defaults.priceRange[0] ||
    filters.priceRange[1] !== defaults.priceRange[1]
  )
    count++;
  if (filters.selectedAmenities.length > 0) count++;
  return count;
};

const HallFiltersPanel = ({ halls, filters, onChange, isOpen, onToggle }: HallFiltersProps) => {
  const allAmenities = Array.from(
    new Set(halls.flatMap((h) => h.amenities || []))
  ).sort();

  const defaults = getDefaultFilters(halls);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);

  const handleReset = () => onChange(defaults);

  const activeCount = getActiveFilterCount(filters, halls);

  if (!isOpen) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold text-foreground">Filters</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeCount} active
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
              <X className="h-3 w-3 mr-1" /> Clear all
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Capacity */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          Capacity: {filters.capacityRange[0]} – {filters.capacityRange[1]} guests
        </Label>
        <Slider
          min={defaults.capacityRange[0]}
          max={defaults.capacityRange[1]}
          step={10}
          value={filters.capacityRange}
          onValueChange={(v) =>
            onChange({ ...filters, capacityRange: [v[0], v[1]] })
          }
          className="w-full"
        />
      </div>

      {/* Price */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          Price: {formatPrice(filters.priceRange[0])} – {formatPrice(filters.priceRange[1])}/hr
        </Label>
        <Slider
          min={defaults.priceRange[0]}
          max={defaults.priceRange[1]}
          step={5000}
          value={filters.priceRange}
          onValueChange={(v) =>
            onChange({ ...filters, priceRange: [v[0], v[1]] })
          }
          className="w-full"
        />
      </div>

      {/* Amenities */}
      {allAmenities.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-foreground">
            Amenities
            {filters.selectedAmenities.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-2">
                {filters.selectedAmenities.length}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-2 gap-2">
              {allAmenities.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  <Checkbox
                    checked={filters.selectedAmenities.includes(amenity)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...filters.selectedAmenities, amenity]
                        : filters.selectedAmenities.filter((a) => a !== amenity);
                      onChange({ ...filters, selectedAmenities: next });
                    }}
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default HallFiltersPanel;
