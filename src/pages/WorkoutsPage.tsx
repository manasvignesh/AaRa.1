import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { usePlanMeta, useWorkouts, useGeneratePlan } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { Loader2, ChevronRight, Dumbbell, Clock, Zap, X, ChevronLeft, PlayCircle, CheckCircle2, Trophy, Flame } from "lucide-react";
import { format, addDays, subDays, isToday, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
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
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">Training Plan</h1>
                    </div>
                }
            >
                <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] gap-6 text-center text-foreground">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <div className="space-y-2">
                        <p className="text-xl font-black tracking-tight animate-pulse uppercase opacity-70">Synthesizing Protocol</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    const weekDays = eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6)
    });

    return (
        <PageLayout
            maxWidth="md"
            header={
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                            {format(selectedDate, "EEEE, MMMM do")}
                        </p>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">Training</h1>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <button
                            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-card/60 backdrop-blur-xl border border-white/5 text-primary hover:bg-card/80 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-card/60 backdrop-blur-xl border border-white/5 text-primary hover:bg-card/80 transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-8 pb-10">
                {/* Weekly Strip */}
                <section>
                    <div className="wellness-card p-3 flex justify-between items-center bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl">
                        {weekDays.map((baseDay: Date, idx: number) => {
                            const active = isSameDay(baseDay, selectedDate);
                            const today = isToday(baseDay);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(baseDay)}
                                    className={cn(
                                        "flex flex-col items-center py-3 px-3 rounded-2xl transition-all w-11",
                                        active ? "brand-gradient text-white shadow-xl scale-105" : "text-muted-foreground/60 hover:text-foreground"
                                    )}
                                >
                                    <span className={cn("text-[8px] font-black uppercase tracking-widest", active ? "text-white/80" : "text-muted-foreground/40")}>
                                        {format(baseDay, "eee")}
                                    </span>
                                    <span className="text-lg font-black tracking-tighter mt-1">{format(baseDay, "d")}</span>
                                    {today && !active && <div className="w-1 h-1 bg-primary rounded-full mt-1" />}
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
                            className="py-10 text-center"
                        >
                            <div className="wellness-card p-10 flex flex-col items-center justify-center space-y-6">
                                <div className="w-20 h-20 rounded-[28px] bg-primary/5 flex items-center justify-center">
                                    <Clock className="w-10 h-10 text-primary opacity-40" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tighter uppercase">Regeneration</h2>
                                    <p className="text-sm text-muted-foreground font-medium max-w-[200px] mx-auto leading-relaxed">
                                        Your neural pathways and tissues are optimizing. Stay hydrated.
                                    </p>
                                </div>
                            </div>
                        </motion.section>
                    ) : (
                        <motion.div
                            key="active-day"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            {/* Workout Sessions */}
                            <section className="space-y-5">
                                <SectionHeader title="Active Protocol" />
                                {workouts.map((workout: any) => (
                                    <Link key={workout.id} href={`/workout/${workout.id}`}>
                                        <div className="wellness-card p-5 cursor-pointer group hover:-translate-y-1 transition-all relative overflow-hidden">
                                            {workout.isCompleted && (
                                                <div className="absolute top-4 right-4 flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-500/10 text-emerald-500">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Mastered</span>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full brand-gradient" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{workout.type}</span>
                                                </div>

                                                <div className="pr-12">
                                                    <h2 className="text-2xl font-black tracking-tighter text-foreground mb-1 leading-tight">{workout.name}</h2>
                                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed opacity-60">
                                                        {workout.description || "Optimized resistance sequence for peak performance."}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-xl font-black tracking-tighter mb-0.5">{workout.duration}</span>
                                                            <span className="text-[8px] font-black text-muted-foreground uppercase opacity-40">m duration</span>
                                                        </div>
                                                        <div className="w-px h-6 bg-white/5" />
                                                        <div className="flex flex-col">
                                                            <span className="text-xl font-black tracking-tighter mb-0.5">~{Math.round(workout.duration * 7)}</span>
                                                            <span className="text-[8px] font-black text-muted-foreground uppercase opacity-40">kcal flux</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                                        {workout.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <PlayCircle className="w-6 h-6 fill-current" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </section>

                            {/* Stats */}
                            <section className="space-y-4">
                                <SectionHeader title="Training Metrics" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="wellness-card p-5 flex flex-col gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Trophy className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black tracking-tighter leading-none">240 <span className="text-xs opacity-30 font-bold">m</span></p>
                                            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Weekly Volume</p>
                                        </div>
                                    </div>
                                    <div className="wellness-card p-5 flex flex-col gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black tracking-tighter leading-none">8.2 <span className="text-xs opacity-30 font-bold">lvl</span></p>
                                            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Intensity Vector</p>
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
