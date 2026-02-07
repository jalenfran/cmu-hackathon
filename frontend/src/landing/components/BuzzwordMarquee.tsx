import { useEffect, useRef } from "react";

const buzzwords = [
  "AI Agents",
  "Data Governance",
  "Machine Learning",
  "Data Privacy",
  "Compliance",
  "Data Quality",
  "Automation",
  "Data Lineage",
  "Metadata Management",
  "Data Catalog",
  "Access Control",
  "Data Security",
  "Policy Enforcement",
  "Data Stewardship",
  "Real-time Analytics",
  "Data Integration",
  "Master Data",
  "Data Observability",
];

const BuzzwordMarquee = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;
    const speed = 0.5;

    const animate = () => {
      scrollPosition += speed;
      
      // Reset position when first set scrolls out of view
      const firstChild = scrollContainer.firstElementChild as HTMLElement;
      if (firstChild && scrollPosition >= firstChild.offsetWidth + 48) {
        scrollPosition = 0;
        scrollContainer.appendChild(firstChild);
      }
      
      scrollContainer.style.transform = `translateX(-${scrollPosition}px)`;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Duplicate buzzwords for seamless loop
  const allBuzzwords = [...buzzwords, ...buzzwords];

  return (
    <div className="w-full overflow-hidden bg-background py-16 border-t border-border/30">
      <div
        ref={scrollRef}
        className="flex gap-12 whitespace-nowrap"
        style={{ willChange: "transform" }}
      >
        {allBuzzwords.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="text-muted-foreground text-2xl md:text-4xl font-semibold uppercase tracking-wider hover:text-foreground transition-colors duration-300"
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BuzzwordMarquee;
