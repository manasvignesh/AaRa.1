import { useEffect, useState } from "react";
import { Link } from "wouter";
import { usePlanMeta, useWorkouts, useGeneratePlan } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronRight, CheckCircle, Calendar, ChevronLeft, Dumbbell, Clock, Flame, Play, X, Zap, Info, ArrowRight } from "lucide-react";
import { format, addDays, subDays, isToday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkoutsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
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
            <div className="flex flex-col md:flex-row min-h-screen bg-background">
                <Navigation />
                <main className="flex-1 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <div className="text-center">
                        <h3 className="font-semibold text-lg text-foreground">
                            {isGenerating ? "Crafting your session..." : "Fetching plan..."}
                        </h3>
                    </div>
                </main>
            </div>
        );
    }

    if (generationError || (!plan && !isGenerating)) {
        return (
            <div className="flex flex-col md:flex-row min-h-screen bg-background">
                <Navigation />
                <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6 max-w-md mx-auto text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <X className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-foreground">Plan Unavailable</h3>
                        <p className="text-muted-foreground mt-2">
                            {generationError || "We couldn't prepare your plan for today."}
                        </p>
                    </div>
                    <Button variant="outline" size="lg" className="w-full rounded-2xl" onClick={handleRetryGeneration}>
                        Retry Generation
                    </Button>
                </main>
            </div>
        );
    }

    const weekDays = eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
    });

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 pb-48 md:pb-12 overflow-y-auto">
                <header className="px-6 pt-10 pb-6 md:pt-16">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Workouts</h1>
                    <p className="text-sm text-muted-foreground mt-1">Focus on form and intensity.</p>
                </header>

                {/* Weekly Strip */}
                <section className="px-4 mb-8">
                    <div className="wellness-card p-3 flex justify-between items-center shadow-sm">
                        {weekDays.map((day, idx) => {
                            const active = isSameDay(day, selectedDate);
                            const today = isToday(day);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "flex flex-col items-center py-2 px-3 rounded-2xl transition-all",
                                        active ? "bg-primary text-white shadow-md active:scale-95" : "hover:bg-secondary/50"
                                    )}
                                >
                                    <span className={cn("text-[10px] font-bold uppercase", active ? "text-white/70" : "text-muted-foreground")}>
                                        {format(day, "eee")}
                                    </span>
                                    <span className="text-lg font-bold">{format(day, "d")}</span>
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
                            className="px-4"
                        >
                            <div className="wellness-card p-10 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                                    <Clock className="w-10 h-10 text-blue-500/50" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">Recovery Day</h2>
                                <p className="text-muted-foreground mt-2 max-w-[240px]">
                                    Rest is as critical as the workout. Use today for mobility or light walking.
                                </p>
                                <Button variant="outline" className="mt-8 rounded-full px-6">
                                    View Recovery Tips
                                </Button>
                            </div>
                        </motion.section>
                    ) : (
                        <motion.div
                            key="active-day"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            {/* Today's Highlight */}
                            <section className="px-4">
                                {workouts.map((workout: any) => (
                                    <div key={workout.id} className="wellness-card p-6 bg-card shadow-sm border-none">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{workout.type} Session</span>
                                                </div>
                                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">{workout.name}</h2>
                                                <p className="text-[13px] text-muted-foreground mt-1">
                                                    {workout.type === 'cardio' ? 'Builds stamina and burns fat' :
                                                        workout.type === 'strength' ? 'Increases strength and metabolic rate' :
                                                            'Improves mobility and recovery'}
                                                </p>
                                            </div>
                                            {workout.isCompleted && (
                                                <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-green-500/10 text-green-600">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-bold uppercase">Completed</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30">
                                                <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm">
                                                    <Clock className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Duration</p>
                                                    <p className="text-sm font-bold">{workout.duration} min</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30">
                                                <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm">
                                                    <Flame className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Intensity</p>
                                                    <p className="text-sm font-bold capitalize">{workout.difficulty}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            {!workout.isCompleted ? (
                                                <Link href={`/workout/${workout.id}/start`} className="flex-1">
                                                    <Button className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold border-none shadow-lg">
                                                        <Play className="w-4 h-4 mr-2 fill-current" />
                                                        Start Workout
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Link href={`/workout/${workout.id}/start`} className="flex-1">
                                                    <Button variant="outline" className="w-full h-12 rounded-2xl border-primary/20 hover:bg-primary/5 text-primary font-bold">
                                                        Redo Session
                                                    </Button>
                                                </Link>
                                            )}
                                            <Link href={`/workout/${workout.id}`}>
                                                <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-secondary/50 hover:bg-secondary text-muted-foreground border-none p-0">
                                                    <Info className="w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            {/* Workout Breakdown */}
                            <section className="px-4">
                                <h2 className="px-2 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">Exercise List</h2>
                                <div className="space-y-3">
                                    {workouts.map((workout: any) => (
                                        <div key={`breakdown-${workout.id}`} className="space-y-2">
                                            {(workout.exercises || []).map((ex: any, idx: number) => {
                                                const hasDetails = typeof ex === 'object' && (ex.sets || ex.reps || ex.duration);
                                                return (
                                                    <div key={idx} className="wellness-card p-4 flex items-center justify-between border-none shadow-sm bg-card">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-secondary/50 flex items-center justify-center text-sm font-bold text-muted-foreground/60">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground leading-tight">{typeof ex === 'string' ? ex : ex.name}</h4>
                                                                {hasDetails && (
                                                                    <p className="text-[11px] font-medium text-muted-foreground mt-1">
                                                                        {[
                                                                            ex.sets && `${ex.sets} sets`,
                                                                            ex.reps && `${ex.reps} reps`,
                                                                            ex.duration && `${ex.duration}s`
                                                                        ].filter(Boolean).join(' • ')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground/20" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Flexibility & Tips */}
                            <section className="px-4 pb-8 space-y-4">
                                <div className="wellness-card p-5 bg-amber-50 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shrink-0 shadow-sm border border-amber-100">
                                        <Zap className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-500 mb-1">Coach Tip</h4>
                                        <p className="text-[13px] text-amber-500/80 leading-snug">
                                            Focus on the tempo. Slow down the lowering phase of each rep to increase muscle recruitment.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <Button variant="outline" className="h-14 rounded-2xl justify-between px-6 border-border bg-card">
                                        <span className="font-semibold">Swap this workout</span>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="outline" className="h-14 rounded-2xl justify-between px-6 border-border bg-card">
                                        <span className="font-semibold">Need an easier option?</span>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
