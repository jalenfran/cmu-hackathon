import { useEffect } from "react";
import "./styles/landing.css";
import PixelMosaic from "./components/PixelMosaic";
import BuzzwordMarquee from "./components/BuzzwordMarquee";
import FeatureSection from "./components/FeatureSection";
import AntigravitySection from "./components/AntigravitySection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

const LandingPage = () => {
  // Landing page needs normal document scrolling for GSAP ScrollTrigger.
  // Dashboard sets overflow:hidden on body — toggle it here.
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="landing-scope flex flex-col min-h-screen overflow-x-hidden bg-background">
      {/* Hero Section */}
      <div className="flex h-screen w-full flex-shrink-0">
        {/* Left Panel - Text (35%) */}
        <div className="w-[35%] flex flex-col justify-center pl-[6vw] z-10 relative">
          <h1 className="text-foreground text-[8vw] m-0 leading-[0.9] uppercase tracking-[2px] font-bold">
            Aegis
          </h1>
          <h2 className="text-muted-foreground text-[1.5vw] mt-4 ml-[5px] font-normal uppercase tracking-[4px]">
            Data Governance
          </h2>
        </div>

        {/* Right Panel - Mosaic (65%) */}
        <PixelMosaic />
      </div>

      {/* Buzzword Marquee Section */}
      <BuzzwordMarquee />

      {/* Feature Section */}
      <FeatureSection />

      {/* Antigravity Section - Globe with scroll-triggered expansion */}
      <AntigravitySection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
