import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { usePlanMeta, useWorkouts, useGeneratePlan } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronRight, CheckCircle, Calendar, ChevronLeft, Dumbbell, Clock, Flame, Play, X, Zap, Info, ArrowRight, Target, Activity, Cpu } from "lucide-react";
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
            <div className="flex flex-col md:flex-row min-h-screen bg-background relative overflow-hidden">
                <Navigation />
                <main className="flex-1 flex flex-col items-center justify-center gap-8 z-10">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360],
                            borderColor: ["hsl(var(--primary))", "hsl(var(--primary)/0.3)", "hsl(var(--primary))"]
                        }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent shadow-[0_0_50px_rgba(142,214,63,0.3)] flex items-center justify-center"
                    >
                        <Dumbbell className="w-10 h-10 text-primary animate-pulse" />
                    </motion.div>
                    <div className="text-center space-y-4">
                        <h3 className="font-display font-bold text-2xl text-white uppercase tracking-[0.2em] animate-pulse">
                            {isGenerating ? "Synthesizing_Tactical_Protocol" : "Initializing_Neural_Link"}
                        </h3>
                        <div className="flex justify-center gap-1">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                    className="w-2 h-2 bg-primary rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (generationError || (!plan && !isGenerating)) {
        return (
            <div className="flex flex-col md:flex-row min-h-screen bg-background">
                <Navigation />
                <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6 max-w-md mx-auto text-center z-10">
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <X className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-display font-bold text-2xl text-white uppercase tracking-tight">PROTOCOL_FAILURE</h3>
                        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest opacity-60 leading-relaxed">
                            {generationError || "NEURAL_SYNTHESIS_ABORTED: UNABLE_TO_CONSTRUCT_DAILY_ROUTINE"}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full rounded-2xl border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all font-display font-bold uppercase tracking-widest"
                        onClick={handleRetryGeneration}
                    >
                        RE-INITIALIZE
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
        <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Navigation />

            <main className="flex-1 pb-48 md:pb-12 overflow-y-auto px-4 md:px-8">
                <header className="pt-10 pb-10 md:pt-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10 rounded-full" />
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight uppercase">Tactical <span className="text-primary">Ops</span></h1>
                        <div className="flex items-center gap-2 mt-2">
                            <Activity className="w-3 h-3 text-primary opacity-60" />
                            <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60">Status: Performance Mode // Active</p>
                        </div>
                    </motion.div>

                    <div className="flex gap-4">
                        <div className="glass-card py-2 px-6 rounded-2xl border-white/5 flex flex-col items-center">
                            <span className="text-[9px] font-mono text-primary uppercase tracking-widest opacity-60 mb-1">Target_HR</span>
                            <span className="text-lg font-display font-bold text-white tracking-tighter">145<span className="text-[10px] ml-1 text-white/40">BPM</span></span>
                        </div>
                        <div className="glass-card py-2 px-6 rounded-2xl border-white/5 flex flex-col items-center">
                            <span className="text-[9px] font-mono text-primary uppercase tracking-widest opacity-60 mb-1">Total_EXP</span>
                            <span className="text-lg font-display font-bold text-white tracking-tighter">850<span className="text-[10px] ml-1 text-white/40">PTS</span></span>
                        </div>
                    </div>
                </header>

                {/* Tactical Timeline Strip */}
                <section className="mb-12 relative">
                    <div className="glass-card p-4 flex justify-between items-center rounded-3xl border-white/5 shadow-2xl overflow-hidden relative">
                        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                        {weekDays.map((day, idx) => {
                            const active = isSameDay(day, selectedDate);
                            const today = isToday(day);
                            return (
                                <motion.button
                                    key={idx}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "relative flex flex-col items-center py-3 px-4 rounded-2xl transition-all duration-300 min-w-[50px] md:min-w-[64px]",
                                        active ? "bg-primary text-black shadow-[0_0_30px_rgba(142,214,63,0.3)] scale-110 z-10" : "hover:bg-white/5 text-white/40"
                                    )}
                                >
                                    <span className={cn("text-[9px] font-mono font-bold uppercase tracking-widest mb-1", active ? "text-black/60" : "text-white/20")}>
                                        {format(day, "eee")}
                                    </span>
                                    <span className="text-xl font-display font-bold">{format(day, "d")}</span>
                                    {today && !active && <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_#8ED63F]" />}
                                    {active && (
                                        <motion.div
                                            layoutId="active-timeline"
                                            className="absolute inset-0 border-2 border-white/20 rounded-2xl pointer-events-none"
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </section>

                <AnimatePresence mode="wait">
                    {workouts.length === 0 ? (
                        <motion.section
                            key="rest-day"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative"
                        >
                            <div className="glass-card p-16 flex flex-col items-center justify-center text-center rounded-[3rem] border-white/5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 -z-10" />
                                <div className="w-24 h-24 rounded-full glass-card border-white/10 flex items-center justify-center mb-8 shadow-inner">
                                    <Clock className="w-12 h-12 text-primary opacity-40 animate-pulse" />
                                </div>
                                <h2 className="text-4xl font-display font-bold text-white uppercase tracking-tight mb-4">Tactical Recovery</h2>
                                <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest max-w-sm leading-relaxed opacity-60">
                                    Biometric stabilization in progress. Optimal performance requires scheduled downtime for morphological repair.
                                </p>
                                <Button variant="outline" className="mt-10 rounded-2xl px-10 h-14 font-display font-bold uppercase tracking-widest border-white/10 hover:border-primary/40 hover:bg-primary/5 text-xs">
                                    SYNC_RECOVERY_PROTOCOL
                                </Button>
                            </div>
                        </motion.section>
                    ) : (
                        <motion.div
                            key="active-day"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-12"
                        >
                            {/* Mission Profile */}
                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {workouts.map((workout: any) => (
                                    <React.Fragment key={workout.id}>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group"
                                        >
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Dumbbell className="w-32 h-32 text-primary" />
                                            </div>

                                            <div className="flex justify-between items-start mb-10 relative z-10">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-mono font-bold text-primary uppercase tracking-[0.2em]">
                                                            {workout.type} Protocol
                                                        </span>
                                                        {workout.isCompleted && (
                                                            <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                                                                <CheckCircle className="w-3 h-3" />
                                                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest">EXECUTED</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h2 className="text-4xl font-display font-bold tracking-tight text-white uppercase">{workout.name}</h2>
                                                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest opacity-60">
                                                        Instruction: Maintain peak core stabilization throughout cycle.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 relative z-10">
                                                {[
                                                    { label: "Duration", value: `${workout.duration}m`, icon: Clock },
                                                    { label: "Intensity", value: workout.difficulty, icon: Flame },
                                                    { label: "Stability", value: "High", icon: Target },
                                                    { label: "CPU_Load", value: "85%", icon: Cpu }
                                                ].map((stat, i) => (
                                                    <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                                        <stat.icon className="w-4 h-4 text-primary opacity-60" />
                                                        <div>
                                                            <p className="text-[9px] font-mono font-bold uppercase text-white/30 tracking-widest">{stat.label}</p>
                                                            <p className="text-sm font-display font-bold text-white uppercase">{stat.value}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex gap-4 relative z-10">
                                                {!workout.isCompleted ? (
                                                    <Link href={`/workout/${workout.id}/start`} className="flex-1">
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className="w-full h-16 rounded-[1.25rem] bg-primary text-black font-display font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(142,214,63,0.3)] hover:neon-glow transition-all flex items-center justify-center gap-3 border-none outline-none"
                                                        >
                                                            <Play className="w-5 h-5 fill-current" />
                                                            ENGAGE_SESSION
                                                        </motion.button>
                                                    </Link>
                                                ) : (
                                                    <Link href={`/workout/${workout.id}/start`} className="flex-1">
                                                        <Button variant="outline" className="w-full h-16 rounded-[1.25rem] border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary font-display font-bold uppercase tracking-widest">
                                                            RE-RUN_PROTOCOL
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Link href={`/workout/${workout.id}`}>
                                                    <Button variant="ghost" className="h-16 w-16 rounded-[1.25rem] glass-card border-white/5 hover:bg-white/10 text-white/40 p-0">
                                                        <Info className="w-6 h-6" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </motion.div>

                                        {/* Sidebar Intel */}
                                        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-between">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <Zap className="w-5 h-5 text-primary" />
                                                    <h4 className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.3em]">Tactical_Intel</h4>
                                                </div>
                                                <p className="text-sm font-display text-white/80 italic leading-relaxed">
                                                    "Optimize morphological recruitment by decelerating the eccentric phase. Core temperature stabilization is critical."
                                                </p>
                                            </div>

                                            <div className="pt-8 border-t border-white/5 space-y-4">
                                                <button className="w-full text-left flex items-center justify-between group outline-none border-none bg-transparent cursor-pointer">
                                                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest group-hover:text-primary transition-colors">SWAP_PROTOCOL</span>
                                                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-all" />
                                                </button>
                                                <button className="w-full text-left flex items-center justify-between group outline-none border-none bg-transparent cursor-pointer">
                                                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest group-hover:text-primary transition-colors">REDUCE_INTENSITY</span>
                                                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-all" />
                                                </button>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </section>

                            {/* Sub-Routines (Exercise Breakdown) */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-4 px-2">
                                    <Cpu className="w-4 h-4 text-primary opacity-60" />
                                    <h2 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.4em]">Sub_Routine_Sequences</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {workouts.map((workout: any) => (
                                        <React.Fragment key={`breakdown-${workout.id}`}>
                                            {(workout.exercises || []).map((ex: any, idx: number) => {
                                                const hasDetails = typeof ex === 'object' && (ex.sets || ex.reps || ex.duration);
                                                return (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="glass-card p-5 flex items-center justify-between border-white/[0.03] group hover:border-primary/20 transition-all rounded-3xl"
                                                    >
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center font-mono text-sm font-bold text-white/20 group-hover:text-primary transition-colors">
                                                                {String(idx + 1).padStart(2, '0')}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-display font-bold text-white group-hover:text-primary transition-colors uppercase tracking-tight">{typeof ex === 'string' ? ex : ex.name}</h4>
                                                                {hasDetails && (
                                                                    <div className="flex gap-2 mt-1">
                                                                        {[
                                                                            ex.sets && { l: "SET", v: ex.sets },
                                                                            ex.reps && { l: "REP", v: ex.reps },
                                                                            ex.duration && { l: "DUR", v: `${ex.duration}s` }
                                                                        ].filter(Boolean).map((d: any, i) => (
                                                                            <span key={i} className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-[0.1em]">
                                                                                {d.l}_<span className="text-white/60">{d.v}</span> {i < 1 && "•"}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all">
                                                            <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-primary" />
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
