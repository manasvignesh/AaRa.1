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
import { Play, Pause, MapPin, Trophy, Footprints, Flame, Timer, Navigation } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Helper for Circular Progress
function CircleProgress({ value, max, size = 120, strokeWidth = 10, children, className }: any) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(value, max) / max) * circumference;

    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-muted/20"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
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
    const { data: serverData, refetch } = useQuery<{ activity: ActivityStats | null, gamification: any }>({
        queryKey: ["/api/activity/today"],
        refetchInterval: 5000 // Poll every 5s for gamification sync
    });

    const { data: leaderboard } = useQuery<any[]>({
        queryKey: ["/api/leaderboard", "steps"],
    });

    // Subscribe to Health Service
    useEffect(() => {
        // 1. Sync server data to health service initially? 
        // Actually HealthService loads it, but we want UI to reflect HealthService (source of truth for Today)
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
            toast({ title: "Run Ended", description: "Route saved." });
        } else {
            healthService.enableGps();
            setIsGpsActive(true);
            toast({ title: "Run Started", description: "GPS tracking enabled." });
        }
    };

    const gamification = serverData?.gamification || { xp: 0, level: 1, badges: [] };
    const badges = gamification.badges || [];

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="p-4 space-y-6">
                <header className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold font-heading">Walk & Run</h1>
                        <p className="text-muted-foreground text-sm">Every step counts.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-medium text-muted-foreground">Level {gamification.level}</span>
                        <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                            {gamification.xp} XP
                        </Badge>
                    </div>
                </header>

                <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="run">Run Mode</TabsTrigger>
                        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                    </TabsList>

                    {/* ACTIVITY TAB */}
                    <TabsContent value="activity" className="space-y-6">

                        {/* Main Ring */}
                        <Card className="border-none shadow-sm bg-card/50">
                            <CardContent className="pt-6 flex flex-col items-center justify-center">
                                <CircleProgress value={stats.steps} max={10000} size={200} strokeWidth={15} className="text-primary">
                                    <div className="flex flex-col items-center">
                                        <Footprints className="w-8 h-8 text-primary mb-2 opacity-80" />
                                        <span className="text-4xl font-bold tabular-nums">{stats.steps.toLocaleString()}</span>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Steps Today</span>
                                        <span className="text-xs text-muted-foreground mt-1">Goal: 10,000</span>
                                    </div>
                                </CircleProgress>

                                <div className="grid grid-cols-3 gap-8 mt-8 w-full">
                                    <div className="flex flex-col items-center">
                                        <Flame className="w-5 h-5 text-orange-500 mb-1" />
                                        <span className="text-lg font-bold tabular-nums">{Math.floor(stats.calories)}</span>
                                        <span className="text-xs text-muted-foreground">Kcal</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <MapPin className="w-5 h-5 text-blue-500 mb-1" />
                                        <span className="text-lg font-bold tabular-nums">{(stats.distance / 1000).toFixed(2)}</span>
                                        <span className="text-xs text-muted-foreground">Km</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Timer className="w-5 h-5 text-green-500 mb-1" />
                                        <span className="text-lg font-bold tabular-nums">{Math.floor(stats.activeTime)}</span>
                                        <span className="text-xs text-muted-foreground">Mins</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Badges */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold px-1">Badges</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {badges.length === 0 && (
                                    <div className="col-span-3 text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                                        Start walking to unlock badges!
                                    </div>
                                )}
                                {badges.includes("5k_club") && (
                                    <Badge variant="outline" className="h-24 flex flex-col items-center justify-center bg-yellow-500/10 border-yellow-500/50 gap-2">
                                        <Trophy className="w-6 h-6 text-yellow-600" />
                                        <span className="text-xs font-bold text-center">5K Club</span>
                                    </Badge>
                                )}
                                {badges.includes("10k_club") && (
                                    <Badge variant="outline" className="h-24 flex flex-col items-center justify-center bg-brand-blue/10 border-brand-blue/30 gap-2">
                                        <Trophy className="w-6 h-6 text-brand-blue" />
                                        <span className="text-xs font-bold text-center">10K Master</span>
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Dev Controls - Removed to enforce strict GPS */}
                        <div className="pt-4 text-center">
                            <p className="text-xs text-muted-foreground">
                                Passive tracking relies on your daily movement.
                                <br />For workouts, switch to <strong>Run Mode</strong>.
                            </p>
                        </div>
                    </TabsContent>

                    {/* RUN TAB */}
                    <TabsContent value="run" className="space-y-4">
                        <Card className="h-[400px] relative overflow-hidden flex flex-col">
                            {isGpsActive ? (
                                <div className="flex-1 bg-secondary flex items-center justify-center relative">
                                    {/* Placeholder for Map - replacing full map for MVP battery/complexity reasons */}
                                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent" />

                                    <div className="text-center z-10 p-6">
                                        <Navigation className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
                                        <h3 className="text-xl font-bold mb-2">GPS Tracking Active</h3>
                                        <p className="text-xs text-orange-600 font-medium mb-1">
                                            Stay outdoors for best accuracy
                                        </p>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Lat: {currentLocation?.coords.latitude.toFixed(4) || "..."} <br />
                                            Lng: {currentLocation?.coords.longitude.toFixed(4) || "..."}
                                        </p>
                                        <div className="text-4xl font-bold font-mono">
                                            {(stats.distance / 1000).toFixed(2)} <span className="text-base text-muted-foreground font-sans">km</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center bg-secondary/30 text-muted-foreground p-6 text-center">
                                    <MapPin className="w-12 h-12 mb-4 opacity-50" />
                                    <p>Start a run to track your route via GPS.</p>
                                </div>
                            )}

                            <div className="p-4 bg-background border-t">
                                <Button
                                    size="lg"
                                    className={cn("w-full transition-all", isGpsActive ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700")}
                                    onClick={toggleGps}
                                >
                                    {isGpsActive ? "Stop Run" : "Start Run"}
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* LEADERBOARD TAB */}
                    <TabsContent value="leaderboard">
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Leaders</CardTitle>
                                <CardDescription>Top steppers today</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[400px]">
                                    {leaderboard?.map((user: any, index: number) => (
                                        <div key={index} className="flex items-center p-4 border-b last:border-0 hover:bg-secondary/50">
                                            <div className="font-bold text-muted-foreground w-8 text-center">#{index + 1}</div>
                                            <Avatar className="h-10 w-10 border ml-2">
                                                <AvatarImage src={user.profileImage} />
                                                <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="ml-4 flex-1">
                                                <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                                                <p className="text-xs text-muted-foreground">{user.value?.toLocaleString()} steps</p>
                                            </div>
                                            {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                                        </div>
                                    ))}
                                    {(!leaderboard || leaderboard.length === 0) && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No activity recorded today. Be the first!
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
