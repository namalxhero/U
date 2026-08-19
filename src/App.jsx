import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Play, Pause, Rocket, ArrowLeft, Sparkles } from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS — "අහස් ගුවන" (deep-field voyage)
   void        #030308   background base
   nebula      #170F2E   nebula haze mid
   ion         #7B5CFF   primary accent (engine glow / UI)
   solar-gold  #FFB454   sun / warm highlight
   text-hi     #F3EFFF
   text-mid    #9C8FC0
--------------------------------------------------------- */

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
.font-display { font-family: 'Orbitron', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
.font-mono { font-family: 'JetBrains Mono', monospace; }
::selection { background: #7B5CFF; color: #030308; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes spinRev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
@keyframes twinkle { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
@keyframes pulseGlow { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
@keyframes rotTexture { from { background-position: 0% center; } to { background-position: -200% center; } }
@keyframes panSky { from { background-position: 0% 50%; } to { background-position: -100% 50%; } }
@keyframes warpLine {
  0% { transform: scaleX(0.05) translateX(0); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: scaleX(1.4) translateX(0); opacity: 0; }
}
@keyframes warpFlash { 0% { opacity: 0; } 40% { opacity: 1; } 100% { opacity: 0; } }
@keyframes riseIn { 0% { opacity: 0; transform: translateY(14px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes ringRotate { from { transform: rotateX(74deg) rotate(0deg); } to { transform: rotateX(74deg) rotate(360deg); } }
@keyframes accretion { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes factFade { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }

.rise-in { animation: riseIn 480ms cubic-bezier(0.22,1,0.36,1) both; }
.fact-fade { animation: factFade 420ms ease both; }
.glass { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
.glass-strong { background: rgba(10,6,24,0.72); border: 1px solid rgba(255,255,255,0.14); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
button { transition: all 200ms cubic-bezier(0.22,1,0.36,1); }
@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
`;

/* real NASA-derived texture maps (Solar System Scope, CC BY 4.0) */
const TEX = {
  milkyway: "https://www.solarsystemscope.com/textures/download/2k_stars_milky_way.jpg",
  sun: "https://www.solarsystemscope.com/textures/download/2k_sun.jpg",
  budha: "https://www.solarsystemscope.com/textures/download/2k_mercury.jpg",
  sikuru: "https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg",
  earth: "https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg",
  angaharu: "https://www.solarsystemscope.com/textures/download/2k_mars.jpg",
  guru: "https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg",
  manda: "https://www.solarsystemscope.com/textures/download/2k_saturn.jpg",
  ring: "https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png",
};

/* ---------------------------------------------------------
   DATA — full tour, ~75s per body × 8 bodies ≈ 10 minutes
--------------------------------------------------------- */

const BODIES = [
  {
    id: "sun", name: "ඉර", en: "Sun", kind: "star", tex: TEX.sun,
    color: "#FFB454", glow: "#FFD98A", size: 30, orbitRadius: 0, orbitDuration: 0,
    intro: "අපේ සූර්ය මණ්ඩලයේ හදවත — සියලුම ග්‍රහලෝක ගුරුත්වාකර්ෂණයෙන් වට කරගෙන ඉන්න ප්ලාස්මා තරුව.",
    facts: [
      "ඉරේ මතුපිට උෂ්ණත්වය සෙන්ටිග්‍රේඩ් අංශක 5,500ක් විතර, ඒත් හරය අභ්‍යන්තරයේ අංශක මිලියන 15කට ආසන්නයි.",
      "පෘථිවියෙන් මිලියන 1.3ක් ඇතුළත් වෙන්න පුළුවන් තරම් ඉර විශාලයි — විෂ්කම්භය කිලෝමීටර් 1.39 මිලියනක්.",
      "ඉරෙන් එළියක් ආලෝකයේ වේගයෙන් පෘථිවියට එන්න විනාඩි 8යි තත්පර 20ක් ගතවෙනවා.",
      "ඉර ප්‍රධාන වශයෙන් හයිඩ්‍රජන් (74%) සහ හීලියම් (24%) වායුවලින් සැදුණු බෝලයක්.",
      "සූර්ය මණ්ඩලයේ මුළු ස්කන්ධයෙන් 99.86%ක්ම ඉරේ තියෙනවා — ඉතුරු හැම දේම (ග්‍රහලෝක ඇතුළුව) 0.14%යි.",
      "ඉර හරයේ hydrogen, helium බවට fusion වෙන reaction එකෙන් තමයි ශක්තිය හැදෙන්නේ — තප්පරයට hydrogen ටොන් මිලියන 600ක් fuse වෙනවා.",
    ],
  },
  {
    id: "budha", name: "බුධ", en: "Mercury", kind: "planet", tex: TEX.budha,
    color: "#B7ADA1", glow: "#D8CFC2", size: 10, orbitRadius: 88, orbitDuration: 10,
    intro: "ඉරට ළඟම ග්‍රහලෝකය — වායු ගෝලයක්ම නැති, වේගවත්ම කක්ෂ ගමන ඇති කුඩා ලෝකය.",
    facts: [
      "බුධ දවසක් (එක් භ්‍රමණයක්) පෘථිවි දින 59කට සමානයි, නමුත් වසරක් දින 88ක් විතරයි.",
      "වායු ගෝලයක් නැති නිසා දහවල් 430°C, රෑ -180°C දක්වා උෂ්ණත්වය දරුණු ලෙස වෙනස් වෙනවා.",
      "සූර්ය මණ්ඩලයේ අඩුම කක්ෂ කාලය තියෙන්නේ බුධට — ඉර වටේ තප්පරයට කි.මී 47කින් සැරිසරනවා.",
      "බුධ පෘථිවි චන්ද්‍රයාට වඩා ටිකක් විශාල පමණයි, ග්‍රහයන් අතරින් දෙවෙනියට කුඩාම.",
      "බුධට චන්ද්‍රයෙක් හෝ වළල්ලක් නෑ.",
      "බුධගේ core එක එහි විෂ්කම්භයෙන් 85%ක්ම ගන්නවා — යකඩෙන් සැදුණු ලොකුම core එක සූර්ය මණ්ඩලයේ.",
    ],
  },
  {
    id: "sikuru", name: "සිකුරු", en: "Venus", kind: "planet", tex: TEX.sikuru,
    color: "#E8C79A", glow: "#F5DDA8", size: 14, orbitRadius: 126, orbitDuration: 16,
    intro: "රාත්‍රී අහසේ දිලිසෙන දෙවන ලාවන්‍ය වස්තුව — ඝන කාබන් ඩයොක්සයිඩ් වලාකුළු තට්ටුවක් යට රත් වෙච්ච නිර්දය ලෝකයක්.",
    facts: [
      "සූර්ය මණ්ඩලයේ උණුසුම්ම ග්‍රහලෝකය සිකුරු — මතුපිට 465°C විතර, ඊයම් පවා දියවෙනවා.",
      "සිකුරු භ්‍රමණය වෙන්නේ අනිත් බොහෝ ග්‍රහලෝකවලට වඩා පිටිපස්සට (retrograde rotation).",
      "සිකුරු දවසක් (භ්‍රමණයක් - දින 243) එහි වසරකට (දින 225) වඩා දිගයි.",
      "ඝන කාබන් ඩයොක්සයිඩ් වායු ගෝලයක් extreme greenhouse effect එකක් ඇති කරනවා.",
      "ප්‍රමාණයෙන් සහ ස්කන්ධයෙන් පෘථිවියට ළඟින්ම සම වගේ නිසා 'පෘථිවියේ නිවුන් සහෝදරිය' කියලා කියනවා.",
      "සිකුරුගේ වායුගෝලයේ pressure එක පෘථිවියේ 92 ගුණයක් — ගැඹුරු මුහුදක ඉන්නවා වගේ.",
    ],
  },
  {
    id: "earth", name: "පෘථිවි", en: "Earth", kind: "planet", tex: TEX.earth,
    color: "#3D7EA6", glow: "#8FD3F5", size: 15, orbitRadius: 168, orbitDuration: 21,
    intro: "අපේ නිවහන — ජීවය තියෙන බව දන්න එකම ලෝකය, ද්‍රව ජලයෙන් 71%ක්ම වැසිලා.",
    facts: [
      "පෘථිවියේ 71%ක්ම වතුරෙන් වැසිලා — ඒත් ජලයෙන් 97%ක්ම ලුණු මුහුදුයි.",
      "එකම ස්වභාවික චන්ද්‍රයෙක් ඉන්නවා, ඒක තමයි වඩිසාරවල් සහ දින දිග ස්ථාවර කරන්නේ.",
      "වායුගෝලයේ ඔක්සිජන් 21%ක් තියෙන්නේ ශතකෝටි ගණනක් ජීවීන්ගේ ක්‍රියාකාරකම නිසා.",
      "පෘථිවියේ magnetic field එක සූර්ය සුළඟෙන් ආරක්ෂාව දෙනවා.",
      "දන්නා විදියට විශ්වයේ ජීවය තියෙන එකම ග්‍රහලෝකය පෘථිවියි.",
      "පෘථිවි වයස අවුරුදු බිලියන 4.5ක් විතර.",
    ],
  },
  {
    id: "angaharu", name: "අඟහරු", en: "Mars", kind: "planet", tex: TEX.angaharu,
    color: "#C1502E", glow: "#FF8A5B", size: 12, orbitRadius: 208, orbitDuration: 27,
    intro: "රතු ග්‍රහලෝකය — යකඩ ඔක්සයිඩ් දූවිල්ලෙන් වැසිලා, අනාගත මිනිස් ගවේෂණයේ ප්‍රධාන ඉලක්කය.",
    facts: [
      "අඟහරු රතුපාට පේන්නේ එහි පස වල යකඩ මාරුවෙච්ච (iron oxide / rust) නිසා.",
      "සූර්ය මණ්ඩලයේ ලොකුම ගිනිකඳු Olympus Mons තියෙන්නේ අඟහරුයි — උස කි.මී 22ක්, එවරස්ට් කන්දට වඩා තුන් ගුණයක්.",
      "අඟහරුට චන්ද්‍රයන් දෙන්නෙක් — Phobos සහ Deimos, දෙකම කුඩායි, අහුවුණු ග්‍රහක වගේ පේනවා.",
      "අඟහරු දවසක් පෘථිවියේ පැයකට ආසන්නයි (පැය 24, විනාඩි 37).",
      "අතීතයේ අඟහරු මතුපිටින් ජලය ගලා ගිය ගංගා මාර්ග වගේ සලකුණු තියෙනවා.",
      "NASA, ESA ඇතුළු ආයතන ගණනාවක් රොබෝ rover යවලා අඟහරු continuous ලෙස study කරනවා.",
    ],
  },
  {
    id: "guru", name: "ගුරු", en: "Jupiter", kind: "planet", tex: TEX.guru,
    color: "#D9A66C", glow: "#F0C98A", size: 26, orbitRadius: 268, orbitDuration: 34,
    intro: "සූර්ය මණ්ඩලයේ රජා — අනිත් සියලුම ග්‍රහලෝක එකට එකතු කළත් ගුරුට වඩා කුඩායි.",
    facts: [
      "ගුරු වායුමය බලපරාක්‍රමයක් — ප්‍රධාන වශයෙන් හයිඩ්‍රජන් සහ හීලියම්, ඝන මතුපිටක් නෑ.",
      "ශතවර්ෂ ගණනාවක් තිස්සේ දිගටම හමන Great Red Spot කුණාටුවක් තියෙනවා — පෘථිවියට වඩා විශාලයි.",
      "ගුරුට දන්නා චන්ද්‍රයන් 90කට වඩා ඉන්නවා — Ganymede සූර්ය මණ්ඩලයේ ලොකුම චන්ද්‍රයා (බුධටත් වඩා ලොකුයි).",
      "ගුරු දවසක් පැය 10ක් විතරයි — ග්‍රහලෝක අතරින් වේගවත්ම භ්‍රමණය.",
      "ගුරුගේ ප්‍රබල ගුරුත්වාකර්ෂණය, පෘථිවියට එන ග්‍රහක සහ වල්ගාතරු බොහොමයක් 'shield' එකක් වගේ වළක්වනවා.",
      "ගුරුටත් සිහින් වළල්ලක් තියෙනවා, ඒත් සෙනසුරුගේ වගේ පේන්නේ නෑ — දූවිලි වගේ සියුම්.",
    ],
  },
  {
    id: "manda", name: "සෙනසුරු", en: "Saturn", kind: "planet", tex: TEX.manda, hasRing: true,
    color: "#E3CB9A", glow: "#F5E3B5", size: 24, orbitRadius: 328, orbitDuration: 48,
    intro: "වළල්ලෙන් හඳුනාගන්නා ලාවන්‍ය ග්‍රහලෝකය — අයිස් සහ ගල් කැබලිවලින් සැදුණු වළල්ල පුදුමයක්.",
    facts: [
      "සෙනසුරුගේ වළල්ල හැදිලා තියෙන්නේ අයිස් සහ ගල් කැබලි කෝටි ගණනකින්.",
      "සෙනසුරුගේ සාමාන්‍ය ඝනත්වය ජලයට වඩා අඩුයි — ලොකු වතුර තටාකයක දැම්මොත් ඒක පාවෙනවා!",
      "සෙනසුරුට තහවුරු කළ චන්ද්‍රයන් 140කට වඩා තියෙනවා, Titan ඒ අතරින් විශාලම — තමන්ගේම dense atmosphere එකක් තියෙනවා.",
      "වළල්ලේ පළල කිලෝමීටර් ලක්ෂ ගණනක් වුණත්, බොහෝ තැන ඝනකම මීටර් 10ට වඩා අඩුයි.",
      "සෙනසුරු වසරක් පෘථිවි වසර 29කට සමානයි — කක්ෂය ලොකු නිසා.",
      "සෙනසුරුගේ hexagonal (හය-කෝණ) කුණාටුවක් උතුරු ධ්‍රැවයේ දිගටම ගමන් කරනවා.",
    ],
  },
  {
    id: "blackhole", name: "කළු කුහරය", en: "Black Hole", kind: "blackhole",
    color: "#0B0714", glow: "#FF7A3D", size: 20, orbitRadius: 390, orbitDuration: 70,
    intro: "අභ්‍යවකාශයේ අන්ධකාරම රහස — ආලෝකයට වත් පැනීමට බැරි තරම් ගුරුත්වාකර්ෂණයක් තියෙන ස්ථානයක්.",
    facts: [
      "කළු කුහරයක ගුරුත්වාකර්ෂණය ඉතාම ප්‍රබලයි — ආලෝකයට වත් රැකගන්න බැහැ, ඒක නිසාම 'කළු' පේනවා.",
      "එදිරි ක්ෂිතිජය (event horizon) කියන්නේ ආපහු එන්න බැරි සීමාව — ඒක overpass කළාම ආපහු යන්න විදිහක් නෑ.",
      "ලොකු තරු මිය ගිහින් තමන්ම ගුරුත්වාකර්ෂණයෙන් කඩාවැටෙන (supernova collapse) කොට තමයි stellar-mass කළු කුහර හැදෙන්නේ.",
      "සමහර දක්ෂතාරකා පද්ධති මධ්‍යයේ තියෙන්නේ සූර්යයාට වඩා මිලියන/බිලියන ගණනක් ගුණයක් බර 'supermassive' කළු කුහර.",
      "අපේ Milky Way ගැලැක්සියේ මධ්‍යයේ තියෙන්නේ Sagittarius A* කියන supermassive black hole එකක්.",
      "2019දී Event Horizon Telescope එකෙන් මිනිසුන් මුල් වතාවට කළු කුහරයක සත්‍ය ඡායාරූපයක් ගත්තා.",
    ],
  },
];

/* ---------------------------------------------------------
   Starfield + milky-way backdrop
--------------------------------------------------------- */

function useStars(count, seed) {
  return useMemo(() => {
    let s = seed;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    return Array.from({ length: count }).map((_, i) => ({
      id: i, x: rand() * 100, y: rand() * 100,
      size: 0.6 + rand() * 1.8, delay: rand() * 4, dur: 2 + rand() * 3,
    }));
  }, [count, seed]);
}

function StarField({ dense = false, milky = false }) {
  const stars = useStars(dense ? 150 : 85, dense ? 7 : 3);
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "#030308" }}>
      {milky && (
        <div className="absolute inset-0 opacity-[0.38]" style={{
          backgroundImage: `url(${TEX.milkyway})`,
          backgroundSize: "220% 100%",
          backgroundRepeat: "repeat-x",
          filter: "saturate(1.1) brightness(0.85)",
          animation: "panSky 240s linear infinite",
        }} />
      )}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(120% 90% at 50% 0%, rgba(23,15,46,0.55) 0%, rgba(10,7,22,0.7) 45%, #030308 100%)"
      }} />
      <div className="absolute inset-0" style={{
        background: "radial-gradient(40% 30% at 75% 15%, rgba(123,92,255,0.16), transparent 70%), radial-gradient(35% 25% at 15% 70%, rgba(255,138,91,0.09), transparent 70%)"
      }} />
      {stars.map((s) => (
        <span key={s.id} className="absolute rounded-full bg-white" style={{
          left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
          animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

function WarpOverlay({ active }) {
  const lines = useMemo(() => Array.from({ length: 28 }).map((_, i) => ({
    id: i, angle: (360 / 28) * i, delay: Math.random() * 120,
  })), [active]);
  if (!active) return null;
  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-white" style={{ animation: "warpFlash 900ms ease-out forwards" }} />
      <div className="absolute left-1/2 top-1/2">
        {lines.map((l) => (
          <div key={l.id} className="absolute h-[2px] w-[48vw] origin-left"
            style={{
              background: "linear-gradient(90deg, #EAF6F7, rgba(123,92,255,0))",
              transform: `rotate(${l.angle}deg)`,
              animation: `warpLine 900ms cubic-bezier(0.1,0.7,0.3,1) ${l.delay}ms forwards`,
            }} />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Realistic textured sphere
--------------------------------------------------------- */

function TexturedSphere({ body, size, spinSeconds = 26 }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative rounded-full overflow-hidden" style={{
      width: size * 2, height: size * 2,
      boxShadow: body.kind === "star"
        ? `0 0 ${size * 1.5}px ${size * 0.55}px ${body.glow}77`
        : `0 0 ${size * 0.5}px ${size * 0.1}px ${body.color}55`,
    }}>
      {/* base color fallback, always present */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle at 35% 30%, ${body.glow}, ${body.color} 55%, #0c0812 100%)`,
        animation: body.kind === "star" ? "pulseGlow 3.5s ease-in-out infinite" : undefined,
      }} />
      {/* real texture, fades in once loaded */}
      {body.tex && (
        <div className="absolute inset-0 transition-opacity duration-700" style={{
          opacity: loaded ? 1 : 0,
          backgroundImage: `url(${body.tex})`,
          backgroundSize: "205% 100%",
          backgroundRepeat: "repeat-x",
          animation: `rotTexture ${spinSeconds}s linear infinite`,
        }}>
          <img src={body.tex} alt="" className="hidden" onLoad={() => setLoaded(true)} onError={() => setLoaded(false)} />
        </div>
      )}
      {/* shading: shadow side */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(circle at 32% 28%, transparent 35%, rgba(0,0,0,0.7) 100%)",
        mixBlendMode: "multiply",
      }} />
      {/* specular highlight */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.55), transparent 42%)",
        mixBlendMode: "soft-light",
      }} />
      {body.kind === "star" && (
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 35% 30%, rgba(255,220,150,0.35), transparent 60%)",
          mixBlendMode: "screen",
        }} />
      )}
    </div>
  );
}

