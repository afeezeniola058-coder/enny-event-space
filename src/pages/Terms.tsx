import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Terms = () => {
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
            Terms and Conditions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-body text-muted-foreground"
          >
            Last updated: January 2026
          </motion.p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-gray dark:prose-invert max-w-none font-body">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground mb-6">
              By accessing and using Eventify's services, you accept and agree to be bound by 
              these Terms and Conditions. If you do not agree to these terms, please do not 
              use our services.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              2. Services Description
            </h2>
            <p className="text-muted-foreground mb-6">
              Eventify provides event planning and management services including venue booking, 
              catering arrangements, decoration services, and related event coordination services. 
              All services are subject to availability and confirmation.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              3. Booking and Payments
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>All bookings require a minimum deposit of 50% to confirm your reservation.</li>
              <li>The remaining balance must be paid at least 7 days before the event date.</li>
              <li>Payments can be made via bank transfer, card payment, or other approved methods.</li>
              <li>All prices are quoted in Nigerian Naira (NGN) unless otherwise stated.</li>
              <li>Prices are subject to change without prior notice for new bookings.</li>
            </ul>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              4. Cancellation Policy
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Cancellations made 30+ days before the event: Full refund minus 10% processing fee.</li>
              <li>Cancellations made 15-29 days before: 50% refund.</li>
              <li>Cancellations made 7-14 days before: 25% refund.</li>
              <li>Cancellations made less than 7 days before: No refund.</li>
              <li>Rescheduling is subject to availability and may incur additional charges.</li>
            </ul>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              5. User Responsibilities
            </h2>
            <p className="text-muted-foreground mb-6">
              Users are responsible for providing accurate information during booking, ensuring 
              guest behavior complies with venue rules, and any damages caused during the event. 
              Eventify reserves the right to refuse service to anyone who violates these terms.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              6. Limitation of Liability
            </h2>
            <p className="text-muted-foreground mb-6">
              Eventify shall not be liable for any indirect, incidental, or consequential damages 
              arising from the use of our services. Our total liability shall not exceed the 
              amount paid for the specific service in question.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              7. Force Majeure
            </h2>
            <p className="text-muted-foreground mb-6">
              Eventify shall not be liable for any failure to perform due to circumstances beyond 
              our reasonable control, including natural disasters, government actions, civil unrest, 
              or pandemic-related restrictions.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              8. Intellectual Property
            </h2>
            <p className="text-muted-foreground mb-6">
              All content on our website, including logos, images, and text, is the property of 
              Eventify and protected by copyright laws. Unauthorized use is prohibited.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              9. Changes to Terms
            </h2>
            <p className="text-muted-foreground mb-6">
              Eventify reserves the right to modify these terms at any time. Changes will be 
              effective immediately upon posting on our website. Continued use of our services 
              constitutes acceptance of modified terms.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              10. Contact Information
            </h2>
            <p className="text-muted-foreground mb-6">
              For questions about these Terms and Conditions, please contact us at{" "}
              <a href="mailto:legal@eventify.com" className="text-primary hover:underline">
                legal@eventify.com
              </a>{" "}
              or call +234 901 767 5564.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
