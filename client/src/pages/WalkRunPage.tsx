import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { healthService, ActivityStats } from "@/lib/health";
import { Play, Pause, MapPin, Trophy, Footprints, Flame, Timer, Navigation, Zap, Target, Activity, ShieldCheck, Cpu, ArrowUpRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// High-Tech Circular HUD
function CircularHUD({ value, max, size = 200, strokeWidth = 8, label, unit, children }: any) {
    const radius = (size - 20) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(value, max) / max) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* outer decorative ring */}
            <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-4 rounded-full border border-primary/10 border-dashed" />

            <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    className="text-primary drop-shadow-[0_0_8px_rgba(142,214,63,0.5)]"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className="text-4xl font-display font-bold text-white tracking-tighter">{value.toLocaleString()}</p>
                <p className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest mt-1">{unit}</p>
            </div>
        </div>
    );
}

export default function WalkRunPage() {
    const { toast } = useToast();

    const [stats, setStats] = useState<ActivityStats>({
        steps: 0,
        distance: 0,
        calories: 0,
        activeTime: 0
    });

    const [isGpsActive, setIsGpsActive] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);

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
            toast({ title: "MISSION_TERMINATED", description: "Route synchronized to cloud." });
        } else {
            healthService.enableGps();
            setIsGpsActive(true);
            toast({ title: "MISSION_DEPLOYED", description: "GPS tracking establishing..." });
        }
    };

    const gamification = serverData?.gamification || { xp: 0, level: 1, badges: [] };
    const badges = gamification.badges || [];

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden selection:bg-primary/30">
            {/* Cybergrid Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
                <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="p-6 md:p-10 space-y-10 z-10 max-w-5xl mx-auto w-full pb-32">
                <header className="flex justify-between items-end gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <Target className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.4em]">KINETIC_INTELLIGENCE</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter leading-none">PEDESTRIAN_LOG</h1>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Operative_Rank</p>
                                <p className="text-xl font-display font-bold text-white tracking-tighter">LVL_{gamification.level}</p>
                            </div>
                            <div className="h-10 w-[1px] bg-white/10" />
                            <div className="flex flex-col items-end">
                                <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Experience_Sync</p>
                                <p className="text-xl font-display font-bold text-primary tracking-tighter">{gamification.xp} XP</p>
                            </div>
                        </div>
                        <Progress value={(gamification.xp % 1000) / 10} className="w-32 h-1 bg-white/5" />
                    </motion.div>
                </header>

                <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="grid grid-cols-3 bg-white/[0.03] border border-white/5 p-1 rounded-2xl h-16 mb-10">
                        <TabsTrigger value="activity" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-display font-bold uppercase text-[10px] tracking-widest transition-all">ACTIVITY_HUB</TabsTrigger>
                        <TabsTrigger value="run" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-display font-bold uppercase text-[10px] tracking-widest transition-all">TACTICAL_RUN</TabsTrigger>
                        <TabsTrigger value="leaderboard" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-display font-bold uppercase text-[10px] tracking-widest transition-all">RANKINGS</TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <TabsContent value="activity" className="space-y-8 outline-none">
                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="lg:col-span-2 glass-card p-10 md:p-14 rounded-[3rem] border-white/5 bg-white/[0.02] flex flex-col md:flex-row items-center gap-14"
                                >
                                    <CircularHUD value={stats.steps} max={10000} label="Bio_Mechanical_Pulse" unit="TOTAL_STEPS" size={240} />

                                    <div className="flex-1 space-y-8 w-full">
                                        <div className="grid grid-cols-2 gap-6">
                                            {[
                                                { icon: Flame, color: "text-orange-500", label: "Energy_Burn", value: Math.floor(stats.calories), unit: "KCAL" },
                                                { icon: MapPin, color: "text-blue-500", label: "Sector_Range", value: (stats.distance / 1000).toFixed(2), unit: "KM" },
                                                { icon: Timer, color: "text-green-500", label: "Active_Uptime", value: Math.floor(stats.activeTime), unit: "MINS" },
                                                { icon: Zap, color: "text-yellow-500", label: "Power_Index", value: Math.round(stats.steps / 100), unit: "PX" },
                                            ].map((stat, i) => (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <stat.icon className={cn("w-3 h-3 opacity-40", stat.color)} />
                                                        <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">{stat.label}</p>
                                                    </div>
                                                    <p className="text-2xl font-display font-bold text-white tracking-tighter">{stat.value} <span className="text-[10px] text-white/20">{stat.unit}</span></p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                                            <p className="text-[9px] font-mono text-primary/60 uppercase tracking-widest leading-relaxed">
                                                Bio-feedback synchronized. Step count represents 64% of daily morphological requirement.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="glass-card p-10 rounded-[3rem] border-white/5 bg-white/[0.02]"
                                >
                                    <div className="flex items-center justify-between mb-10">
                                        <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.4em]">Merit_Archive</h3>
                                        <Trophy className="w-5 h-5 text-primary opacity-20" />
                                    </div>
                                    <ScrollArea className="h-[240px] pr-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {badges.includes("5k_club") ? (
                                                <div className="aspect-square rounded-3xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center p-4 gap-3 group relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-3 opacity-5">
                                                        <Trophy className="w-12 h-12 text-primary" />
                                                    </div>
                                                    <Trophy className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(142,214,63,0.3)]" />
                                                    <p className="text-[9px] font-mono font-bold text-white uppercase text-center tracking-widest">5K_OPERATIVE</p>
                                                </div>
                                            ) : (
                                                <div className="aspect-square rounded-3xl border border-white/5 opacity-20 flex items-center justify-center">
                                                    <ShieldCheck className="w-8 h-8 text-white" />
                                                </div>
                                            )}
                                            {badges.includes("10k_club") ? (
                                                <div className="aspect-square rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center p-4 gap-3 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-3 opacity-5">
                                                        <Zap className="w-12 h-12 text-indigo-400" />
                                                    </div>
                                                    <Zap className="w-8 h-8 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                                                    <p className="text-[9px] font-mono font-bold text-white uppercase text-center tracking-widest">10K_TITAN</p>
                                                </div>
                                            ) : (
                                                <div className="aspect-square rounded-3xl border border-white/5 opacity-20 flex items-center justify-center">
                                                    <ShieldCheck className="w-8 h-8 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </motion.div>
                            </section>
                        </TabsContent>

                        <TabsContent value="run" className="outline-none">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card rounded-[3rem] border-white/5 bg-black/40 overflow-hidden relative min-h-[500px] flex flex-col"
                            >
                                {isGpsActive ? (
                                    <div className="flex-1 relative flex flex-col items-center justify-center">
                                        {/* RADAR EFFECT */}
                                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(142,214,63,0.05)_0%,transparent_70%)]" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary/10 rounded-full" />
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                                            />
                                        </div>

                                        <div className="z-10 text-center space-y-8 p-12">
                                            <div className="relative inline-block">
                                                <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                                                <Navigation className="w-16 h-16 text-primary relative" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">MISSION_TRACKING_ENGAGED</h3>
                                                <p className="text-[10px] font-mono text-primary font-bold uppercase tracking-[0.4em] mt-2 animate-pulse font-mono tracking-widest">Awaiting_Vector_Updates...</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-12 pt-8">
                                                <div className="space-y-1 flex flex-col items-center">
                                                    <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Vector_Lat</p>
                                                    <p className="text-xl font-mono text-white/80">{currentLocation?.coords.latitude.toFixed(6) || "---.------"}</p>
                                                </div>
                                                <div className="space-y-1 flex flex-col items-center">
                                                    <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Vector_Lng</p>
                                                    <p className="text-xl font-mono text-white/80">{currentLocation?.coords.longitude.toFixed(6) || "---.------"}</p>
                                                </div>
                                            </div>

                                            <div className="text-7xl font-display font-bold text-white tracking-tighter pt-8">
                                                {(stats.distance / 1000).toFixed(2)} <span className="text-xl text-white/20 uppercase font-medium">KM</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8">
                                        <div className="w-24 h-24 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center opacity-40">
                                            <MapPin className="w-10 h-10 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Tactical_Telemetry_Idle</h3>
                                            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em] mt-2">Activate GPS beacon to begin high-fidelity route tracking.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="p-10 bg-black/60 border-t border-white/5 backdrop-blur-xl">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={toggleGps}
                                        className={cn(
                                            "w-full h-20 rounded-2xl font-display font-bold text-xl uppercase tracking-[0.2em] shadow-2xl transition-all border-none outline-none flex items-center justify-center gap-4",
                                            isGpsActive ? "bg-red-500 text-white shadow-red-500/20" : "bg-primary text-black shadow-primary/20"
                                        )}
                                    >
                                        {isGpsActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                        {isGpsActive ? "ABORT_MISSION" : "INITIATE_TRACKING"}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="leaderboard" className="outline-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card rounded-[3rem] border-white/5 bg-white/[0.02] overflow-hidden"
                            >
                                <div className="p-10 border-b border-white/5 bg-white/[0.01]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Trophy className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.4em]">ELITE_OPERATIVES</span>
                                    </div>
                                    <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Kinetic_Leaderboard</h3>
                                </div>
                                <ScrollArea className="h-[500px]">
                                    <div className="p-2 space-y-2">
                                        {leaderboard?.map((user: any, index: number) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center p-6 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all group"
                                            >
                                                <div className="w-12 h-12 flex items-center justify-center">
                                                    {index === 0 ? <Trophy className="w-6 h-6 text-yellow-500" /> :
                                                        index === 1 ? <Trophy className="w-6 h-6 text-slate-300" /> :
                                                            index === 2 ? <Trophy className="w-6 h-6 text-amber-700" /> :
                                                                <span className="text-xs font-mono text-white/20">#{index + 1}</span>}
                                                </div>
                                                <div className="relative">
                                                    <Avatar className="h-12 w-12 border-2 border-white/5 group-hover:border-primary/40 transition-all">
                                                        <AvatarImage src={user.profileImage} />
                                                        <AvatarFallback className="bg-white/5 text-white/40">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-black border-2 border-black">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                                <div className="ml-6 flex-1">
                                                    <p className="font-display font-bold text-white uppercase tracking-wide group-hover:text-primary transition-colors">{user.firstName} {user.lastName}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{user.value?.toLocaleString()} STEPS</p>
                                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                                        <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">LVL_{Math.floor(user.value / 1000) + 1}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowUpRight className="w-4 h-4 text-primary" />
                                                </div>
                                            </motion.div>
                                        ))}
                                        {(!leaderboard || leaderboard.length === 0) && (
                                            <div className="py-24 flex flex-col items-center justify-center opacity-30 gap-4">
                                                <Cpu className="w-12 h-12" />
                                                <p className="text-[10px] font-mono uppercase tracking-[0.4em]">NO_LINKED_USERS_DETECTED</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </motion.div>
                        </TabsContent>
                    </AnimatePresence>
                </Tabs>
            </div>
        </div>
    );
}
