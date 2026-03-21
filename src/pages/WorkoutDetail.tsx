import { useLocation, useRoute } from "wouter";
import { useWorkout, useCompleteWorkout } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Timer, Loader2, Info, Dumbbell, Zap, Target, ScrollText, CheckCircle2, Play, X, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { motion } from "framer-motion";

function toTitleCase(input: string) {
  return (input || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function WorkoutDetail() {
  const [, params] = useRoute("/workout/:id");
  const [location, setLocation] = useLocation();

  const { data: workout, isLoading: workoutLoading } = useWorkout(params?.id);
  const { mutate: completeWorkout, isPending } = useCompleteWorkout();

  if (workoutLoading) {
    return (
      <div className="page-transition">
        <PageLayout header={<div><h1 className="font-display text-4xl font-bold tracking-tighter text-[var(--text-primary)]">Loading...</h1></div>}>
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
          </div>
        </PageLayout>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="page-transition">
        <PageLayout header={<div><h1 className="font-display text-4xl font-bold tracking-tighter text-[var(--text-primary)]">Not Found</h1></div>}>
          <div className="min-h-[40vh] flex flex-col items-center justify-center p-10 text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-2">
              <Info className="w-10 h-10 text-[var(--text-muted)]" />
            </div>
            <h2 className="font-display text-xl font-bold uppercase tracking-tighter text-[var(--text-primary)]">Workout Not Found</h2>
            <Button onClick={() => setLocation("/workouts")} className="rounded-full h-14 px-8 btn-primary text-white font-bold uppercase tracking-widest text-[11px] shadow-[0_4px_20px_rgba(47,128,237,0.07)] border-none">Back to Workouts</Button>
          </div>
        </PageLayout>
      </div>
    );
  }

  const workoutDate = workout.plan?.date ? parseISO(workout.plan.date) : new Date();
  const dateStr = workout.plan?.date || format(new Date(), "yyyy-MM-dd");

  return (
    <div className="page-transition">
      <PageLayout
        maxWidth="md"
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => window.history.back()}
                className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.10)] text-[var(--text-primary)] active:scale-[0.98] transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="pt-0.5">
                <div className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--brand-primary)" }}>
                  {workout.type} · {format(workoutDate, "MMM do, yyyy")}
                </div>
              </div>
            </div>
            {workout.isCompleted ? (
              <div className="pill-green px-4 py-1.5 text-[10px] font-bold border border-[#27AE60]/20 whitespace-nowrap">
                Finished
              </div>
            ) : null}
          </div>
        }
      >
        <div className="space-y-8 pb-[220px]">
          {/* Hero Section */}
          <section className="space-y-5 stagger-1">
            <h1 className="font-display text-[28px] font-bold tracking-tight text-[var(--text-primary)] leading-[1.15]" style={{ textTransform: "none" }}>
              {toTitleCase(workout.name)}
            </h1>

            <div className="grid grid-cols-2 gap-3">
              <div className="wellness-card p-5 text-white flex flex-col gap-3" style={{ background: "linear-gradient(135deg, #E8A93A, #C4841A)" }}>
                <div className="w-9 h-9 rounded-[12px] flex items-center justify-center" style={{ background: "rgba(255,255,255,0.18)" }}>
                  <Timer className="w-5 h-5 opacity-90" />
                </div>
                <div>
                  <p className="font-display text-[26px] font-bold tracking-tight leading-none">{workout.duration}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mt-1" style={{ color: "rgba(17,19,24,0.62)" }}>
                    Minutes
                  </p>
                </div>
              </div>
              <div className="wellness-card p-5 bg-[var(--surface-1)] flex flex-col gap-3 border border-[rgba(255,255,255,0.06)]">
                <div className="w-9 h-9 rounded-[12px] flex items-center justify-center" style={{ background: "rgba(232,169,58,0.12)" }}>
                  <Zap className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div>
                  <p className="font-display text-[18px] font-bold tracking-tight leading-none text-[var(--text-primary)]" style={{ textTransform: "none" }}>
                    {toTitleCase(workout.difficulty)}
                  </p>
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em] mt-1">Intensity</p>
                </div>
              </div>
            </div>
          </section>

          {/* Coach Strategy */}
          {workout.description && (
            <section className="space-y-4 stagger-2">
              <SectionHeader title="Focus" />
              <div className="wellness-card p-6 bg-[var(--surface-2)] border border-[rgba(255,255,255,0.06)] relative overflow-hidden">
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed font-medium">
                  {workout.description}
                </p>
              </div>
            </section>
          )}

          {/* Exercises List */}
          <section className="space-y-4 stagger-3">
            <SectionHeader title="Exercises" />
            <div className="space-y-3">
              {Array.isArray(workout.exercises) && (workout.exercises as any[]).map((ex: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="wellness-card p-4 flex items-center justify-between group bg-[var(--surface-1)] border border-[rgba(255,255,255,0.06)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[14px] bg-[var(--surface-2)] flex items-center justify-center font-bold text-brand text-xs border border-[rgba(255,255,255,0.06)]">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold tracking-tight text-[var(--text-primary)]" style={{ textTransform: "none" }}>
                        {typeof ex === 'string' ? toTitleCase(ex) : toTitleCase(ex.name)}
                      </h4>
                      {typeof ex !== 'string' && ex.sets && (
                        <p className="section-label mt-1 text-[var(--text-secondary)]">
                          {ex.sets} sets • {ex.reps} reps
                        </p>
                      )}
                    </div>
                  </div>
                  <Target className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-brand transition-colors" />
                </motion.div>
              ))}
              {(!workout.exercises || (workout.exercises as any[]).length === 0) && (
                <div className="wellness-card p-10 text-center opacity-60 bg-[var(--surface-1)] border border-[rgba(255,255,255,0.06)]">
                  <Dumbbell className="w-8 h-8 opacity-20 mx-auto mb-2 text-[var(--text-muted)]" />
                  <p className="section-label">No Exercises Found</p>
                </div>
              )}
            </div>
          </section>

          {/* Action Dock */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 px-5"
            style={{
              paddingBottom: "max(18px, env(safe-area-inset-bottom))",
              paddingTop: 18,
              background: "linear-gradient(to top, var(--surface-base) 65%, rgba(0,0,0,0))",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="max-w-md mx-auto flex flex-col gap-3">
              {!workout.isCompleted ? (
                <>
                  <button
                    className="w-full h-[54px] rounded-[18px] btn-primary text-white font-bold text-[13px] uppercase tracking-[0.12em] active:scale-[0.99] transition-all flex items-center justify-center gap-2 border-none"
                    onClick={() => setLocation(`/workout/${workout.id}/start`)}
                  >
                    <Play className="w-5 h-5 fill-current" /> Start Workout
                  </button>
                  <button
                    className="h-[48px] rounded-[16px] bg-[var(--surface-1)] text-[var(--text-primary)] font-bold text-[12px] uppercase tracking-[0.1em] transition-all border border-[rgba(255,255,255,0.08)]"
                    onClick={() => completeWorkout({ id: workout.id, isCompleted: true, date: dateStr })}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : "Mark as Finished"}
                  </button>
                </>
              ) : (
                <button
                  className="w-full h-[54px] rounded-[18px] bg-[var(--surface-1)] text-red-400 font-bold text-[13px] uppercase tracking-[0.12em] border border-[rgba(255,255,255,0.08)] transition-all flex items-center justify-center gap-2"
                  onClick={() => completeWorkout({ id: workout.id, isCompleted: false, date: dateStr })}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <X className="w-5 h-5" />}
                  Mark as Incomplete
                </button>
              )}
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
}
