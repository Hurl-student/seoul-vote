/**
 * 홈 화면용 미니 시각화. 모두 summary.json(= 세 시각화와 같은 계산)에서 그린다.
 * 장식용 가짜 차트가 아니라 실제 값의 축소판이다.
 */
import summary from "@/data/summary.json";
import { heatColor, marginColor, textOn } from "@/lib/color";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const D = summary.districts;
const [VW, VH] = summary.view;

/** 구별 우세 후보 미니 지도 (이재명 − 윤석열 격차) */
export function MiniMap({ theme, className }: { theme: Theme; className?: string }) {
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className={cn("h-auto w-full", className)} role="img" aria-label="서울 25개 구 우세 후보 지도">
      {D.map((d) => {
        const m = d.lee - d.yoon;
        return (
          <path key={d.name} d={d.path} fill={marginColor(m, theme)} stroke="var(--surface)" strokeWidth={1.1} strokeLinejoin="round">
            <title>{`${d.name}: ${m > 0 ? "이재명" : "윤석열"} +${Math.abs(m).toFixed(1)}%p`}</title>
          </path>
        );
      })}
    </svg>
  );
}

/** 6×3 히트맵 축소판 */
export function MiniHeat({
  data,
  sat,
  theme,
  className,
  showValues = false,
  aspect = 1.6,
}: {
  data: typeof summary.household;
  sat: number;
  theme: Theme;
  className?: string;
  showValues?: boolean;
  aspect?: number;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-[3px]", className)} role="img" aria-label={`히트맵: ${data.rows.join(", ")} × ${data.cols.join(", ")}`}>
      {data.grid.flatMap((row, i) =>
        row.map((b, j) => {
          const bg = heatColor(b, sat, theme);
          return (
            <div
              key={`${i}-${j}`}
              className={cn("flex items-center justify-center rounded-[4px] tnum font-bold", data.sig[i][j] && "ring-[1.5px] ring-ink/70 ring-inset")}
              style={{ aspectRatio: aspect, background: bg, color: textOn(bg), fontSize: showValues ? "clamp(9px, 4.2cqw, 13px)" : 0 }}
            >
              {showValues ? `${b >= 0 ? "+" : "−"}${Math.abs(b).toFixed(2)}` : ""}
            </div>
          );
        }),
      )}
    </div>
  );
}

/** 25개 구 이재명 득표율 막대 (높은 순) */
export function MiniBars({ className, side = "lee" }: { className?: string; side?: "lee" | "yoon" }) {
  const list = [...D].sort((a, b) => b[side] - a[side]);
  const lo = 25, hi = 70;
  return (
    <div className={cn("flex h-full items-end gap-[2px]", className)} role="img" aria-label="25개 구 득표율 막대">
      {list.map((d) => (
        <div
          key={d.name}
          className="flex-1 rounded-t-[2px]"
          style={{ height: `${((d[side] - lo) / (hi - lo)) * 100}%`, background: side === "lee" ? "var(--lee)" : "var(--yoon)" }}
          title={`${d.name} ${d[side].toFixed(1)}%`}
        />
      ))}
    </div>
  );
}

/** 연령×성별 12칸 계수 점 그림 (진보 득표율 모형, 95% 신뢰구간) */
export function MiniAge({ className, side = "lee" }: { className?: string; side?: "lee" | "yoon" }) {
  const cf = summary.age.models[side].coefs;
  const W = 240, H = 120, padX = 10, padY = 10;
  const lo = Math.min(...cf.map((c) => c.lo)), hi = Math.max(...cf.map((c) => c.hi));
  const x = (i: number) => padX + ((W - 2 * padX) * (Math.floor(i / 2) + 0.5)) / 6 + (i % 2 ? 6 : -6);
  const y = (v: number) => padY + (H - 2 * padY) * (1 - (v - lo) / (hi - lo));
  const col = side === "lee" ? "var(--lee)" : "var(--yoon)";
  const line = (male: boolean) => cf.map((c, i) => ({ c, i })).filter(({ i }) => (i % 2 === 0) === male).map(({ c, i }, n) => `${n ? "L" : "M"}${x(i)},${y(c.b)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-auto w-full", className)} role="img" aria-label="연령×성별 다중 회귀 계수">
      <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--ink)" strokeOpacity={0.5} />
      {cf.map((c, i) => (
        <line key={`ci${i}`} x1={x(i)} x2={x(i)} y1={y(c.hi)} y2={y(c.lo)} stroke={col} strokeOpacity={0.28} strokeWidth={4} strokeLinecap="round" />
      ))}
      <path d={line(true)} fill="none" stroke={col} strokeWidth={2} />
      <path d={line(false)} fill="none" stroke={col} strokeWidth={2} strokeDasharray="4 3" />
      {cf.map((c, i) =>
        i % 2 === 0 ? (
          <circle key={i} cx={x(i)} cy={y(c.b)} r={3.6} fill={c.p < 0.05 ? col : "var(--surface)"} stroke={col} strokeWidth={1.8} />
        ) : (
          <rect key={i} x={x(i) - 3.4} y={y(c.b) - 3.4} width={6.8} height={6.8} rx={1.5} fill={c.p < 0.05 ? col : "var(--surface)"} stroke={col} strokeWidth={1.8} />
        ),
      )}
    </svg>
  );
}
