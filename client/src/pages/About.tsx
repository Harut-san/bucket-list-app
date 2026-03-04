import { Link } from "wouter";

export default function About() {
  return (
    <div className="py-4">
      {/* Header */}
      <div className="mb-8">
        <h2 className="page-heading text-3xl font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
          [ABOUT_BUCKET_LIST]
        </h2>
        <div className="pencil-line" />
      </div>

      {/* Main content */}
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
            How it works
          </h3>
          <div className="space-y-3">
            {[
              { icon: "1.", text: "Create your account and start adding goals to your personal bucket list." },
              { icon: "2.", text: "Organize your goals by dragging and dropping them into the order that feels right." },
              { icon: "3.", text: "Mark goals as achieved with the checkbox when you complete them." },
              { icon: "4.", text: "Track your progress and see how you rank on the leaderboard." },
              { icon: "5.", text: "Discover New Goals added by other users and browse them page by page." },
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

        {/* CTA */}
        <div className="sketch-border-dashed p-6 text-center">
          <p className="text-2xl font-bold mb-4" style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>
            Ready to start sketching your dreams?
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/signup">
              <button className="sketch-button px-6 py-2 bg-foreground text-background">
                Get started for free →
              </button>
            </a>
            <Link href="/">
              <button className="sketch-button px-6 py-2 bg-background">
                View leaderboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
