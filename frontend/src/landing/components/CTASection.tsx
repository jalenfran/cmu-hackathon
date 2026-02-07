import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { ArrowRight, Shield, Zap, Lock } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CTASection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaMainRef = useRef<HTMLDivElement>(null);

  const stats = [
    { value: "99.9%", label: "Uptime SLA" },
    { value: "<50ms", label: "Response Time" },
    { value: "10B+", label: "Events Processed" },
    { value: "500+", label: "Enterprise Clients" },
  ];

  const features = [
    { icon: Shield, text: "Enterprise-grade security" },
    { icon: Zap, text: "Real-time threat detection" },
    { icon: Lock, text: "End-to-end encryption" },
  ];

  useEffect(() => {
    if (!sectionRef.current || !statsRef.current || !ctaMainRef.current) return;

    const statItems = statsRef.current.querySelectorAll('.stat-item');
    
    const ctx = gsap.context(() => {
      // Stats emerge from darkness with scale
      gsap.fromTo(statItems,
        { 
          opacity: 0,
          scale: 0.8,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "top 30%",
            scrub: 1,
          }
        }
      );

      // Main content fades in from darkness
      gsap.fromTo(ctaMainRef.current,
        { 
          opacity: 0,
          scale: 0.95,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 50%",
            end: "top 20%",
            scrub: 1,
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full py-32 md:py-48 bg-background overflow-hidden">
      {/* Background gradient effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 50%)',
        }}
      />
      
      {/* Animated grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="relative px-[6vw]">
        {/* Stats row */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="stat-item text-center"
            >
              <div className="text-foreground text-4xl md:text-5xl lg:text-6xl font-bold mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground text-sm uppercase tracking-[3px]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Main CTA content */}
        <div ref={ctaMainRef} className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-muted-foreground text-sm uppercase tracking-[4px] mb-6">
            Ready to secure your future?
          </span>
          
          <h2 className="text-foreground text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8">
            Stop fraud before it starts.{" "}
            <span className="text-muted-foreground italic font-normal">
              Start today.
            </span>
          </h2>
          
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-12 max-w-2xl mx-auto">
            Join hundreds of enterprises that trust Aegis to protect their business. 
            Get started in minutes with our seamless integration.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="group px-8 py-6 text-lg bg-foreground text-background hover:bg-foreground/90"
              onClick={() => navigate("/demo")}
            >
              Try the Demo
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg border-border/50 hover:border-foreground/50"
              onClick={() => navigate("/demo")}
            >
              Schedule Demo
            </Button>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-6">
            {features.map((feature) => (
              <div 
                key={feature.text}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <feature.icon className="h-4 w-4" />
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient transition to footer */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(15, 32, 39, 0.2) 100%)',
        }}
      />
    </section>
  );
};

export default CTASection;
