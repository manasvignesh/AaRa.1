import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Mail, Lock, User as UserIcon, ShieldKeyhole, Fingerprint, Cpu, Zap, Activity } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
                lastName: regLastName
            });
            setLocation("/onboarding");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-primary/30">
            {/* Cybergrid & Scanning Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
                <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] -z-10 rounded-full opacity-20" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="flex flex-col items-center mb-12">
                    <motion.div
                        initial={{ rotateY: 180 }}
                        animate={{ rotateY: 0 }}
                        transition={{ duration: 1.5, type: "spring" }}
                        className="relative mb-6"
                    >
                        <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                        <img src={aaraLogo} alt="AaRa" className="h-24 w-auto relative brightness-125 hover:scale-110 transition-transform cursor-pointer" />
                    </motion.div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-[0.2em] uppercase">Node_Authorization</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.4em]">Secure_Link // 256_BIT_ENCRYPTION</p>
                    </div>
                </div>

                <div className="glass-card p-2 rounded-[2.5rem] border-white/5 bg-white/[0.02] shadow-2xl relative">
                    <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/20 via-transparent to-primary/10 rounded-[2.5rem] -z-10 opacity-50" />

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full h-16 p-2 bg-black/40 rounded-3xl mb-4">
                            <TabsTrigger
                                value="login"
                                className="rounded-2xl transition-all data-[state=active]:bg-primary data-[state=active]:text-black font-display font-bold uppercase text-[10px] tracking-widest"
                            >
                                IDENTITY_MATCH
                            </TabsTrigger>
                            <TabsTrigger
                                value="register"
                                className="rounded-2xl transition-all data-[state=active]:bg-primary data-[state=active]:text-black font-display font-bold uppercase text-[10px] tracking-widest"
                            >
                                CREATE_NODE
                            </TabsTrigger>
                        </TabsList>

                        <div className="px-6 pb-6 pt-2">
                            <AnimatePresence mode="wait">
                                <TabsContent value="login" key="login">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        <div className="mb-8">
                                            <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight">Access Recovery</h2>
                                            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Input authorized credentials for synthesis.</p>
                                        </div>

                                        <form onSubmit={handleLogin} className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2 group">
                                                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Credential_ID (Email)</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            placeholder="USER@DOMAIN.COM"
                                                            className="h-14 pl-12 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 transition-all font-mono text-xs text-white uppercase tracking-widest"
                                                            value={loginEmail}
                                                            onChange={(e) => setLoginEmail(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 group">
                                                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Access_Code (Password)</Label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                                        <Input
                                                            id="password"
                                                            type="password"
                                                            placeholder="••••••••"
                                                            className="h-14 pl-12 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 transition-all font-mono text-xs text-white"
                                                            value={loginPassword}
                                                            onChange={(e) => setLoginPassword(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                disabled={isLoggingIn}
                                                className="w-full h-16 rounded-2xl bg-primary text-black font-display font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(142,214,63,0.3)] hover:neon-glow transition-all flex items-center justify-center gap-3 border-none outline-none mt-8 disabled:opacity-50"
                                            >
                                                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldKeyhole className="w-5 h-5" />}
                                                ESTABLISH_LINK
                                            </motion.button>
                                        </form>
                                    </motion.div>
                                </TabsContent>

                                <TabsContent value="register" key="register">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <div className="mb-8">
                                            <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight">Node Initialization</h2>
                                            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Registering new biological profile in neural archive.</p>
                                        </div>

                                        <form onSubmit={handleRegister} className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2 group">
                                                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">First_Alias</Label>
                                                    <Input
                                                        className="h-14 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 transition-all font-mono text-xs text-white uppercase tracking-widest"
                                                        value={regFirstName}
                                                        onChange={(e) => setRegFirstName(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2 group">
                                                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Last_Alias</Label>
                                                    <Input
                                                        className="h-14 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 transition-all font-mono text-xs text-white uppercase tracking-widest"
                                                        value={regLastName}
                                                        onChange={(e) => setRegLastName(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2 group">
                                                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Registry_Mail</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                                        <Input
                                                            type="email"
                                                            placeholder="USER@DOMAIN.COM"
                                                            className="h-14 pl-12 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 transition-all font-mono text-xs text-white uppercase tracking-widest"
                                                            value={regEmail}
                                                            onChange={(e) => setRegEmail(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 group">
                                                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Secure_Pass_Code</Label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                                        <Input
                                                            type="password"
                                                            placeholder="••••••••"
                                                            className="h-14 pl-12 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 transition-all font-mono text-xs text-white"
                                                            value={regPassword}
                                                            onChange={(e) => setRegPassword(e.target.value)}
                                                            required
                                                            minLength={6}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                disabled={isRegistering}
                                                className="w-full h-16 rounded-2xl bg-primary text-black font-display font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(142,214,63,0.3)] hover:neon-glow transition-all flex items-center justify-center gap-3 border-none outline-none mt-4 disabled:opacity-50"
                                            >
                                                {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                                RESERVE_NODE
                                            </motion.button>
                                        </form>
                                    </motion.div>
                                </TabsContent>
                            </AnimatePresence>
                        </div>
                    </Tabs>
                </div>

                {/* Secure Status Footer */}
                <div className="flex justify-between items-center mt-12 px-8">
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2 group cursor-help">
                            <Fingerprint className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[8px] font-mono font-bold text-white/20 group-hover:text-white/40 transition-colors uppercase tracking-[0.2em]">Bio_Verify</span>
                        </div>
                        <div className="flex items-center gap-2 group cursor-help">
                            <Activity className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[8px] font-mono font-bold text-white/20 group-hover:text-white/40 transition-colors uppercase tracking-[0.2em]">Live_Sync</span>
                        </div>
                    </div>
                    <div className="h-px flex-1 bg-white/5 mx-8" />
                    <div className="text-[8px] font-mono font-bold text-white/10 uppercase tracking-[0.4em]">Protocol_v.4.2</div>
                </div>
            </motion.div>

            {/* Background Scanner Line */}
            <motion.div
                animate={{ top: ['-10%', '110%'] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[100px] bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent pointer-events-none"
            />
        </div>
    );
}
