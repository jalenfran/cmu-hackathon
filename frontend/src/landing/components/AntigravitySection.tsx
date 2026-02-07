import { lazy, Suspense, useRef, useEffect } from "react";
import { Separator } from "../ui/separator";
import AIConsole from "./globe/AIConsole";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const GlobeCanvas = lazy(() => import("./globe/GlobeCanvas"));

const AntigravitySection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const globeGlowRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
          pin: stickyContainerRef.current,
          anticipatePin: 1,
        }
      });

      // Left column slides out to the left with fade
      tl.to(leftColumnRef.current, {
        x: "-150%",
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut"
      }, 0);

      // AI Console fades out
      tl.to(consoleRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.out"
      }, 0);

      // Globe expands and moves to true center of screen
      tl.to(globeContainerRef.current, {
        scale: 1.35,
        x: "-22vw",
        duration: 0.4,
        ease: "power2.inOut"
      }, 0.05);

      // Globe glow effect pulses in smoothly
      tl.fromTo(globeGlowRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 0.8, scale: 1, duration: 0.3, ease: "power2.out" },
        0.15
      );

      // Overlay text fades in
      tl.fromTo(overlayRef.current, 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
        0.25
      );

      // Scroll indicator fades in
      tl.fromTo(scrollIndicatorRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: "power2.out" },
        0.3
      );

      // Hold the centered state briefly (0.35 to 0.55)
      
      // Start fade out of overlay text
      tl.to(overlayRef.current, {
        opacity: 0,
        duration: 0.15,
        ease: "power2.in"
      }, 0.55);

      tl.to(scrollIndicatorRef.current, {
        opacity: 0,
        duration: 0.1,
        ease: "power2.in"
      }, 0.55);

      // Fade out the entire globe section
      tl.to(globeGlowRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in"
      }, 0.65);

      tl.to(globeContainerRef.current, {
        opacity: 0,
        scale: 1.6,
        duration: 0.25,
        ease: "power2.in"
      }, 0.7);

      // Fade out the entire sticky container
      tl.to(stickyContainerRef.current, {
        opacity: 0,
        duration: 0.1,
        ease: "power2.in"
      }, 0.9);

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full min-h-[300vh] bg-background"
    >
      {/* Sticky container */}
      <div ref={stickyContainerRef} className="sticky top-0 h-screen w-full">
        {/* Background gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(15, 32, 39, 0.6) 0%, rgba(5, 5, 5, 1) 50%)',
          }}
        />
        
        <div className="relative h-full w-full px-[6vw] py-24">
          {/* Flex layout: 30% left, 70% right */}
          <div className="flex h-full gap-8 overflow-visible">
            {/* Left Column - Typography & Content (30%) */}
            <div 
              ref={leftColumnRef}
              className="w-[30%] flex-shrink-0 flex flex-col justify-center space-y-8 will-change-transform"
            >
              <span className="text-muted-foreground text-sm uppercase tracking-[4px] font-medium">
                Fraud Team
              </span>
              
              <h2 className="text-foreground text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1]">
                Self-serve fraud detection,{" "}
                <span className="italic font-normal text-muted-foreground">
                  like never before.
                </span>
              </h2>
              
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-lg">
                Your fraud analysts deserve tools that work as fast as they think.
                Aegis puts investigation, detection, and response in one unified
                interface—no tickets, no waiting.
              </p>
              
              <Separator className="bg-border/50 my-4" />
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-foreground text-xl font-semibold">
                    Investigations without tickets
                  </h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Query any data point instantly. Trace connections across
                    accounts, devices, and behaviors without filing a single
                    request to engineering.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-foreground text-xl font-semibold">
                    Adaptive Intelligence
                  </h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    ML models that learn from your decisions. Every resolved case
                    makes the next detection smarter, reducing false positives by
                    40% within weeks.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right Column - 3D Globe (70%) */}
            <div 
              ref={globeContainerRef}
              className="flex-1 relative flex items-center justify-center will-change-transform origin-center overflow-visible"
              style={{ marginRight: '-6vw' }} /* Extend to edge */
            >
              {/* Pulsing glow effect - visible when expanded */}
              <div 
                ref={globeGlowRef}
                className="absolute inset-[-30%] rounded-full opacity-0 pointer-events-none animate-pulse"
                style={{
                  background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.08) 30%, rgba(2, 132, 199, 0.03) 50%, transparent 70%)',
                  filter: 'blur(40px)',
                }}
              />
              
              {/* Gradient background */}
              <div 
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(15, 32, 39, 0.8) 0%, rgba(32, 58, 67, 0.4) 40%, transparent 70%)',
                }}
              />
              <div className="absolute inset-[-10%] overflow-visible">
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                    </div>
                  }
                >
                  <GlobeCanvas />
                </Suspense>
                
                {/* AI Console Overlay */}
                <div ref={consoleRef} className="will-change-transform">
                  <AIConsole />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Centered overlay text - with more right padding */}
        <div 
          ref={overlayRef}
          className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-20 px-16 md:px-24 opacity-0"
        >
          <h2 className="text-foreground text-4xl md:text-6xl lg:text-8xl font-bold leading-tight mb-6">
            Global Protection,
            <br />
            <span className="text-muted-foreground italic font-normal">
              Real-Time Response
            </span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl lg:text-2xl max-w-2xl">
            Monitoring threats across every timezone, every transaction, every second.
          </p>
        </div>
        
        {/* Scroll indicator */}
        <div 
          ref={scrollIndicatorRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 opacity-0"
        >
          <div className="w-6 h-10 border border-muted-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AntigravitySection;
