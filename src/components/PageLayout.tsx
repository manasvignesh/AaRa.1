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
    maxWidth = "2xl"
}: PageLayoutProps) {
    const maxWidthClass = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        full: "max-w-full"
    }[maxWidth];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
            <main className="flex-1 pb-32 overflow-y-auto overflow-x-hidden">
                <div className={cn("mx-auto px-4 pt-10 pb-6", maxWidthClass)}>
                    {header && (
                        <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                            {header}
                        </header>
                    )}
                    <div className={cn("animate-in fade-in slide-in-from-bottom-6 duration-1000", className)}>
                        {children}
                    </div>
                </div>
            </main>
            <Navigation />
        </div>
    );
}

export function SectionHeader({ title, overline, children }: { title: string; overline?: string; children?: React.ReactNode }) {
    return (
        <div className="flex justify-between items-end mb-6 px-1">
            <div className="space-y-1">
                {overline && (
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-80 leading-none">
                        {overline}
                    </p>
                )}
                <h2 className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] leading-none">
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
}
