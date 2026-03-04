import { Link } from "wouter";

export default function AppAbout() {
  return (
    <div className="py-4">
      <div className="mb-8">
        <h2 className="page-heading text-3xl font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
          [ABOUT_BUCKET_LIST]
        </h2>
        <div className="pencil-line" />
      </div>

      <div className="space-y-6">
        <div className="sketch-border p-5 bg-background/60">
          <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            What is this?
          </h3>
          <p className="text-sm leading-relaxed" style={{ fontFamily: "'Courier Prime', monospace" }}>
            Bucket List is your personal space to capture the experiences, adventures, and dreams
            you want to accomplish in this lifetime. Think of it as a living document — a sketch
            of the life you're designing, one goal at a time.
          </p>
        </div>

        <div className="sketch-border p-5 bg-background/60">
          <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            Tips & tricks
          </h3>
          <div className="space-y-3">
            {[
              { icon: "⠿", text: "Drag the grip handle on the left to reorder your goals by priority." },
              { icon: "☑", text: "Click the checkbox to toggle a goal as achieved — it will show with a strikethrough." },
              { icon: "◈", text: "Keep your profile public to appear on the leaderboard and inspire others." },
              { icon: "◈", text: "Add descriptions to your goals to capture the 'why' behind each dream." },
              { icon: "⊕", text: "Browse New Goals to discover goals added by other users with pagination." },
            ].map((step) => (
              <div key={step.icon} className="flex gap-3 items-start">
                <span
                  className="flex-shrink-0 font-bold text-lg"
                  style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em", color: "oklch(0.78 0.14 75)" }}
                >
                  {step.icon}
                </span>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "'Courier Prime', monospace" }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="sketch-border-dashed p-5 text-center">
          <p className="text-xl font-bold mb-3" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            Ready to add more goals?
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/app">
              <button className="sketch-button px-5 py-2 bg-foreground text-background">
                My bucket list →
              </button>
            </Link>
            <Link href="/app/new-goals">
              <button className="sketch-button px-5 py-2 bg-background">
                Discover goals
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
