import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export const useDecorationPackages = () => {
  return useQuery({
    queryKey: ["decoration_packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decoration_packages")
        .select("*")
        .abortSignal(AbortSignal.timeout(10000));
      
      if (error) throw error;
      return (data && data.length > 0 ? data : samplePackages) as DecorationPackage[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export type { DecorationPackage };
