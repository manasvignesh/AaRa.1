import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { Droplets, Footprints, Loader2, Plus, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

import { usePlanMeta, useGeneratePlan, useUpdateWater, useWorkouts } from "@/hooks/use-plans";
import { useUserProfile, useUserStats } from "@/hooks/use-user";
import { useMeals } from "@/hooks/use-meals";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { MacroRing } from "@/components/MacroRing";
import { ThemeToggle } from "@/components/ThemeToggle";
import { healthService, type ActivityStats } from "@/lib/health";

const bmiDisplayNames: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string; tip: string }
> = {
  underweight: {
    label: "Building Phase",
    color: "#6AAFF5",
    bgColor: "rgba(47,128,237,0.1)",
    borderColor: "rgba(47,128,237,0.25)",
    tip: "Focus on calorie-dense nutritious meals",
  },
  healthy: {
    label: "In the Zone",
    color: "#27AE60",
    bgColor: "rgba(39,174,96,0.1)",
    borderColor: "rgba(39,174,96,0.25)",
    tip: "Maintain your great habits",
  },
  overweight: {
    label: "Active Transformation",
    color: "#E8A93A",
    bgColor: "rgba(232,169,58,0.1)",
    borderColor: "rgba(232,169,58,0.25)",
    tip: "High fiber meals are your best friend",
  },
  obese: {
    label: "Power Journey",
    color: "#F5A623",
    bgColor: "rgba(245,166,35,0.1)",
    borderColor: "rgba(245,166,35,0.25)",
    tip: "Small consistent steps create big changes",
  },
  severely_obese: {
    label: "Strong Start",
    color: "#E8A93A",
    bgColor: "rgba(232,169,58,0.1)",
    borderColor: "rgba(232,169,58,0.25)",
    tip: "Every healthy choice counts. You've got this",
  },
};

