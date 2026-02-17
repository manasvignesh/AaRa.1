import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { usePlanMeta, useGeneratePlan, useUpdateWater, useWorkouts } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { useMeals } from "@/hooks/use-meals";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { MacroRing } from "@/components/MacroRing";
import { Loader2, Plus, ChevronRight, Droplets, Minus, Zap, Footprints, Trophy, PlayCircle } from "lucide-react";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useUserProfile();
  const { data: plan, isLoading: planLoading } = usePlanMeta(selectedDate);
  const { data: meals = [], isLoading: mealsLoading } = useMeals(selectedDate);
  const { data: workouts = [], isLoading: workoutsLoading } = useWorkouts(selectedDate);
  const { mutate: generatePlan, isPending: isGenerating } = useGeneratePlan();
  const { mutate: updateWater } = useUpdateWater();

  const [generationError, setGenerationError] = useState<string | null>(null);

  // Derive totals
  const caloriesProgress = meals.reduce((sum: number, m: any) => {
    if (m.consumedAlternative) return sum + (m.alternativeCalories || 0);
    if (m.isConsumed) return sum + (m.calories || 0);
    return sum;
  }, 0);

  const proteinProgress = meals.reduce((sum: number, m: any) => {
    if (m.consumedAlternative) return sum + (m.alternativeProtein || 0);
    if (m.isConsumed) return sum + (m.protein || 0);
    return sum;
  }, 0);

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

  const handleAddWater = () => {
    if (!plan) return;
    updateWater({ date: format(selectedDate, "yyyy-MM-dd"), amount: 250 });
  };

  const handleSubtractWater = () => {
    if (!plan || (plan.waterIntake || 0) <= 0) return;
    updateWater({ date: format(selectedDate, "yyyy-MM-dd"), amount: -250 });
  };

  const isHydrated = plan ? (plan.waterIntake || 0) >= 2000 : false;

  const caloriesTarget = plan?.caloriesTarget || 2000;
  const proteinTarget = plan?.proteinTarget || 150;
  const remainingCalories = Math.max(0, caloriesTarget - caloriesProgress);

  if (userLoading || (planLoading && !plan) || isGenerating) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
          <p className="text-sm font-medium text-slate-500">Syncing your plan...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1">{format(selectedDate, 'EEEE, MMM do')}</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hello, {user?.displayName || "Athlete"}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
            {user?.displayName?.[0]}
          </div>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Main Summary Card */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
          {/* Subtle background blurs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-blue/5 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-green/5 rounded-full blur-3xl -z-10" />

          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <MacroRing
                caloriesTarget={caloriesTarget}
                caloriesCurrent={caloriesProgress}
                proteinTarget={proteinTarget}
                proteinCurrent={proteinProgress}
                size={130}
              />
            </div>
            <div className="flex-1 space-y-5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Calories Remaining</p>
                <p className="text-3xl font-bold text-slate-900 leading-none tracking-tight">{Math.round(remainingCalories)}</p>
              </div>
              <div className="pt-2 border-t border-slate-50">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Protein Goal</p>
                  <span className="text-[10px] font-medium text-slate-400">{proteinTarget}g</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-green rounded-full transition-all duration-1000 ease-out" style={{ width: `${(proteinProgress / proteinTarget) * 100}%` }} />
                </div>
                <p className="text-right text-[10px] font-bold text-brand-green mt-1">{Math.round(proteinProgress)}g</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Row */}
        <section className="grid grid-cols-2 gap-4">
          {/* Hydration Mini-Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col justify-between h-36 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start relative z-10">
              <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center transition-all shadow-sm", isHydrated ? "bg-blue-500 text-white shadow-blue-200" : "bg-white border border-slate-100 text-blue-500")}>
                <Droplets className="w-4 h-4 fill-current" />
              </div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">H2O</span>
            </div>

            <div className="relative z-10">
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-xl font-bold text-slate-900">{plan?.waterIntake || 0}</span>
                <span className="text-xs font-semibold text-slate-400">ml</span>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSubtractWater} className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors"><Minus className="w-3.5 h-3.5 text-slate-400" /></button>
                <button onClick={handleAddWater} className="flex-1 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Quick Log Meal */}
          <Link href="/log-meal">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col justify-between h-36 shadow-sm relative overflow-hidden cursor-pointer group hover:border-emerald-200 transition-all">
              <div className="absolute inset-0 bg-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex justify-between items-start relative z-10">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Log</span>
              </div>

              <div className="relative z-10">
                <p className="text-sm font-bold text-slate-900 leading-tight mb-1">Track<br />Manual Meal</p>
                <div className="flex items-center gap-1 text-emerald-600">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Entry</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Workout Feature */}
        <section>
          <SectionHeader title="Training" action={<Link href="/workouts"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-brand-blue transition-colors">View All</span></Link>} />
          {workouts.length > 0 ? (
            <Link href={`/workout/${workouts[0].id}`}>
              <div className="group bg-white rounded-[24px] p-1 shadow-lg shadow-slate-200/50 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden border border-slate-100">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 opacity-50" />

                {/* Decorative blur */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-blue/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-blue/10 transition-colors" />

                <div className="relative z-10 p-5 rounded-[22px] flex justify-between items-center h-28">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200">{workouts[0].difficulty}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200">{workouts[0].duration} min</span>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-0.5">{workouts[0].name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Session</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-brand-blue flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 transition-all shadow-md shadow-blue-200">
                    <PlayCircle className="w-6 h-6 text-white fill-current" />
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-6 text-center border border-slate-100 border-dashed h-24 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Zap className="w-5 h-5 text-slate-300" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rest Day Active</p>
              </div>
            </div>
          )}
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          {[
            { label: "Daily Steps", val: "8,204", icon: Footprints, color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
            { label: "Day Streak", val: "12 Days", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" }
          ].map((stat, i) => (
            <div key={i} className={cn("bg-white p-5 rounded-3xl border flex flex-col justify-center gap-3 shadow-sm", stat.bg)}>
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-sm", stat.color)}>
                <stat.icon className="w-5 h-5 fill-current opacity-20" />
                <stat.icon className="w-5 h-5 absolute" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 leading-tight tracking-tight">{stat.val}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider opacity-80">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

      </div>
    </PageLayout>
  );
}
