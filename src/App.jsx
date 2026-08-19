import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Calculator,
  ListChecks,
  StickyNote,
  HeartPulse,
  Cake,
  Timer,
  Plus,
  Trash2,
  Check,
  Play,
  Pause,
  RotateCcw,
  Flag,
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS — night ocean
   sky-deep     #04141C   background top
   sea-deep     #0B3552   background bottom / wave far layer
   sea-mid      #0E4A6E   wave mid layer
   sea-near     #146C93   wave near layer
   foam         #EAF6F7   text-hi / foam highlights
   text-mid     #8FB4C2
   text-low     #4F7186
   accent-cyan  #35C7E8   primary accent
   accent-moon  #FFD98A   secondary accent — used sparingly
   glass        rgba(255,255,255,0.06) surfaces, border rgba(255,255,255,0.14)
--------------------------------------------------------- */

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
.font-display { font-family: 'Space Grotesk', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
.font-mono { font-family: 'JetBrains Mono', monospace; }

::selection { background: #35C7E8; color: #04141C; }

/* ---- waves ---- */
@keyframes waveDrift {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.wave-layer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 100%;
  animation: waveDrift linear infinite;
}
@keyframes glow {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 0.9; }
}
.moon-glow { animation: glow 5s ease-in-out infinite; }

/* ---- touch splash ---- */
.splash-ring {
  position: absolute;
  width: 14px; height: 14px;
  left: 0; top: 0;
  border-radius: 50%;
  border: 2px solid rgba(234,246,247,0.7);
  background: radial-gradient(circle, rgba(53,199,232,0.35), rgba(53,199,232,0.05) 60%, transparent 72%);
  transform: translate(-50%, -50%) scale(1);
  animation: ringExpand 750ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.splash-ring.delay { animation-delay: 90ms; opacity: 0.7; }
@keyframes ringExpand {
  0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0.75; }
  100% { transform: translate(-50%, -50%) scale(9); opacity: 0; }
}
.droplet {
  position: absolute;
  left: 0; top: 0;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #EAF6F7;
  box-shadow: 0 0 6px 1px rgba(53,199,232,0.6);
  animation: dropletFly 650ms cubic-bezier(0.22, 0.9, 0.4, 1) forwards;
}
@keyframes dropletFly {
  0%   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.2); opacity: 0; }
}

