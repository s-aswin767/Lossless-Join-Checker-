import { Moon, Sun } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className={`app-shell ${menuOpen ? "mobile-nav-open" : ""}`}>
    <header className="topbar">
      <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
        <span className="brand-name">Lossless Join Checker</span>
        <span className="brand-sub">Chase algorithm · relational decomposition</span>
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        <Link href="/" className={`nav-link ${location === "/" ? "active" : ""}`}>Checker</Link>
        <Link href="/learn" className={`nav-link ${location.startsWith("/learn") ? "active" : ""}`}>Theory</Link>
        <Link href="/examples" className={`nav-link ${location.startsWith("/examples") ? "active" : ""}`}>Examples</Link>
        <Link href="/history" className={`nav-link ${location.startsWith("/history") ? "active" : ""}`}>History</Link>
      </nav>
      <button className="theme-button" onClick={toggleTheme} aria-pressed={theme === "dark"}>{theme === "light" ? <Moon size={15} /> : <Sun size={15} />} {theme === "light" ? "Dark mode" : "Light mode"}</button>
    </header>
    {children}
  </div>;
}
