import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";

import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user";

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
import CheatMeal from "@/pages/CheatMeal";
import CookWithIngredients from "@/pages/CookWithIngredients";
import HostelMode from "@/pages/HostelMode";
import NotFound from "@/pages/not-found";

import { CoachProvider } from "@/hooks/use-coach-chat";
import { CoachFAB } from "@/components/CoachFAB";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function LoadingScreen() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? "#111318" : "#F5F9FF",
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: isDark
              ? "linear-gradient(145deg, #1E2330, #181C22)"
              : "linear-gradient(135deg, #2F80ED, #28B5A0, #27AE60)",
            border: isDark ? "1px solid rgba(232,169,58,0.25)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isDark
              ? "0 0 24px rgba(232,169,58,0.2)"
              : "0 8px 24px rgba(47,128,237,0.3)",
          }}
        >
          <span
            className="font-display text-xl"
            style={{
              color: isDark ? "#E8A93A" : "#FFFFFF",
              fontWeight: 700,
            }}
          >
            Aa
          </span>
        </div>
        <div className="text-center">
          <p className="font-display text-2xl brand-gradient-text">AARA</p>
          <p
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            Wellness
          </p>
        </div>
        <div
          style={{
            width: 120,
            height: 2,
            borderRadius: 999,
            background: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(47,128,237,0.08)",
            overflow: "hidden",
          }}
        >
          <div className="skeleton" style={{ width: "100%", height: "100%" }} />
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (
      !authLoading &&
      !profileLoading &&
      isAuthenticated &&
      profile === null &&
      window.location.pathname !== "/onboarding"
    ) {
      setLocation("/onboarding");
    }
  }, [authLoading, profileLoading, isAuthenticated, profile, setLocation]);

  if (authLoading || profileLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (profile === null && window.location.pathname !== "/onboarding") {
    return null;
  }

  if (profile && window.location.pathname === "/onboarding") {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="page-transition">
      <Component />
    </div>
  );
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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? <ProtectedRoute component={Dashboard} /> : <Landing />}
      </Route>

      <Route path="/auth">
        {isAuthenticated ? <ProtectedRoute component={Dashboard} /> : <AuthPage />}
      </Route>

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
      <Route path="/cheat-meal">
        <ProtectedRoute component={CheatMeal} />
      </Route>
      <Route path="/cook-with-ingredients">
        <ProtectedRoute component={CookWithIngredients} />
      </Route>
      <Route path="/hostel">
        <ProtectedRoute component={HostelMode} />
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
