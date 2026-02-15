import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { usePlanMeta, useWorkouts, useGeneratePlan } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronRight, CheckCircle, Calendar, ChevronLeft, Dumbbell, Clock, Flame, Play, X, Zap, Info, ArrowRight, PlayCircle, CheckCircle2, Trophy, FlameIcon } from "lucide-react";
import { format, addDays, subDays, isToday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkoutsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [, setLocation] = useLocation();
    const { data: user, isLoading: userLoading } = useUserProfile();
    const { data: plan, isLoading: planLoading } = usePlanMeta(selectedDate);
    const { data: workouts = [], isLoading: workoutsLoading } = useWorkouts(selectedDate);
    const { mutate: generatePlan, isPending: isGenerating } = useGeneratePlan();
    const [generationError, setGenerationError] = useState<string | null>(null);

    useEffect(() => {
        if (!userLoading && user && !planLoading && !plan && !isGenerating && !generationError) {
            generatePlan(selectedDate, {
                onError: (err: any) => {
                    setGenerationError(err.message || "Failed to generate your plan. Please try again.");
                }
            });
        }
    }, [plan, planLoading, isGenerating, selectedDate, generatePlan, user, userLoading, generationError]);

    useEffect(() => {
        setGenerationError(null);
    }, [selectedDate]);

    const handleRetryGeneration = () => {
        setGenerationError(null);
        generatePlan(selectedDate, {
            onError: (err: any) => {
                setGenerationError(err.message || "Failed to generate your plan. Please try again.");
            }
        });
    };

    if (userLoading || (planLoading && !plan) || isGenerating) {
        return (
            <PageLayout
                header={
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                            {format(selectedDate, "EEEE, MMMM do")}
                        </p>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">Workouts</h1>
                    </div>
                }
            >
                <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] gap-6 text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <div className="space-y-2">
                        <p className="text-xl font-black tracking-tight animate-pulse">
                            {isGenerating ? "Crafting Your Session" : "Reading Your Progress"}
                        </p>
                        <p className="text-sm text-muted-foreground font-medium">AARA AI is optimizing your workout plan...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    if (generationError || (!plan && !isGenerating)) {
        return (
            <PageLayout
                header={
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                            {format(selectedDate, "EEEE, MMMM do")}
                        </p>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">Workouts</h1>
                    </div>
                }
            >
                <div className="flex flex-col items-center justify-center py-20 gap-8 text-center max-w-sm mx-auto">
                    <div className="w-24 h-24 rounded-[32px] bg-red-50 flex items-center justify-center shadow-lg border border-red-100">
                        <X className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-black text-2xl tracking-tight text-foreground">Session Halted</h3>
                        <p className="text-muted-foreground font-medium leading-relaxed">
                            {generationError || "We couldn't synchronize your workout plan. This might be a connection issue."}
                        </p>
                    </div>
                    <Button size="lg" className="w-full brand-gradient text-white rounded-[24px] h-16 text-lg font-black shadow-xl" onClick={handleRetryGeneration}>
                        Reload Session
                    </Button>
                </div>
            </PageLayout>
        );
    }

    const weekDays = eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
    });

    return (
        <PageLayout
            header={
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                            {format(selectedDate, "EEEE, MMMM do")}
                        </p>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">Training</h1>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                            className="w-10 h-10 rounded-full bg-card border-none shadow-sm text-primary hover:bg-secondary/50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                            className="w-10 h-10 rounded-full bg-card border-none shadow-sm text-primary hover:bg-secondary/50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-10 pb-32">
                {/* Weekly Strip */}
                <section>
                    <div className="wellness-card p-4 flex justify-between items-center shadow-sm bg-card border-none">
                        {weekDays.map((day: Date, idx: number) => {
                            const active = isSameDay(day, selectedDate);
                            const today = isToday(day);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "flex flex-col items-center py-3 px-3 rounded-[20px] transition-all w-12 group",
                                        active ? "brand-gradient text-white shadow-xl scale-105" : "hover:bg-secondary/30"
                                    )}
                                >
                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", active ? "text-white/80" : "text-muted-foreground/40")}>
                                        {format(day, "eee")}
                                    </span>
                                    <span className="text-lg font-black tracking-tighter mt-1">{format(day, "d")}</span>
                                    {today && !active && <div className="w-1 h-1 bg-primary rounded-full mt-1.5" />}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <AnimatePresence mode="wait">
                    {workouts.length === 0 ? (
                        <motion.section
                            key="rest-day"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="py-10"
                        >
                            <div className="wellness-card p-12 flex flex-col items-center justify-center text-center space-y-8 bg-card border-none shadow-lg group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                    <div className="w-24 h-24 rounded-[32px] bg-primary/5 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-700">
                                        <Clock className="w-12 h-12 text-primary" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black tracking-tighter text-foreground">Regeneration Day</h2>
                                    <p className="text-muted-foreground font-medium max-w-[240px] mx-auto leading-relaxed">
                                        Recovery is where the magic happens. Your tissues are rebuilding. Stay mobile with light movement.
                                    </p>
                                </div>
                                <Button variant="outline" className="h-14 rounded-full px-10 font-black border-primary/20 text-primary hover:bg-primary/5 shadow-sm text-xs uppercase tracking-widest transition-all">
                                    Mobility Guidelines
                                </Button>
                            </div>
                        </motion.section>
                    ) : (
                        <motion.div
                            key="active-day"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-10"
                        >
                            {/* Workout Feed */}
                            <section className="space-y-6">
                                <SectionHeader title="Active Sessions" />
                                {workouts.map((workout: any) => (
                                    <Link key={workout.id} href={`/workout/${workout.id}`}>
                                        <div className="wellness-card p-8 shadow-xl bg-card border-none hover:translate-y-[-4px] active:scale-[0.98] transition-all cursor-pointer group mb-6 overflow-hidden relative">
                                            {workout.isCompleted && (
                                                <div className="absolute top-0 right-0 p-4">
                                                    <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-emerald-500/10 text-emerald-600">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Mastered</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full brand-gradient" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{workout.type} Training</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h2 className="text-3xl font-black tracking-tighter text-foreground leading-tight">{workout.name}</h2>
                                                        <p className="text-[15px] font-medium text-muted-foreground max-w-[320px]">
                                                            {workout.description || (workout.type === 'cardio' ? 'Ignite your metabolism and build endurance.' : 'Sculpt and strengthen your foundation.')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8 bg-secondary/20 p-6 rounded-[28px] shrink-0 border border-border/5">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Clock className="w-5 h-5 text-primary mb-1" />
                                                        <span className="text-lg font-black tracking-tighter leading-none">{workout.duration}</span>
                                                        <span className="text-[8px] font-black text-muted-foreground uppercase opacity-40">Min</span>
                                                    </div>
                                                    <div className="w-px h-8 bg-border/40" />
                                                    <div className="flex flex-col items-center gap-1">
                                                        <FlameIcon className="w-5 h-5 text-primary mb-1" />
                                                        <span className="text-lg font-black tracking-tighter leading-none">~{Math.round(workout.duration * 6.5)}</span>
                                                        <span className="text-[8px] font-black text-muted-foreground uppercase opacity-40">Kcal</span>
                                                    </div>
                                                    <div className="pl-2">
                                                        <div className="w-12 h-12 rounded-full brand-gradient flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                                            {workout.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <PlayCircle className="w-7 h-7 fill-current" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </section>

                            {/* Performance Insights */}
                            <section className="space-y-4">
                                <SectionHeader title="Training Metrics" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="wellness-card p-6 bg-card border-none shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                                                <Trophy className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+12%</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Weekly Volume</p>
                                            <p className="text-2xl font-black tracking-tighter">240 <span className="text-xs font-bold text-muted-foreground/40">MIN</span></p>
                                        </div>
                                    </div>
                                    <div className="wellness-card p-6 bg-card border-none shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 rounded-2xl bg-orange-500/5 flex items-center justify-center text-orange-500">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Active</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Peak Intensity</p>
                                            <p className="text-2xl font-black tracking-tighter">8.5 <span className="text-xs font-bold text-muted-foreground/40">PWR</span></p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageLayout>
    );
}
