import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Start Your Journey Today</span>
          </div>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-background mb-6">
            Ready to Create
            <span className="text-primary block">Magic?</span>
          </h2>

          <p className="text-background/70 font-body text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of happy clients who have trusted us with their most precious celebrations. 
            Your dream event is just a click away.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button
              variant="glass"
              size="xl"
              className="text-background border-background/20 hover:bg-background/10"
              asChild
            >
              <Link to="/halls">Browse Venues</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
