import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShaderAnimation } from "@/components/ui/shader-animation";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Shader Background */}
      <ShaderAnimation />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />

      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Premium Event Planning</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Create
              <span className="text-gradient-gold block">Unforgettable</span>
              Moments
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg font-body leading-relaxed">
              From elegant weddings to corporate galas, we transform your vision into extraordinary 
              celebrations. Let us handle every detail while you create lasting memories.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth?mode=signup">
                  <Calendar className="h-5 w-5 mr-2" />
                  Start Planning
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/halls">Explore Venues</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
              {[
                { value: "500+", label: "Events Hosted" },
                { value: "98%", label: "Happy Clients" },
                { value: "50+", label: "Venues" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <p className="font-display text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-body">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Hero Image/Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-elegant">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
              <img
                src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200"
                alt="Elegant event venue"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
              
              {/* Floating Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center"
                      >
                        <Star className="h-4 w-4 text-primary" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">Join 2,000+ Happy Clients</p>
                    <p className="text-sm text-muted-foreground font-body">Book your dream event today</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Decorative floating elements */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-6 -right-6 w-24 h-24 bg-primary rounded-2xl shadow-glow flex items-center justify-center"
            >
              <Calendar className="h-10 w-10 text-primary-foreground" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
