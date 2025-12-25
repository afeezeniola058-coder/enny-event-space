import { useState } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { useCateringPackages } from "@/hooks/useCateringPackages";

const Catering = () => {
  const { data: packages = [], isLoading } = useCateringPackages();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Traditional", "International", "Cocktail", "Luxury"];

  const filteredPackages =
    selectedCategory === "All"
      ? packages
      : packages.filter((pkg) => pkg.category === selectedCategory);

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
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Culinary Excellence</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Exquisite
                <span className="text-gradient-gold block">Catering</span>
              </h1>
              <p className="text-muted-foreground font-body text-lg mb-8">
                Delight your guests with exceptional cuisine crafted by our expert chefs.
              </p>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "gold" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
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
              <div className="grid md:grid-cols-2 gap-8">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-card rounded-2xl h-96 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {filteredPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="grid md:grid-cols-2">
                      <div className="relative aspect-square md:aspect-auto overflow-hidden">
                        <img
                          src={pkg.image_url || "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=800"}
                          alt={pkg.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                          {pkg.category}
                        </div>
                      </div>

                      <div className="p-6 flex flex-col">
                        <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
                          {pkg.name}
                        </h3>

                        <p className="text-muted-foreground text-sm font-body mb-4">
                          {pkg.description}
                        </p>

                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="font-display text-3xl font-bold text-primary">
                            {formatPrice(pkg.price_per_person)}
                          </span>
                          <span className="text-muted-foreground text-sm">/person</span>
                        </div>

                        {pkg.menu_items && (
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground mb-2">Menu includes:</p>
                            <ul className="space-y-1 mb-4">
                              {pkg.menu_items.slice(0, 4).map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="h-4 w-4 text-primary" />
                                  {item}
                                </li>
                              ))}
                              {pkg.menu_items.length > 4 && (
                                <li className="text-sm text-muted-foreground">
                                  +{pkg.menu_items.length - 4} more items
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        <Button variant="gold" className="w-full mt-auto" asChild>
                          <Link to={`/book?catering=${pkg.id}`}>Select Package</Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredPackages.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body text-lg">
                  No packages found in this category.
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

export default Catering;
