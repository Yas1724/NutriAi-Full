import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";

const BASE_URL   = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ML_URL     = import.meta.env.VITE_ML_URL  || "http://localhost:8000";
const API        = `${BASE_URL}/api/auth`;
const PROFILE    = `${BASE_URL}/api/profile`;
const NUTRITION  = `${BASE_URL}/api/nutrition`;
const FOODLOG    = `${BASE_URL}/api/food-log`;
const SHARE      = `${BASE_URL}/api/share`;
const ML         = ML_URL;

async function apiFetch(base, path, body, method = "POST") {
  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      const cur = window.location.pathname;
      const isAuthPage = ["/", "/signup", "/verify-email", "/forgot-password"].some(p => cur.startsWith(p));
      if (!isAuthPage && path !== "/check-auth") {
        window.location.href = "/";
      }
      return { success: false, status: 401 };
    }
    return res.json();
  } catch (err) {
    if (err.name === "TypeError" && !navigator.onLine) {
      throw new Error("No internet connection");
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  THEME SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

const THEMES = {
  dark: {
    mode: "dark",
    accent:               "#ffffff",
    accentGrad:           "linear-gradient(135deg,#ffffff,#d4d4d4)",
    accentGlow:           "rgba(255,255,255,0.15)",
    accentText:           "#000000",
    pageBg:               "#000000",
    cardBg:               "#0a0a0a",
    cardBorder:           "rgba(255,255,255,0.08)",
    cardShadow:           "0 32px 80px rgba(0,0,0,0.9)",
    inputBg:              "#141414",
    inputBgFocus:         "#1a1a1a",
    inputBorder:          "rgba(255,255,255,0.1)",
    inputBorderFocus:     "rgba(255,255,255,0.4)",
    inputText:            "#ffffff",
    inputPlaceholder:     "#3a3a3a",
    textPrimary:          "#ffffff",
    textSecondary:        "#888888",
    textMuted:            "#3a3a3a",
    textAccent:           "#ffffff",
    socialBg:             "#141414",
    socialBorder:         "rgba(255,255,255,0.07)",
    socialText:           "#888888",
    divider:              "rgba(255,255,255,0.07)",
    choiceBg:             "#141414",
    choiceBorder:         "rgba(255,255,255,0.08)",
    choiceBgSel:          "rgba(255,255,255,0.08)",
    choiceBorderSel:      "rgba(255,255,255,0.5)",
    choiceText:           "#888888",
    choiceTextSel:        "#ffffff",
    dotInactive:          "rgba(255,255,255,0.12)",
    ringTrack:            "rgba(255,255,255,0.08)",
    ringFill:             "#ffffff",
    ringText:             "#ffffff",
    ringSubtext:          "#444444",
    macroTrack:           "rgba(255,255,255,0.08)",
    weekActiveBg:         "#ffffff",
    weekActiveText:       "#000000",
    weekInactiveBg:       "transparent",
    weekInactiveText:     "#3a3a3a",
    mealBorder:           "rgba(255,255,255,0.06)",
    mealDishText:         "#ffffff",
    mealMetaText:         "#3a3a3a",
    unitActiveBg:         "rgba(255,255,255,0.1)",
    unitActiveBorder:     "rgba(255,255,255,0.4)",
    unitActiveText:       "#ffffff",
    unitInactiveBg:       "transparent",
    unitInactiveBorder:   "rgba(255,255,255,0.08)",
    unitInactiveText:     "#3a3a3a",
    resultBg:             "#141414",
    resultBorder:         "rgba(255,255,255,0.1)",
    macroBg:              "#141414",
    statsCardBg:          "#141414",
    statsCardBorder:      "rgba(255,255,255,0.06)",
    statsValue:           "#ffffff",
    statsLabel:           "#444444",
    btnSecBg:             "#141414",
    btnSecBorder:         "rgba(255,255,255,0.1)",
    btnSecText:           "#666666",
    goalChipBg:           "rgba(255,255,255,0.05)",
    goalChipBorder:       "rgba(255,255,255,0.12)",
  },
  light: {
    mode: "light",
    accent:               "#000000",
    accentGrad:           "linear-gradient(135deg,#000000,#2a2a2a)",
    accentGlow:           "rgba(0,0,0,0.15)",
    accentText:           "#ffffff",
    pageBg:               "#d0d0d0",
    cardBg:               "#ffffff",
    cardBorder:           "rgba(0,0,0,0.06)",
    cardShadow:           "0 32px 80px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
    inputBg:              "#f8f8f8",
    inputBgFocus:         "#ffffff",
    inputBorder:          "rgba(0,0,0,0.1)",
    inputBorderFocus:     "rgba(0,0,0,0.35)",
    inputText:            "#000000",
    inputPlaceholder:     "#bbbbbb",
    textPrimary:          "#000000",
    textSecondary:        "#666666",
    textMuted:            "#cccccc",
    textAccent:           "#000000",
    socialBg:             "#f8f8f8",
    socialBorder:         "rgba(0,0,0,0.07)",
    socialText:           "#666666",
    divider:              "rgba(0,0,0,0.06)",
    choiceBg:             "#f8f8f8",
    choiceBorder:         "rgba(0,0,0,0.08)",
    choiceBgSel:          "rgba(0,0,0,0.05)",
    choiceBorderSel:      "rgba(0,0,0,0.4)",
    choiceText:           "#666666",
    choiceTextSel:        "#000000",
    dotInactive:          "rgba(0,0,0,0.1)",
    ringTrack:            "rgba(0,0,0,0.07)",
    ringFill:             "#000000",
    ringText:             "#000000",
    ringSubtext:          "#aaaaaa",
    macroTrack:           "rgba(0,0,0,0.07)",
    weekActiveBg:         "#000000",
    weekActiveText:       "#ffffff",
    weekInactiveBg:       "transparent",
    weekInactiveText:     "#cccccc",
    mealBorder:           "rgba(0,0,0,0.05)",
    mealDishText:         "#000000",
    mealMetaText:         "#aaaaaa",
    unitActiveBg:         "rgba(0,0,0,0.07)",
    unitActiveBorder:     "rgba(0,0,0,0.35)",
    unitActiveText:       "#000000",
    unitInactiveBg:       "#f8f8f8",
    unitInactiveBorder:   "rgba(0,0,0,0.08)",
    unitInactiveText:     "#aaaaaa",
    resultBg:             "#f8f8f8",
    resultBorder:         "rgba(0,0,0,0.08)",
    macroBg:              "#f3f3f3",
    statsCardBg:          "#f8f8f8",
    statsCardBorder:      "rgba(0,0,0,0.06)",
    statsValue:           "#000000",
    statsLabel:           "#aaaaaa",
    btnSecBg:             "#f3f3f3",
    btnSecBorder:         "rgba(0,0,0,0.08)",
    btnSecText:           "#aaaaaa",
    goalChipBg:           "rgba(0,0,0,0.04)",
    goalChipBorder:       "rgba(0,0,0,0.1)",
  },
};

function ThemeToggle() {
  const { theme, setThemeMode } = useTheme();
  const t = THEMES[theme];
  const isLight = theme === "light";
  return (
    <button
      onClick={() => setThemeMode(isLight ? "dark" : "light")}
      style={{
        position: "fixed", top: 14, right: 14, zIndex: 9998,
        display: "flex", alignItems: "center", gap: 7,
        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
        borderRadius: 99, padding: "7px 14px 7px 10px",
        cursor: "pointer", boxShadow: t.cardShadow,
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        fontSize: 12, fontWeight: 700, color: t.textSecondary,
      }}
    >
      <span style={{ fontSize: 14 }}>{isLight ? "🌙" : "☀️"}</span>
      <span style={{ letterSpacing: "0.04em" }}>{isLight ? "DARK" : "LIGHT"}</span>
    </button>
  );
}

function NutriLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 110" fill="none">
      <defs>
        <radialGradient id="mg" cx="40%" cy="30%" r="70%"><stop offset="0%" stopColor="#4aaa4a" stopOpacity="0.7"/><stop offset="100%" stopColor="#1a4a1a" stopOpacity="0"/></radialGradient>
        <radialGradient id="tg" cx="35%" cy="30%" r="65%"><stop offset="0%" stopColor="#ff8080" stopOpacity="0.5"/><stop offset="100%" stopColor="#8b0000" stopOpacity="0"/></radialGradient>
      </defs>
      <ellipse cx="60" cy="72" rx="38" ry="24" fill="#2d7a2d"/>
      <ellipse cx="60" cy="72" rx="38" ry="24" fill="url(#mg)"/>
      <path d="M28 66 Q60 58 92 66" stroke="#5acc5a" strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
      <path d="M46 62 C42 52 36 44 34 32" stroke="#22a84a" strokeWidth="3" strokeLinecap="round"/>
      <path d="M40 50 C36 44 30 40 26 34" stroke="#22a84a" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M44 55 C40 47 38 38 40 30" stroke="#22a84a" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="33" cy="31" rx="7" ry="3.5" fill="#22a84a" transform="rotate(-30 33 31)"/>
      <ellipse cx="25" cy="33" rx="6" ry="3" fill="#2ecc71" transform="rotate(-50 25 33)"/>
      <path d="M58 60 C57 50 55 38 54 24" stroke="#e67e22" strokeWidth="5" strokeLinecap="round"/>
      <path d="M62 60 C63 50 65 38 66 24" stroke="#e67e22" strokeWidth="5" strokeLinecap="round"/>
      <path d="M55 24 C57 16 63 16 65 24" fill="#e67e22"/>
      <path d="M57 60 Q60 66 63 60" fill="#d35400"/>
      <path d="M60 24 C58 14 52 8 48 6" stroke="#22a84a" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M60 24 C62 12 68 8 72 5" stroke="#22a84a" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="48" cy="6" rx="5" ry="2.5" fill="#22a84a" transform="rotate(-40 48 6)"/>
      <ellipse cx="72" cy="5" rx="5" ry="2.5" fill="#22a84a" transform="rotate(40 72 5)"/>
      <circle cx="36" cy="90" r="13" fill="#c0392b"/>
      <circle cx="36" cy="90" r="13" fill="url(#tg)"/>
      <circle cx="36" cy="90" r="9" fill="#e74c3c"/>
      <circle cx="36" cy="90" r="5" fill="#c0392b"/>
      <path d="M33 77 C33 73 36 72 38 74" stroke="#22a84a" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="84" cy="90" r="13" fill="#c0392b"/>
      <circle cx="84" cy="90" r="13" fill="url(#tg)"/>
      <circle cx="84" cy="90" r="9" fill="#e74c3c"/>
      <circle cx="84" cy="90" r="5" fill="#c0392b"/>
      <path d="M81 77 C81 73 84 72 86 74" stroke="#22a84a" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function Brand({ small }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: small ? 0 : 4 }}>
      <NutriLogo size={small ? 28 : 44} />
      <span style={{ fontSize: small ? 17 : 23, fontWeight: 900, color: t.textPrimary, fontFamily: "'DM Sans', 'Inter', sans-serif", letterSpacing: "-0.03em" }}>
        Nutri<span style={{ color: t.accent }}>Ai</span>
      </span>
    </div>
  );
}

function Input({ type = "text", value, onChange, placeholder, min, max }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ position: "relative" }}>
      <input
        type={isPass && !show ? "password" : type === "number" ? "number" : "text"}
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} min={min} max={max}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box",
          background: focused ? t.inputBgFocus : t.inputBg,
          border: `1.5px solid ${focused ? t.inputBorderFocus : t.inputBorder}`,
          borderRadius: 12, padding: isPass ? "13px 44px 13px 16px" : "13px 16px",
          color: t.inputText, fontSize: 14, outline: "none",
          fontFamily: "inherit",
        }}
      />
      {isPass && (
        <button type="button" onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: t.textMuted, padding: 0, display: "flex" }}>
          {show
            ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
        </button>
      )}
    </div>
  );
}

