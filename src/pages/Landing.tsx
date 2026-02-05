import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Heart, Activity } from "lucide-react";
import { motion } from "framer-motion";
import aaraLogo from "@/assets/aara-logo.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative py-6 px-4 md:px-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center">
          <img src={aaraLogo} alt="AaRa" className="h-20 md:h-24 w-auto" data-testid="img-logo-header" />
        </div>
        <Link href="/auth?tab=login">
          <Button variant="outline" className="rounded-full px-6 bg-white/80 backdrop-blur-sm border-sky-200 hover:bg-white hover:border-sky-300 text-sky-700" data-testid="button-login">
            Log In
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="relative flex-1 flex items-center justify-center px-4 md:px-8 py-12 md:py-20">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          {/* Large centered logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center mb-6"
          >
            <img
              src={aaraLogo}
              alt="AaRa Wellness Fitness App"
              className="h-40 md:h-56 w-auto drop-shadow-lg"
              data-testid="img-logo-hero"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-5"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-100 to-teal-100 dark:from-sky-900/50 dark:to-teal-900/50 text-sky-700 dark:text-sky-300 text-sm font-medium border border-sky-200/50">
              <ShieldCheck className="w-4 h-4" />
              <span>Science-backed Safety Protocols</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-slate-800 dark:text-white leading-tight">
              Your Personal <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500">
                Wellness Journey
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              No crash diets. No extreme measures. Just an intelligent, adaptive plan designed for your body, your lifestyle, and your goals.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth?tab=register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full text-lg px-10 py-7 h-auto bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 hover:from-sky-600 hover:via-cyan-600 hover:to-teal-600 shadow-xl shadow-cyan-500/25 hover:shadow-2xl hover:shadow-cyan-500/30 hover:-translate-y-1 transition-all border-0"
                data-testid="button-start-journey"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid md:grid-cols-3 gap-6 mt-16 text-left"
          >
            {[
              {
                title: "Safe & Sustainable",
                desc: "We prioritize your metabolic health. No starvation, just smart nutrition.",
                icon: Heart,
                gradient: "from-rose-400 to-pink-500"
              },
              {
                title: "Personalized Plans",
                desc: "Adaptive meal and workout plans that fit your lifestyle and preferences.",
                icon: Sparkles,
                gradient: "from-sky-400 to-cyan-500"
              },
              {
                title: "Real-time Coaching",
                desc: "Smart adjustments based on your daily progress and feedback.",
                icon: Activity,
                gradient: "from-teal-400 to-emerald-500"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + idx * 0.1 }}
                className="p-6 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer accent */}
      <div className="relative h-2 bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400" />
    </div>
  );
}
