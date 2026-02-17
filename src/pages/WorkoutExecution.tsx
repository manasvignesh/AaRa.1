import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useWorkout, useCompleteWorkout } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import { Pause, Loader2, SkipForward, Info, CheckCircle2, AlertCircle, PlayCircle, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { StructuredExercise } from "@shared/schema";
import { PageLayout } from "@/components/PageLayout";
import { motion, AnimatePresence } from "framer-motion";

function generateStructuredWorkout(duration: number, gymAccess: boolean = false): StructuredExercise[] {
  const totalSeconds = duration * 60;
  const restDurationBetween = 10;
  const warmupTime = Math.round(totalSeconds * 0.18);
  const mainTime = Math.round(totalSeconds * 0.62);
  const cooldownTime = Math.round(totalSeconds * 0.20);
  const exercises: StructuredExercise[] = [];
  const warmupExerciseTime = warmupTime - (3 * restDurationBetween);
  exercises.push(
    { name: "Arm Circles", duration: Math.round(warmupExerciseTime * 0.25), instruction: "Gently rotate your arms in circles.", phase: 'warmup' },
    { name: "Marching in Place", duration: Math.round(warmupExerciseTime * 0.35), instruction: "Lift your knees high while marching.", phase: 'warmup' },
    { name: "Hip Rotations", duration: Math.round(warmupExerciseTime * 0.20), instruction: "Place hands on hips and rotate.", phase: 'warmup' },
    { name: "Gentle Squats", duration: Math.round(warmupExerciseTime * 0.20), instruction: "Slowly lower into a quarter squat.", phase: 'warmup' }
  );
  const mainExerciseTemplates = gymAccess ? [
    { name: "Bodyweight Squats", instruction: "Standard shoulder-width squats." },
    { name: "Push-ups", instruction: "Keep your body in a straight line." },
    { name: "Lunges", instruction: "Alternate legs, forward steps." },
    { name: "Plank Hold", instruction: "Keep core engaged, hold steady." },
  ] : [
    { name: "Bodyweight Squats", instruction: "Standard shoulder-width squats." },
    { name: "Wall Push-ups", instruction: "Lean against wall, push back." },
    { name: "Standing Knee Raises", instruction: "Lift knees to waist height." },
    { name: "Chair Dips", instruction: "Use a sturdy chair surface." },
  ];
  const mainExercisesCount = Math.max(5, Math.floor(mainTime / 50));
  const perExerciseDuration = Math.floor((mainTime - (mainExercisesCount - 1) * 10) / mainExercisesCount);
  for (let i = 0; i < mainExercisesCount; i++) {
    const template = mainExerciseTemplates[i % mainExerciseTemplates.length];
    exercises.push({ ...template, duration: perExerciseDuration, phase: 'main' });
  }
  const cooldownExerciseTime = cooldownTime - (3 * restDurationBetween);
  exercises.push(
    { name: "Deep Breathing", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Breathe in for 4, out for 6.", phase: 'cooldown' },
    { name: "Standing Forward Fold", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Let your upper body hang.", phase: 'cooldown' },
    { name: "Quad Stretch", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Hold for 15s each leg.", phase: 'cooldown' },
    { name: "Final Relaxation", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Five slow breaths to finish.", phase: 'cooldown' }
  );
  return exercises;
}

export default function WorkoutExecution() {
  const [, params] = useRoute("/workout/:id/start");
  const [, setLocation] = useLocation();
  const { data: workout, isLoading: workoutLoading } = useWorkout(params?.id);
  const { mutate: completeWorkout } = useCompleteWorkout();

  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const workoutDate = workout?.plan?.date ? parseISO(workout.plan.date) : new Date();
  const dateStr = workout?.plan?.date || format(new Date(), "yyyy-MM-dd");
  const exercises = workout?.exercises || generateStructuredWorkout(workout?.duration || 30, false);
  const restDuration = 10;
  const currentExercise = exercises[currentIndex];
  const progress = (totalElapsed / ((exercises.reduce((s: number, e: any) => s + e.duration, 0)) + (exercises.length - 1) * 10)) * 100;

  useEffect(() => {
    if (!isRunning || !currentExercise) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (isResting) {
            setIsResting(false);
            setCurrentIndex(i => i + 1);
            return exercises[currentIndex + 1]?.duration || 0;
          } else if (currentIndex < exercises.length - 1) {
            setIsResting(true);
            return restDuration;
          } else {
            setIsRunning(false);
            return 0;
          }
        }
        return prev - 1;
      });
      setTotalElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isResting, currentIndex, exercises, currentExercise]);

  const handleStart = useCallback(() => {
    if (!isRunning && currentExercise) {
      setTimeRemaining(currentExercise.duration);
      setIsRunning(true);
    }
  }, [isRunning, currentExercise]);

  if (workoutLoading || !workout) {
    return (
      <PageLayout header={<div><h1 className="text-4xl font-black">Syncing...</h1></div>}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </PageLayout>
    );
  }

  const isComplete = currentIndex >= exercises.length - 1 && timeRemaining === 0 && !isResting;

  return (
    <PageLayout
      maxWidth="md"
      header={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowEndConfirm(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 backdrop-blur-xl border border-slate-100 text-primary active:scale-90 transition-all"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-0.5">Workout</p>
              <p className="text-[12px] font-bold text-muted-foreground uppercase opacity-40">{workout.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black tracking-tighter tabular-nums leading-none">
              {Math.floor(totalElapsed / 60)}:{String(totalElapsed % 60).padStart(2, '0')}
            </p>
            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Elapsed</p>
          </div>
        </div>
      }
    >
      <div className="space-y-10">
        <div className="space-y-3">
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <motion.div className="h-full brand-gradient" animate={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-40">
            <span>{Math.round(progress)}% Complete</span>
            <span>Drill {currentIndex + 1} / {exercises.length}</span>
          </div>
        </div>

        <main className="min-h-[460px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {isComplete ? (
              <motion.div key="comp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10">
                <div className="w-24 h-24 rounded-[32px] brand-gradient flex items-center justify-center mx-auto shadow-2xl shadow-brand-blue/30">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Workout Completed</h2>
                  <p className="text-sm text-muted-foreground font-medium max-w-[240px] mx-auto opacity-60">Great session. Your progress has been saved.</p>
                </div>
                <button className="w-full h-16 rounded-full brand-gradient text-white font-black uppercase tracking-widest text-sm shadow-xl" onClick={() => { completeWorkout({ id: workout.id, isCompleted: true, date: dateStr }); setLocation("/dashboard"); }}>
                  Finish
                </button>
              </motion.div>
            ) : (
              <motion.div key={currentIndex + (isResting ? "-r" : "")} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10">
                <div className={cn("wellness-card p-12 text-center space-y-10 transition-all border-slate-100 shadow-2xl", isResting ? "bg-primary/5 ring-2 ring-primary/20" : "bg-white/60")}>
                  <div className="space-y-3">
                    <span className={cn("inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em]", isResting ? "brand-gradient text-white" : "bg-slate-100 text-primary")}>
                      {isResting ? "Rest" : currentExercise?.phase || "Active"}
                    </span>
                    <h2 className="text-4xl font-black tracking-tighter leading-none uppercase">{isResting ? "Breathe" : currentExercise?.name}</h2>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="text-8xl font-black tracking-tighter tabular-nums text-foreground">{Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}</div>
                  </div>

                  {!isResting && (
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left flex gap-4">
                      <Info className="w-5 h-5 text-primary shrink-0 opacity-40 mt-1" />
                      <p className="text-[14px] font-medium text-muted-foreground leading-snug">{currentExercise?.instruction}</p>
                    </div>
                  )}
                  {isResting && (
                    <div className="animate-pulse">
                      <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] mb-2">Up Next</p>
                      <p className="text-xl font-black uppercase tracking-tighter text-primary">{exercises[currentIndex + 1]?.name}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {!isRunning && totalElapsed === 0 ? (
                    <button className="w-full h-16 rounded-full brand-gradient text-white font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all" onClick={handleStart}>
                      <PlayCircle className="w-6 h-6 stroke-[3px]" /> Start Workout
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button className="h-16 rounded-[24px] bg-slate-100 border border-slate-200 font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-200 transition-all flex flex-col items-center justify-center gap-1" onClick={() => { setIsRunning(false); if (currentIndex > 0) { setIsResting(false); setCurrentIndex(i => i - 1); setTimeRemaining(exercises[currentIndex - 1]?.duration || 30); } }}>
                        <SkipForward className="w-5 h-5 rotate-180 mb-0.5" />
                        Previous
                      </button>

                      <button className={cn("h-16 rounded-[24px] font-black uppercase tracking-widest text-[10px] text-white transition-all flex flex-col items-center justify-center gap-1 shadow-lg", isRunning ? "bg-amber-400 shadow-amber-200" : "brand-gradient shadow-brand-blue/30")} onClick={() => setIsRunning(!isRunning)}>
                        {isRunning ? <><Pause className="w-5 h-5 mb-0.5" /> Pause</> : <><PlayCircle className="w-5 h-5 mb-0.5" /> Resume</>}
                      </button>

                      <button className="col-span-2 h-12 rounded-full text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors flex items-center justify-center gap-2" onClick={() => { if (isResting) { setIsResting(false); setCurrentIndex(i => i + 1); setTimeRemaining(exercises[currentIndex + 1]?.duration || 0); } else setTimeRemaining(1); }}>
                        Skip Current <SkipForward className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Exercise List Trigger */}
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4">Workout Plan</p>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {exercises.map((ex: any, idx: number) => (
                        <div key={idx} onClick={() => { setCurrentIndex(idx); setIsResting(false); setTimeRemaining(ex.duration); setIsRunning(false); }} className={cn("flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border", idx === currentIndex ? "bg-brand-blue/5 border-brand-blue/20" : "hover:bg-slate-50 border-transparent")}>
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", idx === currentIndex ? "bg-brand-blue text-white" : "bg-slate-100 text-slate-400")}>
                            {idx < currentIndex ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className={cn("text-xs font-bold leading-none", idx === currentIndex ? "text-brand-blue" : "text-slate-600")}>{ex.name}</p>
                          </div>
                          <p className="text-[10px] font-mono text-slate-400">{Math.floor(ex.duration / 60)}:{(ex.duration % 60).toString().padStart(2, '0')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showEndConfirm && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-xl flex items-center justify-center p-8 z-[100] selection:bg-primary/20">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="wellness-card p-10 max-w-[320px] text-center space-y-8 shadow-2xl border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tighter uppercase">End Workout?</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed opacity-60">You haven't finished all exercises yet. This will save your current progress.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button className="h-14 rounded-full brand-gradient text-white font-black text-xs uppercase tracking-widest" onClick={() => setShowEndConfirm(false)}>Resume</button>
                <button className="h-14 rounded-full bg-slate-100 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-slate-200" onClick={() => { completeWorkout({ id: workout.id, isCompleted: true, date: dateStr }); setLocation("/dashboard"); }}>End Workout</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

function XCircle({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>;
}
