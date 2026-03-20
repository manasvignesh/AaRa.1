import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Sparkles } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import aaraLogo from "@/assets/aara-logo.png";

export default function AuthPage() {
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: loginEmail, password: loginPassword });
      setLocation("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
      });
      setLocation("/onboarding");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-transition min-h-screen px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full space-y-8">
          <div className="animate-slide-up text-center">
            <img src={aaraLogo} alt="AARA" className="mx-auto h-20 w-auto" />
            <div className="section-label mt-5">Secure Access</div>
            <h1 className="font-display brand-gradient-text mt-2 text-4xl">Wellness Console</h1>
            <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              Sign in to continue your journey or create a new AARA account.
            </p>
          </div>

          <div className="wellness-card animate-slide-up mx-auto max-w-md p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0">
                <TabsTrigger
                  value="login"
                  className="rounded-xl border-0 bg-transparent px-0 py-0 shadow-none data-[state=active]:bg-transparent"
                >
                  <span className={activeTab === "login" ? "pill-brand" : ""}>Login</span>
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-xl border-0 bg-transparent px-0 py-0 shadow-none data-[state=active]:bg-transparent"
                >
                  <span className={activeTab === "register" ? "pill-brand" : ""}>Signup</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-8">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="stagger-1">
                    <Label className="section-label mb-2 block">Email</Label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      className="input-field"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="stagger-2">
                    <Label className="section-label mb-2 block">Password</Label>
                    <Input
                      type="password"
                      placeholder="Your password"
                      className="input-field"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary stagger-3 w-full" disabled={isLoggingIn}>
                    {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log In"}
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-8">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="stagger-1">
                      <Label className="section-label mb-2 block">First Name</Label>
                      <Input className="input-field" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} required />
                    </div>
                    <div className="stagger-2">
                      <Label className="section-label mb-2 block">Last Name</Label>
                      <Input className="input-field" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="stagger-3">
                    <Label className="section-label mb-2 block">Email</Label>
                    <Input type="email" className="input-field" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                  </div>
                  <div className="stagger-4">
                    <Label className="section-label mb-2 block">Password</Label>
                    <Input
                      type="password"
                      className="input-field"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <button type="submit" className="btn-primary stagger-5 w-full" disabled={isRegistering}>
                    {isRegistering ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <Sparkles className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="animate-slide-up text-center text-sm">
            <a href="/" className="text-brand">
              Return to landing page
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
