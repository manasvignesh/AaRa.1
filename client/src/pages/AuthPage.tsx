import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Mail, Lock, User as UserIcon } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import aaraLogo from "@/assets/aara-logo.png";

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
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-4">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl" />
                <div className="absolute top-40 right-20 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="flex justify-center mb-8">
                    <img src={aaraLogo} alt="AaRa" className="h-24 w-auto drop-shadow-md" />
                </div>

                <Card className="border-white/50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 shadow-2xl">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full h-12 p-1 bg-sky-100/50 dark:bg-slate-800/50">
                            <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Login</TabsTrigger>
                            <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-sky-600 data-[state=active]:shadow-sm">Register</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white">Welcome Back</CardTitle>
                                <CardDescription>Enter your credentials to access your personal plan</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleLogin}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                className="pl-10"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="password"
                                                type="password"
                                                className="pl-10"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-bold h-11" disabled={isLoggingIn}>
                                        {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                        Log In
                                    </Button>
                                </CardFooter>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white">Create Account</CardTitle>
                                <CardDescription>Join AaRa and start your personalized wellness journey</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleRegister}>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                value={regFirstName}
                                                onChange={(e) => setRegFirstName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                value={regLastName}
                                                onChange={(e) => setRegLastName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="regEmail">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="regEmail"
                                                type="email"
                                                placeholder="you@example.com"
                                                className="pl-10"
                                                value={regEmail}
                                                onChange={(e) => setRegEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="regPassword">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="regPassword"
                                                type="password"
                                                className="pl-10"
                                                value={regPassword}
                                                onChange={(e) => setRegPassword(e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic">Minimum 6 characters</p>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold h-11" disabled={isRegistering}>
                                        {isRegistering ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                        Create Account
                                    </Button>
                                </CardFooter>
                            </form>
                        </TabsContent>
                    </Tabs>
                </Card>
            </motion.div>
        </div>
    );
}
