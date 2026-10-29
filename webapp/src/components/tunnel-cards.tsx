import type { ReactNode } from "react";
import summary from "@/data/summary.json";
import type { TunnelItem } from "@/components/ui/perspective-tunnel-hero";
import { MiniAge, MiniBars, MiniHeat, MiniMap } from "@/components/minis";
import type { Theme } from "@/lib/theme";

const S = summary.seoul;
const pct = (v: number) => v.toFixed(1);
const short = (n: string) => n.replace(/구$/, "");
const TOP = summary.districts.reduce((a, d) => (d.lee > a.lee ? d : a));
const LOW = summary.districts.reduce((a, d) => (d.lee < a.lee ? d : a));

/** 터널 카드 공통 틀. 크기는 카드 너비(cqw) 기준이라 모바일·데스크톱 모두 비율이 같다. */
function Card({ kicker, tag, title, note, children, accent }: { kicker: string; tag: string; title: string; note?: string; children: ReactNode; accent?: string }) {
  return (
    <div className="flex h-full flex-col p-[7.5cqw]">
      {accent && <div className="absolute inset-x-0 top-0 h-[2.2cqw]" style={{ background: accent }} />}
      <div className="flex items-center justify-between text-[4.4cqw] font-semibold tracking-[0.08em] text-muted">
        <span>{kicker}</span>
        <span className="tnum">{tag}</span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center py-[4cqw]">{children}</div>
      <div>
        <p className="text-[6.4cqw] leading-tight font-extrabold tracking-[-0.02em] text-ink">{title}</p>
        {note && <p className="mt-[1.5cqw] text-[4.4cqw] leading-snug font-medium text-ink-2">{note}</p>}
      </div>
    </div>
  );
}

function Stat({ value, unit, color }: { value: string; unit: string; color?: string }) {
  return (
    <p className="tnum text-[25cqw] leading-none font-black tracking-[-0.05em]" style={{ color: color ?? "var(--ink)" }}>
      {value}
      <span className="ml-[1cqw] text-[10cqw] font-extrabold tracking-normal">{unit}</span>
    </p>
  );
}

export function tunnelItems(theme: Theme): TunnelItem[] {
  return [
    {
      key: "map",
      title: "구별 우세 후보",
      content: (
        <Card kicker="지도" tag="25개 구" title="구별 우세 후보" note={`윤석열 ${S.nYoon}곳 · 이재명 ${S.nLee}곳`}>
          <MiniMap theme={theme} />
        </Card>
      ),
    },
    {
      key: "turn",
      title: "서울 투표율",
      content: (
        <Card kicker="투표율" tag="2022" title="서울 투표율" note="제20대 대통령선거">
          <Stat value={pct(S.turn)} unit="%" />
        </Card>
      ),
    },
    {
      key: "hh",
      title: "가구 구성 히트맵",
      content: (
        <Card kicker="히트맵 02" tag="6×3" title="가구 구성 × 투표" note={`유의한 칸 ${summary.household.nSig}/18`}>
          <MiniHeat data={summary.household} sat={1} theme={theme} className="w-full" />
        </Card>
      ),
    },
    {
      key: "yoon",
      title: "윤석열 득표율",
      content: (
        <Card kicker="보수" tag="서울" title="윤석열 득표율" note="유효투표수 기준" accent="var(--yoon)">
          <Stat value={pct(S.yoon)} unit="%" color="var(--yoon)" />
        </Card>
      ),
    },
    {
      key: "age",
      title: "연령×성별 계수",
      content: (
        <Card kicker="다중 회귀" tag="12칸" title="연령×성별 계수" note="진보 득표율 · 95% 신뢰구간">
          <MiniAge className="w-full" />
        </Card>
      ),
    },
    {
      key: "lee",
      title: "이재명 득표율",
      content: (
        <Card kicker="진보" tag="서울" title="이재명 득표율" note="유효투표수 기준" accent="var(--lee)">
          <Stat value={pct(S.lee)} unit="%" color="var(--lee)" />
        </Card>
      ),
    },
    {
      key: "pop",
      title: "인구지표 히트맵",
      content: (
        <Card kicker="히트맵 03" tag="6×3" title="인구지표 × 투표" note={`유의한 칸 ${summary.population.nSig}/18`}>
          <MiniHeat data={summary.population} sat={1.5} theme={theme} className="w-full" />
        </Card>
      ),
    },
    {
      key: "bars",
      title: "구별 득표율",
      content: (
        <Card kicker="막대" tag="높은 순" title="구별 이재명 득표율" note={`${short(TOP.name)} ${pct(TOP.lee)}% … ${short(LOW.name)} ${pct(LOW.lee)}%`}>
          <MiniBars className="h-[34cqw] w-full" />
        </Card>
      ),
    },
    {
      key: "n",
      title: "분석 단위",
      content: (
        <Card kicker="분석 단위" tag="n" title="25개 자치구" note="구 단위 관계 · 3개 모형">
          <Stat value="25" unit="구" />
        </Card>
      ),
    },
  ];
}
