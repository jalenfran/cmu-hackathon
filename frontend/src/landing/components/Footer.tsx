import { motion } from "framer-motion";
import { Separator } from "../ui/separator";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    product: [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Security", href: "#" },
      { label: "Integrations", href: "#" },
    ],
    company: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Press", href: "#" },
    ],
    resources: [
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Status", href: "#" },
      { label: "Support", href: "#" },
    ],
    legal: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  };

  return (
    <footer className="relative w-full bg-background border-t border-border/30">
      {/* Gradient overlay at top */}
      <div 
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(15, 32, 39, 0.3) 0%, transparent 100%)',
        }}
      />
      
      <div className="relative px-[6vw] py-16 md:py-24">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-16">
          {/* Brand column */}
          <motion.div 
            className="col-span-2 md:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-foreground text-2xl font-bold uppercase tracking-[2px] mb-4">
              Aegis
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              AI-powered fraud detection for the modern enterprise. Protect your business in real-time.
            </p>
            {/* Social links */}
            <div className="flex gap-4">
              {["X", "LinkedIn", "GitHub"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
                >
                  <span className="text-xs font-medium">{social[0]}</span>
                </a>
              ))}
            </div>
          </motion.div>
          
          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div 
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
            >
              <h4 className="text-foreground text-sm font-semibold uppercase tracking-[2px] mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        
        <Separator className="bg-border/30 mb-8" />
        
        {/* Bottom bar */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-muted-foreground text-sm">
            © {currentYear} Aegis Technologies. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <span className="text-muted-foreground/50 text-xs uppercase tracking-[2px]">
              SOC 2 Type II Certified
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-muted-foreground/50 text-xs uppercase tracking-[2px]">
              GDPR Compliant
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-muted-foreground/50 text-xs uppercase tracking-[2px]">
              ISO 27001
            </span>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative bottom line */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
    </footer>
  );
};

export default Footer;
