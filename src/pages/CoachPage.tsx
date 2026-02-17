import { Navigation } from "@/components/Navigation";
import { useUserProfile } from "@/hooks/use-user";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CoachPage() {
    const { data: user, isLoading: userLoading } = useUserProfile();

    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background overflow-hidden relative selection:bg-primary/20">
            <main className="flex-1 flex flex-col items-center justify-center relative p-6">
                {/* Premium Lock Overlay */}
                <div className="w-full max-w-sm wellness-card p-10 flex flex-col items-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] -z-10 group-hover:scale-110 transition-transform">
                        <Lock className="w-48 h-48" />
                    </div>

                    <div className="w-20 h-20 rounded-[28px] brand-gradient flex items-center justify-center text-white mb-8 shadow-xl shadow-brand-blue/20">
                        <Lock className="w-10 h-10" />
                    </div>

                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-3">Locked Component</p>
                    <h2 className="text-3xl font-black tracking-tighter text-foreground mb-4 uppercase">Neural Link</h2>

                    <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-10 opacity-60">
                        The AARA Intelligence Engine is currently undergoing biometric calibration. Premium synchronization will be available in the next lifecycle update.
                    </p>

                    <Button
                        size="lg"
                        className="w-full brand-gradient text-white rounded-full h-16 text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-blue/30 active:scale-95 transition-all"
                        onClick={() => window.history.back()}
                    >
                        Return to Console
                    </Button>

                    <p className="mt-8 text-[9px] font-black text-primary/40 uppercase tracking-[0.3em]">Estimated Release: Q1 2026</p>
                </div>
            </main>
            <Navigation />
        </div>
    );
}
