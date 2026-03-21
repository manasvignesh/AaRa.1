import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMeals, useToggleMealConsumed } from "@/hooks/use-meals";
import { useGeneratePlan, usePlanMeta } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Utensils, ChevronLeft, ChevronRight, CheckCircle2, Loader2, Plus, RefreshCw } from "lucide-react";
import { format, addDays, subDays, isToday, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function MealsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [, setLocation] = useLocation();
    const { data: user, isLoading: userLoading } = useUserProfile();
    const { data: plan, isLoading: planLoading } = usePlanMeta(selectedDate);
    const { data: meals = [], isLoading: mealsLoading } = useMeals(selectedDate);
    const { mutate: generatePlan, isPending: isGenerating } = useGeneratePlan();
    const { mutate: toggleConsumed } = useToggleMealConsumed();
    const [generationError, setGenerationError] = useState<string | null>(null);

    const [activeMealId, setActiveMealId] = useState<number | null>(null);
    const [showConsumptionPrompt, setShowConsumptionPrompt] = useState(false);

    useEffect(() => {
        if (!userLoading && user && !planLoading && !plan && !isGenerating && !generationError) {
            generatePlan(selectedDate, {
                onError: (err: any) => {
                    setGenerationError(err.message || "Failed to generate meals for this day.");
                }
            });
        }
    }, [userLoading, user, planLoading, plan, isGenerating, generationError, generatePlan, selectedDate]);

    useEffect(() => {
        setGenerationError(null);
    }, [selectedDate]);

    const isLoading = userLoading || planLoading || mealsLoading || isGenerating;

    const handleRetryGeneration = () => {
        setGenerationError(null);
        generatePlan(selectedDate, {
            onError: (err: any) => {
                setGenerationError(err.message || "Failed to generate meals for this day.");
            }
        });
    };

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
                            <p className="text-[11px] font-bold tracking-wider uppercase text-muted mb-[4px]" style={{ color: "var(--text-secondary)" }}>Nutrition Plan</p>
                            <h1 className="font-display text-[28px] font-bold tracking-tight leading-none mb-[16px]" style={{ color: "var(--text-primary)" }}>Today's Fuel</h1>
                        </div>
                        <div className="flex items-center justify-between rounded-full h-[36px] px-1 shadow-[0_4px_20px_rgba(47,128,237,0.07)]" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                            <button
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                style={{ color: "var(--text-muted)" }}
                                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[13px] font-semibold px-2 min-w-[60px] text-center" style={{ color: "var(--text-primary)" }}>
                                {isToday(selectedDate) ? "TODAY" : format(selectedDate, "MMM d")}
                            </span>
                            <button
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                style={{ color: "var(--text-muted)" }}
                                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col gap-[24px]">
                    {/* Minimal Date Strip */}
                    <div className="flex justify-between items-center px-1 h-[64px] mb-[16px] stagger-1">
                        {weekDays.map((baseDay: Date, idx: number) => {
                            const active = isSameDay(baseDay, selectedDate);
                            const today = isToday(baseDay);
                            return (
                                <div key={idx} className="flex flex-col items-center justify-center w-[40px] gap-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{format(baseDay, "eee")}</span>
                                    <button
                                        onClick={() => setSelectedDate(baseDay)}
                                        className={cn(
                                            "flex items-center justify-center w-[40px] h-[40px] rounded-full transition-all relative",
                                            active ? "bg-brand text-white shadow-lg shadow-brand/30" : "bg-transparent hover:bg-surface-2"
                                        )}
                                    >
                                        <span className="text-[16px] font-semibold" style={{ color: active ? "#ffffff" : "var(--text-primary)" }}>{format(baseDay, "d")}</span>
                                        {today && !active && <div className="absolute bottom-1 w-1 h-1 bg-brand rounded-full" />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Meals List */}
                    <section className="flex flex-col gap-[12px] stagger-2">
                        <SectionHeader title={`Scheduled Intake (${meals.length})`} />

                        <div className="flex flex-col gap-[10px]">
                            {generationError && !isLoading && (
                                <div className="rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3" style={{ backgroundColor: "var(--surface-1)", border: "1px solid rgba(220,38,38,0.25)" }}>
                                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#DC2626" }}>Plan Generation Failed</p>
                                    <button
                                        onClick={handleRetryGeneration}
                                        className="h-[40px] px-[16px] rounded-full inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest"
                                        style={{ backgroundColor: "var(--surface-2)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)" }}
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Retry
                                    </button>
                                </div>
                            )}

                            {isLoading && (
                                <div className="rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-dashed" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                                    <Loader2 className="w-8 h-8 text-brand mb-3 animate-spin" />
                                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Preparing Meals</p>
                                </div>
                            )}

                            <AnimatePresence mode="popLayout">
                                {meals.map((meal: any, i: number) => (
                                    <motion.div
                                        key={meal.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => {
                                            setActiveMealId(meal.id);
                                            setShowConsumptionPrompt(true);
                                        }}
                                        className={cn(
                                            "rounded-[20px] px-[16px] py-[14px] flex items-center justify-between border transition-all cursor-pointer shadow-[0_4px_20px_rgba(47,128,237,0.07)] hover:shadow-md h-auto",
                                            meal.isConsumed || meal.consumedAlternative ? "" : "feature-card"
                                        )}
                                        style={meal.isConsumed || meal.consumedAlternative ? { backgroundColor: "rgba(39,174,96,0.12)", borderColor: "rgba(39,174,96,0.25)" } : { backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}
                                    >
                                        <div className="flex items-center gap-[12px] min-w-0 pr-2">
                                            <div className={cn(
                                                "w-[40px] h-[40px] rounded-[12px] flex items-center justify-center shrink-0 transition-colors",
                                                meal.isConsumed || meal.consumedAlternative ? "bg-[#27AE60] text-white shadow-sm" : "text-brand"
                                            )}>
                                                {meal.isConsumed || meal.consumedAlternative ? <CheckCircle2 className="w-[20px] h-[20px]" /> : <Utensils className="w-[18px] h-[18px]" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-[2px]" style={{ color: "var(--text-secondary)" }}>
                                                    {meal.type}
                                                </p>
                                                <h4 className={cn("text-[15px] font-semibold truncate leading-tight", (meal.isConsumed || meal.consumedAlternative) ? "text-[#27AE60] line-through decoration-[#27AE60]/30" : "")} style={{ color: meal.isConsumed || meal.consumedAlternative ? "#27AE60" : "var(--text-primary)" }}>
                                                    {meal.consumedAlternative ? meal.alternativeDescription : meal.name}
                                                    {!meal.consumedAlternative && meal.isWeightLossFriendly &&
                                                        ["overweight", "obese", "severely_obese"].includes(String(user?.weightCategory)) && (
                                                            <span
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "999px",
                                                                    background: "rgba(39,174,96,0.1)",
                                                                    border: "1px solid rgba(39,174,96,0.2)",
                                                                    fontSize: "10px",
                                                                    fontWeight: 600,
                                                                    color: "#27AE60",
                                                                    marginLeft: "6px",
                                                                }}
                                                            >
                                                                ✓ Recommended
                                                            </span>
                                                        )}
                                                    {!meal.consumedAlternative && meal.isMuscleGainFriendly &&
                                                        ["underweight", "healthy"].includes(String(user?.weightCategory)) &&
                                                        String(user?.primaryGoal) === "muscle_gain" && (
                                                            <span
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "999px",
                                                                    background: "rgba(47,128,237,0.1)",
                                                                    border: "1px solid rgba(47,128,237,0.2)",
                                                                    fontSize: "10px",
                                                                    fontWeight: 600,
                                                                    color: "#2F80ED",
                                                                    marginLeft: "6px",
                                                                }}
                                                            >
                                                                Muscle Fuel
                                                            </span>
                                                        )}
                                                </h4>
                                                <div className="flex items-center gap-[6px] mt-1">
                                                    <span className="h-[26px] px-[10px] rounded-full inline-flex items-center text-brand text-[11px] font-bold" style={{ backgroundColor: "var(--surface-2)" }}>
                                                        {meal.consumedAlternative ? meal.alternativeCalories : meal.calories} kcal
                                                    </span>
                                                    <span className="h-[26px] px-[10px] rounded-full inline-flex items-center text-brand text-[11px] font-bold" style={{ backgroundColor: "var(--surface-2)" }}>
                                                        {meal.consumedAlternative ? meal.alternativeProtein : meal.protein}g prot
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-[32px] h-[32px] shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--surface-2)", color: "var(--text-muted)" }}>
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {meals.length === 0 && !isLoading && !generationError && (
                                <div className="rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-dashed" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                                    <Utensils className="w-8 h-8 mb-3" style={{ color: "var(--text-muted)" }} />
                                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>No Meals Planned</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Log Button */}
                    <div className="stagger-3 mt-[20px]">
                        <Link href="/log-meal">
                            <button className="w-full h-[52px] rounded-[16px] btn-primary text-white font-bold text-[14px] hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(47,128,237,0.07)] border-0">
                                <Plus className="w-[18px] h-[18px]" /> Log Extra Meal
                            </button>
                        </Link>
                    </div>
                </div>

                <Dialog open={showConsumptionPrompt} onOpenChange={setShowConsumptionPrompt}>
                    <DialogContent className="max-w-[320px] rounded-[32px] p-6 border-none shadow-[0_4px_20px_rgba(47,128,237,0.15)] outline-none" style={{ backgroundColor: "var(--surface-1)", color: "var(--text-primary)" }}>
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 text-brand" style={{ backgroundColor: "var(--surface-2)" }}>
                                <Utensils className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-display font-bold" style={{ color: "var(--text-primary)" }}>Track Consumption</h3>
                            <p className="text-xs font-medium mt-1 max-w-[200px]" style={{ color: "var(--text-muted)" }}>Did you stick to the plan or try something else?</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                className="w-full h-14 rounded-2xl btn-primary text-white font-bold text-[10px] uppercase tracking-widest shadow-[0_4px_20px_rgba(47,128,237,0.07)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity border-0"
                                onClick={() => {
                                    if (!activeMealId) return;
                                    toggleConsumed({ id: activeMealId, isConsumed: true, date: format(selectedDate, 'yyyy-MM-dd') });
                                    setShowConsumptionPrompt(false);
                                    setActiveMealId(null);
                                }}
                            >
                                Mark Consumed <CheckCircle2 className="w-4 h-4" />
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <Link href={`/meal/${format(selectedDate, 'yyyy-MM-dd')}/${activeMealId}`}>
                                    <button className="w-full h-12 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border" style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", borderColor: "var(--border)" }}>
                                        View Details
                                    </button>
                                </Link>
                                <button
                                    className="w-full h-12 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border"
                                    style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", borderColor: "var(--border)" }}
                                    onClick={() => {
                                        setShowConsumptionPrompt(false);
                                        const mid = activeMealId;
                                        setActiveMealId(null);
                                        if (mid) setLocation(`/meal/${format(selectedDate, 'yyyy-MM-dd')}/${mid}`);
                                    }}
                                >
                                    Edit / Swap
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </PageLayout>
        </div>
    );
}
