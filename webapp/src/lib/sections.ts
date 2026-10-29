import { BarChart3, Grid3x3, MapPinned, type LucideIcon } from "lucide-react";
import summary from "@/data/summary.json";
import type { Route } from "./router";

export type SectionId = Exclude<Route, "home">;

export interface Section {
  id: SectionId;
  no: string;
  title: string;
  short: string;
  question: string;
  method: string;
  file: string;
  icon: LucideIcon;
  /** 이 섹션의 가장 뚜렷한 연결 (시각화 헤드라인과 같은 규칙으로 계산된 값) */
  finding: { label: string; beta: number; p: number };
  /** 모형 설명력 요약 */
  fit: string;
  /** 화면 읽는 법 (3단계) */
  howTo: [string, string, string];
}

const fmtP = (p: number) => (p < 0.001 ? "p<0.001" : `p=${p.toFixed(3)}`);
export const fmtBeta = (b: number) => `${b >= 0 ? "+" : "−"}${Math.abs(b).toFixed(2)}`;
export const fmtPval = fmtP;

const hh = summary.household;
const pop = summary.population;
const age = summary.age.models;
const r2 = (fits: { r2: number }[]) => fits.map((f) => f.r2.toFixed(2)).join(" · ");

export const SECTIONS: Section[] = [
  {
    id: "map",
    no: "01",
    title: "득표 지도와 연령×성별",
    short: "득표 지도",
    question: "어느 구에서 누가 앞섰고, 연령·성별 구성은 득표율과 어떻게 연결될까?",
    method: "구별 득표율 지도 · 막대 · 연령×성별 12칸 다중 회귀",
    file: "map.html",
    icon: MapPinned,
    finding: { label: `${summary.ageBest.lee.label} → 진보 득표율`, beta: summary.ageBest.lee.beta, p: summary.ageBest.lee.p },
    fit: `R² 진보 ${age.lee.r2.toFixed(2)} · 보수 ${age.yoon.r2.toFixed(2)}`,
    howTo: [
      "위쪽 ‘보기’에서 진보·보수·비교를 고르면 지도와 막대의 색이 함께 바뀝니다.",
      "지도나 막대에서 구를 누르면 오른쪽에 그 구의 득표가 고정됩니다.",
      "아래 계수 그래프에서 점이 0보다 위면 그 칸 비중이 높은 구일수록 득표율이 높습니다. 속이 찬 점은 p<0.05.",
    ],
  },
  {
    id: "household",
    no: "02",
    title: "가구 구성 히트맵",
    short: "가구 구성",
    question: "1인 가구·2세대 가구 같은 가구 구성은 투표율·득표율과 어떻게 연결될까?",
    method: "가구 유형 6개 × 결과 3개 · 다중 회귀 표준화 계수",
    file: "household.html",
    icon: Grid3x3,
    finding: { label: `${hh.best.row} → ${hh.best.col}`, beta: hh.best.beta, p: hh.best.p },
    fit: `R² ${r2(hh.fits)}`,
    howTo: [
      "칸 색은 빨강이면 그 가구 유형이 많은 구일수록 결과가 높고, 파랑이면 낮습니다. 진할수록 효과가 큽니다.",
      "칸을 누르면 오른쪽에 25개 구 산점도와 6개 유형의 계수표가 나옵니다.",
      "‘유의’는 p<0.05입니다. 열 머리의 R²는 그 모형이 차이를 얼마나 설명하는지입니다.",
    ],
  },
  {
    id: "population",
    no: "03",
    title: "인구지표 히트맵",
    short: "인구지표",
    question: "부양비·노령화지수·중위연령은 투표 성향과 어떻게 연결될까?",
    method: "인구지표 6개 × 결과 3개 · 다중 회귀 표준화 계수",
    file: "population.html",
    icon: BarChart3,
    finding: { label: `${pop.best.row} → ${pop.best.col}`, beta: pop.best.beta, p: pop.best.p },
    fit: `R² ${r2(pop.fits)}`,
    howTo: [
      "칸 색은 빨강이면 그 지표가 높은 구일수록 결과가 높고, 파랑이면 낮습니다. 진할수록 효과가 큽니다.",
      "칸을 누르면 오른쪽에 산점도와 계수표(VIF 포함)가 나옵니다.",
      "지표끼리 많이 겹치면(VIF 10 이상) 계수가 흔들리므로 짝지어 읽으세요.",
    ],
  },
];

export const sectionOf = (id: SectionId) => SECTIONS.find((s) => s.id === id)!;
