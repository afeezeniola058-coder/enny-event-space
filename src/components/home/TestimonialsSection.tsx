import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
  halls: {
    name: string;
  } | null;
}

const TestimonialsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          title,
          comment,
          created_at,
          profiles:user_id (full_name),
          halls:hall_id (name)
        `)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) {
        setReviews(data as unknown as Review[]);
      }
      setIsLoading(false);
    };

    fetchReviews();
  }, []);

  // Fallback testimonials when no reviews exist
  const fallbackTestimonials = [
    {
      id: "1",
      name: "Adaeze Okonkwo",
      rating: 5,
      comment: "Eventify made our wedding absolutely magical! The Grand Ballroom was stunning and the catering was exceptional. Highly recommended!",
      hall: "Grand Ballroom",
    },
    {
      id: "2",
      name: "Chinedu Eze",
      rating: 5,
      comment: "Professional service from start to finish. The decorations exceeded our expectations and the staff was incredibly helpful.",
      hall: "Garden Pavilion",
    },
    {
      id: "3",
      name: "Ngozi Adeyemi",
      rating: 5,
      comment: "Our corporate event was flawlessly executed. The Crystal Hall provided the perfect ambiance for our product launch.",
      hall: "Crystal Hall",
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : null;

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 w-48 bg-muted animate-pulse rounded mx-auto mb-4" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border">
                <div className="h-24 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Clients Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from couples and companies who trusted us with their special moments
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayReviews ? (
            displayReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 border border-border shadow-sm relative"
              >
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                {review.title && (
                  <h4 className="font-semibold text-foreground mb-2">{review.title}</h4>
                )}
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  "{review.comment}"
                </p>
                <div className="border-t border-border pt-4">
                  <p className="font-medium text-foreground">
                    {review.profiles?.full_name || "Happy Customer"}
                  </p>
                  {review.halls?.name && (
                    <p className="text-xs text-muted-foreground">{review.halls.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            fallbackTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 border border-border shadow-sm relative"
              >
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  "{testimonial.comment}"
                </p>
                <div className="border-t border-border pt-4">
                  <p className="font-medium text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.hall}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
