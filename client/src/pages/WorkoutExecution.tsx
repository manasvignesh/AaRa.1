import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useWorkout, useCompleteWorkout } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Pause, Check, Timer, AlertCircle, Loader2, Zap, Activity, ShieldCheck, Heart, RefreshCw, X, ChevronRight, Award } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { StructuredExercise } from "@shared/schema";

type WorkoutPhase = 'warmup' | 'main' | 'cooldown' | 'rest' | 'complete';

function generateStructuredWorkout(duration: number, gymAccess: boolean = false): StructuredExercise[] {
  const totalSeconds = duration * 60;
  const restDurationBetween = 10;

  const warmupTime = Math.round(totalSeconds * 0.18);
  const mainTime = Math.round(totalSeconds * 0.62);
  const cooldownTime = Math.round(totalSeconds * 0.20);

  const exercises: StructuredExercise[] = [];

  const warmupExerciseTime = warmupTime - (3 * restDurationBetween);
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
    { name: "Plank Hold", instruction: "Hold your body in a straight line. Breathe steadily." }
  ] : [
    { name: "Bodyweight Squats", instruction: "Stand with feet shoulder-width apart. Lower down as if sitting in a chair." },
    { name: "Wall Push-ups", instruction: "Place hands on wall, lean in and push back. Keep core tight." },
    { name: "Standing Knee Raises", instruction: "Stand tall and alternate lifting knees to waist height." },
    { name: "Chair Dips", instruction: "Use a sturdy chair. Lower and raise your body using your arms." }
  ];

  const mainRestsTotal = (4 - 1) * restDurationBetween;
  const mainExerciseTime = mainTime - mainRestsTotal;
  const perExerciseDuration = Math.floor(mainExerciseTime / 4);

  for (let i = 0; i < 4; i++) {
    const template = mainExerciseTemplates[i % mainExerciseTemplates.length];
    exercises.push({ ...template, duration: perExerciseDuration, phase: 'main' });
  }

  const cooldownExerciseTime = cooldownTime - (3 * restDurationBetween);
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
  const totalExerciseTime = exercises.reduce((sum: number, ex: any) => sum + (ex.duration || 0), 0);
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
            return (exercises[currentIndex + 1] as any)?.duration || 0;
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
      if (totalElapsed === 0) {
        setTimeRemaining(currentExercise.duration || 0);
      }
      setIsRunning(true);
    }
  }, [isRunning, currentExercise, totalElapsed]);

  const handlePause = useCallback(() => setIsRunning(false), []);
  const handleResume = useCallback(() => setIsRunning(true), []);

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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full shadow-[0_0_20px_rgba(142,214,63,0.3)]" />
      </div>
    );
  }

  const isComplete = currentIndex >= exercises.length - 1 && timeRemaining === 0 && !isResting;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden selection:bg-primary/30">
      {/* Cybergrid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header Unit */}
      <header className="px-6 py-4 flex items-center justify-between z-50 glass-card border-none border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowEndConfirm(true)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1" />
          </button>
          <div>
            <h1 className="text-sm font-display font-bold text-white uppercase tracking-tight">{workout.name}</h1>
            <p className="text-[8px] font-mono text-white/30 uppercase tracking-[0.2em]">{isResting ? "RECOVERY_INTERVAL" : `UNIT_0${currentIndex + 1}_EXECUTION`}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest leading-none">Global_Time</p>
            <p className="text-[14px] font-mono text-primary font-bold">{Math.floor(totalElapsed / 60)}:{String(totalElapsed % 60).padStart(2, '0')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Heart className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Dynamic Progress Strip */}
      <div className="relative z-10">
        <div className="h-1.5 w-full bg-white/5 relative overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full bg-primary shadow-[0_0_15px_rgba(142,214,63,0.5)]"
          />
        </div>
        <div className="px-6 py-2 flex justify-between items-center bg-black/40 border-b border-white/5">
          <span className="text-[8px] font-mono text-white/40 uppercase tracking-[0.2em]">Sequence_Progress</span>
          <span className="text-[8px] font-mono text-primary uppercase tracking-[0.2em] font-bold">{Math.round(progress)}% COMPLETE</span>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="completion"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-10"
            >
              <div className="relative mx-auto w-32 h-32">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="absolute inset-0 border-4 border-dashed border-primary opacity-20 rounded-full"
                />
                <div className="absolute inset-2 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30">
                  <Award className="w-12 h-12 text-primary" />
                </div>
              </div>
              <div>
                <h2 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter mb-2 leading-none">MISSION_COMPLETE</h2>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em]">Homeostatic synchronization authorized.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="glass-card p-4 border-white/5 bg-white/[0.02] text-center">
                  <p className="text-2xl font-display font-bold text-white tracking-tighter">{Math.floor(totalElapsed / 60)}</p>
                  <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Minutes_Kinetic</p>
                </div>
                <div className="glass-card p-4 border-white/5 bg-white/[0.02] text-center">
                  <p className="text-2xl font-display font-bold text-primary tracking-tighter">100</p>
                  <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Efficiency_Index</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleComplete}
                className="w-full max-w-xs h-18 py-5 rounded-2xl bg-primary text-black font-display font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(142,214,63,0.3)] transition-all border-none outline-none"
              >
                FINALIZE_REPORT
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-2xl space-y-12"
            >
              {/* Active Hub */}
              <div className="relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 blur-[80px] -z-10 rounded-full animate-pulse" />
                <Card className={cn(
                  "p-12 text-center rounded-[3rem] border-white/5 bg-white/[0.01] backdrop-blur-3xl shadow-2xl relative overflow-hidden transition-all duration-700",
                  isResting && "border-indigo-500/30 bg-indigo-500/[0.02]"
                )}>
                  <div className="space-y-4 mb-10">
                    <motion.span
                      key={isResting ? "rest" : "active"}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "text-[10px] font-mono font-bold uppercase tracking-[0.4em] px-4 py-1.5 rounded-full border",
                        isResting ? "text-indigo-400 border-indigo-400/20 bg-indigo-400/5" : "text-primary border-primary/20 bg-primary/5"
                      )}
                    >
                      {isResting ? "RECOVERY_INTERVAL" : currentExercise?.phase?.toUpperCase() || "EXECUTION"}
                    </motion.span>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-tighter leading-tight">
                      {isResting ? "STABILIZE_CORE" : currentExercise?.name}
                    </h2>
                  </div>

                  <div className="relative w-48 h-48 mx-auto mb-10">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="96" cy="96" r="88" className="fill-none stroke-white/5 stroke-[4]" />
                      <motion.circle
                        cx="96" cy="96" r="88"
                        className={cn("fill-none stroke-[6] transition-all duration-1000", isResting ? "stroke-indigo-400" : "stroke-primary")}
                        strokeDasharray={2 * Math.PI * 88}
                        strokeDashoffset={2 * Math.PI * 88 * (1 - (timeRemaining / (isResting ? restDuration : (currentExercise?.duration || 60))))}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-mono font-bold text-white tracking-tighter leading-none">
                        {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:{String(timeRemaining % 60).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-2">{isResting ? "UNTIL_READY" : "REMAINING"}</span>
                    </div>
                  </div>

                  {!isResting && currentExercise && (
                    <p className="text-sm font-display font-medium text-white/40 uppercase tracking-tight italic leading-relaxed max-w-sm mx-auto">
                      "{currentExercise.instruction}"
                    </p>
                  )}

                  {isResting && (
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">NEXT_NODE:</p>
                      <p className="text-sm font-display font-bold text-white uppercase">{exercises[currentIndex + 1]?.name}</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Operation Controls */}
              <div className="flex justify-center items-center gap-8">
                {!isRunning && totalElapsed === 0 ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-20 px-14 rounded-2xl bg-white text-black font-display font-bold text-xl uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    onClick={handleStart}
                  >
                    INITIATE
                  </motion.button>
                ) : isRunning ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all"
                    onClick={handlePause}
                  >
                    <Pause className="w-8 h-8" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-20 px-14 rounded-2xl bg-primary text-black font-display font-bold text-xl uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(142,214,63,0.3)] border-none"
                    onClick={handleResume}
                  >
                    RESUME
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Background Bottom Overlay */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-3">
          <Zap className="w-3 h-3 text-primary opacity-40" />
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Synapse_Link: SYNCHRONIZED</span>
        </div>
        <div className="flex items-center gap-3">
          <Activity className="w-3 h-3 text-primary opacity-40" />
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Neuro_Feedback: ENGAGED</span>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-[100] backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm w-full glass-card p-10 rounded-[3rem] border-white/10 bg-black/40 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight mb-4 leading-none">ABORT_MISSION?</h3>
            <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest leading-relaxed mb-10">
              Calculated kinetic load will be recorded as partial. Are you sure?
            </p>
            <div className="flex flex-col gap-4">
              <Button
                variant="destructive"
                className="h-14 rounded-2xl bg-red-500 text-white font-display font-bold uppercase tracking-widest border-none"
                onClick={handleEndEarly}
              >
                ABORT_SESSION
              </Button>
              <Button
                variant="ghost"
                className="h-12 rounded-xl text-white/30 hover:text-white uppercase font-mono text-[9px] tracking-widest"
                onClick={() => setShowEndConfirm(false)}
              >
                CANCEL_ABORT
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
