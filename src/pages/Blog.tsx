import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, RefreshCw } from "lucide-react";
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

const Blog = () => {
  const { data: events, isLoading } = usePastEvents();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<PastEvent | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const filteredEvents = selectedCategory === "All" 
    ? events 
    : events?.filter(event => event.category === selectedCategory);

  return (
    <>
      <SEO 
        title="Past Events Gallery | Enny Event"
        description="Browse through our gallery of successfully hosted events including weddings, corporate functions, birthdays, and more."
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
            </motion.div>
          </section>

          {/* Category Filter */}
          <section className="container mx-auto px-4 mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
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

          {/* Events Grid */}
          <section className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredEvents && filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="overflow-hidden cursor-pointer group hover:shadow-elegant transition-all duration-300"
                      onClick={() => {
                        setSelectedEvent(event);
                        setSelectedImageIndex(0);
                      }}
                    >
                      <div className="relative">
                        <AspectRatio ratio={4/3}>
                          <img
                            src={event.images[0]}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </AspectRatio>
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                            {event.category}
                          </Badge>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <p className="text-white text-sm flex items-center gap-1">
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

        {/* Image Modal */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">
              {selectedEvent?.title} - Event Gallery
            </DialogTitle>
            {selectedEvent && (
              <div>
                <div className="relative">
                  <AspectRatio ratio={16/9}>
                    <img
                      src={selectedEvent.images[selectedImageIndex]}
                      alt={`${selectedEvent.title} - Image ${selectedImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </div>
                
                {/* Thumbnail Strip */}
                {selectedEvent.images.length > 1 && (
                  <div className="flex gap-2 p-4 bg-muted/50 overflow-x-auto">
                    {selectedEvent.images.map((image, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all ${
                          selectedImageIndex === idx 
                            ? "border-primary" 
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
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

export default Blog;
