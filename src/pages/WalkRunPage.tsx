import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { healthService, ActivityStats } from "@/lib/health";
import { Play, Pause, MapPin, Trophy, Footprints, Flame, Timer, Navigation as NavIcon, Zap, ChevronRight, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { motion } from "framer-motion";

// Clean minimal circular progress
function CircleProgress({ value, max, size = 180, strokeWidth = 12, children }: any) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = Math.min(value, max) / max;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-[#F5F9FF]"
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - percentage * circumference }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#gradient-blue)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                />
                <defs>
                    <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2F80ED" />
                        <stop offset="100%" stopColor="#28B5A0" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {children}
            </div>
        </div>
    );
}

export default function WalkRunPage() {
    const { toast } = useToast();

    // Local state from HealthService (real-time)
    const [stats, setStats] = useState<ActivityStats>({
        steps: 0,
        distance: 0,
        calories: 0,
        activeTime: 0
    });

    const [isGpsActive, setIsGpsActive] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);

    // Server state
    const { data: serverData } = useQuery<{ activity: ActivityStats | null, gamification: any }>({
        queryKey: ["/api/activity/today"],
        refetchInterval: 5000
    });

    const { data: leaderboard } = useQuery<any[]>({
        queryKey: ["/api/leaderboard", "steps"],
    });

    useEffect(() => {
        const unsub = healthService.subscribe((newStats) => {
            setStats(newStats);
        });

        const unsubGps = healthService.subscribeGps((pos) => {
            setCurrentLocation(pos);
        });

        return () => {
            unsub();
            unsubGps();
        };
    }, []);

    const toggleGps = () => {
        if (isGpsActive) {
            healthService.disableGps();
            setIsGpsActive(false);
            toast({ title: "Run Saved", description: "Activity recorded to your timeline." });
        } else {
            healthService.enableGps();
            setIsGpsActive(true);
            toast({ title: "Live Tracking", description: "GPS tracking enabled for your run." });
        }
    };

    const gamification = serverData?.gamification || { xp: 0, level: 1, badges: [] };

    return (
        <div className="page-transition">
            <PageLayout
                header={
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="section-label mb-0.5">Focus</p>
                            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] tracking-tight">Activity</h1>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 bg-[var(--surface-1)] px-3 py-1.5 rounded-full border border-[var(--border)] shadow-sm">
                                <Zap className="w-3.5 h-3.5 text-[#F2994A] fill-current" />
                                <span className="text-[11px] font-bold text-[var(--text-primary)]">LVL {gamification.level}</span>
                            </div>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{gamification.xp} XP</p>
                        </div>
                    </div>
                }
            >
                <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-[var(--surface-1)] p-1 rounded-[20px] h-14 shadow-sm border border-[var(--border)]">
                        <TabsTrigger value="activity" className="rounded-2xl font-bold text-[13px] data-[state=active]:brand-gradient data-[state=active]:text-white text-[var(--text-secondary)] transition-all">Summary</TabsTrigger>
                        <TabsTrigger value="run" className="rounded-2xl font-bold text-[13px] data-[state=active]:brand-gradient data-[state=active]:text-white text-[var(--text-secondary)] transition-all">GPS Run</TabsTrigger>
                        <TabsTrigger value="leaderboard" className="rounded-2xl font-bold text-[13px] data-[state=active]:brand-gradient data-[state=active]:text-white text-[var(--text-secondary)] transition-all">Social</TabsTrigger>
                    </TabsList>

                    {/* ACTIVITY TAB */}
                    <TabsContent value="activity" className="space-y-8 focus-visible:outline-none stagger-1">
                        <section className="wellness-card flex flex-col items-center py-8 bg-[var(--surface-1)] border border-[var(--border)] shadow-[0_4px_20px_rgba(47,128,237,0.05)]">
                            <CircleProgress value={stats.steps} max={10000}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-3 text-brand shadow-inner pointer-events-none">
                                        <Footprints className="w-6 h-6" />
                                    </div>
                                    <span className="font-display text-4xl font-bold text-[var(--text-primary)] tracking-tighter leading-none">{stats.steps.toLocaleString()}</span>
                                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-2">Steps</span>
                                </motion.div>
                            </CircleProgress>

                            <div className="grid grid-cols-3 gap-6 w-full px-6 mt-10">
                                <div className="flex flex-col items-center justify-center gap-1.5">
                                    <Flame className="w-6 h-6 text-[#EB5757] mb-1" />
                                    <span className="font-display text-2xl font-bold text-[var(--text-primary)] leading-none">{Math.floor(stats.calories)}</span>
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Kcal</span>
                                </div>
                                <div className="flex flex-col items-center justify-center gap-1.5 border-x border-[var(--border)] px-4">
                                    <MapPin className="w-6 h-6 text-brand mb-1" />
                                    <span className="font-display text-2xl font-bold text-[var(--text-primary)] leading-none">{(stats.distance / 1000).toFixed(2)}</span>
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Km</span>
                                </div>
                                <div className="flex flex-col items-center justify-center gap-1.5">
                                    <Timer className="w-6 h-6 text-[#27AE60] mb-1" />
                                    <span className="font-display text-2xl font-bold text-[var(--text-primary)] leading-none">{Math.floor(stats.activeTime)}</span>
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Mins</span>
                                </div>
                            </div>
                        </section>
                    </TabsContent>

                    {/* RUN TAB */}
                    <TabsContent value="run" className="space-y-6 focus-visible:outline-none stagger-2">
                        <div className="wellness-card bg-[var(--surface-1)] overflow-hidden flex flex-col shadow-[0_8px_30px_rgba(47,128,237,0.08)] relative min-h-[440px] border border-[var(--border)]">
                            {/* Map Placeholder or Gradient */}
                            <div className="absolute inset-0 bg-[var(--surface-2)]/50 z-0 bg-[radial-gradient(#2F80ED_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
                            {isGpsActive && (
                                <div className="absolute inset-0">
                                    {/* Animated radar effect for authenticity */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-[#2F80ED]/30 rounded-full animate-ping [animation-duration:3s]" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] border border-[#2F80ED]/40 rounded-full animate-ping [animation-duration:3s] [animation-delay:1s]" />
                                </div>
                            )}

                            <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-6 mt-8">
                                {isGpsActive ? (
                                    <>
                                        <div className="w-24 h-24 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-8 shadow-inner relative">
                                            <div className="absolute inset-0 rounded-full bg-[#2F80ED]/20 animate-pulse [animation-duration:2s]" />
                                            <div className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center text-white shadow-lg relative z-10">
                                                <NavIcon className="w-8 h-8 fill-current" />
                                            </div>
                                        </div>
                                        <h3 className="font-display text-5xl font-bold tracking-tighter mb-2 text-[var(--text-primary)] tabular-nums leading-none">{(stats.distance / 1000).toFixed(2)}</h3>
                                        <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-10">kilometers</p>

                                        <div className="grid grid-cols-2 gap-4 w-full">
                                            <div className="bg-[var(--surface-1)]/80 backdrop-blur-md p-5 rounded-[24px] border border-[var(--border)] text-center shadow-sm">
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">Time</p>
                                                <p className="font-display text-3xl font-bold text-[var(--text-primary)] tabular-nums">{Math.floor(stats.activeTime)}:00</p>
                                            </div>
                                            <div className="bg-[var(--surface-1)]/80 backdrop-blur-md p-5 rounded-[24px] border border-[var(--border)] text-center shadow-sm">
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">Pace</p>
                                                <p className="font-display text-3xl font-bold text-[var(--text-primary)] tabular-nums">5:30 <span className="text-[13px] text-[var(--text-muted)] uppercase">/km</span></p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-6 shadow-inner">
                                            <MapPin className="w-10 h-10 text-[var(--text-muted)]" />
                                        </div>
                                        <h3 className="font-display text-2xl font-bold mb-3 text-[var(--text-primary)]">Outdoor Run</h3>
                                        <p className="text-[15px] text-[var(--text-secondary)] max-w-[260px] text-center leading-relaxed font-medium">
                                            Start GPS tracking to map your route and calculate precise distance.
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className="p-6 bg-[var(--surface-1)]/60 backdrop-blur-xl relative z-20">
                                <Button
                                    size="lg"
                                    className={cn(
                                        "w-full h-16 rounded-[24px] text-[15px] font-bold shadow-lg transition-all active:scale-[0.98] border-none tracking-wide",
                                        isGpsActive
                                            ? "bg-[#EB5757] hover:bg-[#EB5757]/90 text-white shadow-[#EB5757]/20"
                                            : "btn-primary shadow-[0_4px_20px_rgba(47,128,237,0.2)]"
                                    )}
                                    onClick={toggleGps}
                                >
                                    {isGpsActive ? (
                                        <>Stop Session <Pause className="w-5 h-5 ml-2 fill-current" /></>
                                    ) : (
                                        <>Start Tracking <Play className="w-5 h-5 ml-2 fill-current" /></>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* LEADERBOARD TAB */}
                    <TabsContent value="leaderboard" className="focus-visible:outline-none stagger-3">
                        <section className="space-y-4">
                            <SectionHeader title="Top Movers" />
                            <div className="wellness-card bg-[var(--surface-1)] border border-[var(--border)] overflow-hidden shadow-sm">
                                <ScrollArea className="h-[500px]">
                                    <div className="p-3 space-y-2">
                                        {leaderboard?.map((user: any, index: number) => (
                                            <div
                                                key={index}
                                                className={cn(
                                                    "flex items-center p-4 rounded-2xl transition-colors",
                                                    index === 0 ? "bg-[var(--surface-2)] border border-[#2F80ED]/10" : "hover:bg-slate-50 border border-transparent"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 flex items-center justify-center font-display font-bold text-lg",
                                                    index === 0 ? "text-brand" : "text-[var(--text-muted)]"
                                                )}>
                                                    #{index + 1}
                                                </div>
                                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm ml-2">
                                                    <AvatarImage src={user.profileImage} className="object-cover" />
                                                    <AvatarFallback className="bg-[var(--surface-2)] font-bold text-xs text-brand">
                                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="ml-4 flex-1">
                                                    <p className="font-bold text-[15px] text-[var(--text-primary)] leading-tight">{user.firstName} {user.lastName}</p>
                                                    <p className="text-[13px] font-medium text-[var(--text-muted)] mt-0.5">{user.value?.toLocaleString()} steps</p>
                                                </div>
                                                {index === 0 && (
                                                    <div className="w-8 h-8 rounded-full bg-[#2F80ED]/10 flex items-center justify-center">
                                                        <Trophy className="w-4 h-4 text-brand" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {(!leaderboard || leaderboard.length === 0) && (
                                            <div className="py-12 text-center px-10">
                                                <p className="text-sm font-bold text-[var(--text-muted)]">No data yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </section>
                    </TabsContent>
                </Tabs>
            </PageLayout>
        </div>
    );
}