function Btn({ children, onClick, loading, variant = "primary", small }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const base = {
    width: "100%", padding: small ? "10px" : "14px 18px",
    borderRadius: 12, border: "none",
    fontSize: small ? 13 : 15, fontWeight: 800,
    cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "inherit", letterSpacing: "0.01em",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  };
  const styles = {
    primary: { ...base, background: loading ? t.textMuted : t.accentGrad, color: t.accentText, opacity: loading ? 0.7 : 1, boxShadow: loading ? "none" : `0 4px 20px ${t.accentGlow}` },
    secondary: { ...base, background: t.btnSecBg, color: t.btnSecText, border: `1px solid ${t.btnSecBorder}` },
  };
  return (
    <button onClick={onClick} disabled={loading} style={styles[variant] || styles.primary}>
      {loading
        ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>Please wait…</>
        : children}
    </button>
  );
}

function SocialRow() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const s = {
    flex: 1, padding: "11px 10px", borderRadius: 12,
    border: `1px solid ${t.socialBorder}`, background: t.socialBg,
    color: t.socialText, cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center", gap: 8,
    fontSize: 12.5, fontWeight: 600, fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <button style={s}>
        <svg width="15" height="15" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Continue with Google
      </button>
      <button style={s}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill={t.socialText}><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.2 1.29-2.18 3.85.03 3.05 2.67 4.06 2.7 4.07-.03.07-.42 1.44-1.38 2.65M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        Continue with Apple
      </button>
    </div>
  );
}

function Or() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 1, background: t.divider }} />
      <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, letterSpacing: "0.09em" }}>OR</span>
      <div style={{ flex: 1, height: 1, background: t.divider }} />
    </div>
  );
}

function Card({ children, title, subtitle, wide }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  return (
    <div style={{
      background: t.cardBg, border: `1px solid ${t.cardBorder}`,
      borderRadius: 24, padding: "32px 28px",
      width: "100%", maxWidth: wide ? 480 : 400,
      boxShadow: t.cardShadow,
    }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Brand />
        {title && <h2 style={{ margin: "16px 0 5px", fontSize: 24, fontWeight: 900, color: t.textPrimary, letterSpacing: "-0.03em", fontFamily: "'DM Sans', 'Inter', sans-serif" }}>{title}</h2>}
        {subtitle && <p style={{ margin: 0, fontSize: 13, color: t.textSecondary, lineHeight: 1.65 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function LinkBtn({ onClick, children }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  return <button onClick={onClick} style={{ background: "none", border: "none", color: t.accent, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>{children}</button>;
}

function Toast({ msg, type, onClose }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  useEffect(() => { if (msg) { const x = setTimeout(onClose, 3500); return () => clearTimeout(x); } }, [msg]);
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: type === "error" ? "#dc2626" : t.accent, color: type === "error" ? "#fff" : t.accentText, borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.25)", animation: "slideIn 0.3s ease", fontFamily: "'DM Sans', 'Inter', sans-serif", whiteSpace: "nowrap" }}>{msg}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH SCREENS
// ─────────────────────────────────────────────────────────────────────────────
function LoginScreen({ setToast, setUser }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.successMsg) {
      setToast({ msg: location.state.successMsg, type: "success" });
      window.history.replaceState({}, ""); // clear state so it doesn't show again on refresh
    }
  }, []);
  const handle = async () => {
    if (!email || !password) return setToast({ msg: "Please fill all fields", type: "error" });
    setLoading(true);
    const data = await apiFetch(API, "/login", { email, password });
    setLoading(false);
    if (data.success) { setToast({ msg: "Welcome back!", type: "success" }); setUser({ email }); }
    else setToast({ msg: data.msg || data.message || "Login failed", type: "error" });
  };
  return (
    <Card title="Welcome back" subtitle="Sign into your account">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SocialRow />
        <Or />
        <Input type="email" value={email} onChange={setEmail} placeholder="Email address" />
        <Input type="password" value={password} onChange={setPassword} placeholder="Password (min 8 characters)" />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => navigate("/forgot-password")} style={{ background: "none", border: "none", color: t.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Forgot password?</button>
        </div>
        <Btn onClick={handle} loading={loading}>Login now ›</Btn>
        <p style={{ textAlign: "center", fontSize: 13, color: t.textSecondary, margin: 0 }}>Don't have an account? <LinkBtn onClick={() => navigate("/signup")}>Sign up</LinkBtn></p>
      </div>
    </Card>
  );
}

function SignupScreen({ setToast, onVerify }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (!name || !email || !password) return setToast({ msg: "All fields are required", type: "error" });
    if (password.length < 8) return setToast({ msg: "Password must be at least 8 characters", type: "error" });
    setLoading(true);
    const data = await apiFetch(API, "/signup", { name, email, password });
    setLoading(false);
    if (data.success) { setToast({ msg: "Account created! Check your email.", type: "success" }); onVerify(email); }
    else setToast({ msg: data.message || "Signup failed", type: "error" });
  };
  return (
    <Card title="Create account" subtitle="Start your nutrition journey today">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SocialRow />
        <Or />
        <Input value={name} onChange={setName} placeholder="Full Name" />
        <Input type="email" value={email} onChange={setEmail} placeholder="Email address" />
        <Input type="password" value={password} onChange={setPassword} placeholder="Password" />
        <Btn onClick={handle} loading={loading}>Create account ›</Btn>
        <p style={{ textAlign: "center", fontSize: 13, color: t.textSecondary, margin: 0 }}>Already have an account? <LinkBtn onClick={() => navigate("/")}>Sign In</LinkBtn></p>
      </div>
    </Card>
  );
}

function VerifyScreen({ setToast, setUser }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);
  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const n = [...code]; n[i] = val; setCode(n);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKey = (i, e) => { if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus(); };
  const handle = async () => {
    const c = code.join("");
    if (c.length < 6) return setToast({ msg: "Enter the full 6-digit code", type: "error" });
    setLoading(true);
    const data = await apiFetch(API, "/verify-email", { code: c });
    setLoading(false);
    if (data.success) { setToast({ msg: "Verified! Welcome to NutriAi!", type: "success" }); setUser({ email }); }
    else setToast({ msg: data.message || "Invalid code", type: "error" });
  };
  return (
    <Card title="Check your email" subtitle={`We sent a 6-digit code to ${email}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {code.map((d, i) => (
            <input key={i} ref={el => refs.current[i] = el} maxLength={1} value={d}
              onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
              style={{ width: 46, height: 54, textAlign: "center", fontSize: 22, fontWeight: 900, background: d ? t.inputBgFocus : t.inputBg, border: `2px solid ${d ? t.accent : t.inputBorder}`, borderRadius: 12, color: t.inputText, outline: "none", fontFamily: "inherit" }}
            />
          ))}
        </div>
        <Btn onClick={handle} loading={loading}>Verify & Continue ›</Btn>
        <p style={{ textAlign: "center", fontSize: 13, color: t.textSecondary, margin: 0 }}>Back to <LinkBtn onClick={() => navigate("/")}>Sign In</LinkBtn></p>
      </div>
    </Card>
  );
}

function ForgotScreen({ setToast }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const handle = async () => {
    if (!email) return setToast({ msg: "Enter your email", type: "error" });
    setLoading(true);
    const data = await apiFetch(API, "/forgot-password", { email });
    setLoading(false);
    if (data.success) { setSent(true); setToast({ msg: "Reset link sent!", type: "success" }); }
    else setToast({ msg: data.message || "Not found", type: "error" });
  };
  return (
    <Card title="Forgot Password?" subtitle="Enter your email and we will send a reset link.">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sent
          ? <div style={{ textAlign: "center", padding: "14px 0" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📬</div>
              <p style={{ color: t.textSecondary, fontSize: 13, lineHeight: 1.7 }}>Check <span style={{ color: t.accent, fontWeight: 800 }}>{email}</span> for your reset link.</p>
            </div>
          : <Input type="email" value={email} onChange={setEmail} placeholder="Email address" />}
        {!sent && <Btn onClick={handle} loading={loading}>Send Reset Link ›</Btn>}
        <p style={{ textAlign: "center", fontSize: 13, color: t.textSecondary, margin: 0 }}>Remembered it? <LinkBtn onClick={() => navigate("/")}>Sign In</LinkBtn></p>
      </div>
    </Card>
  );
}

function ResetScreen({ token, onSwitch, setToast }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (!password || password !== confirm) return setToast({ msg: "Passwords do not match", type: "error" });
    if (password.length < 8) return setToast({ msg: "Password must be at least 8 characters", type: "error" });
    setLoading(true);
    const res = await fetch(`${API}/reset-password/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ password }) });
    const data = await res.json();
    setLoading(false);
    if (data.success) { setToast({ msg: "Password reset! Please login.", type: "success" }); onSwitch(); }
    else setToast({ msg: data.msg || "Failed", type: "error" });
  };
  return (
    <Card title="Reset Password" subtitle="Choose a strong new password.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input type="password" value={password} onChange={setPassword} placeholder="New password" />
        <Input type="password" value={confirm} onChange={setConfirm} placeholder="Confirm new password" />
        <Btn onClick={handle} loading={loading}>Reset Password ›</Btn>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ONBOARDING
// ─────────────────────────────────────────────────────────────────────────────
const GOALS = [
  { value: "lose_weight",  label: "Lose Weight",  emoji: "🔥" },
  { value: "gain_weight",  label: "Gain Weight",  emoji: "💪" },
  { value: "maintain",     label: "Maintain",      emoji: "⚖️" },
  { value: "build_muscle", label: "Build Muscle", emoji: "🏋️" },
];
const ACTIVITY = [
  { value: "sedentary",         label: "Sedentary",         desc: "Little or no exercise" },
  { value: "lightly_active",    label: "Lightly Active",    desc: "Exercise 1-3 days/week" },
  { value: "moderately_active", label: "Moderately Active", desc: "Exercise 3-5 days/week" },
  { value: "very_active",       label: "Very Active",       desc: "Exercise 6-7 days/week" },
  { value: "extra_active",      label: "Extra Active",      desc: "Athlete / physical job" },
];
const TOTAL_STEPS = 7;

function ProgressDots({ step }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} style={{ width: i === step - 1 ? 22 : 6, height: 6, borderRadius: 3, background: i < step ? t.accent : t.dotInactive }} />
      ))}
    </div>
  );
}

function ChoiceBtn({ selected, onClick, children, emoji, desc }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "14px 18px", borderRadius: 14,
      border: `1.5px solid ${selected ? t.choiceBorderSel : t.choiceBorder}`,
      background: selected ? t.choiceBgSel : t.choiceBg,
      color: selected ? t.choiceTextSel : t.choiceText,
      fontFamily: "inherit", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 12, textAlign: "left",
    }}>
      {emoji && <span style={{ fontSize: 20 }}>{emoji}</span>}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{children}</div>
        {desc && <div style={{ fontSize: 11.5, color: selected ? t.accent : t.textMuted, marginTop: 2, opacity: 0.85 }}>{desc}</div>}
      </div>
      {selected && <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
    </button>
  );
}

