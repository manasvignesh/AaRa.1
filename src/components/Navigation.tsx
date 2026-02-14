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
  Lock
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
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/meals", label: "Meals", icon: Utensils },
    { href: "/workouts", label: "Workouts", icon: Dumbbell },
    { href: "/progress", label: "Progress", icon: TrendingUp },
    { href: "/coach", label: "Coach", icon: MessageCircle, isLocked: true },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel md:static md:block md:w-64 md:h-screen md:border-r md:border-b-0 md:bg-card/95 safe-area-bottom shadow-[0_-1px_0_0_rgba(0,0,0,0.05)]">
      <div className="flex flex-row md:flex-col h-[64px] md:h-full items-center md:items-stretch justify-around md:justify-start md:p-6 md:space-y-4">
        {/* Logo Area - Desktop Only */}
        <div className="hidden md:flex items-center gap-3 mb-8">
          <img src={aaraLogo} alt="AaRa" className="h-14 w-auto drop-shadow-sm" data-testid="img-logo-nav" />
        </div>

        {/* Navigation Links */}
        <div className="flex flex-row md:flex-col w-full px-2 md:px-0 justify-around md:justify-start h-full md:h-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            const isLocked = (item as any).isLocked;

            const handleClick = (e: React.MouseEvent) => {
              if (isLocked) {
                e.preventDefault();
                toast({
                  title: "Premium Feature",
                  description: "Chat Coaching is coming soon for Premium members! 🔒",
                  variant: "default",
                });
              }
            };

            return (
              <Link key={item.href} href={item.href} onClick={handleClick}>
                <a className={cn(
                  "flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:gap-3 py-1 md:py-3 md:px-4 rounded-xl transition-all duration-300 group relative",
                  isActive
                    ? "text-primary md:bg-primary/5"
                    : "text-muted-foreground hover:text-foreground",
                  isLocked && "opacity-50 grayscale-[0.5]"
                )}>
                  <div className="relative">
                    <item.icon className={cn(
                      "w-[24px] h-[24px] md:w-5 md:h-5 transition-all duration-300 group-active:scale-90",
                      isActive ? "fill-current" : "stroke-[1.5px]"
                    )} />
                    {isLocked && (
                      <div className="absolute -top-1.5 -right-1.5 bg-white/90 backdrop-blur-sm rounded-full p-0.5 shadow-sm border border-border/50">
                        <Lock className="w-2.5 h-2.5 text-amber-500 fill-current" />
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] md:text-sm font-medium mt-0.5 md:mt-0 tracking-tight transition-colors",
                    isActive ? "text-primary font-bold" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>

                  {/* Subtle active indicator for mobile */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary md:hidden"
                    />
                  )}
                </a>
              </Link>
            );
          })}
        </div>

        {/* Logout - Desktop Only */}
        <button
          onClick={() => logout()}
          className="hidden md:flex flex-row items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all duration-200 mt-auto"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </nav>
  );
}
