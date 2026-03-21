import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";

import { Navigation } from "@/components/Navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCoachChat } from "@/hooks/use-coach-chat";
import { useUserProfile } from "@/hooks/use-user";

export default function CoachPage() {
  const { isLoading: userLoading } = useUserProfile();
  const { chatMessages, streamingMessage, isSending, sendMessage, clearChat } = useCoachChat();

  const [draft, setDraft] = useState("");
  const [activeContext, setActiveContext] = useState("General");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chatMessages.length, streamingMessage, isSending]);

  useEffect(() => {
    const handleResize = () => {
      // When keyboard opens, scroll messages to bottom.
      if (document.activeElement === inputRef.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (userLoading) {
    return (
      <div className="page-transition flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const canSend = draft.trim().length > 0 && !isSending;
  const isTyping = isSending && !streamingMessage;

  const onSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await sendMessage(text);
  };

  const handleSuggestion = (suggestion: string) => {
    setDraft(suggestion);
    // Let the draft render first, then focus.
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const frameStyle: React.CSSProperties = {
    maxWidth: 448, // matches Tailwind `max-w-md`
    width: "100%",
    margin: "0 auto",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
        background: "var(--surface-base)",
      }}
    >
      {/* ── ZONE 1: Fixed Header ── */}
      <div
        style={{
          flexShrink: 0,
          paddingTop: "max(env(safe-area-inset-top), 48px)",
          paddingBottom: "12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "var(--surface-base)",
          zIndex: 10,
        }}
      >
        <div style={{ ...frameStyle, paddingLeft: 20, paddingRight: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <div>
              <div className="section-label">AI COACH</div>
              <h1
                className="font-display"
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                AARA Assistant
              </h1>
            </div>
            <ThemeToggle />
          </div>

          <div style={{ marginTop: "8px" }}>
            <button
              onClick={clearChat}
              type="button"
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-secondary)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* ── ZONE 2: Fixed Context Chips ── */}
      <div
        style={{
          flexShrink: 0,
          paddingTop: "10px",
          paddingBottom: "10px",
          background: "var(--surface-base)",
          zIndex: 9,
        }}
      >
        <div style={{ ...frameStyle, paddingLeft: 20, paddingRight: 20 }}>
          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "4px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {[
              "General",
              "Meal Advice",
              "Workout Advice",
              "Hostel Mode",
              "Cheat Meal Help",
              "Cook with Ingredients",
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => setActiveContext(chip)}
                type="button"
                style={{
                  flexShrink: 0,
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  border: "1px solid",
                  transition: "all 0.2s ease",
                  background: activeContext === chip ? "var(--brand-primary)" : "transparent",
                  borderColor:
                    activeContext === chip ? "var(--brand-primary)" : "rgba(255,255,255,0.12)",
                  color: activeContext === chip ? "var(--surface-base)" : "var(--text-secondary)",
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ZONE 3: Scrollable Messages Area ── */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px 0",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div style={{ ...frameStyle, paddingLeft: 20, paddingRight: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {chatMessages.length === 0 && !streamingMessage && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius: "18px 18px 18px 4px",
                background: "var(--surface-2)",
                color: "var(--text-primary)",
                fontSize: "14px",
                lineHeight: "1.55",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              Ask about meals, training, recovery, or consistency. I'll keep it concise and actionable.
            </div>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius:
                  msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user" ? "var(--brand-primary)" : "var(--surface-2)",
                color: msg.role === "user" ? "var(--surface-base)" : "var(--text-primary)",
                fontSize: "14px",
                lineHeight: "1.55",
                border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.06)" : "none",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {streamingMessage && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius: "18px 18px 18px 4px",
                background: "var(--surface-2)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "var(--text-primary)",
                fontSize: "14px",
                lineHeight: "1.55",
                whiteSpace: "pre-wrap",
              }}
            >
              {streamingMessage}
            </div>
          </div>
        )}

        {isTyping && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "18px 18px 18px 4px",
                background: "var(--surface-2)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--text-muted)",
                    animation: "typingDot 1.2s ease infinite",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── ZONE 4: Fixed Quick Suggestions ── */}
      {chatMessages.length === 0 && (
        <div
          style={{
            flexShrink: 0,
            paddingBottom: "8px",
          }}
        >
          <div style={{ ...frameStyle, paddingLeft: 20, paddingRight: 20 }}>
            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {["What should I eat?", "Adjust my dinner", "I had a cheat meal", "Help with mess food"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestion(suggestion)}
                    type="button"
                    style={{
                      flexShrink: 0,
                      padding: "8px 14px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "500",
                      background: "var(--surface-2)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ZONE 5: Fixed Input Bar (just above nav) ── */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 0",
          paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(var(--surface-base-rgb), 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          marginBottom: "calc(64px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ ...frameStyle, paddingLeft: 20, paddingRight: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "10px",
              background: "var(--surface-2)",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "8px 8px 8px 16px",
              transition: "border-color 0.2s",
            }}
            onFocusCapture={() => {
              // Scroll to bottom when keyboard opens.
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 300);
            }}
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                // Auto-resize textarea (capped).
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
              placeholder="Ask AARA anything..."
              rows={1}
              disabled={isSending}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: "14px",
                lineHeight: "1.5",
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
                maxHeight: "120px",
                overflowY: "auto",
                scrollbarWidth: "none",
              }}
            />
            <button
              onClick={() => void onSend()}
              disabled={!draft.trim() || isSending}
              type="button"
              style={{
                width: 36,
                height: 36,
                borderRadius: "12px",
                background: draft.trim() ? "var(--brand-primary)" : "rgba(255,255,255,0.06)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: draft.trim() && !isSending ? "pointer" : "default",
                flexShrink: 0,
                transition: "all 0.2s ease",
                opacity: canSend ? 1 : 0.75,
              }}
              aria-label="Send"
            >
              {isSending ? (
                <Loader2
                  size={16}
                  style={{
                    color: draft.trim() ? "var(--surface-base)" : "var(--text-muted)",
                  }}
                  className="animate-spin"
                />
              ) : (
                <Send
                  size={16}
                  style={{
                    color: draft.trim() ? "var(--surface-base)" : "var(--text-muted)",
                  }}
                />
              )}
            </button>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", padding: "8px 4px 0 4px" }}>
            Enter to send, Shift+Enter for a new line.
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
