import { Navigation } from "./Navigation";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function PageLayout({
  children,
  className,
  header,
  maxWidth = "md",
}: PageLayoutProps) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  }[maxWidth];

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden font-sans"
      style={{ backgroundColor: "var(--surface-base)", color: "var(--text-primary)" }}
    >
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          paddingTop: "max(48px, env(safe-area-inset-top))",
          paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className={cn("mx-auto px-5", maxWidthClass)}>
          {header && <header className="mb-[24px] animate-slide-up">{header}</header>}
          <div className={cn("animate-slide-up space-y-[24px]", className)}>{children}</div>
        </div>
      </main>
      <Navigation />
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center mb-[12px] px-1">
      <h2 className="text-[16px] font-display font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {action}
        {children}
      </div>
    </div>
  );
}
