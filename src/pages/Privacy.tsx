import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Privacy = () => {
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
            Privacy Policy
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
              1. Information We Collect
            </h2>
            <p className="text-muted-foreground mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Personal information (name, email address, phone number)</li>
              <li>Booking details (event date, venue preferences, guest count)</li>
              <li>Payment information (processed securely through our payment partners)</li>
              <li>Communications with our team</li>
            </ul>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Process and manage your bookings</li>
              <li>Communicate with you about your events</li>
              <li>Send booking confirmations and reminders</li>
              <li>Improve our services and customer experience</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              3. Information Sharing
            </h2>
            <p className="text-muted-foreground mb-6">
              We do not sell, trade, or rent your personal information to third parties. 
              We may share your information with trusted service providers who assist us in 
              operating our business (venue partners, caterers, payment processors), but only 
              to the extent necessary to provide our services.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              4. Data Security
            </h2>
            <p className="text-muted-foreground mb-6">
              We implement appropriate technical and organizational measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or 
              destruction. However, no method of transmission over the Internet is 100% secure, 
              and we cannot guarantee absolute security.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              5. Data Retention
            </h2>
            <p className="text-muted-foreground mb-6">
              We retain your personal information for as long as necessary to fulfill the 
              purposes for which it was collected, including to satisfy legal, accounting, 
              or reporting requirements. Booking records are typically retained for 7 years 
              for accounting purposes.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              6. Your Rights
            </h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              7. Cookies and Tracking
            </h2>
            <p className="text-muted-foreground mb-6">
              We use cookies and similar tracking technologies to enhance your browsing 
              experience, analyze website traffic, and understand user behavior. You can 
              control cookie preferences through your browser settings.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              8. Third-Party Links
            </h2>
            <p className="text-muted-foreground mb-6">
              Our website may contain links to third-party websites. We are not responsible 
              for the privacy practices of these external sites. We encourage you to read 
              their privacy policies before providing any personal information.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              9. Children's Privacy
            </h2>
            <p className="text-muted-foreground mb-6">
              Our services are not directed to individuals under 18. We do not knowingly 
              collect personal information from children. If you believe we have collected 
              information from a child, please contact us immediately.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-muted-foreground mb-6">
              We may update this Privacy Policy from time to time. We will notify you of 
              any changes by posting the new policy on this page and updating the "Last updated" 
              date.
            </p>

            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              11. Contact Us
            </h2>
            <p className="text-muted-foreground mb-6">
              If you have questions about this Privacy Policy or wish to exercise your rights, 
              please contact us at{" "}
              <a href="mailto:privacy@eventify.com" className="text-primary hover:underline">
                privacy@eventify.com
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

export default Privacy;
