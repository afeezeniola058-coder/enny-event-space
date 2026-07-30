import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background" role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2" aria-label="Eventify - Go to homepage">
              <img src={logo} alt="Eventify logo" className="h-10 w-10 rounded-full object-cover" />
              <span className="font-display text-2xl font-bold">Eventify</span>
            </Link>
            <p className="text-background/70 font-body text-sm leading-relaxed">
              Creating unforgettable moments with elegance and precision. Your dream event, our expertise.
            </p>
            <nav aria-label="Social media links" className="flex gap-4">
              <a 
                href="#" 
                className="text-background/60 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-foreground rounded-sm"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
              <a 
                href="#" 
                className="text-background/60 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-foreground rounded-sm"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </a>
              <a 
                href="#" 
                className="text-background/60 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-foreground rounded-sm"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
            </nav>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: "Venues", path: "/halls" },
                { name: "Catering", path: "/catering" },
                { name: "Decorations", path: "/decorations" },
                { name: "About Us", path: "/about" },
                { name: "Contact", path: "/contact" },
                { name: "FAQ", path: "/faq" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-background/70 hover:text-primary transition-colors font-body text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <nav aria-label="Legal links">
            <h4 className="font-display text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-3" role="list">
              {[
                { name: "Contact & Support", path: "/contact" },
                { name: "Terms of Service", path: "/terms" },
                { name: "Cancellation & Refund Policy", path: "/refund-policy" },
                { name: "Privacy Policy", path: "/privacy" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-background/70 hover:text-primary transition-colors font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-foreground rounded-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-background/70 font-body text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                123 Event Street, Lagos, Nigeria
              </li>
              <li className="flex items-center gap-3 text-background/70 font-body text-sm">
                <Phone className="h-4 w-4 text-primary" />
                +234 901 767 5564
              </li>
              <li className="flex items-center gap-3 text-background/70 font-body text-sm">
                <Mail className="h-4 w-4 text-primary" />
                hello@eventify.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center">
          <p className="text-background/50 font-body text-sm">
            © {new Date().getFullYear()} Eventify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
