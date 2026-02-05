import { useLocation, useRoute } from "wouter";
import { useWorkout, useCompleteWorkout } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Timer, BarChart, Loader2, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export default function WorkoutDetail() {
  const [, params] = useRoute("/workout/:id");
  const [location, setLocation] = useLocation();

  const { data: workout, isLoading: workoutLoading } = useWorkout(params?.id);
  const { mutate: completeWorkout, isPending } = useCompleteWorkout();

  if (workoutLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] dark:bg-black">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F2F2F7] dark:bg-black gap-4">
        <p className="text-muted-foreground font-medium">Workout session not found.</p>
        <Button onClick={() => setLocation("/workouts")} variant="outline" className="rounded-xl">Return to Workouts</Button>
      </div>
    );
  }

  const workoutDate = workout.plan?.date ? parseISO(workout.plan.date) : new Date();
  const dateStr = workout.plan?.date || format(new Date(), "yyyy-MM-dd");

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex flex-col">
      <header className="px-6 pt-10 pb-6 md:pt-16 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/workouts")} className="rounded-full bg-white/50 dark:bg-white/10 hover:bg-white/80 transition-all">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Workout Details</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{format(workoutDate, "EEEE, MMMM do")}</p>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 md:pb-8 max-w-2xl mx-auto w-full space-y-6">
        {/* Highlight Card */}
        <div className="ios-inset-grouped p-8 flex flex-col items-center text-center bg-white dark:bg-[#1C1C1E]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary/70">{workout.type}</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tighter mb-4 text-foreground leading-tight">{workout.name}</h2>

          <div className="flex gap-8 mt-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground/60 mb-1">Duration</span>
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold">{workout.duration}m</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground/60 mb-1">Intensity</span>
              <div className="flex items-center gap-1.5">
                <BarChart className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold capitalize">{workout.difficulty}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description / Note */}
        {workout.description && (
          <section>
            <h3 className="px-2 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Coach's Guidance</h3>
            <div className="ios-inset-grouped p-5 bg-[#007AFF]/5 border-none flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-black flex items-center justify-center shrink-0 shadow-sm">
                <Info className="w-5 h-5 text-[#007AFF]" />
              </div>
              <p className="text-[14px] text-[#007AFF]/90 leading-relaxed font-medium">
                {workout.description}
              </p>
            </div>
          </section>
        )}

        {/* Exercises */}
        <section>
          <h3 className="px-2 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Exercises</h3>
          <div className="space-y-3">
            {Array.isArray(workout.exercises) && (workout.exercises as any[]).map((ex: any, idx: number) => (
              <div key={idx} className="ios-inset-grouped p-5 flex items-center gap-4 bg-white dark:bg-[#1C1C1E] border-none shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#F2F2F7] dark:bg-black flex items-center justify-center font-bold text-muted-foreground/50 shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-foreground">{typeof ex === 'string' ? ex : ex.name}</h4>
                  {typeof ex !== 'string' && ex.sets && (
                    <p className="text-[13px] text-muted-foreground font-medium">{ex.sets} sets • {ex.reps} reps</p>
                  )}
                </div>
              </div>
            ))}
            {(!workout.exercises || workout.exercises.length === 0) && (
              <div className="ios-inset-grouped p-8 text-center text-muted-foreground italic">
                No specific exercises listed for this session.
              </div>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-6 md:relative md:p-0 md:pt-8 bg-gradient-to-t from-[#F2F2F7] via-[#F2F2F7] to-transparent md:bg-none">
          <div className="max-w-2xl mx-auto space-y-3">
            {!workout.isCompleted && (
              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold rounded-2xl bg-primary shadow-lg active:scale-[0.98] transition-all"
                onClick={() => setLocation(`/workout/${workout.id}/start`)}
              >
                <Timer className="mr-2" /> Start Workout
              </Button>
            )}
            <Button
              size="lg"
              variant={workout.isCompleted ? "secondary" : "outline"}
              className={cn(
                "w-full h-14 text-lg font-bold rounded-2xl transition-all",
                !workout.isCompleted && "bg-white dark:bg-black border-none shadow-sm"
              )}
              onClick={() => completeWorkout({ id: workout.id, isCompleted: !workout.isCompleted, date: dateStr })}
              disabled={isPending}
            >
              {workout.isCompleted ? (
                "Mark Incomplete"
              ) : (
                <>
                  <Check className="mr-2" /> Mark as Done
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
