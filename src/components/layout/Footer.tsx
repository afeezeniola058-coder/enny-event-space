import { Link } from "react-router-dom";
import { Sparkles, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="font-display text-2xl font-bold">Eventify</span>
            </Link>
            <p className="text-background/70 font-body text-sm leading-relaxed">
              Creating unforgettable moments with elegance and precision. Your dream event, our expertise.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {["Venues", "Catering", "Decorations", "Budget Tool"].map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase().replace(" ", "-")}`}
                    className="text-background/70 hover:text-primary transition-colors font-body text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Our Services</h4>
            <ul className="space-y-3">
              {["Wedding Planning", "Corporate Events", "Birthday Parties", "Anniversary Celebrations"].map((item) => (
                <li key={item}>
                  <span className="text-background/70 font-body text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

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
                +234 800 123 4567
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
