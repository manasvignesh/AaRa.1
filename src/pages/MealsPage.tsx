import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMeals, useToggleMealConsumed } from "@/hooks/use-meals";
import { PageLayout } from "@/components/PageLayout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Utensils, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, ArrowRight, Calendar as CalendarIcon } from "lucide-react";
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
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">
                            Fuel Strategy
                        </p>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">Nutrition</h1>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <button
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 backdrop-blur-xl border border-slate-100 text-primary hover:bg-white/80 transition-all"
                            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 backdrop-blur-xl border border-slate-100 text-primary hover:bg-white/80 transition-all"
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-8 pb-10">
                {/* Weekly Timeline */}
                <section>
                    <div className="wellness-card p-3 flex justify-between items-center bg-white/40 backdrop-blur-xl border-white/20 shadow-xl">
                        {weekDays.map((baseDay: Date, idx: number) => {
                            const active = isSameDay(baseDay, selectedDate);
                            const today = isToday(baseDay);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(baseDay)}
                                    className={cn(
                                        "flex flex-col items-center py-3 px-3 rounded-2xl transition-all w-12",
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

                {/* Meals List */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] leading-none">
                            Scheduled Intake
                        </h2>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                            {meals.length} Meals
                        </span>
                    </div>

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
                                        "wellness-card p-5 flex items-center justify-between transition-all group cursor-pointer border-slate-100",
                                        meal.isConsumed || meal.consumedAlternative ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/60 hover:bg-white/80"
                                    )}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm",
                                            meal.isConsumed || meal.consumedAlternative ? "brand-gradient text-white" : "bg-white text-muted-foreground/40"
                                        )}>
                                            {meal.isConsumed || meal.consumedAlternative ? <CheckCircle2 className="w-6 h-6" /> : <Utensils className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1 opacity-70">
                                                {meal.type}
                                            </p>
                                            <h4 className="text-lg font-black tracking-tight leading-none mb-1 text-foreground">
                                                {meal.consumedAlternative ? meal.alternativeDescription : meal.name}
                                            </h4>
                                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
                                                {meal.consumedAlternative ? meal.alternativeCalories : meal.calories} kcal • {meal.consumedAlternative ? meal.alternativeProtein : meal.protein}g protein
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {meals.length === 0 && !isLoading && (
                            <div className="wellness-card p-10 flex flex-col items-center justify-center text-center opacity-40 bg-white/40">
                                <Utensils className="w-10 h-10 opacity-20 mb-3" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Nutrition Data</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Global Consumption Button */}
                <section>
                    <Link href="/log-meal">
                        <button className="w-full h-16 rounded-full bg-slate-100 border border-slate-200 text-foreground font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
                            <Sparkles className="w-4 h-4 text-primary" /> Log Manual Entry
                        </button>
                    </Link>
                </section>
            </div>

            <Dialog open={showConsumptionPrompt} onOpenChange={setShowConsumptionPrompt}>
                <DialogContent className="max-w-[320px] rounded-[32px] p-0 overflow-hidden border-none bg-white/90 backdrop-blur-3xl shadow-2xl">
                    <div className="brand-gradient p-10 text-center text-white space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl mx-auto flex items-center justify-center border border-white/20">
                            <Utensils className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black tracking-tighter uppercase">Nutrition Log</h3>
                    </div>
                    <div className="p-8 space-y-4">
                        <button
                            className="w-full h-14 rounded-full brand-gradient text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
                            onClick={() => {
                                if (!activeMealId) return;
                                toggleConsumed({ id: activeMealId, isConsumed: true, date: format(selectedDate, 'yyyy-MM-dd') });
                                setShowConsumptionPrompt(false);
                                setActiveMealId(null);
                            }}
                        >
                            Verify Consumed <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href={`/meal/${format(selectedDate, 'yyyy-MM-dd')}/${activeMealId}`}>
                                <button className="w-full h-14 rounded-full bg-slate-100 text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200">
                                    Details
                                </button>
                            </Link>
                            <button
                                className="w-full h-14 rounded-full bg-slate-100 text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
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
