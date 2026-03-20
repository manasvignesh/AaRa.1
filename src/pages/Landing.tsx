import { Link } from "wouter";
import { Activity, ArrowRight, Sparkles, Target, Zap } from "lucide-react";

import aaraLogo from "@/assets/aara-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  const features = [
    {
      title: "Precision Fuel",
      desc: "Adaptive meal systems that align with your metabolic signature.",
      icon: Activity,
      stagger: "stagger-1",
    },
    {
      title: "Smart Training",
      desc: "Workouts that evolve with your performance and recovery.",
      icon: Zap,
      stagger: "stagger-2",
    },
    {
      title: "Goal Precision",
      desc: "Track progress with a calmer, more human wellness dashboard.",
      icon: Target,
      stagger: "stagger-3",
    },
  ];

  return (
    <div className="page-transition min-h-screen flex flex-col overflow-hidden">
      <header className="pt-safe relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-3 animate-slide-up">
          <img src={aaraLogo} alt="AARA" className="h-14 w-auto md:h-16" />
        </div>
        <div className="flex items-center gap-3 animate-slide-up">
          <ThemeToggle />
          <Link href="/auth?tab=login">
            <button className="btn-ghost">Member Login</button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-16 pt-8 md:px-12">
        <section className="animate-slide-up grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <span className="pill-brand">
              <Sparkles className="h-3.5 w-3.5" />
              Intelligent Health Evolution
            </span>
            <div className="space-y-5">
              <h1 className="font-display text-5xl leading-[0.95] md:text-7xl">
                Wellness, redesigned for
                <span className="brand-gradient-text"> clarity and momentum.</span>
              </h1>
              <p
                className="max-w-2xl text-base md:text-lg"
                style={{ color: "var(--text-secondary)" }}
              >
                AARA brings your nutrition, movement, recovery, and guidance into one
                elegant daily flow without changing how the app works underneath.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/auth?tab=register">
                <button className="btn-primary min-w-[220px]">
                  Start Journey
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/auth?tab=login">
                <button className="btn-ghost min-w-[220px]">Open Member Area</button>
              </Link>
            </div>
          </div>

          <div className="wellness-card animate-slide-up p-8 md:p-10">
            <div className="section-label mb-3">Today in AARA</div>
            <h2 className="font-display text-3xl">One calm command center.</h2>
            <p className="mt-3" style={{ color: "var(--text-secondary)" }}>
              Light and dark themes, softer surfaces, richer typography, and
              wellness-first visual hierarchy across meals, workouts, progress,
              profile, and coach screens.
            </p>
            <div className="mt-8 grid gap-4">
              {["Adaptive meals", "Live workout flow", "Progress analytics", "Coach support"].map(
                (item, index) => (
                  <div
                    key={item}
                    className={`metric-card ${["stagger-1", "stagger-2", "stagger-3", "stagger-4"][index]}`}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--text-primary)" }}>{item}</span>
                      <span className="pill-green">Ready</span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="animate-slide-up mt-16 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className={`wellness-card p-6 ${feature.stagger}`}>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-brand">
                <feature.icon className="h-5 w-5" />
              </div>
              <div className="section-label mb-2">Feature</div>
              <h3 className="font-display text-2xl">{feature.title}</h3>
              <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
