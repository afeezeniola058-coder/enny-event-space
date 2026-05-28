import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import ServicesSection from "@/components/home/ServicesSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";
import PastEventsCarousel from "@/components/home/PastEventsCarousel";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Premium Event Planning & Venue Booking"
        description="Book stunning halls, catering, and decorations for weddings, corporate events, and celebrations across Nigeria with Eventify."
        url="/"
      />
      <Navbar />
      <main>
        <HeroSection />
        <PastEventsCarousel />
        <ServicesSection />
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
