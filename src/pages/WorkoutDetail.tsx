import { useLocation, useRoute } from "wouter";
import { useWorkout, useCompleteWorkout } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Timer, BarChart, Loader2, Info, ChevronLeft, Dumbbell, Zap, Target, ScrollText, CheckCircle2, Play } from "lucide-react";
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
      <PageLayout
        header={
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-secondary/30 rounded-full animate-pulse" />
            <div className="h-10 w-48 bg-secondary/30 rounded-lg animate-pulse" />
          </div>
        }
      >
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!workout) {
    return (
      <PageLayout
        header={
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold">Session Details</h1>
          </div>
        }
      >
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-10 text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
            <Info className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h2 className="text-xl font-bold">Workout Not Found</h2>
          <p className="text-muted-foreground text-sm max-w-[280px]">I couldn't find the data for this session. It may have been updated or removed.</p>
          <Button onClick={() => setLocation("/workouts")} className="rounded-full h-12 px-8 brand-gradient text-white">Return to Workouts</Button>
        </div>
      </PageLayout>
    );
  }

  const workoutDate = workout.plan?.date ? parseISO(workout.plan.date) : new Date();
  const dateStr = workout.plan?.date || format(new Date(), "yyyy-MM-dd");

  return (
    <PageLayout
      header={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/workouts")}
              className="rounded-full w-10 h-10 border-none bg-card shadow-sm hover:bg-secondary/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">{workout.type}</p>
              <p className="text-[13px] font-bold text-muted-foreground">{format(workoutDate, "EEEE, MMM do")}</p>
            </div>
          </div>
          {workout.isCompleted && (
            <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Finished
            </div>
          )}
        </div>
      }
    >
      <div className="max-w-3xl mx-auto space-y-8 pb-32">
        {/* Hero Card */}
        <section className="space-y-6">
          <h1 className="text-4xl font-black tracking-tight text-foreground leading-[1.1]">{workout.name}</h1>

          <div className="grid grid-cols-2 gap-4">
            <div className="wellness-card p-6 bg-primary shadow-lg shadow-primary/20 text-white border-none flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Timer className="w-16 h-16" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Session Time</p>
                <p className="text-2xl font-black tracking-tighter">{workout.duration} min</p>
              </div>
            </div>
            <div className="wellness-card p-6 bg-card shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Zap className="w-16 h-16 text-primary" />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Intensity</p>
                <p className="text-2xl font-black tracking-tighter text-foreground capitalize">{workout.difficulty}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Coach Guidance */}
        {workout.description && (
          <section className="space-y-4">
            <SectionHeader title="Coach's Strategy" />
            <div className="wellness-card p-8 bg-blue-50/50 border-blue-100 flex gap-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <ScrollText className="w-32 h-32 text-primary" />
              </div>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                <Info className="w-6 h-6 text-primary" />
              </div>
              <p className="text-[15px] text-primary/80 leading-relaxed font-semibold italic relative z-10">
                "{workout.description}"
              </p>
            </div>
          </section>
        )}

        {/* Exercises List */}
        <section className="space-y-4">
          <SectionHeader title="Drill Routine" />
          <div className="grid grid-cols-1 gap-4">
            {Array.isArray(workout.exercises) && (workout.exercises as any[]).length > 0 ? (
              (workout.exercises as any[]).map((ex: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="wellness-card p-5 flex items-center gap-5 bg-card hover:border-primary/20 transition-all shadow-sm group"
                >
                  <div className="w-12 h-12 rounded-[20px] bg-secondary/30 flex items-center justify-center font-black text-muted-foreground/30 shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors text-lg italic">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[17px] font-black tracking-tight text-foreground">{typeof ex === 'string' ? ex : ex.name}</h4>
                    {typeof ex !== 'string' && ex.sets && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[12px] font-black text-primary/60 uppercase tracking-widest">{ex.sets} SETS</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                        <span className="text-[12px] font-black text-primary/60 uppercase tracking-widest">{ex.reps} REPS</span>
                      </div>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary/10 group-hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-all">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="wellness-card p-12 border-dashed bg-card/30 flex flex-col items-center justify-center text-center opacity-60">
                <Dumbbell className="w-12 h-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No detailed drills provided</p>
              </div>
            )}
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="fixed bottom-10 left-0 right-0 z-50 px-6 max-w-2xl mx-auto flex flex-col gap-3">
          {!workout.isCompleted ? (
            <Button
              size="lg"
              className="w-full h-16 rounded-[24px] text-lg font-black brand-gradient text-white shadow-2xl shadow-brand-blue/30 scale-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={() => setLocation(`/workout/${workout.id}/start`)}
            >
              <Play className="w-6 h-6 mr-3 fill-current" /> Initialize Session
            </Button>
          ) : (
            <div className="bg-emerald-500/10 backdrop-blur-md p-6 rounded-[32px] border border-emerald-500/20 text-center mb-2">
              <p className="text-sm font-bold text-emerald-700">Excellent effort! This session is completed.</p>
            </div>
          )}

          <Button
            size="lg"
            variant="outline"
            className={cn(
              "w-full h-14 rounded-[20px] bg-white/80 backdrop-blur-md font-bold transition-all border-primary/5",
              workout.isCompleted ? "text-red-500 hover:bg-red-50 border-red-100" : "text-primary hover:bg-primary/5"
            )}
            onClick={() => completeWorkout({ id: workout.id, isCompleted: !workout.isCompleted, date: dateStr })}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : workout.isCompleted ? (
              <>Reset Progress</>
            ) : (
              <>Mark as Finished</>
            )}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
