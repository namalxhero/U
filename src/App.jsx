import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  QrCode,
  KeyRound,
  Ruler,
  Braces,
  Timer as TimerIcon,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Download,
  AlertCircle,
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS
   bg-void      #14151A   base background
   bg-surface   #1B1D24   panels
   bg-surface-2 #23262F   inset fields
   border       #2E313C
   brass        #E8A33D   primary accent — tool-metal glint
   teal         #4FD1C5   secondary accent — used sparingly
   text-hi      #F2F0EB
   text-mid     #ACAFBB
   text-low     #6E7180
--------------------------------------------------------- */

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
.font-display { font-family: 'Space Grotesk', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
.font-mono { font-family: 'JetBrains Mono', monospace; }
.drawer-tab { position: relative; }
.drawer-tab.active::before {
  content: '';
  position: absolute;
  left: -1px; top: 8px; bottom: 8px; width: 3px;
  background: #E8A33D;
  border-radius: 0 3px 3px 0;
}
::selection { background: #E8A33D; color: #14151A; }
input[type="range"] {
  -webkit-appearance: none;
  height: 4px;
  border-radius: 999px;
  background: #2E313C;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #E8A33D;
  cursor: pointer;
  border: 2px solid #14151A;
}
input[type="checkbox"] { accent-color: #E8A33D; }
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

/* ---- loader ---- */
@keyframes runAcross {
  0%   { left: -12%; }
  100% { left: 108%; }
}
@keyframes legSwing {
  0%, 100% { transform: rotate(28deg); }
  50%      { transform: rotate(-28deg); }
}
@keyframes armSwing {
  0%, 100% { transform: rotate(-20deg); }
  50%      { transform: rotate(20deg); }
}
@keyframes orbSpin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes orbPulse {
  0%, 100% { box-shadow: 0 0 18px 6px rgba(79,209,197,0.55), 0 0 40px 14px rgba(232,163,61,0.25); }
  50%      { box-shadow: 0 0 26px 10px rgba(79,209,197,0.8), 0 0 60px 20px rgba(232,163,61,0.4); }
}
@keyframes streak {
  0%   { opacity: 0; transform: translateX(0) scaleX(0.4); }
  50%  { opacity: 0.5; }
  100% { opacity: 0; transform: translateX(-40px) scaleX(1); }
}
.loader-fade-out { animation: fadeOut 0.5s ease forwards; }
@keyframes fadeOut { to { opacity: 0; visibility: hidden; } }
`;

const TOOLS = [
  { id: "qr", label: "QR Code", sub: "Text \u2192 scannable code", icon: QrCode },
  { id: "password", label: "Password", sub: "Generate & measure", icon: KeyRound },
  { id: "units", label: "Unit Convert", sub: "Length, weight, temp", icon: Ruler },
  { id: "json", label: "JSON Format", sub: "Prettify & validate", icon: Braces },
  { id: "pomodoro", label: "Focus Timer", sub: "Work / break cycles", icon: TimerIcon },
];

/* ---------- shared bits ---------- */

function Panel({ eyebrow, title, description, children }) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#E8A33D]">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-display text-3xl font-semibold text-[#F2F0EB] mb-2">
        {title}
      </h2>
      <p className="font-body text-sm text-[#ACAFBB] mb-8 leading-relaxed">
        {description}
      </p>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-5">
      <label className="block font-mono text-[11px] tracking-wider uppercase text-[#6E7180] mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function CopyButton({ value, disabled }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      onClick={handle}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#23262F] border border-[#2E313C] text-[#F2F0EB] font-body text-sm hover:border-[#E8A33D]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {copied ? <Check size={15} className="text-[#4FD1C5]" /> : <Copy size={15} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ---------- 1. QR CODE ---------- */

function QRTool() {
  const [text, setText] = useState("https://claude.ai");
  const size = 280;
  const src = text
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(
        text
      )}`
    : null;

  return (
    <Panel
      eyebrow="01 / Encode"
      title="QR code generator"
      description="Type or paste anything — a link, a note, wifi details. The code updates as you type."
    >
      <Field label="Content">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Paste a URL or type text..."
          className="w-full resize-none rounded-md bg-[#23262F] border border-[#2E313C] px-4 py-3 font-body text-sm text-[#F2F0EB] placeholder-[#6E7180] focus:outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]/40"
        />
      </Field>

      <div className="flex flex-col items-center gap-4 mt-2">
        <div className="w-[280px] h-[280px] rounded-lg bg-white p-3 flex items-center justify-center border border-[#2E313C]">
          {src ? (
            <img src={src} alt="Generated QR code" className="w-full h-full object-contain" />
          ) : (
            <span className="font-mono text-xs text-[#6E7180]">Enter content above</span>
          )}
        </div>
        <a
          href={src || "#"}
          download="qr-code.png"
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#E8A33D] text-[#14151A] font-body text-sm font-medium hover:bg-[#f0b155] transition-colors ${
            !src ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <Download size={15} /> Save image
        </a>
      </div>
    </Panel>
  );
}

/* ---------- 2. PASSWORD GENERATOR ---------- */

function PasswordTool() {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [password, setPassword] = useState("");

  const charset = useMemo(() => {
    let s = "";
    if (opts.lower) s += "abcdefghijklmnopqrstuvwxyz";
    if (opts.upper) s += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (opts.numbers) s += "0123456789";
    if (opts.symbols) s += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    return s;
  }, [opts]);

  const generate = () => {
    if (!charset) {
      setPassword("");
      return;
    }
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    let out = "";
    for (let i = 0; i < length; i++) out += charset[arr[i] % charset.length];
    setPassword(out);
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, opts]);

  const strength = useMemo(() => {
    let score = 0;
    if (length >= 8) score++;
    if (length >= 14) score++;
    if (opts.upper && opts.lower) score++;
    if (opts.numbers) score++;
    if (opts.symbols) score++;
    return score; // 0-5
  }, [length, opts]);

  const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"][strength];
  const strengthColor = ["#E85D5D", "#E8A33D", "#E8A33D", "#4FD1C5", "#4FD1C5", "#4FD1C5"][strength];

  const toggle = (key) => setOpts((o) => ({ ...o, [key]: !o[key] }));

  return (
    <Panel
      eyebrow="02 / Secure"
      title="Password generator"
      description="Built with the browser's crypto API, not Math.random — generated locally, never sent anywhere."
    >
      <div className="rounded-md bg-[#23262F] border border-[#2E313C] px-4 py-4 mb-6 flex items-center justify-between gap-3">
        <span className="font-mono text-base sm:text-lg text-[#F2F0EB] break-all">
          {password || "\u2014"}
        </span>
      </div>
      <div className="flex gap-3 mb-8">
        <CopyButton value={password} disabled={!password} />
        <button
          onClick={generate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#E8A33D] text-[#14151A] font-body text-sm font-medium hover:bg-[#f0b155] transition-colors"
        >
          <RotateCcw size={15} /> Regenerate
        </button>
      </div>

      <Field label={`Length \u2014 ${length} characters`}>
        <input
          type="range"
          min={6}
          max={32}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <Field label="Character sets">
        <div className="grid grid-cols-2 gap-3">
          {[
            ["lower", "a-z"],
            ["upper", "A-Z"],
            ["numbers", "0-9"],
            ["symbols", "!@#$"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#23262F] border border-[#2E313C] font-mono text-sm text-[#ACAFBB] cursor-pointer"
            >
              <input type="checkbox" checked={opts[key]} onChange={() => toggle(key)} />
              {label}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Strength">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-[#2E313C] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(strength / 5) * 100}%`, background: strengthColor }}
            />
          </div>
          <span className="font-mono text-xs" style={{ color: strengthColor }}>
            {strengthLabel}
          </span>
        </div>
      </Field>
    </Panel>
  );
}

/* ---------- 3. UNIT CONVERTER ---------- */

const UNIT_GROUPS = {
  Length: {
    base: "m",
    units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254 },
  },
  Weight: {
    base: "kg",
    units: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000 },
  },
  Temperature: { base: "c", units: {} }, // handled specially
};

function convertTemp(value, from, to) {
  let c;
  if (from === "c") c = value;
  else if (from === "f") c = ((value - 32) * 5) / 9;
  else c = value - 273.15;

  if (to === "c") return c;
  if (to === "f") return (c * 9) / 5 + 32;
  return c + 273.15;
}

function UnitTool() {
  const [category, setCategory] = useState("Length");
  const isTemp = category === "Temperature";
  const units = isTemp ? { c: "\u00b0C", f: "\u00b0F", k: "K" } : UNIT_GROUPS[category].units;
  const unitKeys = Object.keys(units);

  const [from, setFrom] = useState(unitKeys[0]);
  const [to, setTo] = useState(unitKeys[1] || unitKeys[0]);
  const [input, setInput] = useState("1");

  useEffect(() => {
    const keys = isTemp ? ["c", "f", "k"] : Object.keys(UNIT_GROUPS[category].units);
    setFrom(keys[0]);
    setTo(keys[1] || keys[0]);
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => {
    const val = parseFloat(input);
    if (isNaN(val)) return "";
    if (isTemp) return convertTemp(val, from, to).toFixed(2);
    const group = UNIT_GROUPS[category].units;
    const meters = val * group[from];
    return (meters / group[to]).toFixed(6).replace(/\.?0+$/, "");
  }, [input, from, to, category, isTemp]);

  return (
    <Panel
      eyebrow="03 / Convert"
      title="Unit converter"
      description="Length, weight, and temperature — converts as you type, no submit button needed."
    >
      <Field label="Category">
        <div className="flex gap-2">
          {Object.keys(UNIT_GROUPS).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-md font-body text-sm border transition-colors ${
                category === c
                  ? "bg-[#E8A33D] text-[#14151A] border-[#E8A33D] font-medium"
                  : "bg-[#23262F] text-[#ACAFBB] border-[#2E313C] hover:border-[#E8A33D]/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="From">
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-md bg-[#23262F] border border-[#2E313C] px-3 py-2.5 font-mono text-sm text-[#F2F0EB] mb-2 focus:outline-none focus:border-[#E8A33D]"
          />
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-md bg-[#23262F] border border-[#2E313C] px-3 py-2.5 font-mono text-sm text-[#F2F0EB] focus:outline-none focus:border-[#E8A33D]"
          >
            {unitKeys.map((u) => (
              <option key={u} value={u}>
                {isTemp ? units[u] : u}
              </option>
            ))}
          </select>
        </Field>

        <Field label="To">
          <div className="w-full rounded-md bg-[#23262F] border border-[#2E313C] px-3 py-2.5 font-mono text-sm text-[#4FD1C5] mb-2 truncate">
            {result || "\u2014"}
          </div>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-md bg-[#23262F] border border-[#2E313C] px-3 py-2.5 font-mono text-sm text-[#F2F0EB] focus:outline-none focus:border-[#E8A33D]"
          >
            {unitKeys.map((u) => (
              <option key={u} value={u}>
                {isTemp ? units[u] : u}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Panel>
  );
}

/* ---------- 4. JSON FORMATTER ---------- */

function highlightJSON(json) {
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
    (match) => {
      let color = "#4FD1C5"; // number
      if (/^"/.test(match)) {
        color = /:$/.test(match) ? "#E8A33D" : "#9FD98C"; // key vs string
      } else if (/true|false/.test(match)) {
        color = "#E8A33D";
      } else if (/null/.test(match)) {
        color = "#6E7180";
      }
      return `<span style="color:${color}">${match}</span>`;
    }
  );
}

function JSONTool() {
  const [raw, setRaw] = useState('{\n  "name": "toolkit",\n  "tools": 5,\n  "active": true\n}');
  const [error, setError] = useState("");
  const [formatted, setFormatted] = useState("");

  const format = () => {
    try {
      const parsed = JSON.parse(raw);
      setFormatted(JSON.stringify(parsed, null, 2));
      setError("");
    } catch (e) {
      setError(e.message);
      setFormatted("");
    }
  };

  useEffect(() => {
    format();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Panel
      eyebrow="04 / Structure"
      title="JSON formatter"
      description="Paste raw or minified JSON, get an indented, color-coded, validated result."
    >
      <Field label="Input">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={6}
          className="w-full resize-none rounded-md bg-[#23262F] border border-[#2E313C] px-4 py-3 font-mono text-[13px] text-[#F2F0EB] focus:outline-none focus:border-[#E8A33D]"
        />
      </Field>

      <button
        onClick={format}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#E8A33D] text-[#14151A] font-body text-sm font-medium hover:bg-[#f0b155] transition-colors"
      >
        Format & validate
      </button>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-md border border-[#E85D5D]/40 bg-[#E85D5D]/10 px-4 py-3">
          <AlertCircle size={16} className="text-[#E85D5D] mt-0.5 shrink-0" />
          <span className="font-mono text-xs text-[#E85D5D] leading-relaxed">{error}</span>
        </div>
      )}

      {formatted && (
        <>
          <div className="flex items-center justify-between mb-2">
            <label className="font-mono text-[11px] tracking-wider uppercase text-[#6E7180]">
              Result
            </label>
            <CopyButton value={formatted} />
          </div>
          <pre className="rounded-md bg-[#23262F] border border-[#2E313C] px-4 py-3 overflow-x-auto">
            <code
              className="font-mono text-[13px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightJSON(formatted) }}
            />
          </pre>
        </>
      )}
    </Panel>
  );
}

/* ---------- 5. POMODORO TIMER ---------- */

function PomodoroTool() {
  const WORK = 25 * 60;
  const BREAK = 5 * 60;
  const [mode, setMode] = useState("work");
  const [secondsLeft, setSecondsLeft] = useState(WORK);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const total = mode === "work" ? WORK : BREAK;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const switchMode = (m) => {
    setRunning(false);
    setMode(m);
    setSecondsLeft(m === "work" ? WORK : BREAK);
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(total);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const progress = 1 - secondsLeft / total;
  const offset = circumference * (1 - progress);

  return (
    <Panel
      eyebrow="05 / Focus"
      title="Focus timer"
      description="Classic 25/5 work-break cycle. Switch modes any time — the ring tracks progress."
    >
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => switchMode("work")}
          className={`px-4 py-2 rounded-md font-body text-sm border transition-colors ${
            mode === "work"
              ? "bg-[#E8A33D] text-[#14151A] border-[#E8A33D] font-medium"
              : "bg-[#23262F] text-[#ACAFBB] border-[#2E313C]"
          }`}
        >
          Work \u00b7 25m
        </button>
        <button
          onClick={() => switchMode("break")}
          className={`px-4 py-2 rounded-md font-body text-sm border transition-colors ${
            mode === "break"
              ? "bg-[#4FD1C5] text-[#14151A] border-[#4FD1C5] font-medium"
              : "bg-[#23262F] text-[#ACAFBB] border-[#2E313C]"
          }`}
        >
          Break \u00b7 5m
        </button>
      </div>

      <div className="flex flex-col items-center">
        <svg width="260" height="260" viewBox="0 0 260 260" className="mb-6">
          <circle cx="130" cy="130" r={radius} fill="none" stroke="#23262F" strokeWidth="14" />
          <circle
            cx="130"
            cy="130"
            r={radius}
            fill="none"
            stroke={mode === "work" ? "#E8A33D" : "#4FD1C5"}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 130 130)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
          <text
            x="130"
            y="140"
            textAnchor="middle"
            className="font-display"
            fontSize="46"
            fontWeight="700"
            fill="#F2F0EB"
          >
            {mins}:{secs}
          </text>
        </svg>

        <div className="flex gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
            disabled={secondsLeft === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#E8A33D] text-[#14151A] font-body text-sm font-medium hover:bg-[#f0b155] transition-colors disabled:opacity-40"
          >
            {running ? <Pause size={15} /> : <Play size={15} />}
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#23262F] border border-[#2E313C] text-[#F2F0EB] font-body text-sm hover:border-[#E8A33D]/50 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- LOADER ---------- */

function NinjaLoader({ onDone }) {
  const [pct, setPct] = useState(0);
  const [exiting, setExiting] = useState(false);
  const DURATION = 5000;

  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setPct(p);
      if (elapsed >= DURATION) {
        clearInterval(iv);
        setExiting(true);
        setTimeout(onDone, 500);
      }
    }, 40);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0B0C10] flex flex-col items-center justify-center overflow-hidden ${
        exiting ? "loader-fade-out" : ""
      }`}
    >
      {/* speed streaks */}
      <div className="absolute inset-0 pointer-events-none">
        {[20, 35, 50, 65, 80].map((top, i) => (
          <div
            key={i}
            className="absolute h-[2px] bg-[#4FD1C5]/40"
            style={{
              top: `${top}%`,
              left: "70%",
              width: "120px",
              animation: `streak 0.6s ease-out infinite`,
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>

      {/* runner track */}
      <div className="relative w-full h-40 mb-10">
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ animation: `runAcross ${DURATION}ms linear forwards` }}
        >
          {/* chakra orb in hand */}
          <div
            className="absolute -right-7 top-6 w-7 h-7 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, #4FD1C5, #14151A, #E8A33D, #14151A, #4FD1C5)",
              animation: "orbSpin 0.5s linear infinite, orbPulse 1s ease-in-out infinite",
            }}
          />
          {/* body */}
          <svg width="70" height="90" viewBox="0 0 70 90">
            {/* head */}
            <circle cx="35" cy="14" r="9" fill="#F2F0EB" />
            {/* headband */}
            <rect x="26" y="10" width="18" height="4" fill="#E8A33D" />
            <rect x="44" y="10" width="10" height="3" fill="#E8A33D" opacity="0.7" />
            {/* torso */}
            <rect x="27" y="24" width="16" height="30" rx="4" fill="#23262F" stroke="#4FD1C5" strokeWidth="1.5" />
            {/* back arm reaching to orb */}
            <g style={{ transformOrigin: "40px 28px", animation: "armSwing 0.4s ease-in-out infinite" }}>
              <rect x="39" y="26" width="22" height="6" rx="3" fill="#F2F0EB" />
            </g>
            {/* front arm */}
            <g style={{ transformOrigin: "30px 28px", animation: "armSwing 0.4s ease-in-out infinite reverse" }}>
              <rect x="10" y="26" width="20" height="6" rx="3" fill="#F2F0EB" />
            </g>
            {/* back leg */}
            <g style={{ transformOrigin: "35px 54px", animation: "legSwing 0.35s ease-in-out infinite" }}>
              <rect x="31" y="54" width="8" height="30" rx="3" fill="#1B1D24" stroke="#E8A33D" strokeWidth="1.2" />
            </g>
            {/* front leg */}
            <g style={{ transformOrigin: "35px 54px", animation: "legSwing 0.35s ease-in-out infinite reverse" }}>
              <rect x="31" y="54" width="8" height="30" rx="3" fill="#23262F" stroke="#E8A33D" strokeWidth="1.2" />
            </g>
          </svg>
        </div>
      </div>

      <div className="w-64">
        <div className="flex justify-between mb-2">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#4FD1C5]">
            Molding chakra
          </span>
          <span className="font-mono text-[11px] text-[#E8A33D]">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#23262F] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4FD1C5] to-[#E8A33D] rounded-full"
            style={{ width: `${pct}%`, transition: "width 0.04s linear" }}
          />
        </div>
      </div>
      <p className="font-display text-xl font-semibold text-[#F2F0EB] mt-6 tracking-tight">
        Toolkit
      </p>
    </div>
  );
}

/* ---------- APP SHELL ---------- */

export default function Toolkit() {
  const [active, setActive] = useState("qr");
  const [loading, setLoading] = useState(true);

  const renderTool = () => {
    switch (active) {
      case "qr":
        return <QRTool />;
      case "password":
        return <PasswordTool />;
      case "units":
        return <UnitTool />;
      case "json":
        return <JSONTool />;
      case "pomodoro":
        return <PomodoroTool />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#14151A] font-body flex flex-col md:flex-row">
      <style>{FONTS}</style>

      {loading && <NinjaLoader onDone={() => setLoading(false)} />}

      {/* Sidebar / drawer rail */}
      <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-[#2E313C] bg-[#1B1D24]">
        <div className="px-5 py-6 border-b border-[#2E313C]">
          <h1 className="font-display text-xl font-semibold text-[#F2F0EB] tracking-tight">
            Toolkit
          </h1>
          <p className="font-mono text-[11px] text-[#6E7180] mt-1">5 drawers, always open</p>
        </div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`drawer-tab ${isActive ? "active" : ""} flex items-center gap-3 px-5 py-4 text-left shrink-0 md:w-full border-r md:border-r-0 border-[#2E313C] transition-colors ${
                  isActive ? "bg-[#23262F]" : "hover:bg-[#1F212A]"
                }`}
              >
                <Icon size={18} className={isActive ? "text-[#E8A33D]" : "text-[#6E7180]"} />
                <span className="min-w-[110px]">
                  <span
                    className={`block font-body text-sm ${
                      isActive ? "text-[#F2F0EB] font-medium" : "text-[#ACAFBB]"
                    }`}
                  >
                    {t.label}
                  </span>
                  <span className="hidden md:block font-mono text-[10px] text-[#6E7180] mt-0.5">
                    {t.sub}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-6 py-10 sm:px-10 md:px-14 md:py-14">{renderTool()}</main>
    </div>
  );
}
