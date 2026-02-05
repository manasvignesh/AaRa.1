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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel md:static md:block md:w-64 md:h-screen md:border-r md:border-b-0 md:bg-white/95 safe-area-bottom">
      <div className="flex flex-row md:flex-col h-[72px] md:h-full items-center md:items-stretch justify-around md:justify-start md:p-6 md:space-y-8">
        {/* Logo Area - Desktop Only */}
        <div className="hidden md:flex items-center gap-3 mb-8">
          <img src={aaraLogo} alt="AaRa" className="h-14 w-auto" data-testid="img-logo-nav" />
        </div>

        {/* Navigation Links */}
        <div className="flex flex-row md:flex-col w-full px-2 md:px-0">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex flex-col md:flex-row items-center justify-center md:justify-start flex-1 md:flex-none md:gap-3 py-1.5 md:py-3 md:px-4 rounded-xl transition-all duration-200 group",
                isActive
                  ? "text-primary md:bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}>
                <div className="relative">
                  <item.icon className={cn(
                    "w-6 h-6 md:w-5 md:h-5 transition-transform duration-200 group-active:scale-90",
                    isActive && "fill-current"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] md:text-sm font-medium mt-1 md:mt-0 tracking-tight",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
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
          className="hidden md:flex flex-row items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all duration-200 mt-auto"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </nav>
  );
}
