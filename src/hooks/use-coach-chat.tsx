import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Message = {
    role: "user" | "assistant";
    content: string;
};

type CoachChatContextType = {
    chatMessages: Message[];
    isSending: boolean;
    streamingMessage: string;
    sendMessage: (message: string) => Promise<void>;
    clearChat: () => void;
};

const CoachChatContext = createContext<CoachChatContextType | undefined>(undefined);

export function CoachProvider({ children }: { children: React.ReactNode }) {
    const [chatMessages, setChatMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem("aara_coach_chat");
        return saved ? JSON.parse(saved) : [];
    });
    const [isSending, setIsSending] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState("");

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem("aara_coach_chat", JSON.stringify(chatMessages));
    }, [chatMessages]);

    const sendMessage = useCallback(async (userMessage: string) => {
        if (!userMessage.trim() || isSending) return;

        setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsSending(true);
        setStreamingMessage("");

        try {
            const response = await fetch("/api/coach/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: chatMessages
                })
            });

            if (!response.ok) throw new Error("Failed to send message");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullMessage = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.content) {
                                    fullMessage += data.content;
                                    setStreamingMessage(fullMessage);
                                }
                                if (data.done) {
                                    setChatMessages(prev => [...prev, { role: "assistant", content: fullMessage }]);
                                    setStreamingMessage("");
                                }
                            } catch { }
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Chat error:", err);
            setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't respond. Please try again." }]);
        } finally {
            setIsSending(false);
        }
    }, [chatMessages, isSending]);

    const clearChat = useCallback(() => {
        setChatMessages([]);
        localStorage.removeItem("aara_coach_chat");
    }, []);

    return (
        <CoachChatContext.Provider value={{ chatMessages, isSending, streamingMessage, sendMessage, clearChat }}>
            {children}
        </CoachChatContext.Provider>
    );
}

export function useCoachChat() {
    const context = useContext(CoachChatContext);
    if (context === undefined) {
        throw new Error("useCoachChat must be used within a CoachProvider");
    }
    return context;
}
