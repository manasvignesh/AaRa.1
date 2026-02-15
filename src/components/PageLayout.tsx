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
        <div className="flex flex-col md:flex-row min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 pb-32 md:pb-8 overflow-y-auto">
                <div className={cn("mx-auto px-6 pt-10 pb-6 md:pt-16 md:px-12", maxWidthClass)}>
                    {header && (
                        <header className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                            {header}
                        </header>
                    )}
                    <div className={cn("animate-in fade-in slide-in-from-bottom-4 duration-1000", className)}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

export function SectionHeader({ title, overline, children }: { title: string; overline?: string; children?: React.ReactNode }) {
    return (
        <div className="flex justify-between items-end mb-6">
            <div className="space-y-1">
                {overline && (
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80 leading-none">
                        {overline}
                    </p>
                )}
                <h2 className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] leading-none">
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
}
