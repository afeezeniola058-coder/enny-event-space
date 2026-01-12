import { motion } from "framer-motion";
import { AlertCircle, Calendar, CreditCard, RefreshCcw } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const refundTiers = [
  {
    timeframe: "30+ days before event",
    refund: "90%",
    description: "Full refund minus 10% processing fee",
    color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  },
  {
    timeframe: "15-29 days before event",
    refund: "50%",
    description: "Half of your booking amount",
    color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  },
  {
    timeframe: "7-14 days before event",
    refund: "25%",
    description: "Quarter of your booking amount",
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  },
  {
    timeframe: "Less than 7 days",
    refund: "0%",
    description: "No refund available",
    color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  },
];

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-16 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6"
          >
            Refund & Cancellation Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-body text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            We understand plans can change. Here's everything you need to know about 
            our cancellation and refund policies.
          </motion.p>
        </div>
      </section>

      {/* Refund Tiers */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
            Cancellation Refund Schedule
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {refundTiers.map((tier, index) => (
              <motion.div
                key={tier.timeframe}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl ${tier.color}`}
              >
                <div className="font-display text-3xl font-bold mb-2">{tier.refund}</div>
                <div className="font-display font-semibold mb-1">{tier.timeframe}</div>
                <div className="font-body text-sm opacity-80">{tier.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Policy Details */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-xl border border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  How to Cancel
                </h3>
              </div>
              <p className="font-body text-sm text-muted-foreground">
                To cancel your booking, log into your account and navigate to your bookings. 
                Select the booking you wish to cancel and click "Request Cancellation". 
                Alternatively, contact us at support@eventify.com with your booking reference.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-xl border border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Refund Processing
                </h3>
              </div>
              <p className="font-body text-sm text-muted-foreground">
                Approved refunds are processed within 5-7 business days. Refunds will be 
                credited to the original payment method. Bank processing times may vary 
                and could take an additional 3-5 business days.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-xl border border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <RefreshCcw className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Rescheduling Option
                </h3>
              </div>
              <p className="font-body text-sm text-muted-foreground">
                Instead of canceling, you may reschedule your event to a different date 
                subject to availability. Rescheduling requests made 14+ days before the 
                original date incur no additional fees. Later changes may have a fee.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card p-6 rounded-xl border border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Special Circumstances
                </h3>
              </div>
              <p className="font-body text-sm text-muted-foreground">
                In cases of documented emergencies, medical situations, or government-imposed 
                restrictions, we may offer more flexible refund options. Please contact us 
                directly to discuss your situation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-gray dark:prose-invert max-w-none font-body">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              Additional Information
            </h2>

            <h3 className="font-display text-xl font-semibold text-foreground mb-3">
              Non-Refundable Items
            </h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Custom decoration elements made specifically for your event</li>
              <li>Perishable catering items already prepared</li>
              <li>Third-party services already paid on your behalf</li>
              <li>Administrative and processing fees</li>
            </ul>

            <h3 className="font-display text-xl font-semibold text-foreground mb-3">
              Cancellation by Eventify
            </h3>
            <p className="text-muted-foreground mb-6">
              In the rare event that we must cancel your booking due to unforeseen 
              circumstances (venue issues, safety concerns, etc.), you will receive a 
              full refund or the option to reschedule at no additional cost.
            </p>

            <h3 className="font-display text-xl font-semibold text-foreground mb-3">
              Contact Us
            </h3>
            <p className="text-muted-foreground">
              For any questions about our refund policy, please contact our support team at{" "}
              <a href="mailto:support@eventify.com" className="text-primary hover:underline">
                support@eventify.com
              </a>{" "}
              or call +234 800 123 4567.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
