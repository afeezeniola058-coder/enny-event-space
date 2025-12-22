import { motion } from "framer-motion";
import { CheckCircle2, CreditCard, Bell, Calendar, Shield, Clock } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Real-time Availability",
    description: "Check venue availability instantly with our live calendar system.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Safe and seamless transactions with Paystack integration.",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    description: "Never miss a deadline with email and SMS notifications.",
  },
  {
    icon: Shield,
    title: "Trusted Vendors",
    description: "All our vendors are vetted for quality and reliability.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Our team is always ready to assist you, day or night.",
  },
  {
    icon: CheckCircle2,
    title: "Easy Management",
    description: "Track all your bookings and payments in one dashboard.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">Why Choose Us</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6">
            Making Event Planning
            <span className="text-gradient-gold block">Effortless</span>
          </h2>
          <p className="text-muted-foreground font-body text-lg">
            Our platform combines cutting-edge technology with exceptional service to deliver an unparalleled event planning experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
