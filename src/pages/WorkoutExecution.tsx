import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useWorkout, useCompleteWorkout } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Pause, Check, Timer, AlertCircle, Loader2, PlayCircle, SkipForward, XCircle, Info, ChevronLeft, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { StructuredExercise } from "@shared/schema";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { motion, AnimatePresence } from "framer-motion";

function generateStructuredWorkout(duration: number, gymAccess: boolean = false): StructuredExercise[] {
  const totalSeconds = duration * 60;
  const restDurationBetween = 10;

  const warmupTime = Math.round(totalSeconds * 0.18);
  const mainTime = Math.round(totalSeconds * 0.62);
  const cooldownTime = Math.round(totalSeconds * 0.20);

  const exercises: StructuredExercise[] = [];

  const warmupRests = 3 * restDurationBetween;
  const warmupExerciseTime = warmupTime - warmupRests;
  exercises.push(
    { name: "Arm Circles", duration: Math.round(warmupExerciseTime * 0.25), instruction: "Gently rotate your arms in circles. Start small, gradually increase.", phase: 'warmup' },
    { name: "Marching in Place", duration: Math.round(warmupExerciseTime * 0.35), instruction: "Lift your knees high while marching. Keep your core engaged.", phase: 'warmup' },
    { name: "Hip Rotations", duration: Math.round(warmupExerciseTime * 0.20), instruction: "Place hands on hips and rotate in circles. Switch directions.", phase: 'warmup' },
    { name: "Gentle Squats", duration: Math.round(warmupExerciseTime * 0.20), instruction: "Slowly lower into a quarter squat. No need to go deep.", phase: 'warmup' }
  );

  const mainExerciseTemplates = gymAccess ? [
    { name: "Bodyweight Squats", instruction: "Stand with feet shoulder-width apart. Lower down as if sitting in a chair." },
    { name: "Push-ups", instruction: "Choose your variation. Keep your body in a straight line." },
    { name: "Lunges", instruction: "Step forward and lower your back knee. Alternate legs." },
    { name: "Plank Hold", instruction: "Hold your body in a straight line. Breathe steadily." },
    { name: "Glute Bridges", instruction: "Lie on your back, feet flat. Lift your hips toward the ceiling." },
  ] : [
    { name: "Bodyweight Squats", instruction: "Stand with feet shoulder-width apart. Lower down as if sitting in a chair." },
    { name: "Wall Push-ups", instruction: "Place hands on wall, lean in and push back. Keep core tight." },
    { name: "Standing Knee Raises", instruction: "Stand tall and alternate lifting knees to waist height." },
    { name: "Chair Dips", instruction: "Use a sturdy chair. Lower and raise your body using your arms." },
    { name: "Glute Bridges", instruction: "Lie on your back, feet flat. Lift your hips toward the ceiling." },
  ];

  const mainExercisesCount = Math.max(5, Math.floor(mainTime / 50));
  const mainRestsTotal = (mainExercisesCount - 1) * restDurationBetween;
  const mainExerciseTime = mainTime - mainRestsTotal;
  const perExerciseDuration = Math.floor(mainExerciseTime / mainExercisesCount);

  for (let i = 0; i < mainExercisesCount; i++) {
    const template = mainExerciseTemplates[i % mainExerciseTemplates.length];
    exercises.push({ ...template, duration: perExerciseDuration, phase: 'main' });
  }

  const cooldownRests = 3 * restDurationBetween;
  const cooldownExerciseTime = cooldownTime - cooldownRests;
  exercises.push(
    { name: "Deep Breathing", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Breathe in for 4 counts, hold for 4, out for 6. Relax your shoulders.", phase: 'cooldown' },
    { name: "Standing Forward Fold", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Let your upper body hang. Bend knees if needed.", phase: 'cooldown' },
    { name: "Quad Stretch", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Hold each leg for 15 seconds. Use wall for balance if needed.", phase: 'cooldown' },
    { name: "Final Relaxation", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Close your eyes. Take 5 slow, deep breaths. You did it.", phase: 'cooldown' }
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
  const totalExerciseTime = exercises.reduce((sum: number, ex: any) => sum + ex.duration, 0);
  const totalRestTime = (exercises.length - 1) * restDuration;
  const totalDuration = totalExerciseTime + totalRestTime;
  const progress = (totalElapsed / totalDuration) * 100;

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

  const handleStart = useCallback(async () => {
    if (!isRunning && currentExercise && workout) {
      try {
        await fetch(`/api/workouts/${workout.id}/start`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (e) {
        console.log("Session tracking not critical:", e);
      }
      setTimeRemaining(currentExercise.duration);
      setIsRunning(true);
    }
  }, [isRunning, currentExercise, workout]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleResume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handleEndEarly = useCallback(() => {
    if (workout) {
      completeWorkout({ id: workout.id, isCompleted: true, feedback: "partial", date: dateStr });
    }
    setLocation("/dashboard");
  }, [workout, completeWorkout, setLocation, dateStr]);

  const handleComplete = useCallback(() => {
    if (workout) {
      completeWorkout({ id: workout.id, isCompleted: true, date: dateStr });
    }
    setLocation("/dashboard");
  }, [workout, completeWorkout, setLocation, dateStr]);

  if (workoutLoading || !workout) {
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

  const isComplete = currentIndex >= exercises.length - 1 && timeRemaining === 0 && !isResting;

  return (
    <PageLayout
      header={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowEndConfirm(true)}
              className="rounded-full w-10 h-10 border-none bg-card shadow-sm hover:bg-secondary/50"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Active Session</p>
              <p className="text-[13px] font-bold text-muted-foreground">{workout.name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tracking-tighter">{Math.floor(totalElapsed / 60)}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">:</span>
              <span className="text-lg font-black tracking-tighter">{String(totalElapsed % 60).padStart(2, '0')}</span>
            </div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Elapsed</p>
          </div>
        </div>
      }
    >
      <div className="max-w-xl mx-auto space-y-8">
        {/* Main Progress Indicator */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full brand-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{Math.round(progress)}% Complete</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Exercise {currentIndex + 1} of {exercises.length}</span>
          </div>
        </div>

        <main className="flex flex-col items-center">
          <AnimatePresence mode="wait">
            {isComplete ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="text-center space-y-8 py-10"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <div className="w-28 h-28 rounded-[40px] bg-primary flex items-center justify-center mx-auto shadow-2xl relative z-10">
                    <CheckCircle2 className="w-14 h-14 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black tracking-tighter">Victorious!</h2>
                  <p className="text-muted-foreground font-medium max-w-[280px] mx-auto">
                    You've dominated this {workout.duration} minute session. Consistency is your superpower.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full h-16 rounded-[24px] text-lg font-black brand-gradient text-white shadow-xl scale-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  onClick={handleComplete}
                >
                  Save & Return Home
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key={currentIndex + (isResting ? "-rest" : "")}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full space-y-10"
              >
                {/* Active Exercise Card */}
                <div className={cn(
                  "wellness-card p-10 w-full text-center space-y-10 transition-all duration-500 relative overflow-hidden bg-card border-none shadow-xl",
                  isResting && "bg-blue-50/50 shadow-blue-500/5 ring-1 ring-blue-100"
                )}>
                  {isResting && (
                    <div className="absolute inset-x-0 top-0 h-1 bg-blue-500/20">
                      <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: restDuration, ease: "linear" }}
                      />
                    </div>
                  )}

                  <div className="space-y-2 relative z-10">
                    <div className={cn(
                      "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                      isResting ? "bg-blue-500 text-white" : "bg-primary/10 text-primary"
                    )}>
                      {isResting ? "Recovery Mode" : currentExercise?.phase}
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter leading-tight text-foreground">
                      {isResting ? "Breathe Deep" : currentExercise?.name}
                    </h2>
                  </div>

                  <div className="flex flex-col items-center justify-center relative z-10">
                    <div className="text-[120px] font-black tracking-tighter leading-none text-primary/10 absolute -inset-10 flex items-center justify-center select-none">
                      {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:{String(timeRemaining % 60).padStart(2, '0')}
                    </div>
                    <div className="text-7xl font-black tracking-tighter leading-none text-foreground tabular-nums relative">
                      {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                    </div>
                  </div>

                  {!isResting && currentExercise && (
                    <div className="flex gap-4 p-5 bg-secondary/20 rounded-[24px] items-start text-left relative z-10">
                      <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center shrink-0 shadow-sm border border-border/10">
                        <Info className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-[14px] text-muted-foreground font-semibold leading-relaxed">
                        {currentExercise.instruction}
                      </p>
                    </div>
                  )}

                  {isResting && (
                    <div className="relative z-10 flex flex-col items-center">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-60">Preparing for</p>
                      <p className="text-lg font-bold text-blue-600 tracking-tight">
                        {exercises[currentIndex + 1]?.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Primary Controls */}
                <div className="flex flex-col gap-4">
                  {!isRunning && totalElapsed === 0 ? (
                    <Button
                      size="lg"
                      className="w-full h-16 rounded-[24px] text-xl font-black brand-gradient text-white shadow-xl shadow-brand-blue/20"
                      onClick={handleStart}
                    >
                      <PlayCircle className="mr-3 w-8 h-8 fill-current" /> Begin Session
                    </Button>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {isRunning ? (
                        <Button
                          variant="secondary"
                          size="lg"
                          className="w-full h-16 rounded-[24px] text-xl font-black bg-card shadow-sm border-none transition-all hover:bg-secondary/50 group"
                          onClick={handlePause}
                        >
                          <Pause className="mr-3 w-6 h-6 fill-current group-hover:scale-110 transition-transform" /> Take a Break
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          className="w-full h-16 rounded-[24px] text-xl font-black brand-gradient text-white shadow-xl"
                          onClick={handleResume}
                        >
                          <PlayCircle className="mr-3 w-8 h-8 fill-current" /> Resume Energy
                        </Button>
                      )}

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 h-14 rounded-[20px] bg-background border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors"
                          onClick={() => setShowEndConfirm(true)}
                        >
                          <XCircle className="w-5 h-5 mr-2" /> End Early
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 h-14 rounded-[20px] bg-background border-secondary/50 text-muted-foreground font-bold hover:bg-secondary/20 transition-colors"
                          onClick={() => {
                            if (isResting) {
                              setIsResting(false);
                              setCurrentIndex(i => i + 1);
                              setTimeRemaining(exercises[currentIndex + 1]?.duration || 0);
                            } else {
                              setTimeRemaining(1);
                            }
                          }}
                        >
                          Next <SkipForward className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Confirmation Overlay */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100]"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-[40px] p-10 max-w-sm w-full space-y-8 text-center shadow-2xl border-none"
            >
              <div className="w-20 h-20 rounded-[28px] bg-orange-50 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-10 h-10 text-orange-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">Pause for today?</h3>
                <p className="text-muted-foreground font-medium text-[15px] leading-relaxed">
                  Every minute you put in counts. We'll save your partial progress and cheer you on for the next time!
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  className="h-14 rounded-full brand-gradient text-white font-black text-lg"
                  onClick={() => setShowEndConfirm(false)}
                >
                  I'm Staying
                </Button>
                <Button
                  variant="ghost"
                  className="h-12 rounded-full text-red-500 font-bold hover:text-red-600 hover:bg-red-50"
                  onClick={handleEndEarly}
                >
                  End Session Early
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
