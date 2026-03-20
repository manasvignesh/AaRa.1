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
            <div className="page-transition">
                <PageLayout
                    header={
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-[4px]">
                                {format(selectedDate, "EEEE, MMMM do")}
                            </p>
                            <h1 className="font-display text-[32px] font-bold tracking-tighter leading-none text-[var(--text-primary)]">Training Plan</h1>
                        </div>
                    }
                >
                    <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] gap-6 text-center text-[var(--text-primary)]">
                        <Loader2 className="w-12 h-12 text-brand animate-spin" />
                        <div className="space-y-2">
                            <p className="text-xl font-bold tracking-tight animate-pulse uppercase opacity-70">Synthesizing Protocol</p>
                        </div>
                    </div>
                </PageLayout>
            </div>
        );
    }

    const weekDays = eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6)
    });

    return (
        <div className="page-transition">
            <PageLayout
                maxWidth="md"
                header={
                    <div className="flex justify-between items-end mb-[16px]">
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-[4px]">
                                {format(selectedDate, "EEEE, MMMM do")}
                            </p>
                            <h1 className="font-display text-[32px] font-bold tracking-tighter leading-none text-[var(--text-primary)]">Training</h1>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <button
                                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                                className="w-[36px] h-[36px] rounded-full flex items-center justify-center bg-[var(--surface-1)] shadow-sm border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)] transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                                className="w-[36px] h-[36px] rounded-full flex items-center justify-center bg-[var(--surface-1)] shadow-sm border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)] transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-8 pb-10">
                    {/* Weekly Strip */}
                    <section className="stagger-1 mb-[16px]">
                        <div className="flex justify-between items-center px-1 h-[64px]">
                            {weekDays.map((baseDay: Date, idx: number) => {
                                const active = isSameDay(baseDay, selectedDate);
                                const today = isToday(baseDay);
                                return (
                                    <div key={idx} className="flex flex-col items-center justify-center w-[40px] gap-1">
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">{format(baseDay, "eee")}</span>
                                        <button
                                            onClick={() => setSelectedDate(baseDay)}
                                            className={cn(
                                                "flex items-center justify-center w-[40px] h-[40px] rounded-full transition-all relative",
                                                active ? "bg-brand text-white shadow-lg shadow-brand/30" : "bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                                            )}
                                        >
                                            <span className={cn("text-[16px] font-semibold", active ? "text-white" : "text-[var(--text-primary)]")}>{format(baseDay, "d")}</span>
                                            {today && !active && <div className="absolute bottom-1 w-1 h-1 bg-brand rounded-full" />}
                                        </button>
                                    </div>
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
                                className="py-10 text-center stagger-2"
                            >
                                <div className="wellness-card p-10 flex flex-col items-center justify-center space-y-6">
                                    <div className="w-20 h-20 rounded-[28px] bg-[#2F80ED]/5 flex items-center justify-center">
                                        <Clock className="w-10 h-10 text-brand opacity-60" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="font-display text-2xl font-bold tracking-tighter uppercase text-[var(--text-primary)]">Regeneration</h2>
                                        <p className="text-sm text-[var(--text-muted)] font-medium max-w-[200px] mx-auto leading-relaxed">
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
                                <section className="space-y-[12px] stagger-2">
                                    <SectionHeader title="Active Protocol" />
                                    {workouts.map((workout: any) => (
                                        <Link key={workout.id} href={`/workout/${workout.id}`}>
                                            <div className="wellness-card p-[20px] max-h-[160px] cursor-pointer group hover:-translate-y-1 transition-all relative overflow-hidden shadow-[0_4px_20px_rgba(47,128,237,0.07)]">
                                                {workout.isCompleted && (
                                                    <div className="absolute top-4 right-4 flex items-center gap-1.5 py-1 px-3 rounded-full bg-[#27AE60]/10 text-[#27AE60]">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Mastered</span>
                                                    </div>
                                                )}

                                                <div className="flex h-full flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-[8px] h-[8px] rounded-full brand-gradient" />
                                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">{workout.type}</span>
                                                        </div>

                                                        <div className="pr-[64px]">
                                                            <h2 className="font-display text-[22px] font-bold tracking-tighter text-[var(--text-primary)] mb-[4px] leading-tight">{workout.name}</h2>
                                                            <p className="text-[13px] text-[var(--text-muted)] font-medium leading-relaxed truncate mb-[16px]">
                                                                {workout.description || "Optimized resistance sequence for peak performance."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex border border-[#1E2A3A]/10 text-[13px] font-bold rounded-lg overflow-hidden text-[var(--text-primary)]">
                                                                <span className="px-2 border-r border-[#1E2A3A]/10">{workout.duration} min</span>
                                                                <span className="px-2">~{Math.round(workout.duration * 7)} kcal</span>
                                                            </div>
                                                        </div>
                                                        <div className="absolute right-5 bottom-5 w-[52px] h-[52px] rounded-full brand-gradient flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                                            {workout.isCompleted ? <CheckCircle2 className="w-8 h-8" /> : <PlayCircle className="w-8 h-8 fill-current" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </section>

                                {/* Stats */}
                                <section className="space-y-[12px] stagger-3">
                                    <SectionHeader title="Training Metrics" />
                                    <div className="grid grid-cols-2 gap-[10px]">
                                        <div className="metric-card p-[16px] rounded-[20px] min-h-[100px] flex flex-col justify-center">
                                            <div className="w-[36px] h-[36px] rounded-[10px] bg-[#2F80ED]/10 flex items-center justify-center text-brand">
                                                <Trophy className="w-[18px] h-[18px]" />
                                            </div>
                                            <div className="mt-[12px]">
                                                <p className="font-display text-[26px] font-bold tracking-tighter leading-none text-[var(--text-primary)]">240 <span className="text-xs opacity-40 font-bold text-[var(--text-muted)]">m</span></p>
                                                <p className="text-[10px] font-bold tracking-widest uppercase mt-[4px] text-[var(--text-muted)]">Weekly Volume</p>
                                            </div>
                                        </div>
                                        <div className="metric-card p-[16px] rounded-[20px] min-h-[100px] flex flex-col justify-center">
                                            <div className="w-[36px] h-[36px] rounded-[10px] bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                <Zap className="w-[18px] h-[18px]" />
                                            </div>
                                            <div className="mt-[12px]">
                                                <p className="font-display text-[26px] font-bold tracking-tighter leading-none text-[var(--text-primary)]">8.2 <span className="text-xs opacity-40 font-bold text-[var(--text-muted)]">lvl</span></p>
                                                <p className="text-[10px] font-bold tracking-widest uppercase mt-[4px] text-[var(--text-muted)]">Intensity Vector</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </PageLayout>
        </div>
    );
}
