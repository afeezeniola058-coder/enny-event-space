import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";

const faqs = [
  {
    category: "Booking & Reservations",
    questions: [
      {
        q: "How do I make a booking?",
        a: "Simply browse our venues, select your preferred date, choose your catering and decoration packages, and complete the booking form. You'll receive a confirmation email once your booking is confirmed.",
      },
      {
        q: "How far in advance should I book?",
        a: "We recommend booking at least 2-3 months in advance for large events like weddings. For smaller gatherings, 2-4 weeks is usually sufficient. Popular dates during peak season may require earlier booking.",
      },
      {
        q: "Can I visit the venue before booking?",
        a: "Yes! We encourage venue tours. Contact us to schedule a visit and our team will be happy to show you around and answer any questions.",
      },
      {
        q: "What's included in the venue rental?",
        a: "Basic venue rental includes the space, standard furniture setup, basic lighting, and access to restroom facilities. Additional services like catering, decorations, and audio-visual equipment can be added during booking.",
      },
    ],
  },
  {
    category: "Payments & Pricing",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept bank transfers, debit/credit cards (Visa, Mastercard), and mobile payments. All transactions are processed securely through Paystack.",
      },
      {
        q: "Is a deposit required?",
        a: "Yes, a 50% deposit is required to confirm your booking. The remaining balance is due at least 7 days before your event date.",
      },
      {
        q: "Are there any hidden fees?",
        a: "No hidden fees! All costs are clearly displayed during the booking process. Any additional services you add will show their prices upfront.",
      },
      {
        q: "Can I get an invoice for my booking?",
        a: "Yes, detailed invoices are automatically generated and sent to your email upon booking confirmation and after full payment.",
      },
    ],
  },
  {
    category: "Cancellations & Changes",
    questions: [
      {
        q: "What is your cancellation policy?",
        a: "Refunds vary based on cancellation timing: 90% for 30+ days before, 50% for 15-29 days, 25% for 7-14 days, and no refund for less than 7 days. See our full Refund Policy for details.",
      },
      {
        q: "Can I reschedule my event?",
        a: "Yes, rescheduling is possible subject to availability. Requests made 14+ days before your original date incur no additional fees. Later changes may have a rescheduling fee.",
      },
      {
        q: "What if my guest count changes?",
        a: "Minor changes can usually be accommodated up to 7 days before your event. Significant increases may require additional arrangements and costs.",
      },
    ],
  },
  {
    category: "Catering",
    questions: [
      {
        q: "Can you accommodate dietary restrictions?",
        a: "Absolutely! We offer vegetarian, vegan, halal, and other dietary options. Please specify any requirements during booking or contact our team.",
      },
      {
        q: "Can I taste the food before my event?",
        a: "Yes, we offer food tasting sessions for bookings above a certain value. Contact us to arrange a tasting appointment.",
      },
      {
        q: "Can I bring my own caterer?",
        a: "While we recommend our in-house catering partners for the best experience, outside catering may be permitted with prior approval and an additional fee.",
      },
    ],
  },
  {
    category: "Event Day",
    questions: [
      {
        q: "What time can we access the venue for setup?",
        a: "Standard setup time is 2-3 hours before your event. Extended setup can be arranged for an additional fee if needed.",
      },
      {
        q: "Will there be staff present during my event?",
        a: "Yes, depending on your package, our event coordinators and support staff will be present to ensure everything runs smoothly.",
      },
      {
        q: "What happens if something goes wrong?",
        a: "Our experienced team is trained to handle any situation. We also maintain backup equipment and contingency plans for common issues.",
      },
    ],
  },
];

const FAQ = () => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.flatMap((category) =>
      category.questions.map((q) => ({
        "@type": "Question",
        name: q.q,
        acceptedAnswer: { "@type": "Answer", text: q.a },
      }))
    ),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Frequently Asked Questions"
        description="Answers about bookings, payments, cancellations, catering, and event day logistics with Eventify."
        url="/faq"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <Navbar />


      <section className="pt-32 pb-16 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6"
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-body text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Find answers to common questions about our event planning services
          </motion.p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {faqs.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="mb-10"
            >
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                {category.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {category.questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`${categoryIndex}-${index}`}
                    className="bg-card rounded-lg border border-border px-4"
                  >
                    <AccordionTrigger className="font-display text-left hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="font-body text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            Still Have Questions?
          </h2>
          <p className="font-body text-muted-foreground mb-6 max-w-xl mx-auto">
            Can't find the answer you're looking for? Our friendly team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </a>
            <a
              href="mailto:support@eventify.com"
              className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Email Support
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
