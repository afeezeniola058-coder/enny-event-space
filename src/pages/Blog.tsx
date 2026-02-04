import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface PastEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  guestCount: number;
  category: string;
  description: string;
  images: string[];
}

const pastEvents: PastEvent[] = [
  {
    id: "1",
    title: "Adeyemi & Folake Wedding",
    date: "January 15, 2026",
    venue: "Grand Ballroom",
    guestCount: 350,
    category: "Wedding",
    description: "A beautiful traditional Nigerian wedding celebration with elegant gold and white decorations.",
    images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800",
    ],
  },
  {
    id: "2",
    title: "TechVenture Corporate Summit",
    date: "December 8, 2025",
    venue: "Executive Conference Hall",
    guestCount: 200,
    category: "Corporate",
    description: "Annual tech conference featuring keynote speakers and networking sessions.",
    images: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800",
    ],
  },
  {
    id: "3",
    title: "Princess Chioma's Sweet 16",
    date: "November 22, 2025",
    venue: "Garden Pavilion",
    guestCount: 150,
    category: "Birthday",
    description: "A magical pink and gold themed celebration for a special 16th birthday.",
    images: [
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
      "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=800",
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800",
    ],
  },
  {
    id: "4",
    title: "Okonkwo Family Reunion",
    date: "October 5, 2025",
    venue: "Outdoor Terrace",
    guestCount: 250,
    category: "Family Event",
    description: "A joyful gathering celebrating three generations of the Okonkwo family.",
    images: [
      "https://images.unsplash.com/photo-1529543544277-750e9ce698f8?w=800",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800",
      "https://images.unsplash.com/photo-1496024840928-4c417adf211d?w=800",
    ],
  },
  {
    id: "5",
    title: "Lagos Business Awards Gala",
    date: "September 18, 2025",
    venue: "Crystal Hall",
    guestCount: 400,
    category: "Gala",
    description: "An elegant black-tie event honoring outstanding business achievements.",
    images: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
      "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
    ],
  },
  {
    id: "6",
    title: "Baby Dedication Ceremony",
    date: "August 30, 2025",
    venue: "Intimate Lounge",
    guestCount: 80,
    category: "Religious",
    description: "A heartwarming ceremony welcoming a new blessing to the family.",
    images: [
      "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800",
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800",
      "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=800",
    ],
  },
];

const categories = ["All", "Wedding", "Corporate", "Birthday", "Family Event", "Gala", "Religious"];

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<PastEvent | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const filteredEvents = selectedCategory === "All" 
    ? pastEvents 
    : pastEvents.filter(event => event.category === selectedCategory);

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
                          {event.date}
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
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.guestCount} guests
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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

                {/* Event Details */}
                <div className="p-6">
                  <Badge variant="secondary" className="mb-2">{selectedEvent.category}</Badge>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    {selectedEvent.title}
                  </h2>
                  <p className="text-muted-foreground mb-4">{selectedEvent.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {selectedEvent.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedEvent.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {selectedEvent.guestCount} guests
                    </span>
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
