import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, RefreshCw, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { usePastEvents, type PastEvent } from "@/hooks/usePastEvents";

const categories = ["All", "Wedding", "Corporate", "Birthday", "Family Event", "Gala", "Religious", "Other"];

/** Image that degrades gracefully instead of showing a broken placeholder. */
const SafeImage = ({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
        <ImageOff className="h-6 w-6" />
        <span className="text-xs">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

const Gallery = () => {
  const { data: events, isLoading } = usePastEvents();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<PastEvent | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const withImages = useMemo(
    () => (events ?? []).filter((e) => Array.isArray(e.images) && e.images.length > 0),
    [events]
  );

  const filteredEvents = useMemo(
    () =>
      selectedCategory === "All"
        ? withImages
        : withImages.filter((event) => event.category === selectedCategory),
    [withImages, selectedCategory]
  );

  // Group by event type so the gallery reads as organised sections
  const grouped = useMemo(() => {
    const map = new Map<string, PastEvent[]>();
    filteredEvents.forEach((event) => {
      const key = event.category || "Other";
      map.set(key, [...(map.get(key) ?? []), event]);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredEvents]);

  const availableCategories = useMemo(() => {
    const present = new Set(withImages.map((e) => e.category));
    return categories.filter((c) => c === "All" || present.has(c));
  }, [withImages]);

  const totalImages = filteredEvents.reduce((sum, e) => sum + e.images.length, 0);

  const openLightbox = (event: PastEvent, index = 0) => {
    setSelectedEvent(event);
    setSelectedImageIndex(index);
  };

  const step = useCallback(
    (delta: number) => {
      if (!selectedEvent) return;
      const len = selectedEvent.images.length;
      setSelectedImageIndex((i) => (i + delta + len) % len);
    },
    [selectedEvent]
  );

  useEffect(() => {
    if (!selectedEvent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedEvent, step]);

  return (
    <>
      <SEO
        title="Past Events Gallery | Enny Event"
        description="Browse photos from weddings, corporate functions, birthdays and more events hosted at Enny Event."
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main id="main-content" className="pt-24 pb-16">
          {/* Hero Section */}
          <section className="container mx-auto px-4 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="secondary" className="mb-4">Our Portfolio</Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                Past Events Gallery
              </h1>
              <p className="text-muted-foreground text-lg">
                Take a look at some of the memorable events we've had the privilege to host.
                Each celebration tells a unique story of joy, elegance, and unforgettable moments.
              </p>
              {!isLoading && totalImages > 0 && (
                <p className="text-sm text-muted-foreground mt-3">
                  {totalImages} photos across {filteredEvents.length} events
                </p>
              )}
            </motion.div>
          </section>

          {/* Category Filter */}
          <section className="container mx-auto px-4 mb-10">
            <div className="flex flex-wrap justify-center gap-2">
              {availableCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          {/* Events grouped by category */}
          <section className="container mx-auto px-4 space-y-14">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : grouped.length > 0 ? (
              grouped.map(([category, categoryEvents]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="font-display text-2xl font-semibold text-foreground">{category}</h2>
                    <span className="h-px flex-1 bg-border" />
                    <Badge variant="secondary">{categoryEvents.length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: Math.min(index, 5) * 0.06 }}
                      >
                        <Card
                          className="overflow-hidden cursor-pointer group hover:shadow-elegant transition-all duration-300"
                          role="button"
                          tabIndex={0}
                          onClick={() => openLightbox(event)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openLightbox(event);
                            }
                          }}
                        >
                          <div className="relative">
                            <AspectRatio ratio={4 / 3}>
                              <SafeImage
                                src={event.images[0]}
                                alt={`${event.title} — ${event.category} event at ${event.venue}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </AspectRatio>
                            <div className="absolute top-3 left-3 flex gap-2">
                              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                                {event.category}
                              </Badge>
                              {event.images.length > 1 && (
                                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                                  {event.images.length} photos
                                </Badge>
                              )}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                              <p className="text-primary-foreground text-sm flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(event.event_date), "MMMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-display text-lg font-semibold text-foreground mb-2 line-clamp-1">
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.venue}
                              </span>
                              {event.guest_count && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {event.guest_count} guests
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {selectedCategory === "All"
                    ? "No events to display yet. Check back soon!"
                    : `No ${selectedCategory} events found.`}
                </p>
              </div>
            )}
          </section>
        </main>

        {/* Lightbox */}
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">{selectedEvent?.title} — Event Gallery</DialogTitle>
            {selectedEvent && (
              <div>
                <div className="relative bg-foreground/95">
                  <AspectRatio ratio={16 / 9}>
                    <SafeImage
                      src={selectedEvent.images[selectedImageIndex]}
                      alt={`${selectedEvent.title} — photo ${selectedImageIndex + 1} of ${selectedEvent.images.length}`}
                      className="w-full h-full object-contain"
                    />
                  </AspectRatio>

                  {selectedEvent.images.length > 1 && (
                    <>
                      <button
                        aria-label="Previous photo"
                        onClick={() => step(-1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background p-2 shadow-md transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        aria-label="Next photo"
                        onClick={() => step(1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background p-2 shadow-md transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <span className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full bg-background/80">
                        {selectedImageIndex + 1} / {selectedEvent.images.length}
                      </span>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {selectedEvent.images.length > 1 && (
                  <div className="flex gap-2 p-4 bg-muted/50 overflow-x-auto">
                    {selectedEvent.images.map((image, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        aria-label={`View photo ${idx + 1}`}
                        className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all ${
                          selectedImageIndex === idx
                            ? "border-primary"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <SafeImage src={image} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Event Details */}
                <div className="p-6">
                  <Badge variant="secondary" className="mb-2">{selectedEvent.category}</Badge>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    {selectedEvent.title}
                  </h2>
                  {selectedEvent.description && (
                    <p className="text-muted-foreground mb-4">{selectedEvent.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(selectedEvent.event_date), "MMMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedEvent.venue}
                    </span>
                    {selectedEvent.guest_count && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {selectedEvent.guest_count} guests
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </>
  );
};

export default Gallery;
