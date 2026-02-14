import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { useUserProfile } from "@/hooks/use-user";
import { useCoachChat } from "@/hooks/use-coach-chat";
import { Loader2, Sparkles, Send, Cpu, Zap, Activity, ShieldCheck, Terminal, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function CoachPage() {
    const { data: user, isLoading: userLoading } = useUserProfile();
    const { chatMessages, isSending, streamingMessage, sendMessage } = useCoachChat();

    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, streamingMessage]);

    const handleSend = async () => {
        if (!chatInput.trim() || isSending) return;
        const msg = chatInput.trim();
        setChatInput("");
        await sendMessage(msg);
    };

    if (userLoading) {
        return (
            <div className="flex flex-col md:flex-row min-h-screen bg-background relative overflow-hidden">
                <Navigation />
                <main className="flex-1 flex flex-col items-center justify-center gap-8 z-10">
                    <motion.div
                        animate={{
                            rotate: 360,
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="w-20 h-20 rounded-full border-2 border-primary border-t-transparent shadow-[0_0_30px_rgba(142,214,63,0.3)] flex items-center justify-center"
                    >
                        <Bot className="w-8 h-8 text-primary animate-pulse" />
                    </motion.div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#050505] overflow-hidden selection:bg-primary/30">
            <Navigation />

            <main className="flex-1 flex flex-col h-full relative">
                {/* Background Cybergrid */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
                    <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                </div>

                {/* Status Header */}
                <header className="px-8 py-6 glass-card border-none border-b border-white/5 bg-white/[0.02] flex items-center justify-between z-20">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full animate-pulse" />
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary relative">
                                <Bot className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-bold text-white uppercase tracking-tight">NEURAL_AI_COACH</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                <p className="text-[9px] font-mono text-primary font-bold uppercase tracking-[0.3em]">Status: ONLINE_LINK_ESTABLISHED</p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Processing_Core</p>
                            <p className="text-[10px] font-mono text-white/60">V.4.2_GEN_N</p>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10" />
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Security_Level</p>
                            <p className="text-[10px] font-mono text-primary font-bold">ALPHA_ENCRYPTED</p>
                        </div>
                    </div>
                </header>

                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto px-6 pt-10 pb-56 md:pb-44 scrollbar-hide z-10">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {/* Initial State */}
                        {chatMessages.length === 0 && !streamingMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-24 space-y-6"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 mx-auto flex items-center justify-center">
                                    <Terminal className="w-8 h-8 text-primary opacity-40" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-display font-bold text-white uppercase tracking-tight mb-2">Awaiting_Instructions</h2>
                                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed">
                                        Input your nutritional, kinetic, or morphological queries for immediate processing.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-8">
                                    {[
                                        "OPTIMIZE_MY_MEAL_PLAN",
                                        "ADJUST_INTENSITY_WORKOUT",
                                        "RECOVERY_PROTOCOL_REQUEST",
                                        "DIETARY_RESTRICTION_LOG"
                                    ].map(cmd => (
                                        <button
                                            key={cmd}
                                            onClick={() => setChatInput(cmd.toLowerCase().replace(/_/g, ' '))}
                                            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                                        >
                                            <p className="text-[9px] font-mono text-white/40 group-hover:text-primary transition-colors tracking-widest uppercase">{cmd}</p>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Message Stream */}
                        <AnimatePresence>
                            {chatMessages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={cn(
                                        "flex flex-col max-w-[85%] relative",
                                        msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                                    )}
                                >
                                    <div className={cn(
                                        "px-6 py-4 rounded-[2rem] text-sm leading-relaxed border relative",
                                        msg.role === "user"
                                            ? "bg-primary text-black font-medium border-primary shadow-[0_0_20px_rgba(142,214,63,0.2)] rounded-tr-sm"
                                            : "bg-white/[0.03] text-white/90 border-white/5 rounded-tl-sm hover:border-white/20 transition-all shadow-xl"
                                    )}>
                                        {msg.content}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 px-2">
                                        <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">{msg.role === "user" ? "Bio_Source" : "AI_Core"} // {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Streaming Feedback */}
                        {streamingMessage && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col items-start mr-auto max-w-[85%]"
                            >
                                <div className="px-6 py-4 rounded-[2rem] rounded-tl-sm bg-white/[0.05] border border-primary/20 text-white/90 text-sm leading-relaxed shadow-xl">
                                    {streamingMessage}
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="inline-block w-2 h-4 bg-primary ml-1 align-middle"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2 px-2">
                                    <Loader2 className="w-2.5 h-2.5 text-primary animate-spin" />
                                    <p className="text-[8px] font-mono text-primary font-bold uppercase tracking-widest">Synthesizing_Response...</p>
                                </div>
                            </motion.div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Tactical Input Unit */}
                <div className="absolute bottom-[80px] md:bottom-6 left-0 right-0 px-6 z-20">
                    <div className="max-w-3xl mx-auto relative group">
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 via-transparent to-primary/30 rounded-[2.5rem] -z-10 blur-sm opacity-50 transition-opacity" />
                        <div className="glass-card p-2 rounded-[2.5rem] bg-black/60 shadow-2xl border-white/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-focus-within:text-primary transition-colors">
                                <Terminal className="w-5 h-5" />
                            </div>
                            <input
                                placeholder="TYPE_COMMAND_HERE..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                disabled={isSending}
                                className="flex-1 bg-transparent border-none outline-none py-4 text-white font-mono text-xs uppercase tracking-[0.2em] placeholder:text-white/10"
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSend}
                                disabled={!chatInput.trim() || isSending}
                                className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                                    chatInput.trim() ? "bg-primary text-black shadow-[0_0_20px_rgba(142,214,63,0.4)]" : "bg-white/5 text-white/10"
                                )}
                            >
                                {isSending ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <Send className="w-6 h-6" />
                                )}
                            </motion.button>
                        </div>
                    </div>
                    {/* Input Status Sub-bar */}
                    <div className="max-w-3xl mx-auto flex justify-between px-8 mt-3">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3 text-primary opacity-40" />
                                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Latency: 24ms</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-primary opacity-40" />
                                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Secure_Layer: ON</span>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-white/10 uppercase tracking-[0.3em]">AI_Core_Link_v4.2</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
