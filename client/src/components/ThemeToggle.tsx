import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
      style={{
        background:
          theme === "dark"
            ? "rgba(255,255,255,0.06)"
            : "rgba(47,128,237,0.08)",
        border:
          theme === "dark"
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(47,128,237,0.15)",
      }}
      aria-label="Toggle theme"
      type="button"
    >
      {theme === "dark" ? (
        <Sun size={16} style={{ color: "#E8A93A" }} />
      ) : (
        <Moon size={16} style={{ color: "#2F80ED" }} />
      )}
    </button>
  );
}
