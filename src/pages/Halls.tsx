import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, MapPin, Star, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { useHalls } from "@/hooks/useHalls";
import logo from "@/assets/logo.jpg";
import HallFiltersPanel, {
  type HallFilters,
  getDefaultFilters,
  getActiveFilterCount,
} from "@/components/halls/HallFilters";
import { Badge } from "@/components/ui/badge";

const Halls = () => {
  const { data: halls = [], isLoading } = useHalls();
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<HallFilters | null>(null);

  // Initialize filters from data
  const activeFilters = filters ?? getDefaultFilters(halls);
  const activeCount = getActiveFilterCount(activeFilters, halls);

  const filteredHalls = useMemo(() => {
    return halls.filter((hall) => {
      const matchesSearch =
        hall.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hall.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCapacity =
        hall.capacity >= activeFilters.capacityRange[0] &&
        hall.capacity <= activeFilters.capacityRange[1];
      const matchesPrice =
        hall.price_per_hour >= activeFilters.priceRange[0] &&
        hall.price_per_hour <= activeFilters.priceRange[1];
      const matchesAmenities =
        activeFilters.selectedAmenities.length === 0 ||
        activeFilters.selectedAmenities.every((a) =>
          hall.amenities?.includes(a)
        );
      return matchesSearch && matchesCapacity && matchesPrice && matchesAmenities;
    });
  }, [halls, searchQuery, activeFilters]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <SEO
        title="Venues"
        description="Discover perfect venues for your event. From grand ballrooms to intimate garden settings, find the ideal space for weddings, corporate events, and celebrations in Lagos, Nigeria."
      />
      {/* Faint Background Logo */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url(${logo})`,
          backgroundSize: '400px',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />
      
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
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Discover Perfect
                <span className="text-gradient-gold block">Venues</span>
              </h1>
              <p className="text-muted-foreground font-body text-lg mb-8">
                From grand ballrooms to intimate garden settings, find the ideal space for your celebration.
              </p>

              {/* Search */}
              <div className="flex gap-4 max-w-xl mx-auto">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 rounded-xl"
                  />
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl relative"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  <Filter className="h-5 w-5" />
                  {activeCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                      {activeCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filters Panel */}
        <section className="container mx-auto px-4 -mt-8 mb-4">
          <HallFiltersPanel
            halls={halls}
            filters={activeFilters}
            onChange={setFilters}
            isOpen={filtersOpen}
            onToggle={() => setFiltersOpen(false)}
          />
        </section>

        {/* Venues Grid */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
                    <div className="aspect-[4/3] bg-muted animate-pulse" />
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                      </div>
                      <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-muted animate-pulse" />
                        <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                      </div>
                      <div className="flex gap-4">
                        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
                        <div className="h-6 w-14 rounded-full bg-muted animate-pulse" />
                        <div className="h-6 w-18 rounded-full bg-muted animate-pulse" />
                      </div>
                      <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredHalls.map((hall, index) => (
                  <motion.div
                    key={hall.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover-lift"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={hall.image_url || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800"}
                        alt={hall.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        {formatPrice(hall.price_per_hour)}/hr
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-primary fill-primary" />
                        <span className="text-sm text-muted-foreground">4.9 (120 reviews)</span>
                      </div>

                      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                        {hall.name}
                      </h3>

                      <p className="text-muted-foreground text-sm font-body mb-4 line-clamp-2">
                        {hall.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Up to {hall.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>Lagos</span>
                        </div>
                      </div>

                      {hall.amenities && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {hall.amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
                            >
                              {amenity}
                            </span>
                          ))}
                          {hall.amenities.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{hall.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <Button variant="gold" className="w-full" asChild>
                        <Link to={`/book?hall=${hall.id}`}>Book Now</Link>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredHalls.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body text-lg">
                  No venues found matching your search.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Halls;
