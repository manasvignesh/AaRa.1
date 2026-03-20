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
      <div className="page-transition">
        <PageLayout header={<div><h1 className="font-display text-4xl font-bold tracking-tighter text-[var(--text-primary)]">Loading...</h1></div>}>
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
          </div>
        </PageLayout>
      </div>
    );
  }

  const isComplete = currentIndex >= exercises.length - 1 && timeRemaining === 0 && !isResting;

  return (
    <div className="page-transition min-h-screen bg-[var(--surface-2)]">
      <PageLayout
        maxWidth="md"
        header={
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowEndConfirm(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface-1)] shadow-sm border border-[var(--border)] text-[var(--text-primary)] active:scale-90 transition-all hover:bg-[var(--surface-2)]"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <div>
                <p className="section-label mb-0.5">Workout</p>
                <p className="font-display text-[14px] font-bold text-[var(--text-muted)] uppercase">{workout.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold tracking-tight tabular-nums leading-none text-[var(--text-primary)]">
                {Math.floor(totalElapsed / 60)}:{String(totalElapsed % 60).padStart(2, '0')}
              </p>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Elapsed</p>
            </div>
          </div>
        }
      >
        <div className="space-y-10">
          <div className="space-y-3 stagger-1">
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <motion.div className="h-full brand-gradient" animate={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
              <span>{Math.round(progress)}% Complete</span>
              <span>Drill {currentIndex + 1} / {exercises.length}</span>
            </div>
          </div>

          <main className="min-h-[460px] flex flex-col justify-center stagger-2">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div key="comp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10">
                  <div className="w-24 h-24 rounded-full brand-gradient flex items-center justify-center mx-auto shadow-[0_8px_30px_rgba(47,128,237,0.2)]">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="font-display text-4xl font-bold tracking-tight uppercase leading-none text-[var(--text-primary)]">Workout Completed</h2>
                    <p className="text-sm text-[var(--text-muted)] font-medium max-w-[240px] mx-auto">Great session. Your progress has been saved.</p>
                  </div>
                  <button className="w-full h-16 rounded-full btn-primary text-white font-bold uppercase tracking-widest text-sm shadow-[0_4px_20px_rgba(47,128,237,0.15)] border-none" onClick={() => { completeWorkout({ id: workout.id, isCompleted: true, date: dateStr }); setLocation("/dashboard"); }}>
                    Finish
                  </button>
                </motion.div>
              ) : (
                <motion.div key={currentIndex + (isResting ? "-r" : "")} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10">
                  <div className={cn("wellness-card p-10 text-center space-y-8 transition-all border-[var(--border)] shadow-[0_4px_20px_rgba(47,128,237,0.05)]", isResting ? "bg-[#2F80ED]/5 ring-2 ring-[#2F80ED]/20" : "bg-[var(--surface-1)]")}>
                    <div className="space-y-2">
                      <span className={cn("pill-blue text-[10px] font-bold uppercase tracking-wider", isResting ? "bg-[#2F80ED] text-white" : "bg-[var(--surface-2)] text-brand")}>
                        {isResting ? "Rest" : currentExercise?.phase || "Active"}
                      </span>
                      <h2 className="font-display text-4xl font-bold tracking-tight leading-none uppercase text-[var(--text-primary)] mt-4">{isResting ? "Breathe" : currentExercise?.name}</h2>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="font-display text-8xl font-bold tracking-tighter tabular-nums text-brand leading-none py-4">{Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}</div>
                    </div>

                    {!isResting && (
                      <div className="p-6 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] text-left flex gap-4">
                        <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                        <p className="text-[15px] font-medium text-[var(--text-secondary)] leading-snug">{currentExercise?.instruction}</p>
                      </div>
                    )}
                    {isResting && (
                      <div className="animate-pulse p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">Up Next</p>
                        <p className="font-display text-xl font-bold uppercase tracking-tight text-[var(--text-primary)]">{exercises[currentIndex + 1]?.name}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {!isRunning && totalElapsed === 0 ? (
                      <button className="w-full h-16 rounded-full btn-primary text-white font-bold uppercase tracking-widest text-[13px] shadow-[0_4px_20px_rgba(47,128,237,0.15)] flex items-center justify-center gap-3 active:scale-95 transition-all border-none" onClick={handleStart}>
                        <PlayCircle className="w-6 h-6 stroke-[2.5px]" /> Start Workout
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button className="h-16 rounded-full bg-[var(--surface-1)] border border-[var(--border)] font-bold uppercase tracking-wider text-[11px] text-[var(--text-secondary)] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm" onClick={() => { setIsRunning(false); if (currentIndex > 0) { setIsResting(false); setCurrentIndex(i => i - 1); setTimeRemaining(exercises[currentIndex - 1]?.duration || 30); } }}>
                          <SkipForward className="w-4 h-4 rotate-180" />
                          Previous
                        </button>

                        <button className={cn("h-16 rounded-full font-bold uppercase tracking-wider text-[11px] text-white transition-all flex items-center justify-center gap-2 border-none", isRunning ? "bg-[#27AE60] shadow-[0_4px_15px_rgba(39,174,96,0.3)]" : "btn-primary shadow-[0_4px_15px_rgba(47,128,237,0.3)]")} onClick={() => setIsRunning(!isRunning)}>
                          {isRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><PlayCircle className="w-4 h-4" /> Resume</>}
                        </button>

                        <button className="col-span-2 h-14 rounded-full bg-transparent border-none text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex items-center justify-center gap-2" onClick={() => { if (isResting) { setIsResting(false); setCurrentIndex(i => i + 1); setTimeRemaining(exercises[currentIndex + 1]?.duration || 0); } else setTimeRemaining(1); }}>
                          Skip Current <SkipForward className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Exercise List Trigger */}
                    <div className="pt-6 border-t border-[var(--border)] mt-6">
                      <p className="text-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">Workout Plan</p>
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {exercises.map((ex: any, idx: number) => (
                          <div key={idx} onClick={() => { setCurrentIndex(idx); setIsResting(false); setTimeRemaining(ex.duration); setIsRunning(false); }} className={cn("flex items-center gap-4 p-4 rounded-[20px] cursor-pointer transition-all border", idx === currentIndex ? "bg-[var(--surface-1)] border-[#2F80ED] shadow-sm ring-1 ring-[#2F80ED]/10" : "bg-[var(--surface-1)]/50 border-transparent hover:bg-[var(--surface-1)]")}>
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold", idx === currentIndex ? "bg-[#2F80ED] text-white" : "bg-[var(--surface-2)] text-[var(--text-muted)]")}>
                              {idx < currentIndex ? <CheckCircle2 className="w-5 h-5 text-[#27AE60]" /> : idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className={cn("font-display text-[15px] font-bold leading-none", idx === currentIndex ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>{ex.name}</p>
                            </div>
                            <p className="text-[12px] font-medium text-[var(--text-muted)] tabular-nums">{Math.floor(ex.duration / 60)}:{(ex.duration % 60).toString().padStart(2, '0')}</p>
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
            <div className="fixed inset-0 bg-[var(--surface-1)]/80 backdrop-blur-md flex items-center justify-center p-6 z-[100]">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="wellness-card p-8 w-full max-w-[320px] text-center space-y-8 bg-[var(--surface-1)] shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-orange-500" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-display text-2xl font-bold tracking-tight uppercase text-[var(--text-primary)]">End Workout?</h3>
                  <p className="text-[14px] text-[var(--text-secondary)] font-medium leading-relaxed">You haven't finished all exercises yet. This will save your current progress.</p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <button className="h-14 rounded-full btn-primary text-white font-bold text-[12px] uppercase tracking-wider border-none w-full" onClick={() => setShowEndConfirm(false)}>Resume</button>
                  <button className="h-14 rounded-full bg-[var(--surface-1)] border border-red-100 text-red-500 font-bold text-[12px] uppercase tracking-wider hover:bg-red-50 w-full transition-colors" onClick={() => { completeWorkout({ id: workout.id, isCompleted: true, date: dateStr }); setLocation("/dashboard"); }}>End Workout</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PageLayout>
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>;
}
