import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CateringPackage {
  id: string;
  name: string;
  description: string | null;
  price_per_person: number;
  menu_items: string[] | null;
  image_url: string | null;
  category: string | null;
}

const samplePackages: CateringPackage[] = [
  {
    id: "1",
    name: "Classic Nigerian",
    description: "Traditional Nigerian cuisine featuring jollof rice, fried rice, and assorted proteins.",
    price_per_person: 5000,
    menu_items: ["Jollof Rice", "Fried Rice", "Grilled Chicken", "Beef Suya", "Plantain", "Coleslaw", "Soft Drinks"],
    image_url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=800",
    category: "Traditional",
  },
  {
    id: "2",
    name: "Continental Fusion",
    description: "A blend of international flavors with elegant presentation for sophisticated palates.",
    price_per_person: 8500,
    menu_items: ["Caesar Salad", "Grilled Salmon", "Beef Tenderloin", "Pasta Primavera", "Roasted Vegetables", "Tiramisu", "Wine Selection"],
    image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800",
    category: "International",
  },
  {
    id: "3",
    name: "Premium Cocktail",
    description: "Finger foods and canapés perfect for cocktail receptions and networking events.",
    price_per_person: 6500,
    menu_items: ["Mini Burgers", "Shrimp Skewers", "Bruschetta", "Spring Rolls", "Cheese Board", "Fruit Display", "Cocktails"],
    image_url: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800",
    category: "Cocktail",
  },
  {
    id: "4",
    name: "Luxury Gourmet",
    description: "An exquisite fine dining experience with premium ingredients and chef's specialties.",
    price_per_person: 15000,
    menu_items: ["Lobster Bisque", "Wagyu Beef", "Truffle Risotto", "Oysters", "Chocolate Soufflé", "Champagne", "Petit Fours"],
    image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800",
    category: "Luxury",
  },
];

export const useCateringPackages = () => {
  return useQuery({
    queryKey: ["catering_packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catering_packages")
        .select("*")
        .abortSignal(AbortSignal.timeout(10000));
      
      if (error) throw error;
      return (data && data.length > 0 ? data : samplePackages) as CateringPackage[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export type { CateringPackage };
