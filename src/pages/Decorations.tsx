import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { useDecorationPackages } from "@/hooks/useDecorationPackages";
import SEO from "@/components/SEO";
const Decorations = () => {
  const { data: packages = [], isLoading } = useDecorationPackages();
  const [selectedStyle, setSelectedStyle] = useState<string>("All");

  const styles = ["All", "Classic", "Rustic", "Modern", "Botanical", "Royal", "Minimalist"];

  const filteredPackages =
    selectedStyle === "All"
      ? packages
      : packages.filter((pkg) => pkg.style === selectedStyle);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Event Decoration Packages — Classic, Modern, Royal"
        description="Browse bespoke decoration packages by style — Classic, Rustic, Modern, Botanical, Royal, and Minimalist — for weddings and events in Nigeria."
        url="/decorations"
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Palette className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Transform Your Space</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Stunning
                <span className="text-gradient-gold block">Decorations</span>
              </h1>
              <p className="text-muted-foreground font-body text-lg mb-8">
                Create the perfect ambiance with our curated decoration packages.
              </p>

              {/* Style Filter */}
              <div className="flex flex-wrap justify-center gap-3">
                {styles.map((style) => (
                  <Button
                    key={style}
                    variant={selectedStyle === style ? "gold" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStyle(style)}
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Packages Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
                    <div className="aspect-[4/3] bg-muted animate-pulse" />
                    <div className="p-6 space-y-4">
                      <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-muted animate-pulse" />
                        <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                      </div>
                      <div className="h-7 w-32 rounded bg-muted animate-pulse" />
                      <div className="space-y-2">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                            <div className="h-3 w-28 rounded bg-muted animate-pulse" />
                          </div>
                        ))}
                      </div>
                      <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover-lift"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={pkg.image_url || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800"}
                        alt={pkg.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-foreground/80 text-background px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                        {pkg.style}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                        {pkg.name}
                      </h3>

                      <p className="text-muted-foreground text-sm font-body mb-4 line-clamp-2">
                        {pkg.description}
                      </p>

                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="font-display text-2xl font-bold text-primary">
                          {formatPrice(pkg.price)}
                        </span>
                        <span className="text-muted-foreground text-sm">/package</span>
                      </div>

                      {pkg.features && (
                        <ul className="space-y-1 mb-6">
                          {pkg.features.slice(0, 3).map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                          {pkg.features.length > 3 && (
                            <li className="text-sm text-muted-foreground pl-6">
                              +{pkg.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      )}

                      <Button variant="gold" className="w-full" asChild>
                        <Link to={`/book?decoration=${pkg.id}`}>Add to my booking</Link>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredPackages.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body text-lg">
                  No packages found in this style.
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

export default Decorations;
