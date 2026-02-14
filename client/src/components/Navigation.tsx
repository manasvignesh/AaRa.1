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
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import aaraLogo from "@/assets/aara-logo.png";

export function Navigation() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/meals", label: "Meals", icon: Utensils },
    { href: "/workouts", label: "Workouts", icon: Dumbbell },
    { href: "/progress", label: "Progress", icon: TrendingUp },
    { href: "/coach", label: "Coach", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card md:static md:block md:w-64 md:h-screen md:border-r md:border-white/5 safe-area-bottom">
      <div className="flex flex-row md:flex-col h-[72px] md:h-full items-center md:items-stretch justify-around md:justify-start md:p-6 md:space-y-4">
        {/* Logo Area - Desktop Only */}
        <div className="hidden md:flex items-center gap-3 mb-8 px-4">
          <img src={aaraLogo} alt="AaRa" className="h-10 w-auto brightness-110 drop-shadow-[0_0_10px_rgba(142,214,63,0.3)]" data-testid="img-logo-nav" />
          <span className="text-xl font-display font-bold tracking-wider text-primary">AARA</span>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-row md:flex-col w-full px-2 md:px-0 gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:gap-3 py-1.5 md:py-3 md:px-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                isActive
                  ? "text-primary bg-primary/10 neon-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}>
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-primary/5 z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10">
                  <item.icon className={cn(
                    "w-6 h-6 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110 group-active:scale-90",
                    isActive && "text-primary drop-shadow-[0_0_8px_rgba(142,214,63,0.5)]"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] md:text-sm font-display font-medium mt-1 md:mt-0 tracking-tight relative z-10 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Logout - Desktop Only */}
        <button
          onClick={() => logout()}
          className="hidden md:flex flex-row items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 mt-auto border border-transparent hover:border-destructive/20"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-display font-medium">Log Out</span>
        </button>
      </div>
    </nav>
  );
}
