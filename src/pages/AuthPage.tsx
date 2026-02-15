import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Mail, Lock, User as UserIcon, ChevronRight, Fingerprint, Key, AtSign } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import aaraLogo from "@/assets/aara-logo.png";
import { cn } from "@/lib/utils";

export default function AuthPage() {
    const { login, register, isLoggingIn, isRegistering } = useAuth();
    const [, setLocation] = useLocation();
    const searchParams = new URLSearchParams(window.location.search);
    const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
    const [activeTab, setActiveTab] = useState(initialTab);

    // Login state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Register state
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
                lastName: regLastName
            });
            setLocation("/onboarding");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-10 selection:bg-primary/20 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-blue/5 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[420px] relative z-10 space-y-10"
            >
                <div className="flex flex-col items-center space-y-6">
                    <img src={aaraLogo} alt="AaRa" className="h-24 md:h-28 w-auto" />
                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Secure Access</p>
                        <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">Wellness Console</h1>
                    </div>
                </div>

                <div className="wellness-card bg-white/60 backdrop-blur-2xl border-white/40 shadow-2xl p-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full h-14 p-1 bg-slate-100 rounded-[20px] mb-2">
                            <TabsTrigger
                                value="login"
                                className="rounded-[16px] font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all"
                            >
                                Member
                            </TabsTrigger>
                            <TabsTrigger
                                value="register"
                                className="rounded-[16px] font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all"
                            >
                                New Entry
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                {activeTab === "login" ? (
                                    <motion.div
                                        key="login-tab"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <form onSubmit={handleLogin} className="space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Identification</Label>
                                                <div className="relative group">
                                                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input
                                                        type="email"
                                                        placeholder="Email Address"
                                                        className="h-14 pl-12 rounded-[20px] border-none bg-slate-50 font-bold focus-visible:ring-primary/20 shadow-inner group-focus-within:bg-white transition-all"
                                                        value={loginEmail}
                                                        onChange={(e) => setLoginEmail(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Access Key</Label>
                                                <div className="relative group">
                                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input
                                                        type="password"
                                                        placeholder="Password"
                                                        className="h-14 pl-12 rounded-[20px] border-none bg-slate-50 font-bold focus-visible:ring-primary/20 shadow-inner group-focus-within:bg-white transition-all"
                                                        value={loginPassword}
                                                        onChange={(e) => setLoginPassword(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                type="submit"
                                                className="w-full brand-gradient text-white font-black text-sm uppercase tracking-widest h-16 rounded-[24px] shadow-xl shadow-brand-blue/30 mt-4 active:scale-[0.98] transition-all"
                                                disabled={isLoggingIn}
                                            >
                                                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Log In <ChevronRight className="ml-2 w-5 h-5" /></>}
                                            </Button>
                                        </form>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="register-tab"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <form onSubmit={handleRegister} className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">First Name</Label>
                                                    <Input
                                                        className="h-14 rounded-[20px] border-none bg-slate-50 font-bold focus-visible:ring-primary/20 shadow-inner"
                                                        value={regFirstName}
                                                        onChange={(e) => setRegFirstName(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Last Name</Label>
                                                    <Input
                                                        className="h-14 rounded-[20px] border-none bg-slate-50 font-bold focus-visible:ring-primary/20 shadow-inner"
                                                        value={regLastName}
                                                        onChange={(e) => setRegLastName(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Primary Email</Label>
                                                <Input
                                                    type="email"
                                                    className="h-14 rounded-[20px] border-none bg-slate-50 font-bold focus-visible:ring-primary/20 shadow-inner"
                                                    value={regEmail}
                                                    onChange={(e) => setRegEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Security Code</Label>
                                                <Input
                                                    type="password"
                                                    className="h-14 rounded-[20px] border-none bg-slate-50 font-bold focus-visible:ring-primary/20 shadow-inner"
                                                    value={regPassword}
                                                    onChange={(e) => setRegPassword(e.target.value)}
                                                    required
                                                    minLength={6}
                                                />
                                                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest px-2">Minimum 6 characters required</p>
                                            </div>
                                            <Button
                                                type="submit"
                                                className="w-full brand-gradient text-white font-black text-sm uppercase tracking-widest h-16 rounded-[24px] shadow-xl shadow-brand-blue/30 mt-4 active:scale-[0.98] transition-all"
                                                disabled={isRegistering}
                                            >
                                                {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <Sparkles className="ml-2 w-5 h-5" /></>}
                                            </Button>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Tabs>
                </div>

                <div className="text-center">
                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">Designed for Performance & Vitality</p>
                </div>
            </motion.div>
        </div>
    );
}
