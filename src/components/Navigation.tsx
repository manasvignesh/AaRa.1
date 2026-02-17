import { Link, useLocation } from "wouter";
import {
  LayoutGrid,
  Calendar,
  Activity,
  User,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutGrid },
    { href: "/meals", label: "Meals", icon: Utensils },
    { href: "/workouts", label: "Workouts", icon: Calendar },
    { href: "/progress", label: "Track", icon: Activity },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 pb-safe pt-2 px-6 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");

          return (
            <Link key={item.label} href={item.href}>
              <a
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 active:scale-95",
                  isActive ? "text-primary" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <item.icon
                  className={cn(
                    "w-6 h-6 mb-1 transition-all duration-200",
                    isActive ? "stroke-[2.5px] fill-primary/10" : "stroke-[1.5px]"
                  )}
                />
                <span className={cn(
                  "text-[10px] font-medium tracking-tight transition-all",
                  isActive ? "opacity-100 font-semibold" : "opacity-0 h-0 overflow-hidden"
                )}>
                  {item.label}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
