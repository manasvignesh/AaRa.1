import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Home,
  Utensils,
  Dumbbell,
  MessageCircle,
  User,
  LogOut,
  TrendingUp,
  Lock,
  Compass,
  Zap,
  LayoutGrid
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import aaraLogo from "@/assets/aara-logo.png";

export function Navigation() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutGrid },
    { href: "/meals", label: "Fuel", icon: Utensils },
    { href: "/workouts", label: "Train", icon: Dumbbell },
    { href: "/progress", label: "Stats", icon: TrendingUp },
    { href: "/coach", label: "AARA AI", icon: Zap, isLocked: true },
    { href: "/profile", label: "You", icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-72 h-screen bg-card border-r border-border/40 p-10 fixed left-0 top-0 overflow-y-auto selection:bg-primary/10">
        <div className="mb-14">
          <img src={aaraLogo} alt="AaRa" className="h-16 w-auto" />
          <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mt-3">Vitality OS v1.0</p>
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-4 opacity-40">Console</p>
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            const isLocked = item.isLocked;

            return (
              <Link key={item.href} href={isLocked ? "#" : item.href}>
                <a
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    isLocked && "opacity-40"
                  )}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      toast({
                        title: "Restricted Access",
                        description: "AARA AI Coaching is reserved for elite subscribers. 💎",
                      });
                    }
                  }}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                  )} />
                  <span className={cn(
                    "text-[13px] uppercase tracking-widest font-black transition-colors",
                    isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-full"
                    />
                  )}
                  {isLocked && <Lock className="w-3.5 h-3.5 ml-auto opacity-40" />}
                </a>
              </Link>
            );
          })}
        </div>

        <div className="pt-10 border-t border-border/5">
          <button
            onClick={() => logout()}
            className="flex items-center gap-4 px-5 py-4 w-full rounded-[20px] text-muted-foreground/40 hover:text-red-500 hover:bg-red-50/50 transition-all group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Terminate Session</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - High Fidelity Glass Pill */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm">
        <div className="bg-card/70 backdrop-blur-3xl border border-white/40 shadow-2xl rounded-[32px] p-2 flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            const isLocked = item.isLocked;

            return (
              <Link key={item.href} href={isLocked ? "#" : item.href}>
                <a
                  className={cn(
                    "relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all group",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground/60"
                  )}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      toast({ title: "Premium Access Required" });
                    }
                  }}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-all",
                    isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                  )} />
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-mobile"
                      className="absolute -bottom-1.5 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]"
                    />
                  )}
                  {isLocked && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 border-2 border-card" />}
                </a>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Placeholder to prevent layout shift on desktop */}
      <div className="hidden md:block w-72 h-screen shrink-0" />
    </>
  );
}
