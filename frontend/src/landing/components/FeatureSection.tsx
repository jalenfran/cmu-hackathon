const RadarIcon = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
    {/* Radar rings */}
    <circle cx="60" cy="60" r="45" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.3" />
    <circle cx="60" cy="60" r="30" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.4" />
    <circle cx="60" cy="60" r="15" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />
    
    {/* Radar sweep */}
    <path
      d="M60 60 L60 15 A45 45 0 0 1 95 40 Z"
      fill="url(#radarGradient)"
      opacity="0.6"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 60 60"
        to="360 60 60"
        dur="3s"
        repeatCount="indefinite"
      />
    </path>
    
    {/* Center dot */}
    <circle cx="60" cy="60" r="4" fill="hsl(var(--foreground))" />
    
    {/* Pulse waves */}
    <circle cx="60" cy="60" r="20" stroke="hsl(var(--foreground))" strokeWidth="2" opacity="0.3">
      <animate attributeName="r" from="15" to="50" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
    </circle>
    
    {/* Detection points */}
    <circle cx="75" cy="35" r="3" fill="hsl(var(--foreground))" opacity="0.8" />
    <circle cx="40" cy="50" r="2" fill="hsl(var(--foreground))" opacity="0.6" />
    <circle cx="80" cy="70" r="2.5" fill="hsl(var(--foreground))" opacity="0.7" />
    
    <defs>
      <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.4" />
        <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

const BrainIcon = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
    {/* Floating data shards */}
    <rect x="35" y="25" width="20" height="30" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3" transform="rotate(-10 45 40)">
      <animate attributeName="y" values="25;22;25" dur="3s" repeatCount="indefinite" />
    </rect>
    <rect x="55" y="35" width="25" height="35" rx="4" fill="hsl(var(--muted-foreground))" opacity="0.4" transform="rotate(5 67 52)">
      <animate attributeName="y" values="35;32;35" dur="2.5s" repeatCount="indefinite" />
    </rect>
    <rect x="40" y="55" width="18" height="25" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.35" transform="rotate(-5 49 67)">
      <animate attributeName="y" values="55;58;55" dur="2.8s" repeatCount="indefinite" />
    </rect>
    
    {/* Central brain core */}
    <circle cx="60" cy="55" r="18" stroke="hsl(var(--foreground))" strokeWidth="2" opacity="0.6" />
    <circle cx="60" cy="55" r="10" fill="hsl(var(--foreground))" opacity="0.2" />
    
    {/* Neural connections */}
    <path d="M45 45 Q60 35 75 45" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.5" />
    <path d="M42 60 Q60 70 78 60" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.5" />
    
    {/* Glowing center */}
    <circle cx="60" cy="55" r="5" fill="hsl(var(--foreground))">
      <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
    </circle>
    
    {/* Connection nodes */}
    <circle cx="45" cy="45" r="3" fill="hsl(var(--foreground))" opacity="0.7" />
    <circle cx="75" cy="45" r="3" fill="hsl(var(--foreground))" opacity="0.7" />
    <circle cx="42" cy="60" r="2.5" fill="hsl(var(--foreground))" opacity="0.6" />
    <circle cx="78" cy="60" r="2.5" fill="hsl(var(--foreground))" opacity="0.6" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
    {/* Outer shield frame */}
    <path
      d="M60 20 L90 35 L90 65 Q90 90 60 100 Q30 90 30 65 L30 35 Z"
      stroke="hsl(var(--muted-foreground))"
      strokeWidth="2"
      fill="none"
      opacity="0.4"
    />
    
    {/* Inner shield */}
    <path
      d="M60 30 L82 42 L82 62 Q82 82 60 90 Q38 82 38 62 L38 42 Z"
      stroke="hsl(var(--foreground))"
      strokeWidth="1.5"
      fill="hsl(var(--muted-foreground))"
      opacity="0.2"
    />
    
    {/* Checkmark */}
    <path
      d="M48 58 L56 66 L72 50"
      stroke="hsl(var(--foreground))"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.9"
    />
    
    {/* Verified glow */}
    <circle cx="60" cy="58" r="20" fill="hsl(var(--foreground))" opacity="0.05">
      <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.05;0.1;0.05" dur="2s" repeatCount="indefinite" />
    </circle>
    
    {/* Corner accents */}
    <circle cx="60" cy="20" r="2" fill="hsl(var(--foreground))" opacity="0.6" />
    <circle cx="90" cy="35" r="2" fill="hsl(var(--foreground))" opacity="0.6" />
    <circle cx="30" cy="35" r="2" fill="hsl(var(--foreground))" opacity="0.6" />
  </svg>
);

const features = [
  {
    icon: RadarIcon,
    title: "Catch Fraud Instantly",
    description: "ML + streaming detect anomalies as they happen",
  },
  {
    icon: BrainIcon,
    title: "Investigate Automatically",
    description: "AI agents reason through 95% of alerts",
  },
  {
    icon: ShieldIcon,
    title: "Decide with Confidence",
    description: "Human analysts see full context, not noise",
  },
];

const FeatureSection = () => {
  return (
    <section className="relative w-full bg-background px-[6vw] py-24 overflow-hidden">
      {/* Subtle teal gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(200 52% 8% / 0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, hsl(200 40% 12% / 0.3) 0%, transparent 50%)',
        }}
      />
      {/* Header Row */}
      <div className="relative flex flex-col lg:flex-row justify-between items-start gap-8 mb-16">
        {/* Left - Headline */}
        <h2 className="text-foreground text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-xl">
          An <span className="italic font-normal text-muted-foreground">AI fraud platform</span> for real-time defense
        </h2>
        
        {/* Right - Paragraph */}
        <p className="text-muted-foreground text-lg md:text-xl max-w-md leading-relaxed lg:text-right">
          Fraud teams respond in seconds, not hours. Aegis combines streaming anomaly detection, autonomous AI investigation, and human oversight—all in real-time.
        </p>
      </div>

      {/* Cards Row */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative rounded-3xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 transition-all duration-300 hover:border-border hover:bg-card/50"
          >
            {/* Glassmorphism inner glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Icon Container */}
            <div className="relative aspect-square w-full mb-6 rounded-2xl bg-secondary/30 flex items-center justify-center p-8">
              <feature.icon />
            </div>
            
            {/* Text Content */}
            <div className="relative flex items-end justify-between gap-4">
              <div>
                <h3 className="text-foreground text-xl font-semibold mb-1">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
              
              {/* Verified Badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/50 border border-border/50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 2l2.4 3.6L18 4l-1.6 3.6L20 10l-3.6.4L18 14l-3.6-1.6L12 16l-2.4-3.6L6 14l1.6-3.6L4 10l3.6-.4L6 6l3.6 1.6L12 2z"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureSection;
