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
    maxWidth = "md"
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
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
            <main className="flex-1 pb-24 overflow-y-auto overflow-x-hidden">
                <div className={cn("mx-auto px-5 pt-8 pb-6", maxWidthClass)}>
                    {header && (
                        <header className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
                            {header}
                        </header>
                    )}
                    <div className={cn("animate-in fade-in duration-500", className)}>
                        {children}
                    </div>
                </div>
            </main>
            <Navigation />
        </div>
    );
}

export function SectionHeader({ title, action, children }: { title: string; action?: React.ReactNode; children?: React.ReactNode }) {
    return (
        <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                {title}
            </h2>
            <div className="flex items-center gap-2">
                {action}
                {children}
            </div>
        </div>
    );
}
