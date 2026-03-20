import { useLocation, useRoute } from "wouter";
import { useWorkout, useCompleteWorkout } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Timer, Loader2, Info, Dumbbell, Zap, Target, ScrollText, CheckCircle2, Play, X, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { motion } from "framer-motion";

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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface-1)] shadow-sm border border-[var(--border)] text-[var(--text-primary)] active:scale-90 transition-all hover:bg-[var(--surface-2)]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <p className="section-label mb-0.5">{workout.type}</p>
                <p className="text-[12px] font-bold text-[var(--text-muted)] uppercase">{format(workoutDate, "MMM do, yyyy")}</p>
              </div>
            </div>
            {workout.isCompleted && (
              <div className="pill-green px-4 py-1.5 text-[10px] font-bold border border-[#27AE60]/20">
                Finished
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-10 pb-40">
          {/* Hero Section */}
          <section className="space-y-8 stagger-1">
            <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-none uppercase">{workout.name}</h1>

            <div className="grid grid-cols-2 gap-4">
              <div className="wellness-card p-5 brand-gradient text-white flex flex-col gap-3 shadow-[0_4px_20px_rgba(47,128,237,0.07)]">
                <Timer className="w-6 h-6 opacity-80" />
                <div>
                  <p className="font-display text-3xl font-bold tracking-tighter leading-none">{workout.duration}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mt-1">Minutes</p>
                </div>
              </div>
              <div className="wellness-card p-5 bg-[var(--surface-1)] flex flex-col gap-3">
                <Zap className="w-6 h-6 text-brand opacity-80" />
                <div>
                  <p className="font-display text-3xl font-bold tracking-tighter leading-none text-[var(--text-primary)] uppercase">{workout.difficulty}</p>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Intensity</p>
                </div>
              </div>
            </div>
          </section>

          {/* Coach Strategy */}
          {workout.description && (
            <section className="space-y-4 stagger-2">
              <SectionHeader title="Focus" />
              <div className="wellness-card p-6 bg-[var(--surface-2)] border border-[var(--border)] relative overflow-hidden group shadow-[0_4px_20px_rgba(47,128,237,0.07)]">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                  "{workout.description}"
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
                  className="wellness-card p-4 flex items-center justify-between group bg-[var(--surface-1)] shadow-[0_4px_20px_rgba(47,128,237,0.07)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center font-bold text-brand text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold tracking-tight text-[var(--text-primary)] uppercase">{typeof ex === 'string' ? ex : ex.name}</h4>
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
                <div className="wellness-card p-10 text-center opacity-40 bg-[var(--surface-1)]">
                  <Dumbbell className="w-8 h-8 opacity-20 mx-auto mb-2 text-[var(--text-muted)]" />
                  <p className="section-label">No Exercises Found</p>
                </div>
              )}
            </div>
          </section>

          {/* Action Dock */}
          <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pt-10 bg-gradient-to-t from-[#F5F9FF] via-[#F5F9FF]/90 to-transparent">
            <div className="max-w-md mx-auto flex flex-col gap-3">
              {!workout.isCompleted ? (
                <>
                  <button
                    className="w-full h-16 rounded-full btn-primary text-white font-bold text-sm uppercase tracking-widest shadow-[0_4px_20px_rgba(47,128,237,0.07)] active:scale-95 transition-all flex items-center justify-center gap-2 border-none"
                    onClick={() => setLocation(`/workout/${workout.id}/start`)}
                  >
                    <Play className="w-5 h-5 fill-current" /> Start Workout
                  </button>
                  <button
                    className="h-14 rounded-full bg-[var(--surface-1)] text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all border border-[var(--border)] shadow-sm"
                    onClick={() => completeWorkout({ id: workout.id, isCompleted: true, date: dateStr })}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : "Mark as Finished"}
                  </button>
                </>
              ) : (
                <button
                  className="w-full h-16 rounded-full bg-[var(--surface-1)] text-red-500 font-bold text-sm uppercase tracking-widest hover:bg-red-50 border border-red-100 transition-all flex items-center justify-center gap-2 shadow-sm"
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
