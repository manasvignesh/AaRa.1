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
      <PageLayout header={<div><h1 className="text-4xl font-black tracking-tighter text-foreground">Loading...</h1></div>}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!workout) {
    return (
      <PageLayout header={<div><h1 className="text-4xl font-black tracking-tighter text-foreground">Not Found</h1></div>}>
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-10 text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-2">
            <Info className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Workout Not Found</h2>
          <Button onClick={() => setLocation("/workouts")} className="rounded-full h-14 px-8 brand-gradient text-white font-black uppercase tracking-widest text-[11px]">Back to Workouts</Button>
        </div>
      </PageLayout>
    );
  }

  const workoutDate = workout.plan?.date ? parseISO(workout.plan.date) : new Date();
  const dateStr = workout.plan?.date || format(new Date(), "yyyy-MM-dd");

  return (
    <PageLayout
      maxWidth="md"
      header={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 backdrop-blur-xl border border-slate-100 text-primary active:scale-90 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-0.5">{workout.type}</p>
              <p className="text-[12px] font-bold text-muted-foreground uppercase opacity-40">{format(workoutDate, "MMM do, yyyy")}</p>
            </div>
          </div>
          {workout.isCompleted && (
            <div className="bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
              Finished
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-10 pb-40">
        {/* Hero Section */}
        <section className="space-y-8">
          <h1 className="text-4xl font-black tracking-tight text-foreground leading-none uppercase">{workout.name}</h1>

          <div className="grid grid-cols-2 gap-4">
            <div className="wellness-card p-5 brand-gradient text-white flex flex-col gap-3 shadow-xl shadow-brand-blue/20">
              <Timer className="w-6 h-6 opacity-60" />
              <div>
                <p className="text-3xl font-black tracking-tighter leading-none">{workout.duration}</p>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">Minutes</p>
              </div>
            </div>
            <div className="wellness-card p-5 bg-white flex flex-col gap-3">
              <Zap className="w-6 h-6 text-primary opacity-60" />
              <div>
                <p className="text-3xl font-black tracking-tighter leading-none text-foreground uppercase">{workout.difficulty}</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mt-1">Intensity</p>
              </div>
            </div>
          </div>
        </section>

        {/* Coach Strategy */}
        {workout.description && (
          <section className="space-y-4">
            <SectionHeader title="Focus" />
            <div className="wellness-card p-6 bg-slate-50 border-slate-100 relative overflow-hidden group">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                "{workout.description}"
              </p>
            </div>
          </section>
        )}

        {/* Exercises List */}
        <section className="space-y-4">
          <SectionHeader title="Exercises" />
          <div className="space-y-3">
            {Array.isArray(workout.exercises) && (workout.exercises as any[]).map((ex: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="wellness-card p-4 flex items-center justify-between group bg-white/40"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-primary/40 text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black tracking-tight text-foreground uppercase">{typeof ex === 'string' ? ex : ex.name}</h4>
                    {typeof ex !== 'string' && ex.sets && (
                      <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                        {ex.sets} sets • {ex.reps} reps
                      </p>
                    )}
                  </div>
                </div>
                <Target className="w-4 h-4 text-muted-foreground/10 group-hover:text-primary transition-colors" />
              </motion.div>
            ))}
            {(!workout.exercises || (workout.exercises as any[]).length === 0) && (
              <div className="wellness-card p-10 text-center opacity-40">
                <Dumbbell className="w-8 h-8 opacity-20 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Exercises Found</p>
              </div>
            )}
          </div>
        </section>

        {/* Action Dock */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pt-10 bg-gradient-to-t from-background via-background/90 to-transparent">
          <div className="max-w-md mx-auto flex flex-col gap-3">
            {!workout.isCompleted ? (
              <>
                <button
                  className="w-full h-16 rounded-full brand-gradient text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-blue/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                  onClick={() => setLocation(`/workout/${workout.id}/start`)}
                >
                  <Play className="w-5 h-5 fill-current" /> Start Workout
                </button>
                <button
                  className="h-14 rounded-full bg-slate-100 text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                  onClick={() => completeWorkout({ id: workout.id, isCompleted: true, date: dateStr })}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : "Mark as Finished"}
                </button>
              </>
            ) : (
              <button
                className="w-full h-16 rounded-full bg-slate-100 text-red-500 font-black text-sm uppercase tracking-widest hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-2"
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
  );
}
