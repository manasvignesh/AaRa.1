import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { useDailyPlan } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { useCoachChat } from "@/hooks/use-coach-chat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, Sparkles, TrendingUp, Utensils, Dumbbell, Heart, Send, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function CoachPage() {
    const { data: user, isLoading: userLoading } = useUserProfile();
    const { chatMessages, isSending, streamingMessage, sendMessage } = useCoachChat();

    // Local input state (still needed for typing)
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
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
            <div className="min-h-screen flex items-center justify-center bg-secondary/30">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-white dark:bg-black overflow-hidden font-sans">
            <Navigation />

            <main className="flex-1 flex flex-col h-full bg-[#F2F2F7] dark:bg-black relative">
                {/* Header */}
                <header className="px-6 py-4 glass-panel sticky top-0 z-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
                            <Sparkles className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                            <p className="text-[17px] font-semibold tracking-tight">Coach</p>
                            <p className="text-[12px] text-primary font-medium">Assistant</p>
                        </div>
                    </div>
                </header>

                {/* Chat Section */}
                <div className="flex-1 overflow-y-auto px-4 pt-6 pb-52 md:pb-40 scrollbar-hide">
                    <div className="max-w-2xl mx-auto space-y-2">
                        {/* Welcome Message */}
                        {chatMessages.length === 0 && !streamingMessage && (
                            <div className="text-center py-20 px-6">
                                <span className="text-4xl mb-4 block">✨</span>
                                <h2 className="text-2xl font-bold tracking-tight mb-2">How can I help you?</h2>
                                <p className="text-[15px] text-muted-foreground leading-snug">
                                    I'm your personal health & wellness guide. Ask me about your nutrition, workouts, or track your progress.
                                </p>
                            </div>
                        )}

                        {/* Messages */}
                        {chatMessages.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "flex flex-col w-full mb-1",
                                    msg.role === "user" ? "items-end" : "items-start"
                                )}
                            >
                                <div className={cn(
                                    "px-4 py-2.5 rounded-[20px] max-w-[85%] text-[16px] leading-[1.3] shadow-sm",
                                    msg.role === "user"
                                        ? "bg-[#2CC0D8] text-white rounded-tr-md"
                                        : "bg-[#E9E9EB] dark:bg-[#1C1C1E] text-black dark:text-white rounded-tl-md"
                                )}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}

                        {/* Streaming message */}
                        {streamingMessage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-start w-full mb-1"
                            >
                                <div className="px-4 py-2.5 rounded-[20px] rounded-tl-md bg-[#E9E9EB] dark:bg-[#1C1C1E] text-black dark:text-white max-w-[85%] text-[16px] leading-[1.3] shadow-sm">
                                    {streamingMessage}
                                    <span className="inline-block w-1.5 h-4 bg-primary/40 ml-1 animate-pulse" />
                                </div>
                            </motion.div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Chat Input - iOS Style */}
                <div className="absolute bottom-[72px] md:bottom-0 left-0 right-0 glass-panel p-4 pb-[calc(env(safe-area-inset-bottom,20px)+12px)] md:pb-4 z-20">
                    <div className="max-w-2xl mx-auto flex items-center gap-2">
                        <div className="flex-1 bg-white/50 dark:bg-white/10 rounded-[22px] border border-black/5 dark:border-white/10 p-1 flex items-center pr-1 overflow-hidden">
                            <input
                                placeholder="iMessage"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                disabled={isSending}
                                className="flex-1 h-9 bg-transparent px-4 py-2 text-[16px] outline-none placeholder:text-muted-foreground/50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!chatInput.trim() || isSending}
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90",
                                    chatInput.trim() ? "bg-[#2CC0D8] text-white" : "bg-muted text-muted-foreground/30"
                                )}
                            >
                                {isSending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 fill-current" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