/* ---- glass surfaces ---- */
.glass {
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.14);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.glass-solid {
  background: rgba(8,32,46,0.55);
  border: 1px solid rgba(255,255,255,0.14);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

/* ---- tool-switch transition ---- */
.tool-enter { animation: toolIn 420ms cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes toolIn {
  0%   { opacity: 0; transform: translateY(10px); filter: blur(4px); }
  100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}

button, select, input, textarea { transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1); }
input[type="range"] { -webkit-appearance: none; height: 4px; border-radius: 999px; background: rgba(255,255,255,0.15); }
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
  background: #35C7E8; cursor: pointer; border: 2px solid #04141C;
}
input[type="checkbox"] { accent-color: #35C7E8; }

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`;

/* ---------- ocean background ---------- */

function WaveBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{
      background: "linear-gradient(180deg, #04141C 0%, #06202E 45%, #0B3552 100%)"
    }}>
      <div
        className="moon-glow absolute rounded-full"
        style={{
          top: "8%", right: "12%", width: 90, height: 90,
          background: "radial-gradient(circle, rgba(255,217,138,0.9), rgba(255,217,138,0.15) 60%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />
      <svg className="wave-layer" style={{ animationDuration: "22s", opacity: 0.35 }} viewBox="0 0 2400 300" preserveAspectRatio="none">
        <path d="M0,150 C300,220 600,80 900,150 C1200,220 1500,80 1800,150 C2100,220 2400,80 2400,150 L2400,300 L0,300 Z" fill="#0E4A6E" />
      </svg>
      <svg className="wave-layer" style={{ animationDuration: "16s", animationDirection: "reverse", opacity: 0.5 }} viewBox="0 0 2400 300" preserveAspectRatio="none">
        <path d="M0,180 C300,120 600,240 900,180 C1200,120 1500,240 1800,180 C2100,120 2400,240 2400,180 L2400,300 L0,300 Z" fill="#146C93" />
      </svg>
      <svg className="wave-layer" style={{ animationDuration: "11s", opacity: 0.75 }} viewBox="0 0 2400 300" preserveAspectRatio="none">
        <path d="M0,210 C300,260 600,170 900,210 C1200,260 1500,170 1800,210 C2100,260 2400,170 2400,210 L2400,300 L0,300 Z" fill="#1A87B3" />
      </svg>
    </div>
  );
}

/* ---------- touch splash layer ---------- */

function SplashLayer() {
  const [splashes, setSplashes] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    const handler = (e) => {
      const point = e.touches ? e.touches[0] : e;
      const x = point.clientX;
      const y = point.clientY;
      const id = idRef.current++;
      const droplets = Array.from({ length: 6 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
        const dist = 24 + Math.random() * 26;
        return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist - 10, key: i };
      });
      setSplashes((s) => [...s, { id, x, y, droplets }]);
      setTimeout(() => setSplashes((s) => s.filter((sp) => sp.id !== id)), 800);
    };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      {splashes.map((sp) => (
        <div key={sp.id}>
          <span className="splash-ring" style={{ left: sp.x, top: sp.y }} />
          <span className="splash-ring delay" style={{ left: sp.x, top: sp.y }} />
          {sp.droplets.map((d) => (
            <span
              key={d.key}
              className="droplet"
              style={{ left: sp.x, top: sp.y, "--dx": `${d.dx}px`, "--dy": `${d.dy}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- shared bits ---------- */

const TOOLS = [
  { id: "calc", label: "Calculator", sub: "Everyday arithmetic", icon: Calculator },
  { id: "todo", label: "To-Do List", sub: "Saved automatically", icon: ListChecks },
  { id: "notes", label: "Quick Notes", sub: "Autosaves as you type", icon: StickyNote },
  { id: "bmi", label: "BMI Check", sub: "Height & weight", icon: HeartPulse },
  { id: "age", label: "Age Calculator", sub: "From a birthdate", icon: Cake },
  { id: "stopwatch", label: "Stopwatch", sub: "With lap times", icon: Timer },
];

function Panel({ eyebrow, title, description, children }) {
  return (
    <div className="max-w-2xl">
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#35C7E8]">
        {eyebrow}
      </span>
      <h2 className="font-display text-3xl font-semibold text-[#EAF6F7] mt-2 mb-2">{title}</h2>
      <p className="font-body text-sm text-[#8FB4C2] mb-8 leading-relaxed">{description}</p>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-5">
      <label className="block font-mono text-[11px] tracking-wider uppercase text-[#4F7186] mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ---------- 1. CALCULATOR ---------- */

function CalculatorTool() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);

  const inputDigit = (d) => {
    if (fresh || display === "0") {
      setDisplay(d);
      setFresh(false);
    } else {
      setDisplay(display + d);
    }
  };
  const inputDot = () => {
    if (fresh) { setDisplay("0."); setFresh(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  };
  const clearAll = () => { setDisplay("0"); setPrev(null); setOp(null); setFresh(true); };

  const compute = (a, b, operator) => {
    switch (operator) {
      case "+": return a + b;
      case "\u2212": return a - b;
      case "\u00d7": return a * b;
      case "\u00f7": return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const chooseOp = (operator) => {
    const current = parseFloat(display);
    if (prev !== null && op && !fresh) {
      const result = compute(prev, current, op);
      setPrev(result);
      setDisplay(String(Number.isFinite(result) ? +result.toFixed(8) : "Error"));
    } else {
      setPrev(current);
    }
    setOp(operator);
    setFresh(true);
  };

  const equals = () => {
    if (op === null || prev === null) return;
    const current = parseFloat(display);
    const result = compute(prev, current, op);
    setDisplay(String(Number.isFinite(result) ? +result.toFixed(8) : "Error"));
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const btn = (label, onClick, extra = "") => (
    <button
      onClick={onClick}
      className={`h-14 rounded-xl font-display text-lg font-medium text-[#EAF6F7] active:scale-95 ${extra}`}
    >
      {label}
    </button>
  );

  return (
    <Panel eyebrow="01 / Compute" title="Calculator" description="Everyday arithmetic — clean and quick, no ads or clutter.">
      <div className="glass rounded-2xl p-5 max-w-sm">
        <div className="text-right font-mono text-4xl text-[#EAF6F7] py-6 px-2 truncate">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {btn("C", clearAll, "bg-white/10 hover:bg-white/15")}
          {btn("\u00f7", () => chooseOp("\u00f7"), "bg-white/10 hover:bg-white/15 text-[#35C7E8]")}
          {btn("\u00d7", () => chooseOp("\u00d7"), "bg-white/10 hover:bg-white/15 text-[#35C7E8]")}
          {btn("\u2212", () => chooseOp("\u2212"), "bg-white/10 hover:bg-white/15 text-[#35C7E8]")}

          {["7","8","9"].map((d) => btn(d, () => inputDigit(d), "bg-white/5 hover:bg-white/10"))}
          {btn("+", () => chooseOp("+"), "bg-white/10 hover:bg-white/15 text-[#35C7E8] row-span-2 h-full")}

          {["4","5","6"].map((d) => btn(d, () => inputDigit(d), "bg-white/5 hover:bg-white/10"))}

          {["1","2","3"].map((d) => btn(d, () => inputDigit(d), "bg-white/5 hover:bg-white/10"))}
          {btn("=", equals, "bg-[#35C7E8] text-[#04141C] row-span-2 h-full")}

          {btn("0", () => inputDigit("0"), "bg-white/5 hover:bg-white/10 col-span-2")}
          {btn(".", inputDot, "bg-white/5 hover:bg-white/10")}
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 2. TO-DO LIST (persisted) ---------- */

function TodoTool() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("toolkit:todos", false);
        setTodos(res ? JSON.parse(res.value) : []);
      } catch {
        setTodos([]);
      }
      setReady(true);
    })();
  }, []);

  const persist = async (next) => {
    setTodos(next);
    try {
      await window.storage.set("toolkit:todos", JSON.stringify(next), false);
    } catch {}
  };

  const add = () => {
    if (!text.trim()) return;
    persist([...todos, { id: Date.now(), text: text.trim(), done: false }]);
    setText("");
  };
  const toggle = (id) => persist(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => persist(todos.filter((t) => t.id !== id));

  return (
    <Panel eyebrow="02 / Organize" title="To-do list" description="Add tasks, check them off — saved automatically so they're here next time you open this.">
      <div className="flex gap-2 mb-6">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task..."
          className="flex-1 rounded-xl glass px-4 py-3 font-body text-sm text-[#EAF6F7] placeholder-[#4F7186] focus:outline-none"
        />
        <button onClick={add} className="rounded-xl px-4 bg-[#35C7E8] text-[#04141C] flex items-center justify-center">
          <Plus size={20} />
        </button>
      </div>

      {!ready ? (
        <p className="font-mono text-xs text-[#4F7186]">Loading...</p>
      ) : todos.length === 0 ? (
        <p className="font-mono text-xs text-[#4F7186]">No tasks yet — add your first one above.</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((t) => (
            <li key={t.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => toggle(t.id)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                  t.done ? "bg-[#35C7E8] border-[#35C7E8]" : "border-[#4F7186]"
                }`}
              >
                {t.done && <Check size={13} className="text-[#04141C]" />}
              </button>
              <span className={`flex-1 font-body text-sm ${t.done ? "line-through text-[#4F7186]" : "text-[#EAF6F7]"}`}>
                {t.text}
              </span>
              <button onClick={() => remove(t.id)} className="text-[#4F7186] hover:text-[#EAF6F7]">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ---------- 3. QUICK NOTES (persisted) ---------- */

function NotesTool() {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | saved
  const timeoutRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("toolkit:notes", false);
        if (res) setNote(res.value);
      } catch {}
    })();
  }, []);

  const onChange = (val) => {
    setNote(val);
    setStatus("saving");
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        await window.storage.set("toolkit:notes", val, false);
        setStatus("saved");
      } catch {
        setStatus("idle");
      }
    }, 500);
  };

  return (
    <Panel eyebrow="03 / Capture" title="Quick notes" description="One open note, always here. Stops autosaving 500ms after you pause typing.">
      <textarea
        value={note}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        placeholder="Start typing..."
        className="w-full resize-none rounded-xl glass px-4 py-3 font-body text-sm text-[#EAF6F7] placeholder-[#4F7186] focus:outline-none"
      />
      <p className="font-mono text-[11px] text-[#4F7186] mt-2">
        {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "\u00a0"}
      </p>
    </Panel>
  );
}

/* ---------- 4. BMI CALCULATOR ---------- */

function BMITool() {
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("65");

  const { bmi, label, color } = useMemo(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w) return { bmi: null, label: "", color: "" };
    const val = w / (h * h);
    let label, color;
    if (val < 18.5) { label = "Underweight"; color = "#FFD98A"; }
    else if (val < 25) { label = "Healthy range"; color = "#35C7E8"; }
    else if (val < 30) { label = "Overweight"; color = "#FFD98A"; }
    else { label = "Obese range"; color = "#F08A6C"; }
    return { bmi: val.toFixed(1), label, color };
  }, [height, weight]);

  return (
    <Panel eyebrow="04 / Health" title="BMI calculator" description="A rough screening number from height and weight — not a diagnosis, just a starting reference point.">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Field label="Height (cm)">
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full rounded-xl glass px-4 py-3 font-mono text-sm text-[#EAF6F7] focus:outline-none"
          />
        </Field>
        <Field label="Weight (kg)">
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-xl glass px-4 py-3 font-mono text-sm text-[#EAF6F7] focus:outline-none"
          />
        </Field>
      </div>

      <div className="glass rounded-2xl p-6 text-center">
        <div className="font-display text-5xl font-semibold" style={{ color: color || "#EAF6F7" }}>
          {bmi || "\u2014"}
        </div>
        <div className="font-mono text-xs uppercase tracking-wide text-[#8FB4C2] mt-2">
          {label || "Enter height & weight"}
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 5. AGE CALCULATOR ---------- */

function AgeTool() {
  const [dob, setDob] = useState("2000-01-01");

  const result = useMemo(() => {
    const birth = new Date(dob);
    if (isNaN(birth)) return null;
    const now = new Date();
    if (birth > now) return null;

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) {
      months -= 1;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += lastMonth;
    }
    if (months < 0) { months += 12; years -= 1; }

    let next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    const daysToNext = Math.ceil((next - now) / 86400000);

    return { years, months, days, daysToNext };
  }, [dob]);

  return (
    <Panel eyebrow="05 / Time" title="Age calculator" description="Pick a birthdate — get the exact age, and a countdown to the next birthday.">
      <Field label="Birthdate">
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="w-full rounded-xl glass px-4 py-3 font-mono text-sm text-[#EAF6F7] focus:outline-none"
        />
      </Field>

      {result ? (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[["Years", result.years], ["Months", result.months], ["Days", result.days]].map(([l, v]) => (
            <div key={l} className="glass rounded-xl p-4 text-center">
              <div className="font-display text-3xl font-semibold text-[#35C7E8]">{v}</div>
              <div className="font-mono text-[10px] uppercase tracking-wide text-[#4F7186] mt-1">{l}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-mono text-xs text-[#4F7186] mb-4">Pick a valid past date.</p>
      )}

      {result && (
        <p className="font-body text-sm text-[#8FB4C2]">
          {result.daysToNext === 0 ? "Birthday is today \u2014 happy birthday!" : `${result.daysToNext} day${result.daysToNext === 1 ? "" : "s"} until the next birthday.`}
        </p>
      )}
    </Panel>
  );
}

/* ---------- 6. STOPWATCH ---------- */

function formatMs(ms) {
  const mins = String(Math.floor(ms / 60000)).padStart(2, "0");
  const secs = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, "0");
  return `${mins}:${secs}.${cs}`;
}

function StopwatchTool() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const startRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsed;
    const tick = () => {
      setElapsed(Date.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => { setRunning(false); setElapsed(0); setLaps([]); };
  const lap = () => setLaps((l) => [formatMs(elapsed), ...l]);

  return (
    <Panel eyebrow="06 / Track" title="Stopwatch" description="Start, lap, and reset — millisecond precision for timing anything.">
      <div className="glass rounded-2xl p-8 text-center mb-6">
        <div className="font-mono text-5xl text-[#EAF6F7] tabular-nums">{formatMs(elapsed)}</div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#35C7E8] text-[#04141C] font-body text-sm font-medium"
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={lap}
          disabled={!running}
          className="inline-flex items-center justify-center gap-2 px-4 rounded-xl glass text-[#EAF6F7] disabled:opacity-30"
        >
          <Flag size={16} />
        </button>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-4 rounded-xl glass text-[#EAF6F7]"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {laps.length > 0 && (
        <ul className="space-y-1.5">
          {laps.map((l, i) => (
            <li key={i} className="glass rounded-lg px-4 py-2 flex justify-between font-mono text-xs text-[#8FB4C2]">
              <span>Lap {laps.length - i}</span>
              <span className="text-[#EAF6F7]">{l}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ---------- APP SHELL ---------- */

export default function Toolkit() {
  const [active, setActive] = useState("calc");

  const renderTool = () => {
    switch (active) {
      case "calc": return <CalculatorTool />;
      case "todo": return <TodoTool />;
      case "notes": return <NotesTool />;
      case "bmi": return <BMITool />;
      case "age": return <AgeTool />;
      case "stopwatch": return <StopwatchTool />;
      default: return null;
    }
  };

  return (
    <div className="relative min-h-screen font-body flex flex-col md:flex-row">
      <style>{FONTS}</style>
      <WaveBackground />
      <SplashLayer />

      <aside className="relative z-10 w-full md:w-64 shrink-0 glass-solid md:min-h-screen">
        <div className="px-5 py-6 border-b border-white/10">
          <h1 className="font-display text-xl font-semibold text-[#EAF6F7] tracking-tight">Toolkit</h1>
          <p className="font-mono text-[11px] text-[#4F7186] mt-1">tap anywhere \u2014 watch it ripple</p>
        </div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`relative flex items-center gap-3 px-5 py-4 text-left shrink-0 md:w-full border-r md:border-r-0 border-white/10 ${
                  isActive ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <span className="hidden md:block absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#35C7E8]" />
                )}
                <Icon size={18} className={isActive ? "text-[#35C7E8]" : "text-[#4F7186]"} />
                <span className="min-w-[110px]">
                  <span className={`block font-body text-sm ${isActive ? "text-[#EAF6F7] font-medium" : "text-[#8FB4C2]"}`}>
                    {t.label}
                  </span>
                  <span className="hidden md:block font-mono text-[10px] text-[#4F7186] mt-0.5">{t.sub}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="relative z-10 flex-1 px-6 py-10 sm:px-10 md:px-14 md:py-14">
        <div key={active} className="tool-enter">{renderTool()}</div>
      </main>
    </div>
  );
}

