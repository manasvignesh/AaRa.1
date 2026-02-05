import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import ProgressTracker from "@/pages/ProgressTracker";
import MealDetail from "@/pages/MealDetail";
import MealsPage from "@/pages/MealsPage";
import WorkoutDetail from "@/pages/WorkoutDetail";
import WorkoutExecution from "@/pages/WorkoutExecution";
import WorkoutsPage from "@/pages/WorkoutsPage";
import CoachPage from "@/pages/CoachPage";
import WeightLog from "@/pages/WeightLog";
import LogManualMeal from "@/pages/LogManualMeal";
import WalkRunPage from "@/pages/WalkRunPage";
import NotFound from "@/pages/not-found";

import { CoachProvider } from "@/hooks/use-coach-chat";
import { CoachFAB } from "@/components/CoachFAB";

import { ErrorBoundary } from "@/components/ErrorBoundary";

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [, setLocation] = useLocation();

  // If authenticated but no profile, force Onboarding
  useEffect(() => {
    if (!authLoading && !profileLoading && isAuthenticated && profile === null && window.location.pathname !== "/onboarding") {
      console.log("ProtectedRoute: No profile found, redirecting to onboarding");
      setLocation("/onboarding");
    }
  }, [authLoading, profileLoading, isAuthenticated, profile, setLocation]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Securing your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (profile === null && window.location.pathname !== "/onboarding") {
    return null;
  }

  // If authenticated AND has profile, but trying to access Onboarding, redirect to Dashboard
  if (profile && window.location.pathname === "/onboarding") {
    setLocation("/dashboard");
    return null;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const publicPaths = ["/", "/auth"];
    if (!isLoading && !isAuthenticated && !publicPaths.includes(window.location.pathname)) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) return null;

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? (
          <ProtectedRoute component={Dashboard} />
        ) : (
          <Landing />
        )}
      </Route>

      <Route path="/auth">
        {isAuthenticated ? (
          <ProtectedRoute component={Dashboard} />
        ) : (
          <AuthPage />
        )}
      </Route>

      {/* Auth Protected Routes */}
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/progress">
        <ProtectedRoute component={ProgressTracker} />
      </Route>
      <Route path="/meals">
        <ProtectedRoute component={MealsPage} />
      </Route>
      <Route path="/workouts">
        <ProtectedRoute component={WorkoutsPage} />
      </Route>
      <Route path="/coach">
        <ProtectedRoute component={CoachPage} />
      </Route>
      <Route path="/weight/log">
        <ProtectedRoute component={WeightLog} />
      </Route>
      <Route path="/meal/:date/:id">
        <ProtectedRoute component={MealDetail} />
      </Route>
      <Route path="/workout/:id">
        <ProtectedRoute component={WorkoutDetail} />
      </Route>
      <Route path="/workout/:id/start">
        <ProtectedRoute component={WorkoutExecution} />
      </Route>
      <Route path="/log-meal">
        <ProtectedRoute component={LogManualMeal} />
      </Route>
      <Route path="/walk-run">
        <ProtectedRoute component={WalkRunPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CoachProvider>
          <Router />
          <CoachFAB />
          <Toaster />
        </CoachProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