function BodyDisc({ body, size, spinSeconds }) {
  if (body.kind === "blackhole") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size * 2.6, height: size * 2.6 }}>
        <div className="absolute rounded-full" style={{
          width: size * 2.6, height: size * 2.6,
          background: `conic-gradient(from 0deg, #FF7A3D, #7B5CFF 25%, #0B0714 55%, #FF7A3D 100%)`,
          filter: "blur(2px)",
          animation: "accretion 6s linear infinite",
          opacity: 0.85,
        }} />
        <div className="absolute rounded-full" style={{
          width: size * 2, height: size * 2,
          background: `conic-gradient(from 90deg, transparent, rgba(255,180,120,0.5), transparent 40%)`,
          animation: "accretion 3.4s linear infinite reverse",
          filter: "blur(1px)",
        }} />
        <div className="absolute rounded-full" style={{
          width: size * 0.95, height: size * 0.95, background: "#020103",
          boxShadow: "0 0 26px 12px rgba(0,0,0,0.95)",
        }} />
      </div>
    );
  }
  return (
    <div className="relative flex items-center justify-center" style={{ width: size * 2.7, height: size * 2.7 }}>
      {body.hasRing && (
        <div className="absolute" style={{
          width: size * 3.1, height: size * 1.05,
          backgroundImage: `url(${TEX.ring})`,
          backgroundSize: "100% 100%",
          borderRadius: "50%",
          opacity: 0.85, transform: "rotateX(74deg)",
          animation: "ringRotate 20s linear infinite",
          maskImage: "radial-gradient(ellipse, black 60%, black 60%)",
        }} />
      )}
      <TexturedSphere body={body} size={size} spinSeconds={spinSeconds} />
    </div>
  );
}

