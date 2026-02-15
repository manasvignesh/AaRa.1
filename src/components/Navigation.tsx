import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutGrid,
  Calendar,
  Activity,
  User,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function Navigation() {
  const [location] = useLocation();
  const [showCoachLocked, setShowCoachLocked] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutGrid },
    { href: "/meals", label: "Meals", icon: Utensils },
    { href: "/workouts", label: "Workouts", icon: Calendar },
    { href: "/progress", label: "Track", icon: Activity },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 md:pb-8 pt-2">
      <div className="max-w-md mx-auto bg-white/60 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[32px] p-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");

          return (
            <div key={item.label} className="relative">
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 relative group",
                    isActive ? "text-primary" : "text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  <div className="relative">
                    <item.icon className={cn(
                      "w-6 h-6 mb-1 transition-transform",
                      isActive ? "scale-110 stroke-[2.5px]" : "scale-100 stroke-[1.5px]"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 bg-primary/10 rounded-2xl -z-10"
                    />
                  )}
                </a>
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