function OnboardingScreen({ onDone, setToast }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ gender: "", age: "", height: "", weight: "", goal: "", activityLevel: "sedentary", targetWeight: "", durationWeeks: "", mealsPerDay: "", customMealName: "" });

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(""); };
  const validate = () => {
    if (step === 1 && !form.gender) { setError("Please select your gender"); return false; }
    if (step === 2) {
      if (!form.age || !form.height || !form.weight) { setError("Please fill in all fields"); return false; }
      if (form.age < 10 || form.age > 120)           { setError("Enter a valid age (10-120)"); return false; }
      if (form.height < 50 || form.height > 300)     { setError("Enter a valid height in cm"); return false; }
      if (form.weight < 20 || form.weight > 500)     { setError("Enter a valid weight in kg"); return false; }
    }
    if (step === 3 && !form.goal)          { setError("Please select your goal"); return false; }
    if (step === 4 && !form.activityLevel) { setError("Please select your activity level"); return false; }
    if (step === 5) {
      if (!form.targetWeight) { setError("Please set your target weight"); return false; }
    }
    if (step === 6) {
      if (!form.durationWeeks) { setError("Please select a duration"); return false; }
      // Realistic goal check — max ~0.75kg/week loss, ~0.5kg/week gain
      const diff = Math.abs(Number(form.targetWeight) - Number(form.weight));
      const weeks = Number(form.durationWeeks);
      const weeklyChange = diff / weeks;
      const isLoss = Number(form.targetWeight) < Number(form.weight);
      const maxWeekly = isLoss ? 0.75 : 0.6;
      if (weeklyChange > maxWeekly) {
        const realisticWeeks = Math.ceil(diff / maxWeekly);
        setError(`⚠️ That's ${weeklyChange.toFixed(1)}kg/week — not realistic or healthy. You'd need at least ${realisticWeeks} weeks for this goal safely.`);
        return false;
      }
    }
    if (step === 7 && !form.mealsPerDay) { setError("Please select meals per day"); return false; }
    if (step === 7 && form.mealsPerDay === 5 && !form.customMealName.trim()) { setError("Please name your custom meal"); return false; }
    return true;
  };
  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => { setError(""); setStep(s => s - 1); };
  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await apiFetch(PROFILE, "/setup", {
        age: Number(form.age), height: Number(form.height), weight: Number(form.weight),
        gender: form.gender, goal: form.goal, activityLevel: form.activityLevel,
        targetWeight: form.targetWeight ? Number(form.targetWeight) : Number(form.weight),
        durationWeeks: form.durationWeeks ? Number(form.durationWeeks) : null,
        mealsPerDay: Number(form.mealsPerDay),
        customMealName: form.customMealName.trim() || null,
      });
      if (data.success) { setToast({ msg: "Your plan is ready! 🎉", type: "success" }); onDone(data); }
      else setError(data.message || "Something went wrong");
    } catch { setError("Could not connect to server"); }
    finally { setLoading(false); }
  };

  const H2    = { margin: 0, fontSize: 22, fontWeight: 900, color: t.textPrimary, letterSpacing: "-0.02em", fontFamily: "'DM Sans', 'Inter', sans-serif" };
  const SUB   = { margin: "6px 0 0", fontSize: 12.5, color: t.textSecondary };
  const LABEL = { fontSize: 11, color: t.textMuted, fontWeight: 800, marginBottom: -4, textTransform: "uppercase", letterSpacing: "0.08em" };

  const renderStep = () => {
    switch (step) {
      case 1: return (<>
        <h2 style={H2}>Choose your Gender</h2><p style={SUB}>This calibrates your personal plan.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          {["male", "female", "other"].map(g => (
            <ChoiceBtn key={g} selected={form.gender === g} onClick={() => set("gender", g)}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </ChoiceBtn>
          ))}
        </div>
      </>);
      case 2: return (<>
        <h2 style={H2}>Your Body Stats</h2><p style={SUB}>Used to calculate your daily calorie needs.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          <label style={LABEL}>Age</label>
          <Input type="number" value={form.age} onChange={v => set("age", v)} placeholder="e.g. 25" min={10} max={120} />
          <label style={LABEL}>Height (cm)</label>
          <Input type="number" value={form.height} onChange={v => set("height", v)} placeholder="e.g. 170" min={50} max={300} />
          <label style={LABEL}>Current Weight (kg)</label>
          <Input type="number" value={form.weight} onChange={v => set("weight", v)} placeholder="e.g. 70" min={20} max={500} />
        </div>
      </>);
      case 3: return (<>
        <h2 style={H2}>What is your goal?</h2><p style={SUB}>Your plan will be fully customized around this.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          {GOALS.map(g => (
            <ChoiceBtn key={g.value} selected={form.goal === g.value} onClick={() => set("goal", g.value)} emoji={g.emoji}>{g.label}</ChoiceBtn>
          ))}
        </div>
      </>);
      case 4: return (<>
        <h2 style={H2}>Activity Level</h2><p style={SUB}>How active are you on a weekly basis?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          {ACTIVITY.map(a => (
            <ChoiceBtn key={a.value} selected={form.activityLevel === a.value} onClick={() => set("activityLevel", a.value)} desc={a.desc}>{a.label}</ChoiceBtn>
          ))}
        </div>
      </>);
      case 5: return (<>
        <h2 style={H2}>Desired Weight?</h2><p style={SUB}>{GOALS.find(g => g.value === form.goal)?.label}</p>
        <div style={{ textAlign: "center", margin: "24px 0 8px" }}>
          <span style={{ fontSize: 56, fontWeight: 900, color: t.accent, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>{form.targetWeight || form.weight || "—"}</span>
          <span style={{ fontSize: 22, color: t.textMuted, marginLeft: 6 }}>kg</span>
        </div>
        <input type="range" min={30} max={200} value={form.targetWeight || form.weight || 70} onChange={e => set("targetWeight", e.target.value)} style={{ width: "100%", accentColor: t.accent, marginBottom: 8 }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.textMuted }}><span>30 kg</span><span>200 kg</span></div>
      </>);
      case 6: return (<>
        <h2 style={H2}>Your Timeline ⏱️</h2>
        <p style={SUB}>How long do you want to achieve your goal? We'll warn you if it's not realistic.</p>
        {(() => {
          const diff = Math.abs(Number(form.targetWeight || 0) - Number(form.weight || 0));
          const isLoss = Number(form.targetWeight) < Number(form.weight);
          const weeks = Number(form.durationWeeks);
          const weeklyChange = weeks ? (diff / weeks).toFixed(2) : null;
          const maxWeekly = isLoss ? 0.75 : 0.6;
          const isUnrealistic = weeklyChange && Number(weeklyChange) > maxWeekly;
          const realisticWeeks = diff ? Math.ceil(diff / maxWeekly) : null;
          return (
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { value: 4,  label: "1 Month",   desc: "~4 weeks" },
                { value: 8,  label: "2 Months",  desc: "~8 weeks" },
                { value: 12, label: "3 Months",  desc: "~12 weeks" },
                { value: 24, label: "6 Months",  desc: "~24 weeks" },
                { value: 52, label: "1 Year",    desc: "~52 weeks" },
              ].map(o => (
                <ChoiceBtn key={o.value} selected={form.durationWeeks === o.value}
                  onClick={() => set("durationWeeks", o.value)} desc={o.desc}>
                  {o.label}
                </ChoiceBtn>
              ))}
              {form.durationWeeks && diff > 0 && (
                <div style={{
                  padding: "12px 16px", borderRadius: 12, marginTop: 4,
                  background: isUnrealistic ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isUnrealistic ? "rgba(220,38,38,0.3)" : t.cardBorder}`,
                }}>
                  {isUnrealistic ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#dc2626", marginBottom: 4 }}>⚠️ Unrealistic Goal</div>
                      <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.5 }}>
                        {weeklyChange}kg/week is too aggressive and unhealthy.<br/>
                        For {diff}kg {isLoss ? "loss" : "gain"}, you need at least <strong style={{ color: t.textPrimary }}>{realisticWeeks} weeks</strong>.
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 800, color: t.textPrimary, marginBottom: 4 }}>✓ Realistic Goal</div>
                      <div style={{ fontSize: 12, color: t.textSecondary }}>
                        ~{weeklyChange}kg/week — achievable with consistent effort.
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </>);
      case 7: return (<>
        <h2 style={H2}>Meals per day?</h2>
        <p style={SUB}>We will organize your log around these meal slots.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          {[
            { value: 3, emoji: "🍽️", label: "3 Meals", desc: "Breakfast · Lunch · Dinner" },
            { value: 4, emoji: "🥗", label: "4 Meals", desc: "Breakfast · Lunch · Dinner · Snack" },
            { value: 5, emoji: "⚡", label: "5 Meals", desc: "Breakfast · Lunch · Dinner · Snack · Custom" },
          ].map(o => (
            <ChoiceBtn key={o.value} selected={form.mealsPerDay === o.value}
              onClick={() => set("mealsPerDay", o.value)} emoji={o.emoji} desc={o.desc}>
              {o.label}
            </ChoiceBtn>
          ))}
        </div>
        {form.mealsPerDay === 5 && (
          <div style={{ marginTop: 16 }}>
            <label style={LABEL}>Name your 5th meal</label>
            <div style={{ marginTop: 8 }}>
              <Input
                value={form.customMealName}
                onChange={v => set("customMealName", v)}
                placeholder="e.g. Pre-workout, Evening Snack"
              />
            </div>
            <p style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>
              This slot will appear on your daily dashboard.
            </p>
          </div>
        )}
      </>);
      default: return null;
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 430 }}>
      <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 24, padding: "28px 28px", boxShadow: t.cardShadow }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          {step > 1
            ? <button onClick={back} style={{ background: "none", border: `1px solid ${t.cardBorder}`, borderRadius: 8, color: t.accent, cursor: "pointer", padding: "6px 12px", fontSize: 13, fontFamily: "inherit", fontWeight: 700 }}>← Back</button>
            : <div />}
          <Brand small />
          <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 700 }}>{step}/{TOTAL_STEPS}</span>
        </div>
        <ProgressDots step={step} />
        {renderStep()}
        {error && <p style={{ color: "#dc2626", fontSize: 12.5, textAlign: "center", marginTop: 12, fontWeight: 600 }}>{error}</p>}
        <div style={{ marginTop: 22 }}>
          <Btn onClick={step === TOTAL_STEPS ? submit : next} loading={loading}>
            {step === TOTAL_STEPS ? "Get My Plan 🚀" : "Continue ›"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function CalRing({ eaten, target, size = 190 }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const r = (size - 22) / 2;
  const circ = 2 * Math.PI * r;
  const pct = target ? Math.min(eaten / target, 1) : 0;
  const offset = circ * (1 - pct);
  const cx = size / 2;
  const left = Math.max(0, (target || 0) - eaten);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={t.ringTrack} strokeWidth={16} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={t.ringFill} strokeWidth={16}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.34,1.2,0.64,1)", filter: `drop-shadow(0 0 8px ${t.ringFill}66)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <span style={{ fontSize: 38, fontWeight: 900, color: t.ringText, fontFamily: "'DM Sans', 'Inter', sans-serif", letterSpacing: -2, lineHeight: 1 }}>{eaten}</span>
        <span style={{ fontSize: 10, color: t.ringSubtext, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>
          {target ? `${(target / 1000).toFixed(3)} kcal` : "kcal"}
        </span>
        {target > 0 && <span style={{ fontSize: 11, color: t.accent, fontWeight: 800, marginTop: 2 }}>{left} left</span>}
      </div>
    </div>
  );
}

function MacroPill({ label, eaten, target, color }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const pct = target ? Math.min((eaten / target) * 100, 100) : 0;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ height: 5, borderRadius: 99, background: t.macroTrack, overflow: "hidden", marginBottom: 7 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
        <span style={{ fontSize: 10, color: t.textSecondary, fontFamily: "monospace" }}>
          <span style={{ color: t.textPrimary, fontWeight: 700 }}>{eaten}</span>/{target || "—"}g
        </span>
      </div>
    </div>
  );
}

function WeekStrip({ activeDay, setActiveDay, weekOffset, setWeekOffset, todayDow }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const today = new Date();
  const days  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  // Touch swipe handling
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 40) return; // ignore small swipes
    if (diff > 0 && weekOffset < 0) setWeekOffset(w => w + 1); // swipe left = forward in time
    if (diff < 0) setWeekOffset(w => w - 1); // swipe right = back in time
    touchStartX.current = null;
  };

  // Get the Monday of the displayed week
  const getWeekStart = () => {
    const d = new Date(today);
    d.setDate(today.getDate() - todayDow + (weekOffset * 7));
    return d;
  };

  const weekStart = getWeekStart();
  const isCurrentWeek = weekOffset === 0;

  // Header: show month(s) of the displayed week
  const firstDay = new Date(weekStart);
  const lastDay  = new Date(weekStart); lastDay.setDate(weekStart.getDate() + 6);
  const headerLabel = firstDay.getMonth() === lastDay.getMonth()
    ? `${firstDay.toLocaleString("default", { month: "long" })} ${firstDay.getFullYear()}`
    : `${firstDay.toLocaleString("default", { month: "short" })} – ${lastDay.toLocaleString("default", { month: "short" })} ${lastDay.getFullYear()}`;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ userSelect: "none" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={{
            background: "none", border: `1px solid ${t.cardBorder}`, borderRadius: 6,
            color: t.textMuted, cursor: "pointer", padding: "2px 7px", fontSize: 13,
            lineHeight: 1.6, fontFamily: "inherit",
          }}>‹</button>
          <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>
            {headerLabel}
          </span>
          <button onClick={() => weekOffset < 0 && setWeekOffset(w => w + 1)} style={{
            background: "none", border: `1px solid ${t.cardBorder}`, borderRadius: 6,
            color: weekOffset < 0 ? t.textMuted : t.textMuted,
            cursor: weekOffset < 0 ? "pointer" : "not-allowed",
            padding: "2px 7px", fontSize: 13, lineHeight: 1.6, fontFamily: "inherit",
            opacity: weekOffset < 0 ? 1 : 0.3,
          }}>›</button>
        </div>
        {!isCurrentWeek && (
          <button onClick={() => {
            if (weekOffset === 0 && activeDay === todayDow) return;
            setWeekOffset(0);
            if (activeDay === todayDow) {
              // weekOffset changed but activeDay same — force refetch by toggling
              setActiveDay(-1);
              setTimeout(() => setActiveDay(todayDow), 0);
            } else {
              setActiveDay(todayDow);
            }
          }} style={{
            background: t.accentGrad, border: "none", borderRadius: 8,
            color: "#fff", cursor: "pointer", padding: "4px 10px",
            fontSize: 10, fontWeight: 800, fontFamily: "inherit", letterSpacing: 0.5,
          }}>Today ↩</button>
        )}
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {days.map((d, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const isToday   = date.toDateString() === today.toDateString();
          const isActive  = i === activeDay && weekOffset === weekOffset; // always true, kept for clarity
          const isFuture  = date > today;
          const isActiveSel = i === activeDay;
          return (
            <button key={d} onClick={() => !isFuture && setActiveDay(i)} style={{
              flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
              cursor: isFuture ? "not-allowed" : "pointer",
              background: isActiveSel ? t.weekActiveBg : t.weekInactiveBg,
              opacity: isFuture ? 0.3 : 1,
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: isActiveSel ? t.weekActiveText : t.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>{d}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: isActiveSel ? t.weekActiveText : isToday ? t.accent : t.weekInactiveText, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>{date.getDate()}</div>
              {isToday && !isActiveSel && <div style={{ width: 3, height: 3, borderRadius: "50%", background: t.accent, margin: "3px auto 0" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── FIXED: uses dishName, proteinG, carbsG, fatG ─────────────────────────────
function MealEntry({ meal, onRemove }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: `1px solid ${t.mealBorder}`, animation: "fadeUp 0.25s ease" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.mealDishText, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meal.dishName}</div>
        <div style={{ fontSize: 11, color: t.mealMetaText, display: "flex", gap: 10 }}>
          <span style={{ color: t.accent, fontWeight: 700 }}>{meal.calories} kcal</span>
          <span>P:{meal.proteinG}g</span><span>C:{meal.carbsG}g</span><span>F:{meal.fatG}g</span>
        </div>
      </div>
      {onRemove && (
        <button onClick={() => onRemove(meal.id)} style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 16, padding: "4px 8px", flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
          onMouseLeave={e => e.target.style.color = t.textMuted}
        >✕</button>
      )}
    </div>
  );
}

const UNITS = [
  { label: "g", value: "g" }, { label: "kg", value: "kg" },
  { label: "piece", value: "piece" }, { label: "cup", value: "cup" },
  { label: "tbsp", value: "tbsp" }, { label: "tsp", value: "tsp" },
  { label: "ml", value: "ml" }, { label: "bowl", value: "bowl" },
  { label: "slice", value: "slice" }, { label: "plate", value: "plate" },
];

function toGrams(qty, unit, portion_g) {
  const base = portion_g || 100;
  switch (unit) {
    case "g": return qty; case "kg": return qty * 1000;
    case "piece": return qty * base; case "slice": return qty * base;
    case "cup": return qty * 240; case "tbsp": return qty * 15;
    case "tsp": return qty * 5; case "ml": return qty;
    case "bowl": return qty * 300; case "plate": return qty * base * 2.5;
    default: return qty * base;
  }
}

// ── FIXED: output now uses dishName, proteinG, carbsG, fatG ──────────────────
function scaleMacros(base, consumedGrams) {
  const ratio = consumedGrams / (base.portion_g || 100);
  const r = v => Math.round(v * ratio * 10) / 10;
  return {
    dishName:  base.dish,
    calories:  r(base.calories),
    proteinG:  r(base.protein),
    carbsG:    r(base.carbs),
    fatG:      r(base.fats),
    portion_g: Math.round(consumedGrams),
    source:    base.source,
  };
}

function MealSearchPanel({ onAdd, setToast, mealType = "snack", compact = false }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("piece");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [raw, setRaw] = useState(null);
  const [pending, setPending] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    if (!raw) return;
    setPending(scaleMacros(raw, toGrams(Number(qty) || 1, unit, raw.portion_g)));
  }, [qty, unit, raw]);

  const search = async () => {
    const dish = query.trim();
    if (!dish) return;
    setLoading(true); setRaw(null); setPending(null);
    try {
      const data = await apiFetch(NUTRITION, "/search", { dish });
      if (data.success) {
        setRaw(data.result);
        setPending(scaleMacros(data.result, toGrams(Number(qty) || 1, unit, data.result.portion_g)));
      } else { setToast({ msg: data.message || "Not found. Try a different name.", type: "error" }); }
    } catch {
      setToast({ msg: "Nutrition service unavailable. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ── Saves to DB, prevents double-tap duplicates ──────────────────────────
  const confirm = async () => {
    if (!pending || confirming || Number(qty) <= 0) return;
    setConfirming(true);
    try {
      await apiFetch(FOODLOG, "", {
        dishName:  pending.dishName,
        mealType:  mealType,
        calories:  pending.calories,
        proteinG:  pending.proteinG,
        carbsG:    pending.carbsG,
        fatG:      pending.fatG,
        portionG:  pending.portion_g,
        source:    pending.source,
        loggedVia: "search",
      });
      onAdd({ ...pending, id: Date.now() });
      setRaw(null); setPending(null); setQuery(""); setQty(1); setUnit("piece");
      inputRef.current?.focus();
    } catch (e) {
      setToast({ msg: "Failed to log meal. Please try again.", type: "error" });
    } finally {
      setConfirming(false);
    }
  };

  const dismiss = () => { setRaw(null); setPending(null); setQuery(""); setQty(1); setUnit("piece"); };
  const canSearch = query.trim() && !loading;
  const canConfirm = pending && !confirming && Number(qty) > 0 && (pending.calories > 0 || pending.proteinG > 0);

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: t.textMuted, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 12 }}>Log a Meal</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input ref={inputRef} value={query}
          onChange={e => { setQuery(e.target.value); setRaw(null); setPending(null); }}
          onKeyDown={e => e.key === "Enter" && canSearch && search()}
          placeholder="e.g. eggs, chapati, dal…"
          style={{ flex: 1, background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, borderRadius: 12, padding: "12px 14px", color: t.inputText, fontFamily: "'DM Sans', 'Inter', sans-serif", fontSize: 14, outline: "none" }}
          onFocus={e => e.target.style.borderColor = t.inputBorderFocus}
          onBlur={e => e.target.style.borderColor = t.inputBorder}
        />
        <button onClick={search} disabled={!canSearch} style={{
          background: canSearch ? t.accentGrad : t.btnSecBg,
          border: "none", borderRadius: 12, padding: "12px 18px",
          color: canSearch ? t.accentText : t.textMuted,
          fontWeight: 800, fontFamily: "'DM Sans', 'Inter', sans-serif", fontSize: 13,
          cursor: canSearch ? "pointer" : "not-allowed",
          minWidth: 76, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {loading
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
            : "Search"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, borderRadius: 12, overflow: "hidden" }}>
          <button onClick={() => setQty(q => Math.max(0.5, Number(q) - (unit === "g" || unit === "ml" ? 25 : 0.5)))}
            style={{ background: "none", border: "none", color: t.textMuted, fontSize: 18, padding: "0 12px", height: 44, cursor: "pointer", lineHeight: 1, fontFamily: "inherit" }}>−</button>
          <input type="number" value={qty} min={0.5}
            step={unit === "g" || unit === "ml" || unit === "kg" ? 25 : 0.5}
            onChange={e => setQty(Math.max(0.5, Number(e.target.value) || 1))}
            style={{ width: 50, textAlign: "center", background: "none", border: "none", color: t.inputText, fontWeight: 900, fontSize: 14, fontFamily: "inherit", outline: "none", MozAppearance: "textfield" }} />
          <button onClick={() => setQty(q => Number(q) + (unit === "g" || unit === "ml" ? 25 : 0.5))}
            style={{ background: "none", border: "none", color: t.textMuted, fontSize: 18, padding: "0 12px", height: 44, cursor: "pointer", lineHeight: 1, fontFamily: "inherit" }}>+</button>
        </div>
        <div style={{ display: "flex", gap: 5, overflowX: "auto", flex: 1, paddingBottom: 2 }}>
          {UNITS.map(u => (
            <button key={u.value} onClick={() => setUnit(u.value)} style={{
              flexShrink: 0, padding: "7px 10px", borderRadius: 8,
              border: `1.5px solid ${unit === u.value ? t.unitActiveBorder : t.unitInactiveBorder}`,
              background: unit === u.value ? t.unitActiveBg : t.unitInactiveBg,
              color: unit === u.value ? t.unitActiveText : t.unitInactiveText,
              fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}>{u.label}</button>
          ))}
        </div>
      </div>

      {raw && (
        <div style={{ marginTop: 7, fontSize: 11, color: t.textMuted }}>
          ≈ <span style={{ color: t.textSecondary, fontWeight: 700 }}>{Math.round(toGrams(Number(qty) || 1, unit, raw.portion_g))}g</span>
          {" "}· base {raw.portion_g}g per {raw.dish}
        </div>
      )}

      {pending && (
        <div style={{ marginTop: 12, background: t.resultBg, border: `1px solid ${t.resultBorder}`, borderRadius: 14, padding: "14px 16px", animation: "fadeUp 0.2s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              {/* FIXED: pending.dishName */}
              <div style={{ fontSize: 15, fontWeight: 800, color: t.textPrimary, marginBottom: 2, textTransform: "capitalize" }}>{pending.dishName}</div>
              <div style={{ fontSize: 11, color: t.textSecondary }}>{qty} {unit} · {pending.portion_g}g</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: t.textPrimary, fontFamily: "'DM Sans', 'Inter', sans-serif", lineHeight: 1 }}>{pending.calories}</div>
              <div style={{ fontSize: 10, color: t.textMuted, letterSpacing: 1, fontWeight: 700 }}>KCAL</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {/* FIXED: pending.proteinG, pending.carbsG, pending.fatG */}
            {[
              { l: "Protein", v: pending.proteinG, c: t.accent },
              { l: "Carbs",   v: pending.carbsG,   c: t.textSecondary },
              { l: "Fat",     v: pending.fatG,      c: t.textMuted },
            ].map(m => (
              <div key={m.l} style={{ flex: 1, textAlign: "center", background: t.macroBg, borderRadius: 10, padding: "8px 4px" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: m.c, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>{m.v}g</div>
                <div style={{ fontSize: 9, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginTop: 2, fontWeight: 700 }}>{m.l}</div>
              </div>
            ))}
          </div>
          {pending.source && <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>Source: {pending.source}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={confirm} disabled={!canConfirm} style={{
              flex: 1, background: !canConfirm ? t.textMuted : t.accentGrad,
              border: "none", borderRadius: 10, padding: "11px",
              fontWeight: 800, fontSize: 13, fontFamily: "'DM Sans', 'Inter', sans-serif",
              cursor: !canConfirm ? "not-allowed" : "pointer",
              color: t.accentText,
              boxShadow: !canConfirm ? "none" : `0 4px 14px ${t.accentGlow}`,
              opacity: !canConfirm ? 0.7 : 1,
            }}>{confirming ? "Adding..." : !canConfirm && Number(qty) <= 0 ? "Enter qty > 0" : "+ Add to Log"}</button>
            <button onClick={dismiss} style={{
              background: t.btnSecBg, border: `1px solid ${t.btnSecBorder}`, borderRadius: 10,
              padding: "11px 14px", color: t.btnSecText, cursor: "pointer",
              fontFamily: "'DM Sans', 'Inter', sans-serif", fontSize: 13, fontWeight: 600,
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MEAL LOG SECTION — grouped by meal type
// ─────────────────────────────────────────────────────────────────────────────
function MealLogSection({ meals, isTodaySelected, onRemove, onAdd, setToast, mealsPerDay, customMealName, activeDay }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [activeMealType, setActiveMealType] = useState(null); // which slot has panel open

  const getMealSlots = () => {
    const base = [
      { key: "breakfast", label: "Breakfast", emoji: "🌅" },
      { key: "lunch",     label: "Lunch",     emoji: "☀️" },
      { key: "dinner",    label: "Dinner",     emoji: "🌙" },
    ];
    if (mealsPerDay >= 4) base.push({ key: "snack",  label: "Snack",       emoji: "🥤" });
    if (mealsPerDay >= 5) base.push({ key: "custom", label: customMealName, emoji: "⚡" });
    return base;
  };

  const slots = getMealSlots();
  const dayLabel = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][activeDay];

  return (
    <div style={{ padding: "0 24px", marginTop: 22, paddingBottom: 8 }}>
      {/* Day label */}
      <div style={{ fontSize: 10, fontWeight: 800, color: t.textMuted, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 16 }}>
        {isTodaySelected ? "Today" : dayLabel}{'s'} Log - {meals.length} item{meals.length !== 1 ? 's' : ''}
      </div>

      {slots.map(slot => {
        const slotMeals = (meals || []).filter(m => (m.mealType || "snack") === slot.key);
        const isOpen    = activeMealType === slot.key;
        const slotCals  = slotMeals.reduce((s, m) => s + (m.calories || 0), 0);

        return (
          <div key={slot.key} style={{ marginBottom: 12, background: t.weekInactiveBg, borderRadius: 14, overflow: "hidden", border: `1px solid ${t.cardBorder}` }}>
            {/* Slot header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{slot.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: t.textPrimary }}>{slot.label}</div>
                  <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 600 }}>
                    {slotMeals.length > 0 ? `${slotMeals.length} item${slotMeals.length > 1 ? "s" : ""} · ${Math.round(slotCals)} kcal` : "Nothing logged yet"}
                  </div>
                </div>
              </div>
              {isTodaySelected && (
                <button onClick={() => setActiveMealType(isOpen ? null : slot.key)} style={{
                  background: isOpen ? t.weekActiveBg : t.accentGrad,
                  border: "none", borderRadius: 8, padding: "5px 12px",
                  fontSize: 12, fontWeight: 800, color: isOpen ? t.weekActiveText : t.accentText,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  {isOpen ? "✕ Close" : "+ Add"}
                </button>
              )}
            </div>

            {/* Meals in this slot */}
            {slotMeals.length > 0 && (
              <div style={{ padding: "0 14px", borderTop: `1px solid ${t.mealBorder}` }}>
                {slotMeals.map(m => (
                  <MealEntry key={m.id} meal={m} onRemove={onRemove} />
                ))}
              </div>
            )}

            {/* Search panel for this slot */}
            {isOpen && (
              <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${t.mealBorder}` }}>
                <MealSearchPanel
                  onAdd={(meal) => { onAdd({ ...meal, mealType: slot.key }); setActiveMealType(null); }}
                  setToast={setToast}
                  mealType={slot.key}
                  compact
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state — no meals at all */}
      {meals.length === 0 && !isTodaySelected && (
        <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
          <p style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>
            {isTodaySelected ? "Tap + Add to log your first meal" : "No meals logged on this day"}
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout, setToast, profileData }) {
  const { theme, setThemeMode } = useTheme();
  const t = THEMES[theme];
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [meals, setMeals] = useState([]);
  const getTodayDow = () => (new Date().getDay() + 6) % 7;
  const [todayDow, setTodayDow] = useState(getTodayDow);
  const [activeDay, setActiveDay] = useState(() => getTodayDow());
  const [weekOffset, setWeekOffset] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Auto-refresh todayDow at midnight ─────────────────────────────────────
  useEffect(() => {
    const getMsUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight - now;
    };
    let timeout;
    const scheduleMidnightRefresh = () => {
      timeout = setTimeout(() => {
        const newDow = getTodayDow();
        setTodayDow(newDow);
        setActiveDay(newDow);
        setWeekOffset(0);
        scheduleMidnightRefresh(); // reschedule for next midnight
      }, getMsUntilMidnight());
    };
    scheduleMidnightRefresh();
    return () => clearTimeout(timeout);
  }, []);

  const targets   = profileData?.dailyTargets || {};
  const profile   = profileData?.profile    || {};
  const userName  = profileData?.name || "";
  const goalLabel = GOALS.find(g => g.value === profile.goal)?.label || "Your Goal";

  const isCurrentWeek = weekOffset === 0;
  const isTodaySelected = isCurrentWeek && activeDay === todayDow;

  // ── Get date string for any day index + week offset ───────────────────────
  const getDateForDay = (dayIndex) => {
    const today = new Date();
    const dow   = (today.getDay() + 6) % 7;
    const date  = new Date(today);
    date.setDate(today.getDate() - dow + dayIndex + (weekOffset * 7));
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  // ── Load meals whenever activeDay or weekOffset changes ───────────────────
  useEffect(() => {
    const fetchLogs = async () => {
      setLogsLoading(true);
      try {
        const date = getDateForDay(activeDay);
        const data = await apiFetch(FOODLOG, `/dashboard?date=${date}`, undefined, "GET");
        if (data.success) {
          setMeals(data.logs.map(log => ({
            id:       log.id,
            dishName: log.dishName  || log.dish_name  || "",
            calories: log.calories  || 0,
            proteinG: log.proteinG  || log.protein_g  || 0,
            carbsG:   log.carbsG    || log.carbs_g    || 0,
            fatG:     log.fatG      || log.fat_g      || 0,
            mealType: log.mealType  || log.meal_type  || "snack",
          })));
        }
      } catch (e) {
        } finally {
        setLogsLoading(false);
      }
    };
    fetchLogs();
    // Listen for refresh events dispatched after camera log
    window.addEventListener("nutriai:refresh", fetchLogs);
    return () => window.removeEventListener("nutriai:refresh", fetchLogs);
  }, [activeDay, weekOffset]);



  const r1 = v => Math.round(v * 10) / 10;
  const rawTotals = (meals || []).reduce((acc, m) => ({
    calories: acc.calories + (Number(m.calories) || 0),
    protein:  acc.protein  + (Number(m.proteinG) || 0),
    carbs:    acc.carbs    + (Number(m.carbsG)   || 0),
    fat:      acc.fat      + (Number(m.fatG)     || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const totals = {
    calories: r1(rawTotals.calories),
    protein:  r1(rawTotals.protein),
    carbs:    r1(rawTotals.carbs),
    fat:      r1(rawTotals.fat),
  };

  const addMeal = m => setMeals(prev => [m, ...prev]);

  // ── Delete from DB + remove from local state ──────────────────────────────
  const removeMeal = async (id) => {
    try {
      await apiFetch(FOODLOG, `/${id}`, undefined, "DELETE");
      setMeals(prev => prev.filter(m => m.id !== id));
      setToast({ msg: "Meal removed from log", type: "success" });
    } catch (e) {
      setToast({ msg: "Failed to remove meal", type: "error" });
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    await fetch(`${API}/logout`, { method: "POST", credentials: "include" });
    setLogoutLoading(false);
    setToast({ msg: "Logged out", type: "success" });
    onLogout();
  };

  return (
    <div style={{
      width: "100%",
      fontFamily: "'DM Sans', 'Inter', sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
            background: t.textPrimary,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 900, color: t.cardBg,
            boxShadow: `0 0 0 2px ${t.cardBg}, 0 0 0 4px ${t.cardBorder}`,
          }}>
            {userName?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>
              {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: t.textPrimary, lineHeight: 1.2 }}>
              {userName.split(" ")[0] || "there"} {"👋"}
            </div>
          </div>
        </div>
        <button onClick={() => setThemeMode(theme === "dark" ? "light" : "dark")} style={{
          background: t.statsCardBg, border: `1px solid ${t.cardBorder}`,
          borderRadius: 99, padding: "7px 14px", fontSize: 13,
          cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 6,
          color: t.textSecondary, fontWeight: 600,
        }}>
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          <span style={{ fontSize: 11 }}>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
      </div>

      <div style={{ padding: "14px 24px 0" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: t.goalChipBg, border: `1px solid ${t.goalChipBorder}`, borderRadius: 99, padding: "5px 14px 5px 10px" }}>
          <span style={{ fontSize: 13 }}>{GOALS.find(g => g.value === profile.goal)?.emoji || "🎯"}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: t.accent, textTransform: "uppercase", letterSpacing: 1 }}>{goalLabel}</span>
          <span style={{ fontSize: 11, color: t.textMuted }}>·</span>
          <span style={{ fontSize: 11, color: t.textSecondary }}>{profile.weight}kg → {profile.targetWeight || profile.weight}kg</span>
        </div>
      </div>

      {/* Log content */}
      {(<>

      <div style={{ padding: "18px 24px 0" }}>
        <WeekStrip activeDay={activeDay} setActiveDay={setActiveDay} weekOffset={weekOffset} setWeekOffset={setWeekOffset} todayDow={todayDow} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "26px 24px 0" }}>
        <CalRing eaten={totals.calories} target={targets.calories} size={190} />
      </div>

      <div style={{ padding: "18px 24px 0", display: "flex", gap: 20 }}>
        <MacroPill label="Protein" eaten={totals.protein} target={targets.protein} color={t.accent} />
        <MacroPill label="Carbs"   eaten={totals.carbs}   target={targets.carbs}   color={t.textSecondary} />
        <MacroPill label="Fat"     eaten={totals.fat}     target={targets.fat}     color={t.textMuted} />
      </div>

      <div style={{ height: 1, background: t.divider, margin: "22px 24px 0" }} />

      {!isTodaySelected && (
        <div style={{ padding: "22px 24px 0", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>
            {new Date(getDateForDay(activeDay)).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
            Read-only - log meals on today only
          </p>
        </div>
      )}

      {logsLoading ? (
        <div style={{ padding: "22px 24px 0", textAlign: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
          </svg>
        </div>
      ) : (
        <MealLogSection
          meals={meals}
          isTodaySelected={isTodaySelected}
          onRemove={isTodaySelected ? removeMeal : undefined}
          onAdd={addMeal}
          setToast={setToast}
          mealsPerDay={profile.mealsPerDay || 3}
          customMealName={profile.customMealName || "Custom"}
          activeDay={activeDay}
        />
      )}

      <div style={{ padding: "22px 24px 28px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Target", value: `${targets.calories || "—"} kcal` },
          { label: "Eaten",  value: `${totals.calories} kcal` },
          { label: "BMI",    value: profile.height && profile.weight ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : "—" },
        ].map(item => (
          <div key={item.label} style={{ background: t.statsCardBg, border: `1px solid ${t.statsCardBorder}`, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: t.statsValue, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>{item.value}</div>
            <div style={{ fontSize: 9, color: t.statsLabel, marginTop: 4, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.2 }}>{item.label}</div>
          </div>
        ))}
      </div>
      </>)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
function Bg() {
  const { theme } = useTheme();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, background: theme === "light" ? "#d0d0d0" : "#000000" }} />
  );
}

function ProgressTab({ profileData, setToast, standalone = false }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [period, setPeriod] = useState("daily");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(null);

  const targets = profileData?.dailyTargets || {};
  const profile = profileData?.profile || {};

  useEffect(() => {
    fetchStats();
    fetchLinks();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(SHARE, `/stats?period=${period}`, undefined, "GET");
      if (data.success) setStats(data.stats);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchLinks = async () => {
    try {
      const data = await apiFetch(SHARE, "/links", undefined, "GET");
      if (data.success) setLinks(data.links);
    } catch { /* silent */ }
  };

  const generateLink = async () => {
    if (generating) return;
    if ((links || []).length >= 5) {
      setToast({ msg: "Max 5 active links. Delete one first.", type: "error" });
      return;
    }
    setGenerating(true);
    try {
      const data = await apiFetch(SHARE, "/generate", { period });
      if (data.success) {
        setLinks(prev => [data.link, ...prev]);
        setToast({ msg: "Share link generated!", type: "success" });
      } else {
        setToast({ msg: data.message || "Failed to generate link", type: "error" });
      }
    } catch { setToast({ msg: "Failed to generate link", type: "error" }); }
    finally { setGenerating(false); }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const deleteLink = async (token) => {
    try {
      await apiFetch(SHARE, `/${token}`, undefined, "DELETE");
      setLinks(prev => prev.filter(l => l.token !== token));
      setToast({ msg: "Link deleted", type: "success" });
    } catch { setToast({ msg: "Failed to delete link", type: "error" }); }
  };

  const pct = (val, target) => target ? Math.min(100, Math.round((val / target) * 100)) : 0;
  const periodLabel = { daily: "Today", weekly: "This Week", monthly: "This Month" };

  const MacroBar = ({ label, val, target, color }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: t.textSecondary }}>{label}</span>
        <span style={{ fontSize: 12, color: t.textMuted }}>{val}g / {target || "?"}g</span>
      </div>
      <div style={{ height: 7, background: t.macroTrack, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct(val, target)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%", fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
    {standalone && (
      <div style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div style={{ padding: "22px 24px 16px", borderBottom: `1px solid ${t.divider}` }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: t.textPrimary }}>Progress</div>
          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>Track your nutrition trends</div>
        </div>
      </div>
    )}
    <div>
    <div style={{ padding: "20px 24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Period selector */}
      <div style={{ display: "flex", gap: 6 }}>
        {["daily", "weekly", "monthly"].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
            background: period === p ? t.accentGrad : t.weekInactiveBg,
            color: period === p ? t.accentText : t.textMuted,
            fontWeight: 700, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
            textTransform: "capitalize",
          }}>{p}</button>
        ))}
      </div>

      {/* Stats card */}
      <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "20px 20px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: t.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
          {periodLabel[period]} Summary
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
            </svg>
          </div>
        ) : stats ? (<>
          {/* Calorie ring summary */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke={t.macroTrack} strokeWidth="8"/>
                <circle cx="40" cy="40" r="32" fill="none" stroke={t.accent} strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct(stats.calories, targets.calories * (period === "weekly" ? 7 : period === "monthly" ? 30 : 1)) / 100)}`}
                  strokeLinecap="round" transform="rotate(-90 40 40)" style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: t.accent }}>{pct(stats.calories, targets.calories * (period === "weekly" ? 7 : period === "monthly" ? 30 : 1))}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: t.textPrimary, fontFamily: "'DM Sans', 'Inter', sans-serif", lineHeight: 1 }}>{Math.round(stats.calories)}</div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>kcal consumed</div>
              <div style={{ fontSize: 11, color: t.accent, fontWeight: 700, marginTop: 4 }}>{stats.meals} meals logged</div>
            </div>
          </div>

          {/* Macro bars */}
          <MacroBar label="Protein" val={Math.round(stats.protein)} target={targets.protein * (period === "weekly" ? 7 : period === "monthly" ? 30 : 1)} color={t.accent} />
          <MacroBar label="Carbs"   val={Math.round(stats.carbs)}   target={targets.carbs   * (period === "weekly" ? 7 : period === "monthly" ? 30 : 1)} color={t.textSecondary} />
          <MacroBar label="Fat"     val={Math.round(stats.fat)}     target={targets.fat     * (period === "weekly" ? 7 : period === "monthly" ? 30 : 1)} color={t.textMuted} />
        </>) : (
          <p style={{ fontSize: 13, color: t.textMuted, textAlign: "center", padding: "12px 0" }}>No data for this period</p>
        )}
      </div>

      {/* Generate share link */}
      <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "18px 20px" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: t.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
          Share Progress
        </div>
        <p style={{ fontSize: 13, color: t.textSecondary, marginBottom: 14, lineHeight: 1.6 }}>
          Generate a public link for your <strong style={{ color: t.textPrimary }}>{period}</strong> progress. Anyone with the link can view it. Expires in 7 days.
        </p>
        <button onClick={generateLink} disabled={generating} style={{
          width: "100%", padding: "12px", borderRadius: 12, border: "none",
          background: generating ? t.textMuted : t.accentGrad,
          color: t.accentText, fontWeight: 800, fontSize: 14,
          fontFamily: "inherit", cursor: generating ? "not-allowed" : "pointer",
          opacity: generating ? 0.7 : 1,
        }}>{generating ? "Generating..." : "Generate Share Link"}</button>
      </div>

      {/* Active links */}
      {links.length > 0 && (
        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "18px 20px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: t.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
            Active Links
          </div>
          {(links || []).map(link => {
            const expiresIn = Math.ceil((new Date(link.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
            const expired = expiresIn <= 0;
            return (
              <div key={link.token} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${t.mealBorder}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary, textTransform: "capitalize" }}>{link.period} progress</div>
                  <div style={{ fontSize: 10, color: expired ? t.textSecondary : t.textMuted, marginTop: 2 }}>
                    {expired ? "Expired" : `Expires in ${expiresIn} day${expiresIn !== 1 ? "s" : ""}`}
                  </div>
                </div>
                <button onClick={() => copyLink(link.token)} style={{
                  background: copied === link.token ? t.accent : t.weekInactiveBg,
                  border: "none", borderRadius: 8, padding: "6px 12px",
                  fontSize: 11, fontWeight: 800, color: copied === link.token ? "#fff" : t.textMuted,
                  cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                }}>{copied === link.token ? "Copied!" : "Copy"}</button>
                <button onClick={() => deleteLink(link.token)} style={{
                  background: "none", border: "none", color: t.textMuted,
                  cursor: "pointer", fontSize: 15, padding: "4px 6px", flexShrink: 0,
                }}
                  onMouseEnter={e => e.currentTarget.style.color = t.textPrimary}
                  onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
                >×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC PROGRESS PAGE — no auth needed
// ─────────────────────────────────────────────────────────────────────────────
function PublicProgressPage() {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPublic = async () => {
      try {
        const res = await fetch(`${SHARE}/view/${token}`);
        const json = await res.json();
        if (json.success) setData(json);
        else setError(json.message || "This link is invalid or has expired.");
      } catch { setError("Could not load progress data."); }
      finally { setLoading(false); }
    };
    fetchPublic();
  }, [token]);

  const accent = t.accent;
  const pct = (v, t) => t ? Math.min(100, Math.round((v / t) * 100)) : 0;
  const periodLabel = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000000" }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000000", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", color: "#888" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Link unavailable</div>
        <div style={{ fontSize: 14 }}>{error}</div>
      </div>
    </div>
  );

  const { stats, targets, profile, period, generatedAt } = data;
  const multiplier = period === "weekly" ? 7 : period === "monthly" ? 30 : 1;

  return (
    <div style={{ minHeight: "100vh", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.4s ease" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Nutri<span style={{ color: "#ffffff" }}>Ai</span>
          </div>
          <div style={{ fontSize: 13, color: t.accent, fontWeight: 600, letterSpacing: 1 }}>
            {periodLabel[period]} Progress
          </div>
        </div>

        {/* Profile pill */}
        <div style={{ background: "#111111", border: "1px solid #2d4a2d", borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#222222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
            {profile?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{profile?.name || "NutriAi User"}</div>
            <div style={{ fontSize: 11, color: t.accent, fontWeight: 600 }}>
              {profile?.goal?.replace(/_/g, " ") || "Healthy living"} · {new Date(generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* Calorie card */}
        <div style={{ background: "#111111", border: "1px solid #2d4a2d", borderRadius: 16, padding: "24px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a1a" strokeWidth="10"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct(stats.calories, (targets?.calories || 2000) * multiplier) / 100)}`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#ffffff" }}>{pct(stats.calories, (targets?.calories || 2000) * multiplier)}%</span>
                <span style={{ fontSize: 9, color: t.accent, fontWeight: 700 }}>goal</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 38, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{Math.round(stats.calories).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: "#666666", marginTop: 2 }}>kcal consumed</div>
              <div style={{ fontSize: 12, color: t.accent, fontWeight: 700, marginTop: 6 }}>{stats.meals} meals logged</div>
              <div style={{ fontSize: 11, color: t.accent, fontWeight: 600, marginTop: 2 }}>Target: {Math.round((targets?.calories || 2000) * multiplier).toLocaleString()} kcal</div>
            </div>
          </div>
        </div>

        {/* Macro cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Protein", val: stats.protein, target: (targets?.protein || 0) * multiplier, color: "#ffffff" },
            { label: "Carbs",   val: stats.carbs,   target: (targets?.carbs   || 0) * multiplier, color: t.textSecondary },
            { label: "Fat",     val: stats.fat,     target: (targets?.fat     || 0) * multiplier, color: t.textPrimary },
          ].map(m => (
            <div key={m.label} style={{ background: "#111111", border: "1px solid #2d4a2d", borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: m.color, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>{Math.round(m.val)}g</div>
              <div style={{ fontSize: 9, color: "#666666", marginTop: 4, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>{m.label}</div>
              <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: `${pct(m.val, m.target)}%`, height: "100%", background: m.color, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 9, color: "#555555", marginTop: 4 }}>{pct(m.val, m.target)}% of goal</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#333333" }}>Shared via NutriAi · Track your nutrition at nutriai.app</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  BOTTOM NAV
// ─────────────────────────────────────────────────────────────────────────────
function BottomNav({ setToast, profileData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const t = THEMES[theme];
  const path = location.pathname;
  const [showCamera, setShowCamera] = useState(false);

  const tabs = [
    { path: "/dashboard", label: "Home",     icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? t.accent : "none"} stroke={active ? t.accent : t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>
      </svg>
    )},
    { path: "/progress-page", label: "Progress", icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? t.accent : t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    )},
    { path: "/profile-page", label: "Profile",  icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? t.accent : t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )},
  ];

  return (<>
    <div style={{
      display: "flex", alignItems: "center",
      background: t.cardBg, borderTop: `1px solid ${t.cardBorder}`,
      padding: "10px 0 18px", flexShrink: 0,
    }}>
      {[
        { label: "Home",     route: "/dashboard",    active: path === "/dashboard",    action: null,
          icon: (on) => <svg width="21" height="21" viewBox="0 0 24 24" fill={on ? t.accent : "none"} stroke={on ? t.accent : t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
        { label: "Progress", route: "/progress-page", active: path === "/progress-page", action: null,
          icon: (on) => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={on ? t.accent : t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
        { label: "Camera",   route: null,            active: false,                    action: () => setShowCamera(true),
          icon: (_) => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> },
        { label: "Profile",  route: "/profile-page", active: path === "/profile-page", action: null,
          icon: (on) => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={on ? t.accent : t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
      ].map(tab => (
        <button key={tab.label}
          onClick={() => tab.action ? tab.action() : navigate(tab.route)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "6px 0", fontFamily: "inherit" }}>
          {tab.icon(tab.active)}
          <span style={{ fontSize: 10, fontWeight: 700, color: tab.label === "Camera" ? t.accent : tab.active ? t.accent : t.textMuted }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>

    {showCamera && (
      <ImageUploadModal
        setToast={setToast}
        profileData={profileData}
        onClose={() => setShowCamera(false)}
        onLogged={() => { setShowCamera(false); window.dispatchEvent(new Event("nutriai:refresh")); }}
      />
    )}
  </>);
}

// ─────────────────────────────────────────────────────────────────────────────
//  IMAGE UPLOAD MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ImageUploadModal({ onClose, onLogged, setToast, profileData }) {
  const { theme } = useTheme();
  const t = THEMES[theme];
  const [step, setStep]             = useState("upload");   // upload | confirm | qty
  const [preview, setPreview]       = useState(null);
  const [imageFile, setImageFile]   = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [result, setResult]         = useState(null);       // { top_prediction, nutrition, is_uncertain, all_predictions }
  const [selected, setSelected]     = useState(null);       // chosen dish when uncertain
  const [qty, setQty]               = useState(1);
  const [unit, setUnit]             = useState("piece");
  const [confirming, setConfirming] = useState(false);
  const [mealType, setMealType]     = useState("lunch");
  const fileRef = useRef();

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setToast({ msg: "Image too large. Max 10MB.", type: "error" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setToast({ msg: "Please upload an image file.", type: "error" });
      return;
    }
    setImageFile(file);
    const objUrl = URL.createObjectURL(file);
    setPreview(prev => { if (prev) URL.revokeObjectURL(prev); return objUrl; });
    setStep("upload");
    setResult(null); setSelected(null);
  };

  const classify = async () => {
    if (!imageFile) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    setClassifying(true);
    try {
      const form = new FormData();
      form.append("file", imageFile);
      const res  = await fetch(`${ML}/classify`, { method: "POST", body: form });
      const json = await res.json();
      setResult(json);
      if (json.is_uncertain) {
        setSelected(json.all_predictions[0]?.dish || "");
      } else {
        setSelected(json.top_prediction?.dish || "");
      }
      setStep("confirm");
    } catch {
      setToast({ msg: "Image classification failed. Try again.", type: "error" });
    } finally {
      setClassifying(false);
    }
  };

  // Compute scaled macros for quantity
  const nutrition = result?.nutrition;
  const scaled = nutrition ? scaleMacros(
    { dish: selected || nutrition.dish, calories: nutrition.calories, protein: nutrition.protein, carbs: nutrition.carbs, fats: nutrition.fats, portion_g: nutrition.portion_g, source: nutrition.source },
    toGrams(Number(qty) || 1, unit, nutrition.portion_g)
  ) : null;

  const confirmLog = async () => {
    if (!scaled || confirming) return;
    setConfirming(true);
    try {
      await apiFetch(FOODLOG, "", {
        dishName:  scaled.dishName,
        mealType,
        calories:  scaled.calories,
        proteinG:  scaled.proteinG,
        carbsG:    scaled.carbsG,
        fatG:      scaled.fatG,
        portionG:  scaled.portion_g,
        source:    scaled.source,
        loggedVia: "image",
      });
      setToast({ msg: `${scaled.dishName} logged!`, type: "success" });
      onLogged();
    } catch {
      setToast({ msg: "Failed to log meal. Try again.", type: "error" });
    } finally {
      setConfirming(false);
    }
  };

  const MEAL_TYPES = [
    { value: "breakfast", label: "Breakfast", emoji: "🌅" },
    { value: "lunch",     label: "Lunch",     emoji: "☀️" },
    { value: "dinner",    label: "Dinner",    emoji: "🌙" },
    { value: "snack",     label: "Snack",     emoji: "🍎" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", background: t.cardBg, fontFamily: "'DM Sans', 'Inter', sans-serif", animation: "fadeUp 0.25s ease", borderRadius: 28, overflow: "hidden" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${t.cardBorder}`, borderRadius: 10, padding: "8px 14px", color: t.textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Cancel
        </button>
        <div style={{ fontSize: 15, fontWeight: 900, color: t.textPrimary }}>Snap a Meal</div>
        <div style={{ width: 70 }} />
      </div>

      {/* Image area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Photo preview / picker */}
        <div onClick={() => step === "upload" && fileRef.current?.click()} style={{
          position: "relative", borderRadius: 20, overflow: "hidden",
          background: t.cardBg, border: `2px dashed ${preview ? "transparent" : t.cardBorder}`,
          minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: step === "upload" ? "pointer" : "default",
          flexShrink: 0,
        }}>
          {preview ? (
            <img src={preview} alt="food" style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📷</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.textPrimary, marginBottom: 6 }}>Take or upload a photo</div>
              <div style={{ fontSize: 13, color: t.textMuted }}>We will identify the food and estimate calories</div>
            </div>
          )}
          {preview && step === "upload" && (
            <div style={{ position: "absolute", bottom: 12, right: 12 }}>
              <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }} style={{ background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Change
              </button>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pickImage} style={{ display: "none" }} />

        {/* Step: upload — show Identify button */}
        {step === "upload" && preview && (
          <button onClick={classify} disabled={classifying} style={{
            width: "100%", padding: "15px", borderRadius: 14, border: "none",
            background: classifying ? t.statsCardBg : t.accentGrad,
            color: t.accentText, fontWeight: 900, fontSize: 15, fontFamily: "inherit",
            cursor: classifying ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            {classifying ? (<>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
              Identifying food...
            </>) : "Identify Food"}
          </button>
        )}

        {/* Step: confirm — show results */}
        {step === "confirm" && result && (<>

          {/* Uncertain — show top 3 to pick */}
          {result.is_uncertain && (
            <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: t.textMuted, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 12 }}>
                Not sure — pick the closest match
              </div>
              {result.all_predictions.map((p, i) => (
                <button key={i} onClick={() => setSelected(p.dish)} style={{
                  width: "100%", textAlign: "left", padding: "12px 14px", marginBottom: 8,
                  borderRadius: 12, border: `2px solid ${selected === p.dish ? t.accent : t.cardBorder}`,
                  background: selected === p.dish ? `${t.accent}15` : t.cardBg,
                  cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary, textTransform: "capitalize" }}>{p.dish?.replace(/_/g, " ")}</span>
                  <span style={{ fontSize: 12, color: t.accent, fontWeight: 800 }}>{(p.confidence || 0).toFixed(1)}%</span>
                </button>
              ))}
            </div>
          )}

          {/* Identified dish */}
          {!result.is_uncertain && (
            <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: t.accent, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 }}>Identified</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: t.textPrimary, textTransform: "capitalize" }}>
                {result.top_prediction?.dish?.replace(/_/g, " ")}
              </div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                {(result.top_prediction?.confidence || 0).toFixed(1)}% confidence
              </div>
            </div>
          )}

          {/* Nutrition preview (scaled) */}
          {scaled && (<>
            <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: t.textPrimary, textTransform: "capitalize" }}>{scaled.dishName}</div>
                  <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{qty} {unit} · {Math.round(toGrams(Number(qty)||1, unit, nutrition.portion_g))}g</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 34, fontWeight: 900, color: t.accent, fontFamily: "'DM Sans', 'Inter', sans-serif", lineHeight: 1 }}>{scaled.calories}</div>
                  <div style={{ fontSize: 10, color: t.textMuted, letterSpacing: 1, fontWeight: 700 }}>KCAL</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[
                  { l: "Protein", v: scaled.proteinG, c: t.textPrimary },
                  { l: "Carbs",   v: scaled.carbsG,   c: t.textSecondary },
                  { l: "Fat",     v: scaled.fatG,      c: t.textMuted },
                ].map(m => (
                  <div key={m.l} style={{ flex: 1, textAlign: "center", background: t.macroBg, borderRadius: 10, padding: "10px 4px" }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: m.c }}>{m.v}g</div>
                    <div style={{ fontSize: 9, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1, marginTop: 2, fontWeight: 700 }}>{m.l}</div>
                  </div>
                ))}
              </div>

              {/* Qty input */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: t.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Quantity</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", background: t.inputBg, border: `1.5px solid ${t.inputBorder}`, borderRadius: 12, overflow: "hidden" }}>
                    <button onClick={() => setQty(q => Math.max(0.5, Number(q) - (unit === "g" || unit === "ml" ? 25 : 0.5)))}
                      style={{ background: "none", border: "none", color: t.textMuted, fontSize: 18, padding: "0 12px", height: 44, cursor: "pointer", fontFamily: "inherit" }}>-</button>
                    <input type="number" value={qty} min={0.5}
                      onChange={e => setQty(Math.max(0.5, Number(e.target.value) || 1))}
                      style={{ width: 52, textAlign: "center", background: "none", border: "none", color: t.inputText, fontWeight: 900, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                    <button onClick={() => setQty(q => Number(q) + (unit === "g" || unit === "ml" ? 25 : 0.5))}
                      style={{ background: "none", border: "none", color: t.textMuted, fontSize: 18, padding: "0 12px", height: 44, cursor: "pointer", fontFamily: "inherit" }}>+</button>
                  </div>
                  <div style={{ display: "flex", gap: 5, overflowX: "auto", flex: 1 }}>
                    {UNITS.map(u => (
                      <button key={u.value} onClick={() => setUnit(u.value)} style={{
                        flexShrink: 0, padding: "7px 10px", borderRadius: 8,
                        border: `1.5px solid ${unit === u.value ? t.unitActiveBorder : t.unitInactiveBorder}`,
                        background: unit === u.value ? t.unitActiveBg : t.unitInactiveBg,
                        color: unit === u.value ? t.unitActiveText : t.unitInactiveText,
                        fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', 'Inter', sans-serif",
                      }}>{u.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Meal type */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: t.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Add to</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {MEAL_TYPES.map(m => (
                    <button key={m.value} onClick={() => setMealType(m.value)} style={{
                      flex: 1, padding: "8px 4px", borderRadius: 10,
                      border: `2px solid ${mealType === m.value ? t.accent : t.cardBorder}`,
                      background: mealType === m.value ? `${t.accent}15` : t.cardBg,
                      cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 15 }}>{m.emoji}</div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: mealType === m.value ? t.accent : t.textMuted, marginTop: 2 }}>{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Log button */}
            <button onClick={confirmLog} disabled={confirming} style={{
              width: "100%", padding: "16px", borderRadius: 14, border: "none",
              background: confirming ? t.statsCardBg : t.accentGrad,
              color: t.accentText, fontWeight: 900, fontSize: 15, fontFamily: "inherit",
              cursor: confirming ? "not-allowed" : "pointer",
              boxShadow: `0 6px 20px ${t.accentGlow}`,
            }}>
              {confirming ? "Logging..." : "Done"}
            </button>
          </>)}

          {/* Retake */}
          <button onClick={() => { setStep("upload"); setResult(null); setPreview(null); setImageFile(null); }} style={{
            width: "100%", padding: "13px", borderRadius: 14, border: `1px solid ${t.cardBorder}`,
            background: "none", color: t.textMuted, fontWeight: 700, fontSize: 14,
            fontFamily: "inherit", cursor: "pointer",
          }}>
            Take Another Photo
          </button>
        </>)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROFILE PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ProfilePage({ profileData, onLogout, setToast }) {
  const { theme, setThemeMode } = useTheme();
  const t = THEMES[theme];
  const profile  = profileData?.profile    || {};
  const targets  = profileData?.dailyTargets || {};
  const userName = profileData?.name || "";

  const stats = [
    { label: "Age",           value: profile.age ? `${profile.age} yrs` : "-" },
    { label: "Height",        value: profile.height ? `${profile.height} cm` : "-" },
    { label: "Weight",        value: profile.weight ? `${profile.weight} kg` : "-" },
    { label: "Target Weight", value: profile.targetWeight ? `${profile.targetWeight} kg` : "-" },
    { label: "Goal",          value: GOALS.find(g => g.value === profile.goal)?.label || "-" },
    { label: "Activity",      value: profile.activityLevel?.replace(/_/g, " ") || "-" },
  ];

  const macros = [
    { label: "Calories", value: `${targets.calories || "-"} kcal`, color: t.accent },
    { label: "Protein",  value: `${targets.protein  || "-"}g`,     color: t.accent },
    { label: "Carbs",    value: `${targets.carbs    || "-"}g`,     color: t.textSecondary },
    { label: "Fat",      value: `${targets.fat      || "-"}g`,     color: t.textPrimary },
  ];

  return (
    <div style={{ width: "100%", fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <div style={{ background: "transparent" }}>

        {/* Header */}
        <div style={{ padding: "28px 24px 20px", display: "flex", alignItems: "center", gap: 16, borderBottom: `1px solid ${t.divider}` }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
            background: t.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 900, color: "#fff",
            boxShadow: `0 0 0 3px ${t.cardBg}, 0 0 0 5px ${t.accent}55`,
          }}>
            {userName?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: t.textPrimary }}>{userName || "User"}</div>
            <div style={{ fontSize: 13, color: t.accent, fontWeight: 700, marginTop: 2 }}>
              {GOALS.find(g => g.value === profile.goal)?.emoji} {GOALS.find(g => g.value === profile.goal)?.label || "NutriAi Member"}
            </div>
          </div>
        </div>

        {/* Daily targets */}
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: t.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Daily Targets</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
            {macros.map(m => (
              <div key={m.label} style={{ background: t.statsCardBg, border: `1px solid ${t.statsCardBorder}`, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 9, color: t.textMuted, marginTop: 4, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body stats */}
        <div style={{ padding: "0 24px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: t.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Body Stats</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: t.statsCardBg, border: `1px solid ${t.statsCardBorder}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: t.textPrimary, textTransform: "capitalize" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 3, fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BMI card */}
        {profile.height && profile.weight && (
          <div style={{ padding: "0 24px 20px" }}>
            {(() => {
              const bmi = (profile.weight / Math.pow(profile.height / 100, 2));
              const bmiLabel = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
              const bmiColor = t.textPrimary;
              return (
                <div style={{ background: t.statsCardBg, border: `1px solid ${t.statsCardBorder}`, borderRadius: 14, padding: "16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: t.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>BMI</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: t.textPrimary, fontFamily: "'DM Sans', 'Inter', sans-serif", lineHeight: 1.1 }}>{bmi.toFixed(1)}</div>
                  <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 600, marginTop: 4 }}>{bmiLabel}</div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Settings */}
        <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 10, borderTop: `1px solid ${t.divider}`, paddingTop: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: t.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Settings</div>

          {/* Theme toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: t.statsCardBg, border: `1px solid ${t.statsCardBorder}`, borderRadius: 12, padding: "14px 16px" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary }}>Theme</span>
            <div style={{ display: "flex", gap: 6 }}>
              {["dark", "light"].map(m => (
                <button key={m} onClick={() => setThemeMode(m)} style={{
                  padding: "6px 14px", borderRadius: 8, border: "none",
                  background: theme === m ? t.accentGrad : t.weekInactiveBg,
                  color: theme === m ? "#fff" : t.textMuted,
                  fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  textTransform: "capitalize",
                }}>{m}</button>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <button onClick={onLogout} style={{
            width: "100%", padding: "14px", borderRadius: 12,
            border: "1px solid #dc262640", background: "#dc262610",
            color: "#dc2626", fontWeight: 800, fontSize: 14,
            fontFamily: "inherit", cursor: "pointer",
          }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROTECTED ROUTE
// ─────────────────────────────────────────────────────────────────────────────
function ProtectedRoute({ children, user }) {
  if (!user) return <Navigate to="/" replace />;
  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESET PASSWORD PAGE (reads token from URL params)
// ─────────────────────────────────────────────────────────────────────────────
function ResetPasswordPage({ setToast }) {
  const { token } = useParams();
  const navigate  = useNavigate();
  const handleSuccess = () => {
    navigate("/", { state: { successMsg: "Password reset! Please login with your new password." } });
  };
  return <ResetScreen token={token} onSwitch={handleSuccess} setToast={setToast} />;
}

// ─────────────────────────────────────────────────────────────────────────────
//  APP INNER (has access to useNavigate)
// ─────────────────────────────────────────────────────────────────────────────
function AppInner() {
  const navigate = useNavigate();
  const [themeMode, setThemeModeState] = useState(() => {
    try { return localStorage.getItem("nutriai-theme") || "dark"; } catch { return "dark"; }
  });
  const [toast, setToast]             = useState({ msg: "", type: "success" });
  const [user, setUser]               = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const setThemeMode = (m) => {
    setThemeModeState(m);
    try { localStorage.setItem("nutriai-theme", m); } catch {}
  };

  const t = THEMES[themeMode];

  // ── Restore session on page refresh ───────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const data = await apiFetch(API, "/check-auth", undefined, "GET");
        if (data.success) {
          setUser({ email: data.user.email });
          if (data.user.profile?.isOnboarded) {
            setProfileData(data.user);
            const cur = window.location.pathname;
            if (cur === "/" || cur === "/signup" || cur === "/verify-email") {
              navigate("/dashboard", { replace: true });
            }
          } else {
            navigate("/onboarding", { replace: true });
          }
        }
      } catch {
        // no session, stay on login
      } finally {
        setInitializing(false);
      }
    };
    const path = window.location.pathname;
    if (path.startsWith("/reset-password") || path.startsWith("/share/")) {
      setInitializing(false);
    } else {
      restoreSession();
    }
  }, []);

  const handleUser = async (u) => {
    setUser(u);
    try {
      const data = await apiFetch(PROFILE, "", undefined, "GET");
      if (data.success && data.user?.profile?.isOnboarded) {
        setProfileData(data.user);
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch {
      navigate("/onboarding", { replace: true });
    }
  };

  const handleOnboardingDone = (data) => {
    setProfileData({ profile: data.profile, dailyTargets: data.dailyTargets });
    navigate("/dashboard", { replace: true });
  };

  const handleLogout = async () => {
    await fetch(`${API}/logout`, { method: "POST", credentials: "include" });
    setUser(null);
    setProfileData(null);
    setToast({ msg: "Logged out", type: "success" });
    navigate("/", { replace: true });
  };

  const location = useLocation();
  const isApp = ["/dashboard", "/progress-page", "/profile-page"].includes(location.pathname);
  const isDashboard = isApp;

  if (initializing) return (
    <ThemeContext.Provider value={{ theme: themeMode, setThemeMode }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Bg />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
        </svg>
      </div>
    </ThemeContext.Provider>
  );

  return (
    <ThemeContext.Provider value={{ theme: themeMode, setThemeMode }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: ${t.pageBg}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bgpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: ${t.inputPlaceholder}; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px ${t.inputBg} inset !important; -webkit-text-fill-color: ${t.inputText} !important; }
        input[type=range] { -webkit-appearance: none; height: 6px; background: ${t.macroTrack}; border-radius: 3px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: ${t.accent}; cursor: pointer; box-shadow: 0 0 0 3px ${t.cardBg}, 0 0 10px ${t.accent}55; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 4px; height: 0; }
        ::-webkit-scrollbar-thumb { background: ${t.divider}; border-radius: 2px; }
      `}</style>

      <Bg />

      {/* Outer centering wrapper */}
      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh",
        display: "flex",
        alignItems: isApp ? "center" : "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        animation: "fadeUp 0.4s ease",
      }}>
        {isApp ? (
          /* ── App shell: phone-like card with scrollable content + bottom nav ── */
          <div style={{
            width: "100%", maxWidth: 480,
            height: "calc(100vh - 48px)",
            maxHeight: 860,
            background: t.cardBg,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 28,
            boxShadow: t.cardShadow,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}>
            {/* Scrollable content area */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              <Routes>
                <Route path="/dashboard"
                  element={
                    <ProtectedRoute user={user}>
                      <Dashboard user={user} onLogout={handleLogout} setToast={setToast} profileData={profileData} />
                    </ProtectedRoute>
                  }
                />
                <Route path="/progress-page"
                  element={
                    <ProtectedRoute user={user}>
                      <ProgressTab profileData={profileData} setToast={setToast} standalone />
                    </ProtectedRoute>
                  }
                />
                <Route path="/profile-page"
                  element={
                    <ProtectedRoute user={user}>
                      <ProfilePage profileData={profileData} setProfileData={setProfileData} onLogout={handleLogout} setToast={setToast} />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>

            {/* Bottom nav — inside the card */}
            <BottomNav setToast={setToast} profileData={profileData} />
          </div>
        ) : (
          /* ── Auth / onboarding pages — centered, no shell ── */
          <Routes>
            <Route path="/"
              element={<LoginScreen setToast={setToast} setUser={handleUser} />}
            />
            <Route path="/signup"
              element={<SignupScreen setToast={setToast} onVerify={(email) => navigate("/verify-email", { state: { email } })} />}
            />
            <Route path="/verify-email"
              element={<VerifyScreen setToast={setToast} setUser={handleUser} />}
            />
            <Route path="/forgot-password"
              element={<ForgotScreen setToast={setToast} />}
            />
            <Route path="/reset-password/:token"
              element={<ResetPasswordPage setToast={setToast} />}
            />
            <Route path="/onboarding"
              element={
                <ProtectedRoute user={user}>
                  <OnboardingScreen onDone={handleOnboardingDone} setToast={setToast} />
                </ProtectedRoute>
              }
            />
            <Route path="/share/:token" element={<PublicProgressPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "" })} />
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { /* silent in production */ }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#000", fontFamily: "'DM Sans', sans-serif", gap: 16, padding: 24 }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Something went wrong</div>
          <div style={{ fontSize: 11, color: "#dc2626", textAlign: "center", maxWidth: 400, fontFamily: "monospace", background: "#111", padding: "12px 16px", borderRadius: 8, wordBreak: "break-all" }}>
            {this.state.error?.message || "Unknown error"}
          </div>
          <button onClick={() => { this.setState({ hasError: false, error: null }); }} style={{ marginTop: 8, padding: "10px 24px", background: "#fff", color: "#000", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            Try Again
          </button>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", background: "transparent", color: "#666", border: "1px solid #333", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </ErrorBoundary>
  );
}