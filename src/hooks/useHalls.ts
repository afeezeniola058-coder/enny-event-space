import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Hall {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  price_per_hour: number;
  image_url: string | null;
  amenities: string[] | null;
}

const sampleHalls: Hall[] = [
  {
    id: "1",
    name: "Grand Ballroom",
    description: "An elegant ballroom perfect for large celebrations and corporate events.",
    capacity: 500,
    price_per_hour: 150000,
    image_url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800",
    amenities: ["Air Conditioning", "Stage", "Sound System", "Lighting", "Parking"],
  },
  {
    id: "2",
    name: "Garden Pavilion",
    description: "A beautiful outdoor space with lush gardens for intimate gatherings.",
    capacity: 150,
    price_per_hour: 75000,
    image_url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800",
    amenities: ["Garden View", "Tent Available", "Natural Lighting", "Parking"],
  },
  {
    id: "3",
    name: "Crystal Hall",
    description: "A modern venue with crystal chandeliers and contemporary design.",
    capacity: 300,
    price_per_hour: 120000,
    image_url: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=800",
    amenities: ["Chandeliers", "AC", "DJ Booth", "VIP Lounge", "Parking"],
  },
  {
    id: "4",
    name: "Rooftop Terrace",
    description: "Stunning city views with open-air luxury for exclusive events.",
    capacity: 100,
    price_per_hour: 100000,
    image_url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800",
    amenities: ["City View", "Bar Area", "Lounge Seating", "Heaters"],
  },
];

export const useHalls = () => {
  return useQuery({
    queryKey: ["halls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("halls")
        .select("*")
        .abortSignal(AbortSignal.timeout(10000));
      
      if (error) throw error;
      return (data && data.length > 0 ? data : sampleHalls) as Hall[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
};

export type { Hall };
