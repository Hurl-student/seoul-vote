/**
 * 「우리 구는 어땠을까?」 — 25개 구 중 하나를 골라 득표율·투표율·순위를 보는 탐색기.
 * 지도(클릭·키보드) 또는 목록에서 고르면 오른쪽 수치가 바뀌고, 01 득표 지도 화면에서 그 구를 선택한 채로 열 수 있다.
 */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import summary from "@/data/summary.json";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { marginColor } from "@/lib/color";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const D = summary.districts;
const S = summary.seoul;
const [VW, VH] = summary.view;
type District = (typeof D)[number];

const rankOf = (d: District, key: "lee" | "yoon" | "turn") => [...D].sort((a, b) => b[key] - a[key]).findIndex((x) => x.name === d.name) + 1;
const short = (n: string) => n.replace(/구$/, "");
const sgn = (v: number, unit = "%p") => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}${unit}`;
const fmtN = (n: number) => Math.round(n).toLocaleString("ko-KR");

function Bar({ label, value, avg, color, rank }: { label: string; value: number; avg: number; color: string; rank: number }) {
  const lo = 25, hi = 70;
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-bold text-ink-2">{label}</span>
        <span className="tnum text-[13px] text-muted">
          서울 {rank}위 <span className="text-muted/70">/ 25</span>
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-wash">
          <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: color }} initial={false} animate={{ width: pos(value) }} transition={{ type: "spring", stiffness: 140, damping: 22 }} />
          <span className="absolute inset-y-[-3px] w-[2px] bg-ink/70" style={{ left: pos(avg) }} title={`서울 전체 ${avg.toFixed(1)}%`} />
        </div>
        <span className="tnum w-[64px] text-right text-[22px] leading-none font-black tracking-[-0.03em]" style={{ color }}>
          {value.toFixed(1)}
          <span className="text-[13px] font-extrabold">%</span>
        </span>
      </div>
    </div>
  );
}

const MARGINS = D.map((x) => x.lee - x.yoon);
const M_LO = Math.floor(Math.min(...MARGINS) / 10) * 10;
const M_HI = Math.ceil(Math.max(...MARGINS) / 10) * 10;
const SW = 400, SH = 70, PADX = 14;
const mx = (m: number) => PADX + ((SW - 2 * PADX) * (m - M_LO)) / (M_HI - M_LO);
const SWARM = (() => {
  const rows: number[][] = [];
  const out: Record<string, { x: number; y: number }> = {};
  [...D].sort((a, b) => a.lee - a.yoon - (b.lee - b.yoon)).forEach((x) => {
    const px = mx(x.lee - x.yoon);
    let r = 0;
    while (rows[r] && rows[r].some((q) => Math.abs(q - px) < 11)) r++;
    (rows[r] ??= []).push(px);
    const off = [0, -1, 1, -2, 2, -3, 3][r] ?? 0;
    out[x.name] = { x: px, y: SH / 2 - 6 + off * 9 };
  });
  return out;
})();

function MarginStrip({ sel, onPick, theme }: { sel: string; onPick: (n: string) => void; theme: Theme }) {
  const ticks: number[] = [];
  for (let t = M_LO; t <= M_HI; t += 10) ticks.push(t);
  const cur = SWARM[sel];
  return (
    <div>
      <p className="text-[12px] font-bold text-muted">25개 구 중 위치 · 이재명 − 윤석열 격차</p>
      <svg viewBox={`0 0 ${SW} ${SH + 16}`} className="mt-2 h-auto w-full" role="img" aria-label={`25개 구 격차 분포에서 ${sel}의 위치`}>
        <line x1={PADX} x2={SW - PADX} y1={SH / 2 - 6} y2={SH / 2 - 6} stroke="var(--line-strong)" />
        <line x1={mx(0)} x2={mx(0)} y1={6} y2={SH - 6} stroke="var(--ink)" strokeOpacity={0.45} strokeDasharray="2 3" />
        {ticks.map((t) => (
          <text key={t} x={mx(t)} y={SH + 10} textAnchor="middle" fontSize={10} fill="var(--muted)" className="tnum">
            {t > 0 ? `+${t}` : t === 0 ? "0" : `−${-t}`}
          </text>
        ))}
        {D.map((x) => {
          const p = SWARM[x.name];
          const on = x.name === sel;
          return (
            <circle
              key={x.name}
              cx={p.x}
              cy={p.y}
              r={on ? 7 : 4.6}
              fill={marginColor(x.lee - x.yoon, theme)}
              stroke={on ? "var(--ink)" : "var(--surface)"}
              strokeWidth={on ? 2.2 : 1.2}
              className="cursor-pointer transition-[r] duration-200"
              onClick={() => onPick(x.name)}
            >
              <title>{`${x.name} ${x.lee - x.yoon >= 0 ? "+" : "−"}${Math.abs(x.lee - x.yoon).toFixed(1)}%p`}</title>
            </circle>
          );
        })}
        {cur && <circle cx={cur.x} cy={cur.y} r={7} fill="none" stroke="var(--ink)" strokeWidth={2.2} pointerEvents="none" />}
      </svg>
      <div className="mt-0.5 flex justify-between text-[11px] font-semibold text-muted">
        <span>← 윤석열 우세</span>
        <span>이재명 우세 →</span>
      </div>
    </div>
  );
}

export function DistrictExplorer({ theme }: { theme: Theme }) {
  const [sel, setSel] = useState("양천구");
  const [hover, setHover] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const d = D.find((x) => x.name === sel)!;
  const idx = D.indexOf(d);
  const margin = d.lee - d.yoon;
  const winner = margin > 0 ? "이재명" : "윤석열";
  const ranks = useMemo(() => ({ lee: rankOf(d, "lee"), yoon: rankOf(d, "yoon"), turn: rankOf(d, "turn") }), [d]);
  const step = (k: number) => setSel(D[(idx + k + D.length) % D.length].name);
  // 선택한 구를 맨 위에 그려 테두리가 이웃에 가리지 않게
  const ordered = [...D.filter((x) => x.name !== sel), d];
  const hovered = hover ? D.find((x) => x.name === hover) : null;

  return (
    <div className="grid overflow-hidden rounded-[28px] border border-line bg-surface shadow-card lg:grid-cols-12">
      {/* 지도 */}
      <div className="relative border-b border-line bg-paper-2 p-5 sm:p-8 lg:col-span-7 lg:border-r lg:border-b-0">
        <span className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <svg viewBox={`0 0 ${VW} ${VH}`} className="relative mx-auto h-auto w-full max-w-[620px]" role="group" aria-label="서울 25개 구 지도. 구를 누르면 오른쪽에 수치가 나옵니다.">
          {ordered.map((x) => {
            const on = x.name === sel;
            return (
              <path
                key={x.name}
                d={x.path}
                fill={marginColor(x.lee - x.yoon, theme)}
                stroke={on ? "var(--ink)" : "var(--surface)"}
                strokeWidth={on ? 2.2 : 0.9}
                strokeLinejoin="round"
                className={cn("cursor-pointer outline-none transition-[opacity] duration-200 focus-visible:stroke-[var(--ink)]", hover && hover !== x.name && !on && "opacity-60")}
                tabIndex={0}
                role="button"
                aria-label={`${x.name} 선택`}
                aria-pressed={on}
                onClick={() => setSel(x.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSel(x.name);
                  }
                }}
                onPointerEnter={() => setHover(x.name)}
                onPointerLeave={() => setHover(null)}
              />
            );
          })}
          {/* 선택한 구 이름표 */}
          <g pointerEvents="none">
            <rect x={d.cx - 21} y={d.cy - 8.5} width={42} height={17} rx={8.5} fill="var(--ink)" />
            <text x={d.cx} y={d.cy + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={800} fill="var(--paper)">
              {short(d.name)}
            </text>
          </g>
        </svg>
        <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-ink-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">윤석열 우세</span>
            <span
              className="h-2.5 w-36 rounded-full"
              style={{ background: `linear-gradient(90deg, ${[-20, -12, -5, 0, 5, 12, 20].map((m) => marginColor(m === 0 ? 0.01 : m, theme)).join(",")})` }}
              aria-hidden="true"
            />
            <span className="font-semibold">이재명 우세</span>
          </div>
          <span className="tnum min-h-[1.2em] text-muted" aria-live="polite">
            {hovered ? `${hovered.name} · ${hovered.lee > hovered.yoon ? "이재명" : "윤석열"} ${sgn(Math.abs(hovered.lee - hovered.yoon))}` : "색이 진할수록 격차가 큼 (±20%p)"}
          </span>
        </div>
      </div>

      {/* 수치 */}
      <div className="flex flex-col p-6 sm:p-8 lg:col-span-5">
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <span className="sr-only">자치구 선택</span>
            <select
              value={sel}
              onChange={(e) => setSel(e.target.value)}
              className="h-11 w-full appearance-none rounded-full border border-line-strong bg-paper pr-10 pl-4 text-[14.5px] font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            >
              {[...D].sort((a, b) => a.name.localeCompare(b.name, "ko")).map((x) => (
                <option key={x.name} value={x.name}>
                  {x.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-ink-2" aria-hidden="true" />
          </label>
          <button type="button" onClick={() => step(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-paper text-ink transition-colors hover:bg-surface-2" aria-label="이전 구">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => step(1)} className="grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-paper text-ink transition-colors hover:bg-surface-2" aria-label="다음 구">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={sel}
            initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 flex flex-col"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3 className="text-[40px] leading-none font-black tracking-[-0.05em]">{d.name}</h3>
              <span
                className="rounded-full px-3 py-1 text-[13px] font-extrabold text-white"
                style={{ background: margin > 0 ? "var(--lee)" : "var(--yoon)" }}
              >
                {winner} {sgn(Math.abs(margin))} 앞섬
              </span>
            </div>
            <div className="mt-7 grid gap-5">
              <Bar label="이재명 (진보) 득표율" value={d.lee} avg={S.lee} color="var(--lee)" rank={ranks.lee} />
              <Bar label="윤석열 (보수) 득표율" value={d.yoon} avg={S.yoon} color="var(--yoon)" rank={ranks.yoon} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-paper px-4 py-3.5">
                <p className="text-[12px] font-bold text-muted">투표율</p>
                <p className="tnum mt-1 text-[24px] leading-none font-black tracking-[-0.03em]">
                  {d.turn.toFixed(1)}
                  <span className="text-[13px] font-extrabold">%</span>
                </p>
                <p className="tnum mt-1.5 text-[12px] text-ink-2">
                  서울 {ranks.turn}위 · 평균 대비 {sgn(d.turn - S.turn)}
                </p>
              </div>
              <div className="rounded-2xl bg-paper px-4 py-3.5">
                <p className="text-[12px] font-bold text-muted">유효투표</p>
                <p className="tnum mt-1 text-[24px] leading-none font-black tracking-[-0.03em]">
                  {fmtN(d.valid / 1000)}
                  <span className="text-[13px] font-extrabold">천 표</span>
                </p>
                <p className="tnum mt-1.5 text-[12px] text-ink-2">
                  이 {fmtN(d.leeN)} · 윤 {fmtN(d.yoonN)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-muted">막대의 세로 눈금 = 서울 전체 득표율 · 출처 중앙선관위 개표결과</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-auto pt-7">
          <MarginStrip sel={sel} onPick={setSel} theme={theme} />
        </div>

        <div className="mt-6">
          <LiquidMetalButton href={`#/map?sel=${encodeURIComponent(sel)}`} label={`${d.name}를 득표 지도에서 자세히 보기`}>
            {short(d.name)} 자세히 보기 <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LiquidMetalButton>
        </div>
      </div>
    </div>
  );
}
