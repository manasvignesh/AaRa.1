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
                    className="text-slate-100"
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - percentage * circumference }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="hsl(var(--brand-blue))"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
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
        <PageLayout
            header={
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 mb-1">Activity</p>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity</h1>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                            <span className="text-xs font-bold text-slate-700">LVL {gamification.level}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{gamification.xp} XP</p>
                    </div>
                </div>
            }
        >
            <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-2xl h-12">
                    <TabsTrigger value="activity" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-500 data-[state=active]:text-slate-900">Summary</TabsTrigger>
                    <TabsTrigger value="run" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-500 data-[state=active]:text-slate-900">GPS Run</TabsTrigger>
                    <TabsTrigger value="leaderboard" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-500 data-[state=active]:text-slate-900">Social</TabsTrigger>
                </TabsList>

                {/* ACTIVITY TAB */}
                <TabsContent value="activity" className="space-y-8 focus-visible:outline-none">
                    <section className="flex flex-col items-center py-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <CircleProgress value={stats.steps} max={10000}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-2 text-brand-blue">
                                    <Footprints className="w-5 h-5" />
                                </div>
                                <span className="text-4xl font-bold text-slate-900 tracking-tight">{stats.steps.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Steps</span>
                            </motion.div>
                        </CircleProgress>

                        <div className="grid grid-cols-3 gap-6 w-full px-6 mt-8">
                            <div className="flex flex-col items-center justify-center gap-1">
                                <Flame className="w-5 h-5 text-orange-500 mb-1" />
                                <span className="text-lg font-bold text-slate-900">{Math.floor(stats.calories)}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kcal</span>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-1 border-x border-slate-100 px-4">
                                <MapPin className="w-5 h-5 text-blue-500 mb-1" />
                                <span className="text-lg font-bold text-slate-900">{(stats.distance / 1000).toFixed(2)}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Km</span>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-1">
                                <Timer className="w-5 h-5 text-emerald-500 mb-1" />
                                <span className="text-lg font-bold text-slate-900">{Math.floor(stats.activeTime)}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mins</span>
                            </div>
                        </div>
                    </section>
                </TabsContent>

                {/* RUN TAB */}
                <TabsContent value="run" className="space-y-6 focus-visible:outline-none">
                    <div className="bg-white rounded-[32px] overflow-hidden flex flex-col shadow-xl shadow-slate-200/50 relative min-h-[400px] border border-slate-100">
                        {/* Map Placeholder or Gradient */}
                        <div className="absolute inset-0 bg-slate-50/50 z-0" />
                        {isGpsActive && (
                            <div className="absolute inset-0 opacity-10">
                                {/* Animated radar effect for authenticity */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-brand-blue rounded-full animate-ping" />
                            </div>
                        )}

                        <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-6">
                            {isGpsActive ? (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6 animate-pulse">
                                        <div className="w-16 h-16 rounded-full bg-brand-blue flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                            <NavIcon className="w-8 h-8 fill-current" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold tracking-tight mb-1 text-slate-900">{(stats.distance / 1000).toFixed(2)} km</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Tracking Active</p>

                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time</p>
                                            <p className="text-xl font-mono font-bold text-slate-900">{Math.floor(stats.activeTime)}:00</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pace</p>
                                            <p className="text-xl font-mono font-bold text-slate-900">5:30 <span className="text-[10px] text-slate-400">/km</span></p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                                        <MapPin className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-900">Outdoor Run</h3>
                                    <p className="text-sm text-slate-400 max-w-[240px] text-center leading-relaxed">
                                        Start GPS tracking to map your route and calculate precise distance.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 relative z-20">
                            <Button
                                size="lg"
                                className={cn(
                                    "w-full h-16 rounded-2xl text-base font-bold shadow-lg transition-all active:scale-[0.98]",
                                    isGpsActive
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-brand-blue hover:bg-blue-600 text-white"
                                )}
                                onClick={toggleGps}
                            >
                                {isGpsActive ? (
                                    <>Stop Session <Pause className="w-4 h-4 ml-2 fill-current" /></>
                                ) : (
                                    <>Start Tracking <Play className="w-4 h-4 ml-2 fill-current" /></>
                                )}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* LEADERBOARD TAB */}
                <TabsContent value="leaderboard" className="focus-visible:outline-none">
                    <section className="space-y-4">
                        <SectionHeader title="Top Movers" />
                        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                            <ScrollArea className="h-[500px]">
                                <div className="p-2 space-y-1">
                                    {leaderboard?.map((user: any, index: number) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "flex items-center p-3 rounded-2xl transition-colors",
                                                index === 0 ? "bg-amber-50" : "hover:bg-slate-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 flex items-center justify-center font-bold text-sm",
                                                index === 0 ? "text-amber-600" : "text-slate-400"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <Avatar className="h-10 w-10 border border-slate-100">
                                                <AvatarImage src={user.profileImage} className="object-cover" />
                                                <AvatarFallback className="bg-slate-100 font-bold text-xs text-slate-600">
                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="ml-4 flex-1">
                                                <p className="font-bold text-sm text-slate-900">{user.firstName} {user.lastName}</p>
                                                <p className="text-xs font-medium text-slate-500">{user.value?.toLocaleString()} steps</p>
                                            </div>
                                            {index === 0 && <Trophy className="w-4 h-4 text-amber-500" />}
                                        </div>
                                    ))}
                                    {(!leaderboard || leaderboard.length === 0) && (
                                        <div className="py-12 text-center px-10">
                                            <p className="text-sm font-bold text-slate-400">No data yet.</p>
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
