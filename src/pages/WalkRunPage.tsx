import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { healthService, ActivityStats } from "@/lib/health";
import { Play, Pause, MapPin, Trophy, Footprints, Flame, Timer, Navigation as NavIcon, Target, ChevronRight, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { motion, AnimatePresence } from "framer-motion";

// Helper for Circular Progress (Premium Version)
function CircleProgress({ value, max, size = 220, strokeWidth = 18, children, className }: any) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = Math.min(value, max) / max;
    const offset = circumference - percentage * circumference;

    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90 drop-shadow-sm">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-primary/5"
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000 ease-in-out"
                />
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

    // Server state (Persisted & Gamification)
    const { data: serverData } = useQuery<{ activity: ActivityStats | null, gamification: any }>({
        queryKey: ["/api/activity/today"],
        refetchInterval: 5000 // Poll every 5s for gamification sync
    });

    const { data: leaderboard } = useQuery<any[]>({
        queryKey: ["/api/leaderboard", "steps"],
    });

    // Subscribe to Health Service
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
    const badges = gamification.badges || [];

    return (
        <PageLayout
            header={
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[13px] font-semibold text-primary uppercase tracking-wider mb-1">Active Living</p>
                        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Step Tracker</h1>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/10">
                            <Zap className="w-3.5 h-3.5 text-primary fill-current" />
                            <span className="text-sm font-black text-primary uppercase tracking-tighter">LVL {gamification.level}</span>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{gamification.xp} XP</p>
                    </div>
                </div>
            }
        >
            <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-secondary/30 p-1.5 rounded-[20px] h-14">
                    <TabsTrigger value="activity" className="rounded-2xl font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">Summary</TabsTrigger>
                    <TabsTrigger value="run" className="rounded-2xl font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">Live Track</TabsTrigger>
                    <TabsTrigger value="leaderboard" className="rounded-2xl font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">Social</TabsTrigger>
                </TabsList>

                {/* ACTIVITY TAB */}
                <TabsContent value="activity" className="space-y-10 focus-visible:outline-none">
                    <section className="flex flex-col items-center">
                        <CircleProgress value={stats.steps} max={10000} className="mb-10 group">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                                    <Footprints className="w-7 h-7" />
                                </div>
                                <span className="text-5xl font-black tabular-nums tracking-tighter">{stats.steps.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Steps Today</span>
                            </motion.div>
                        </CircleProgress>

                        <div className="grid grid-cols-3 gap-4 w-full">
                            <div className="wellness-card p-4 flex flex-col items-center justify-center bg-card shadow-sm group hover:border-orange-200 transition-colors">
                                <Flame className="w-5 h-5 text-orange-500 mb-2 group-hover:animate-bounce" />
                                <span className="text-xl font-black tabular-nums tracking-tight">{Math.floor(stats.calories)}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Calories</span>
                            </div>
                            <div className="wellness-card p-4 flex flex-col items-center justify-center bg-card shadow-sm group hover:border-blue-200 transition-colors">
                                <MapPin className="w-5 h-5 text-blue-500 mb-2 group-hover:animate-bounce" />
                                <span className="text-xl font-black tabular-nums tracking-tight">{(stats.distance / 1000).toFixed(2)}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Km</span>
                            </div>
                            <div className="wellness-card p-4 flex flex-col items-center justify-center bg-card shadow-sm group hover:border-emerald-200 transition-colors">
                                <Timer className="w-5 h-5 text-emerald-500 mb-2 group-hover:animate-bounce" />
                                <span className="text-xl font-black tabular-nums tracking-tight">{Math.floor(stats.activeTime)}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Mins</span>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <SectionHeader title="Achievements & Badges" />
                        <div className="grid grid-cols-3 gap-4">
                            {!badges.length && (
                                <div className="col-span-3 wellness-card p-10 border-dashed bg-card/10 flex flex-col items-center justify-center text-center opacity-60">
                                    <Trophy className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Walk more to unlock badges</p>
                                </div>
                            )}
                            {badges.includes("5k_club") && (
                                <div className="wellness-card p-5 flex flex-col items-center justify-center bg-yellow-50 shadow-sm border-yellow-100 gap-3 group hover:scale-105 transition-transform">
                                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-200 shadow-inner">
                                        <Trophy className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <span className="text-[11px] font-black text-center text-yellow-800 uppercase tracking-tighter leading-tight">5K Step<br />Fighter</span>
                                </div>
                            )}
                            {badges.includes("10k_club") && (
                                <div className="wellness-card p-5 flex flex-col items-center justify-center bg-blue-50 shadow-sm border-blue-100 gap-3 group hover:scale-105 transition-transform">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-200 shadow-inner">
                                        <Trophy className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <span className="text-[11px] font-black text-center text-blue-800 uppercase tracking-tighter leading-tight">10K Step<br />Master</span>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 text-center">
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            AARA tracks your activity in the background. <br />
                            Switch to <strong>Live Track</strong> for GPS-accurate run mapping.
                        </p>
                    </div>
                </TabsContent>

                {/* RUN TAB */}
                <TabsContent value="run" className="space-y-6 focus-visible:outline-none">
                    <div className="wellness-card h-[460px] relative overflow-hidden flex flex-col bg-slate-50 border-none shadow-xl">
                        {isGpsActive ? (
                            <div className="flex-1 flex flex-col items-center justify-center relative">
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_hsl(var(--primary))_0%,_transparent_70%)] animate-pulse" />

                                <div className="text-center z-10 p-8">
                                    <div className="relative mb-6">
                                        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                        <NavIcon className="w-14 h-14 text-primary relative mx-auto" />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tighter mb-1">Session Active</h3>
                                    <p className="text-[11px] text-primary font-bold uppercase tracking-[0.15em] mb-6">Tracking Live Route</p>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm">
                                            <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1">Latency</p>
                                            <p className="text-sm font-bold font-mono">{currentLocation?.coords.latitude.toFixed(4) || "..."}</p>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm">
                                            <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1">Heading</p>
                                            <p className="text-sm font-bold font-mono">{currentLocation?.coords.longitude.toFixed(4) || "..."}</p>
                                        </div>
                                    </div>

                                    <div className="text-6xl font-black tracking-tighter tabular-nums flex items-baseline justify-center gap-2">
                                        {(stats.distance / 1000).toFixed(2)}
                                        <span className="text-lg font-bold text-muted-foreground tracking-normal">km</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6 border border-border/10">
                                    <MapPin className="w-10 h-10 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">GPS Run Tracking</h3>
                                <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed mx-auto">
                                    Get precise distance and route mapping for your outdoor runs or walks.
                                </p>
                            </div>
                        )}

                        <div className="p-8 bg-white/50 backdrop-blur-lg border-t border-white/50">
                            <Button
                                size="lg"
                                className={cn(
                                    "w-full h-16 rounded-full text-lg font-bold shadow-lg transition-all active:scale-[0.98]",
                                    isGpsActive
                                        ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white border-none"
                                        : "brand-gradient text-white shadow-brand-blue/20"
                                )}
                                onClick={toggleGps}
                            >
                                {isGpsActive ? (
                                    <>Stop and Save Run</>
                                ) : (
                                    <>Start New Session</>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 wellness-card p-5 bg-blue-50/50 border-blue-100 shadow-sm shadow-blue-500/5">
                        <Target className="w-5 h-5 text-primary" />
                        <p className="text-xs font-bold text-primary/80 uppercase tracking-wider">Outdoor tracking increases XP gains</p>
                    </div>
                </TabsContent>

                {/* LEADERBOARD TAB */}
                <TabsContent value="leaderboard" className="focus-visible:outline-none">
                    <section className="space-y-4 pb-20">
                        <SectionHeader title="Community Ranks" />
                        <div className="wellness-card bg-card border-none shadow-sm overflow-hidden">
                            <ScrollArea className="h-[500px]">
                                <div className="p-2 space-y-2">
                                    {leaderboard?.map((user: any, index: number) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "flex items-center p-4 rounded-[20px] transition-colors group",
                                                index === 0 ? "bg-yellow-50/50 border border-yellow-100" : "hover:bg-secondary/30"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 flex items-center justify-center font-black italic text-lg",
                                                index === 0 ? "text-yellow-600" : "text-muted-foreground/30"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div className="relative">
                                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm overflow-hidden">
                                                    <AvatarImage src={user.profileImage} className="object-cover" />
                                                    <AvatarFallback className="bg-secondary font-black text-xs">
                                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {index === 0 && (
                                                    <div className="absolute -top-1 -right-1 bg-yellow-400 p-0.5 rounded-full shadow-sm text-yellow-900">
                                                        <Trophy className="w-3 h-3 fill-current" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-5 flex-1">
                                                <p className="font-bold text-[15px] tracking-tight">{user.firstName} {user.lastName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase py-0 h-4 border-primary/20 bg-primary/5 text-primary">
                                                        ELITE
                                                    </Badge>
                                                    <span className="text-xs font-black text-muted-foreground group-hover:text-foreground transition-colors">
                                                        {user.value?.toLocaleString()} steps
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                        </div>
                                    ))}
                                    {(!leaderboard || leaderboard.length === 0) && (
                                        <div className="py-20 text-center px-10">
                                            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                                                <Zap className="w-8 h-8 text-muted-foreground/20" />
                                            </div>
                                            <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest">No Activity Recorded</h4>
                                            <p className="text-xs text-muted-foreground mt-2 font-medium">Be the first to step onto the board!</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </section>
                </TabsContent>
            </Tabs>
        </PageLayout>
    );
}
