import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Building2, UtensilsCrossed, Palette, Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Building2,
    title: "Venue Booking",
    description: "Choose from our curated selection of stunning venues, from intimate spaces to grand ballrooms.",
    href: "/halls",
    cta: "Explore Venues",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: UtensilsCrossed,
    title: "Catering Services",
    description: "Exquisite culinary experiences crafted by top chefs to delight your guests' palates.",
    href: "/catering",
    cta: "View Catering Menus",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Palette,
    title: "Decorations",
    description: "Transform any space into a magical setting with our bespoke decoration packages.",
    href: "/decorations",
    cta: "Browse Decoration Styles",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Calculator,
    title: "Budget Planner",
    description: "Smart budgeting tools to help you plan your perfect event without overspending.",
    href: "/budget",
    cta: "Plan Your Event Budget",
    color: "from-emerald-500 to-teal-500",
  },
];

const ServicesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">Our Services</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6">
            Everything You Need for a
            <span className="text-gradient-gold block">Perfect Event</span>
          </h2>
          <p className="text-muted-foreground font-body text-lg">
            From planning to execution, we provide comprehensive services to make your event truly exceptional.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover-lift">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <service.icon className="h-7 w-7 text-white" />
                </div>
                
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {service.title}
                </h3>
                
                <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
                  {service.description}
                </p>

                <Button variant="ghost" size="sm" className="group/btn p-0" asChild>
                  <Link to={service.href} aria-label={`${service.cta} — ${service.title}`}>
                    {service.cta}
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