/* ---------------------------------------------------------
   System view — orbiting bodies
--------------------------------------------------------- */

function SystemView({ onPick, paused }) {
  return (
    <div className="relative w-full aspect-square max-w-[560px] mx-auto" style={{ perspective: 900 }}>
      {BODIES.filter((b) => b.id !== "sun").map((b) => (
        <div key={b.id} className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: b.orbitRadius * 2, height: b.orbitRadius * 2,
            marginLeft: -b.orbitRadius, marginTop: -b.orbitRadius,
            border: "1px dashed rgba(255,255,255,0.10)",
          }}>
          <div className="absolute inset-0" style={{
            animation: `spin ${b.orbitDuration}s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
          }}>
            <button
              onClick={() => onPick(b)}
              className="absolute rounded-full active:scale-90"
              style={{ left: "100%", top: "50%", transform: "translate(-50%,-50%)" }}
              aria-label={b.name}
            >
              <div style={{ animation: `spinRev ${b.orbitDuration}s linear infinite`, animationPlayState: paused ? "paused" : "running" }}>
                <BodyDisc body={b} size={b.size} spinSeconds={18 + b.size} />
              </div>
            </button>
          </div>
        </div>
      ))}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <button onClick={() => onPick(BODIES[0])} className="active:scale-90" aria-label="ඉර">
          <BodyDisc body={BODIES[0]} size={BODIES[0].size} spinSeconds={40} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Pick card (confirm "Go Trip")
--------------------------------------------------------- */

function PickCard({ body, onGo, onCancel }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6 pt-24 flex justify-center pointer-events-none"
      style={{ background: "linear-gradient(180deg, rgba(3,3,8,0) 0%, rgba(3,3,8,0.92) 55%)" }}>
      <div className="glass-strong rounded-2xl p-5 w-full max-w-md rise-in pointer-events-auto">
        <div className="flex items-center gap-3 mb-3">
          <BodyDisc body={body} size={16} spinSeconds={20} />
          <div>
            <div className="font-display text-lg text-[#F3EFFF] tracking-wide">{body.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#9C8FC0]">{body.en}</div>
          </div>
        </div>
        <p className="font-body text-sm text-[#C7BEDD] leading-relaxed mb-5">{body.intro}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl glass text-[#C7BEDD] font-body text-sm">
            පසුබා
          </button>
          <button onClick={onGo} className="flex-1 py-3 rounded-xl bg-[#7B5CFF] text-white font-body text-sm font-semibold flex items-center justify-center gap-2">
            <Rocket size={16} /> Go Trip
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Fullscreen detail view
--------------------------------------------------------- */

function DetailView({ body, onBack, tourActive, onToggleTour, tourProgress }) {
  const [factIdx, setFactIdx] = useState(0);
  const intervalRef = useRef(null);
  const factCycleMs = tourActive ? 11000 : 5000;

  useEffect(() => { setFactIdx(0); }, [body.id]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (tourActive) {
      intervalRef.current = setInterval(() => {
        setFactIdx((i) => (i + 1) % body.facts.length);
      }, factCycleMs);
    }
    return () => clearInterval(intervalRef.current);
  }, [tourActive, body.id, body.facts.length, factCycleMs]);

  const nextFact = () => setFactIdx((i) => (i + 1) % body.facts.length);
  const prevFact = () => setFactIdx((i) => (i - 1 + body.facts.length) % body.facts.length);

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <StarField dense milky />

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4">
          <button onClick={onBack} className="glass rounded-full p-2.5 text-[#F3EFFF]">
            <ArrowLeft size={18} />
          </button>
          <button onClick={onToggleTour} className="glass rounded-full px-4 py-2 flex items-center gap-2 text-[#F3EFFF] font-body text-xs">
            {tourActive ? <Pause size={14} /> : <Play size={14} />}
            {tourActive ? "චාරිකාව නවත්වන්න" : "ස්වයංක්‍රීය චාරිකාව"}
          </button>
        </div>

        {tourActive && (
          <div className="px-4 mt-3">
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-[#7B5CFF]" style={{ width: `${tourProgress}%`, transition: "width 200ms linear" }} />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-4">
          <div className="mb-5">
            <BodyDisc body={body} size={Math.min(78, body.size * 2.9)} spinSeconds={30} />
          </div>
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-[#7B5CFF]">{body.en}</span>
          <h1 className="font-display text-4xl font-bold text-[#F3EFFF] mt-1 mb-1 tracking-wide">{body.name}</h1>
        </div>

        <div className="px-5 pb-8">
          <div key={factIdx} className="glass-strong rounded-2xl p-5 max-w-md mx-auto fact-fade min-h-[100px] flex items-center">
            <p className="font-body text-[15px] text-[#EAE5FF] leading-relaxed">{body.facts[factIdx]}</p>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {body.facts.map((_, i) => (
              <span key={i} className="rounded-full transition-all" style={{
                width: i === factIdx ? 18 : 6, height: 6,
                background: i === factIdx ? "#7B5CFF" : "rgba(255,255,255,0.2)",
              }} />
            ))}
          </div>
          {!tourActive && (
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={prevFact} className="glass rounded-full px-4 py-2 text-[#C7BEDD] font-body text-xs">← කලින්</button>
              <button onClick={nextFact} className="glass rounded-full px-4 py-2 text-[#C7BEDD] font-body text-xs">ඊළඟ →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   APP SHELL
--------------------------------------------------------- */

const STAY_MS = 75000; // ~75s per body × 8 bodies ≈ 10 minute full tour

export default function GalaxyExplorer() {
  const [phase, setPhase] = useState("system"); // system | picked | warp | detail
  const [current, setCurrent] = useState(null);
  const [fullTour, setFullTour] = useState(false);
  const [tourStepActive, setTourStepActive] = useState(false);
  const [tourProgress, setTourProgress] = useState(0);
  const rootRef = useRef(null);
  const tourTimerRef = useRef(null);
  const progressTimerRef = useRef(null);

  const requestFs = () => {
    try {
      if (rootRef.current && rootRef.current.requestFullscreen) {
        rootRef.current.requestFullscreen().catch(() => {});
      }
    } catch (e) {}
  };
  const exitFs = () => {
    try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) {}
  };

  const goTrip = useCallback((body) => {
    requestFs();
    setPhase("warp");
    setTimeout(() => { setCurrent(body); setPhase("detail"); }, 780);
  }, []);

  const pick = (body) => {
    if (fullTour) return;
    setCurrent(body);
    setPhase("picked");
  };

  const backToSystem = () => {
    exitFs();
    clearTimeout(tourTimerRef.current);
    clearInterval(progressTimerRef.current);
    setPhase("system");
    setCurrent(null);
    setFullTour(false);
    setTourStepActive(false);
    setTourProgress(0);
  };

  useEffect(() => {
    if (!fullTour) return;
    const order = BODIES;
    const visit = (i) => {
      if (i >= order.length) { backToSystem(); return; }
      const body = order[i];
      requestFs();
      setPhase("warp");
      setTourProgress(0);
      setTimeout(() => {
        setCurrent(body);
        setPhase("detail");
        setTourStepActive(true);
        const start = Date.now();
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = setInterval(() => {
          const pct = Math.min(100, ((Date.now() - start) / STAY_MS) * 100);
          setTourProgress(pct);
        }, 150);
        tourTimerRef.current = setTimeout(() => visit(i + 1), STAY_MS);
      }, 780);
    };
    visit(0);
    return () => {
      clearTimeout(tourTimerRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, [fullTour]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={rootRef} className="relative min-h-screen font-body overflow-hidden" style={{ background: "#030308" }}>
      <style>{FONTS}</style>
      <StarField milky />

      {phase === "system" && (
        <div className="relative z-10 flex flex-col min-h-screen px-5 py-8">
          <div className="text-center mb-6">
            <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#7B5CFF] flex items-center justify-center gap-1.5">
              <Sparkles size={12} /> අභ්‍යවකාශ ගවේෂණය
            </span>
            <h1 className="font-display text-2xl font-bold text-[#F3EFFF] mt-2">ග්‍රහලෝකයක් තෝරන්න</h1>
            <p className="font-body text-xs text-[#9C8FC0] mt-1">ග්‍රහලෝකයක් ස්පර්ශ කර, එතනට ගමන් යන්න</p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <SystemView onPick={pick} paused={phase !== "system"} />
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <button onClick={() => setFullTour(true)} className="glass-strong rounded-full px-6 py-3 flex items-center gap-2 text-[#F3EFFF] font-body text-sm font-medium">
              <Rocket size={16} className="text-[#7B5CFF]" /> මුළු ගැලැක්සිය චාරිකාව (විනාඩි 10)
            </button>
          </div>
        </div>
      )}

      {phase === "picked" && current && (
        <PickCard body={current} onGo={() => goTrip(current)} onCancel={() => { setPhase("system"); setCurrent(null); }} />
      )}

      <WarpOverlay active={phase === "warp"} />

      {phase === "detail" && current && (
        <DetailView
          body={current}
          onBack={backToSystem}
          tourActive={fullTour || tourStepActive}
          onToggleTour={() => {
            if (fullTour) { backToSystem(); return; }
            setTourStepActive((v) => !v);
          }}
          tourProgress={fullTour ? tourProgress : 0}
        />
      )}
    </div>
  );
}
