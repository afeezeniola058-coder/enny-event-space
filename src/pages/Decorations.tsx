import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Palette, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface DecorationPackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[] | null;
  image_url: string | null;
  style: string | null;
}

const samplePackages: DecorationPackage[] = [
  {
    id: "1",
    name: "Elegant Classic",
    description: "Timeless elegance with white florals, crystal accents, and soft lighting.",
    price: 250000,
    features: ["White Rose Arrangements", "Crystal Centerpieces", "Fairy Lights", "Satin Table Runners", "Chair Covers"],
    image_url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800",
    style: "Classic",
  },
  {
    id: "2",
    name: "Rustic Romance",
    description: "Warm and cozy with natural wood, burlap, and wildflower arrangements.",
    price: 180000,
    features: ["Wooden Centerpieces", "Mason Jar Lanterns", "Wildflower Bouquets", "Burlap Accents", "Twinkle Lights"],
    image_url: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?q=80&w=800",
    style: "Rustic",
  },
  {
    id: "3",
    name: "Modern Luxe",
    description: "Contemporary sophistication with geometric shapes and metallic accents.",
    price: 350000,
    features: ["Geometric Installations", "Gold/Silver Accents", "LED Lighting", "Acrylic Signage", "Modern Florals"],
    image_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800",
    style: "Modern",
  },
  {
    id: "4",
    name: "Garden Paradise",
    description: "Lush greenery and botanical elements for an enchanting outdoor feel.",
    price: 280000,
    features: ["Living Walls", "Hanging Installations", "Tropical Florals", "Garden Arches", "Ambient Lighting"],
    image_url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800",
    style: "Botanical",
  },
  {
    id: "5",
    name: "Royal Grandeur",
    description: "Opulent designs fit for royalty with rich colors and lavish details.",
    price: 500000,
    features: ["Floral Chandeliers", "Velvet Draping", "Gold Candelabras", "Premium Florals", "Stage Design"],
    image_url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800",
    style: "Royal",
  },
  {
    id: "6",
    name: "Minimalist Chic",
    description: "Clean lines and understated elegance for modern sophistication.",
    price: 150000,
    features: ["Single Stem Arrangements", "Neutral Palette", "Clean Linens", "Simple Signage", "Subtle Lighting"],
    image_url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=800",
    style: "Minimalist",
  },
];

const Decorations = () => {
  const [packages, setPackages] = useState<DecorationPackage[]>(samplePackages);
  const [selectedStyle, setSelectedStyle] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  const styles = ["All", "Classic", "Rustic", "Modern", "Botanical", "Royal", "Minimalist"];

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase.from("decoration_packages").select("*");
      if (!error && data && data.length > 0) {
        setPackages(data as DecorationPackage[]);
      }
      setIsLoading(false);
    };
    fetchPackages();
  }, []);

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
                  <div key={i} className="bg-card rounded-2xl h-96 animate-pulse" />
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
                        <Link to={`/book?decoration=${pkg.id}`}>Choose Package</Link>
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
