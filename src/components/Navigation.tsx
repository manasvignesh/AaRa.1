import { Link, useLocation } from "wouter";
import { LayoutGrid, Calendar, Activity, User, Utensils } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel px-6" style={{ height: "calc(64px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-md mx-auto flex items-center justify-between h-[64px]">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");

          return (
            <Link key={item.label} href={item.href}>
              <a
                className={cn(
                  "flex flex-col items-center justify-center px-2 h-full transition-all duration-200 active:scale-95",
                  isActive ? "text-brand" : "",
                )}
                style={!isActive ? { color: "var(--text-muted)" } : undefined}
              >
                <item.icon
                  className={cn(
                    "w-[22px] h-[22px] mb-1 transition-all duration-200",
                    isActive ? "stroke-[2.5px]" : "stroke-[1.5px]",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-tight transition-all",
                    isActive ? "opacity-100 font-semibold" : "opacity-0 h-0 overflow-hidden",
                  )}
                >
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