export default function Dashboard() {
  const [selectedDate] = useState(new Date());
  const { data: user, isLoading: userLoading } = useUserProfile();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: plan, isLoading: planLoading } = usePlanMeta(selectedDate);
  const { data: meals = [] } = useMeals(selectedDate);
  const { data: workouts = [] } = useWorkouts(selectedDate);
  const { mutate: generatePlan, isPending: isGenerating } = useGeneratePlan();
  const { mutate: updateWater } = useUpdateWater();
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityStats>({
    steps: 0,
    distance: 0,
    calories: 0,
    activeTime: 0,
  });
  const [noticeAcknowledged, setNoticeAcknowledged] = useState(true);

  const caloriesProgress = meals.reduce((sum: number, meal: any) => {
    if (meal.consumedAlternative) return sum + (meal.alternativeCalories || 0);
    if (meal.isConsumed) return sum + (meal.calories || 0);
    return sum;
  }, 0);

  const proteinProgress = meals.reduce((sum: number, meal: any) => {
    if (meal.consumedAlternative) return sum + (meal.alternativeProtein || 0);
    if (meal.isConsumed) return sum + (meal.protein || 0);
    return sum;
  }, 0);

  useEffect(() => {
    if (!userLoading && user && !planLoading && !plan && !isGenerating && !generationError) {
      generatePlan(selectedDate, {
        onError: (err: any) => setGenerationError(err.message || "Failed to generate plan."),
      });
    }
  }, [plan, planLoading, isGenerating, selectedDate, generatePlan, user, userLoading, generationError]);

  useEffect(() => {
    const unsub = healthService.subscribe(setActivity);
    // Start motion-based steps tracking when the dashboard is open (works while app is open).
    // On iOS this may require user gesture; if permission isn't granted, it silently stays disabled.
    void healthService.enableStepCounter();
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      setNoticeAcknowledged(localStorage.getItem("aara_notice_ack") === "true");
    } catch {
      setNoticeAcknowledged(true);
    }
  }, []);

  if (userLoading || statsLoading || (planLoading && !plan) || isGenerating) {
    return (
      <PageLayout>
        <div className="page-transition flex min-h-[70vh] items-center justify-center">
          <div className="wellness-card flex flex-col items-center gap-4 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p style={{ color: "var(--text-secondary)" }}>Syncing your plan...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const caloriesTarget = plan?.caloriesTarget || 2000;
  const proteinTarget = plan?.proteinTarget || 150;
  const remainingCalories = Math.max(0, caloriesTarget - caloriesProgress);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const stepsGoal = 10000;
  const stepsProgress = Math.max(0, Math.floor(activity.steps || 0));
  const stepsPercent = Math.min(100, Math.round((stepsProgress / stepsGoal) * 100));

  return (
    <PageLayout
      header={
        <div className="flex items-start justify-between">
          <div className="animate-slide-up">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted mb-1" style={{ color: "var(--text-secondary)" }}>{format(selectedDate, "EEEE, MMM do")}</p>
            <h1 className="font-display brand-gradient-text text-[32px] font-bold leading-none mb-1">
              Hello, {user?.displayName || "Athlete"}
            </h1>
            <p className="text-[14px] leading-[1.6] mb-[24px]" style={{ color: "var(--text-secondary)" }}>
              Your wellness dashboard is ready for today.
            </p>
          </div>
          <ThemeToggle />
        </div>
      }
    >
      <div className="space-y-[24px] page-transition">
        {user?.weightCategory && user?.bmi && bmiDisplayNames[String(user.weightCategory)] && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderRadius: "16px",
              background: bmiDisplayNames[String(user.weightCategory)].bgColor,
              border: `1px solid ${bmiDisplayNames[String(user.weightCategory)].borderColor}`,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "2px",
                }}
              >
                YOUR PHASE
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: bmiDisplayNames[String(user.weightCategory)].color,
                }}
              >
                {bmiDisplayNames[String(user.weightCategory)].label}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {bmiDisplayNames[String(user.weightCategory)].tip}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{
                  fontSize: "28px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: bmiDisplayNames[String(user.weightCategory)].color,
                  lineHeight: 1,
                }}
              >
                {Number(user.bmi).toFixed(1)}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                BMI
              </div>
            </div>
          </div>
        )}

        {user?.weightCategory === "severely_obese" && !noticeAcknowledged && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 100,
              display: "flex",
              alignItems: "flex-end",
              padding: "16px",
            }}
          >
            <div className="wellness-card" style={{ padding: "24px", width: "100%" }}>
              <div
                style={{
                  fontSize: "20px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "12px",
                }}
              >
                A note before we start
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginBottom: "20px",
                }}
              >
                AARA is designed to support your journey with personalized Indian meal plans and workouts. For your
                safety, we recommend consulting a doctor or registered dietitian alongside using this app. We're here
                to help. Every small step counts.
              </p>
              <button
                className="btn-primary"
                style={{ width: "100%", height: "52px" }}
                onClick={() => {
                  setNoticeAcknowledged(true);
                  try {
                    localStorage.setItem("aara_notice_ack", "true");
                  } catch {}
                }}
              >
                I understand, let's begin
              </button>
            </div>
          </div>
        )}

        <section className="animate-slide-up">
          <div className="wellness-card" style={{
            padding: "16px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "20px",
            minHeight: "120px",
            maxHeight: "148px",
          }}>
            {/* Left — Ring */}
            <div style={{ flexShrink: 0, width: 88, height: 88 }}>
              <MacroRing
                caloriesTarget={caloriesTarget}
                caloriesCurrent={caloriesProgress}
                proteinTarget={proteinTarget}
                proteinCurrent={proteinProgress}
                size={88}
                strokeWidth={8}
              />
            </div>

            {/* Right — Stats */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              <span className="section-label bg-transparent font-bold !text-[var(--text-muted)]">Calories Remaining</span>

              {/* Big number */}
              <span className="font-display" style={{
                fontSize: "36px",
                fontWeight: "700",
                color: "var(--text-primary)",
                lineHeight: 1,
              }}>
                {Math.round(remainingCalories)}
              </span>

              {/* Protein row */}
              <div style={{ marginTop: "4px" }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "5px",
                }}>
                  <span className="section-label bg-transparent font-bold !text-[var(--text-muted)]">Protein Goal</span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                    {Math.round(proteinProgress)}g / {proteinTarget}g
                  </span>
                </div>
                {/* Progress bar */}
                <div className="progress-bar" style={{
                  height: "5px",
                  borderRadius: "999px",
                  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(47,128,237,0.12)"
                }}>
                  <div
                    className="progress-bar-fill"
                    style={{ 
                      width: `${Math.min(100, (proteinProgress / proteinTarget) * 100)}%`,
                      background: isDark ? "linear-gradient(90deg, #C4841A, #F5C96B)" : "linear-gradient(90deg, #2F80ED, #28B5A0)",
                      height: "100%",
                      borderRadius: "999px",
                      transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="animate-slide-up grid grid-cols-3 gap-[10px]">
          <div className="metric-card stagger-1 min-h-[128px] p-[14px] flex flex-col justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-[0.08em] mb-[8px]" style={{ color: "var(--text-secondary)" }}>Hydration</div>
              <div className="mb-[10px] flex items-center justify-between gap-2">
                <div className="font-display text-[22px] font-bold leading-none shrink-0">{plan?.waterIntake || 0}</div>
                <Droplets className="w-[18px] h-[18px] text-brand shrink-0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-auto w-full">
              <button
                aria-label="Remove water"
                className="flex items-center justify-center h-[30px] rounded-full text-brand font-bold text-lg transition-colors"
                style={{ backgroundColor: "var(--surface-2)" }}
                onClick={() => updateWater({ date: format(selectedDate, "yyyy-MM-dd"), amount: -250 })}
              >
                -
              </button>
              <button
                aria-label="Add water"
                className="flex items-center justify-center h-[30px] rounded-full text-white transition-colors"
                style={{ backgroundColor: "var(--brand-primary)" }}
                onClick={() => updateWater({ date: format(selectedDate, "yyyy-MM-dd"), amount: 250 })}
              >
                <Plus className="w-[16px] h-[16px] stroke-[3px]" />
              </button>
            </div>
          </div>

          <div className="metric-card stagger-2 min-h-[128px] p-[14px] flex flex-col justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-[0.08em] mb-[8px]" style={{ color: "var(--text-secondary)" }}>Steps</div>
              <div className="mb-[10px] flex items-center justify-between gap-2">
                <div className="font-display text-[22px] font-bold leading-none tracking-tight shrink-0">
                  {stepsProgress.toLocaleString()}
                </div>
                <Footprints className="w-[18px] h-[18px] text-brand shrink-0" />
              </div>
            </div>
            <div className="progress-bar h-[4px] mt-auto rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <div className="progress-bar-fill h-full bg-brand rounded-full" style={{ width: `${stepsPercent}%` }} />
            </div>
          </div>

          <div className="metric-card stagger-3 min-h-[128px] p-[14px] flex flex-col justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-[0.08em] mb-[8px]" style={{ color: "var(--text-secondary)" }}>Streak</div>
              <div className="mb-[10px] flex items-center justify-between gap-2">
                <div className="font-display text-[22px] font-bold leading-none shrink-0">{stats?.currentStreak ?? stats?.streak ?? 0}</div>
                <Trophy className="w-[18px] h-[18px] text-brand shrink-0" />
              </div>
            </div>
            <span className="pill-green text-[9px] mt-auto self-start whitespace-nowrap">On track</span>
          </div>
        </section>

        <section className="animate-slide-up space-y-[12px]">
          <SectionHeader
            title="Today's Plan"
            action={
              <Link href="/log-meal">
                <button className="bg-brand text-white flex items-center justify-center gap-1.5 px-4 h-[44px] rounded-[14px] text-[14px] font-bold hover:opacity-90 transition-opacity">
                  <Plus className="w-4 h-4" />
                  Quick Log
                </button>
              </Link>
            }
          />
          <div className="flex flex-col gap-[12px]">
            {meals.slice(0, 3).map((meal: any, index: number) => (
              <Link key={meal.id} href={`/meal/${format(selectedDate, "yyyy-MM-dd")}/${meal.id}`}>
                <div className={`wellness-card cursor-pointer p-[16px] ${["stagger-1", "stagger-2", "stagger-3"][index]}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-[0.08em] mb-[4px]" style={{ color: "var(--text-secondary)" }}>{meal.type}</div>
                      <h3 className="text-[15px] font-semibold text-primary truncate leading-tight">
                        {meal.name}
                        {meal.isWeightLossFriendly &&
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
                        {meal.isMuscleGainFriendly &&
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
                      </h3>
                      <p className="mt-[4px] text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        {meal.calories} kcal · {meal.protein}g protein
                      </p>
                    </div>
                    <span className={cn(meal.isConsumed ? "pill-green" : "pill-brand", "text-[11px]")}>{meal.isConsumed ? "Logged" : "Planned"}</span>
                  </div>
                </div>
              </Link>
            ))}
            {meals.length === 0 && <div className="wellness-card p-[16px] text-center" style={{ color: "var(--text-secondary)" }}>No meals generated yet.</div>}
          </div>
        </section>

        <section className="animate-slide-up space-y-[12px]">
          <SectionHeader title="Training" />
          {workouts.length > 0 ? (
            <Link href={`/workout/${workouts[0].id}`}>
              <div className="wellness-card stagger-4 cursor-pointer p-[16px] group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-[0.08em] mb-[4px]" style={{ color: "var(--text-secondary)" }}>Workout</div>
                    <h3 className="text-[15px] font-semibold text-primary truncate leading-tight">{workouts[0].name}</h3>
                    <p className="mt-[4px] text-[12px]" style={{ color: "var(--text-secondary)" }}>
                      {workouts[0].difficulty} · {workouts[0].duration} min
                    </p>
                  </div>
                  <div className="w-[44px] h-[44px] rounded-[14px] bg-surface-2 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
                    <Zap className="w-[20px] h-[20px] fill-current" />
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="wellness-card p-[16px] text-center" style={{ color: "var(--text-secondary)" }}>Rest day. No workout assigned yet.</div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
