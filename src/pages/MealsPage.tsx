import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMeals, useToggleMealConsumed } from "@/hooks/use-meals";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Utensils, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, Plus } from "lucide-react";
import { format, addDays, subDays, isToday, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function MealsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [, setLocation] = useLocation();
    const { data: meals = [], isLoading } = useMeals(selectedDate);
    const { mutate: toggleConsumed } = useToggleMealConsumed();

    const [activeMealId, setActiveMealId] = useState<number | null>(null);
    const [showConsumptionPrompt, setShowConsumptionPrompt] = useState(false);

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
                        <p className="text-xs font-semibold text-slate-400 mb-1">Nutrition Plan</p>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Today's Fuel</h1>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-full p-1 shadow-sm">
                        <button
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-slate-600 w-20 text-center">
                            {isToday(selectedDate) ? "Today" : format(selectedDate, "MMM d")}
                        </span>
                        <button
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Minimal Date Strip */}
                <div className="flex justify-between items-center px-1">
                    {weekDays.map((baseDay: Date, idx: number) => {
                        const active = isSameDay(baseDay, selectedDate);
                        const today = isToday(baseDay);
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDate(baseDay)}
                                className={cn(
                                    "flex flex-col items-center justify-center w-10 h-14 rounded-2xl transition-all",
                                    active ? "brand-gradient text-white shadow-lg shadow-brand-blue/30 scale-110" : "bg-transparent text-slate-400 hover:bg-slate-50"
                                )}
                            >
                                <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5">{format(baseDay, "eee")}</span>
                                <span className={cn("text-sm font-bold", active ? "text-white" : "text-slate-700")}>{format(baseDay, "d")}</span>
                                {today && !active && <div className="w-1 h-1 bg-brand-blue rounded-full mt-1" />}
                            </button>
                        );
                    })}
                </div>

                {/* Meals List */}
                <section className="space-y-3">
                    <SectionHeader title={`Scheduled Intake (${meals.length})`} />

                    <div className="space-y-3">
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
                                        "bg-white rounded-3xl p-4 flex items-center justify-between border transition-all cursor-pointer shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md",
                                        meal.isConsumed || meal.consumedAlternative ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100 hover:border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                            meal.isConsumed || meal.consumedAlternative ? "bg-emerald-500 text-white shadow-sm" : "bg-brand-blue/10 text-brand-blue"
                                        )}>
                                            {meal.isConsumed || meal.consumedAlternative ? <CheckCircle2 className="w-6 h-6" /> : <Utensils className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                                {meal.type}
                                            </p>
                                            <h4 className={cn("text-base font-bold tracking-tight leading-tight", (meal.isConsumed || meal.consumedAlternative) ? "text-emerald-900 line-through decoration-emerald-500/30" : "text-slate-900")}>
                                                {meal.consumedAlternative ? meal.alternativeDescription : meal.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                                    {meal.consumedAlternative ? meal.alternativeCalories : meal.calories} kcal
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                                    {meal.consumedAlternative ? meal.alternativeProtein : meal.protein}g prot
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {meals.length === 0 && !isLoading && (
                            <div className="bg-slate-50 rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-dashed border-slate-200">
                                <Utensils className="w-8 h-8 text-slate-300 mb-3" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Meals Planned</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Log Button */}
                <Link href="/log-meal">
                    <button className="w-full py-4 rounded-3xl brand-gradient text-white font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-blue/20">
                        <Plus className="w-4 h-4" /> Log Extra Meal
                    </button>
                </Link>
            </div>

            <Dialog open={showConsumptionPrompt} onOpenChange={setShowConsumptionPrompt}>
                <DialogContent className="max-w-[320px] rounded-[32px] p-6 border-none bg-white shadow-2xl outline-none">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 rounded-3xl bg-brand-blue/10 flex items-center justify-center mb-4 text-brand-blue">
                            <Utensils className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Track Consumption</h3>
                        <p className="text-xs font-medium text-slate-500 mt-1 max-w-[200px]">Did you stick to the plan or try something else?</p>
                    </div>

                    <div className="space-y-3">
                        <button
                            className="w-full h-14 rounded-2xl bg-brand-gradient text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            style={{ background: 'linear-gradient(135deg, #2F80ED 0%, #27AE60 100%)' }}
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
                                <button className="w-full h-12 rounded-2xl bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100">
                                    View Details
                                </button>
                            </Link>
                            <button
                                className="w-full h-12 rounded-2xl bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
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
    );
}
