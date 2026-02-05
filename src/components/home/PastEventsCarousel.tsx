import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePastEvents } from "@/hooks/usePastEvents";
import { format } from "date-fns";

const PastEventsCarousel = () => {
  const { data: events, isLoading } = usePastEvents();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const publishedEvents = events?.filter(e => e.is_published) || [];

  useEffect(() => {
    if (publishedEvents.length <= 1) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % publishedEvents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [publishedEvents.length]);

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => 
      prev === 0 ? publishedEvents.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % publishedEvents.length);
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="h-[500px] bg-muted animate-pulse rounded-3xl" />
        </div>
      </section>
    );
  }

  if (publishedEvents.length === 0) {
    return null;
  }

  const currentEvent = publishedEvents[currentIndex];
  const currentImage = currentEvent?.images?.[0] || "/placeholder.svg";

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const imageVariants = {
    initial: {
      scale: 1,
    },
    animate: {
      scale: 1.1,
      transition: {
        duration: 6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section className="py-20 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Our Portfolio
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Past Events
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-body">
            Explore some of our most memorable celebrations and see how we bring visions to life
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <div className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden shadow-elegant">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0"
              >
                <motion.img
                  src={currentImage}
                  alt={currentEvent.title}
                  className="w-full h-full object-cover"
                  variants={imageVariants}
                  initial="initial"
                  animate="animate"
                  key={`img-${currentIndex}`}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                
                {/* Event Info */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute bottom-0 left-0 right-0 p-8 md:p-12"
                >
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-sm font-medium mb-4">
                    {currentEvent.category}
                  </span>
                  <h3 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                    {currentEvent.title}
                  </h3>
                  <div className="flex flex-wrap gap-6 text-white/90 mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-body">{currentEvent.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-body">
                        {format(new Date(currentEvent.event_date), "MMMM d, yyyy")}
                      </span>
                    </div>
                    {currentEvent.guest_count && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-body">{currentEvent.guest_count} Guests</span>
                      </div>
                    )}
                  </div>
                  {currentEvent.description && (
                    <p className="text-white/80 font-body max-w-2xl line-clamp-2 mb-6">
                      {currentEvent.description}
                    </p>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {publishedEvents.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/20 hover:bg-background/40 text-white backdrop-blur-sm h-12 w-12 rounded-full"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/20 hover:bg-background/40 text-white backdrop-blur-sm h-12 w-12 rounded-full"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {publishedEvents.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {publishedEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Button variant="outline" size="lg" asChild>
            <Link to="/blog">View All Events</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default PastEventsCarousel;
