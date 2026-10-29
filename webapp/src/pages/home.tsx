import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarRange, Database, Info, Layers, ScanSearch, ShieldCheck, Sigma, Users } from "lucide-react";
import summary from "@/data/summary.json";
import PerspectiveTunnelHero from "@/components/ui/perspective-tunnel-hero";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { tunnelItems } from "@/components/tunnel-cards";
import { MiniHeat, MiniMap } from "@/components/minis";
import { Brand, ThemeCycle } from "@/components/chrome";
import { Reveal } from "@/components/reveal";
import { CountUp, TiltCard } from "@/components/motion-bits";
import { DistrictExplorer } from "@/components/district-explorer";
import { SiteFooter } from "@/components/site-footer";
import { SECTIONS, fmtBeta, fmtPval, type Section } from "@/lib/sections";
import { hrefOf } from "@/lib/router";
import { useMedia } from "@/lib/media";
import type { Theme, ThemePref } from "@/lib/theme";

const S = summary.seoul;
const EASE = [0.16, 1, 0.3, 1] as const;

function TopBar({ pref, setPref }: { pref: ThemePref; setPref: (p: ThemePref) => void }) {
  const wide = useMedia("(min-width: 768px)");
  const roomy = useMedia("(min-width: 640px)");
  const reduce = useReducedMotion();
  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.55 }}
      className="absolute inset-x-0 top-0 z-40 px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8"
    >
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4">
        <a href={hrefOf("home")} aria-label="서울의 표심 홈">
          <Brand />
        </a>
        <nav aria-label="분석 바로가기" className="flex items-center gap-2.5">
          {wide && (
            <ul className="mr-1 flex items-center gap-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <LiquidMetalButton size="sm" href={hrefOf(s.id)} label={`${s.no} ${s.short}`}>
                    <span className="tnum opacity-60">{s.no}</span>
                    {s.short}
                  </LiquidMetalButton>
                </li>
              ))}
            </ul>
          )}
          <ThemeCycle pref={pref} onChange={setPref} />
          {roomy && (
            <LiquidMetalButton href={hrefOf("map")} label="분석 보기">
              분석 보기 <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LiquidMetalButton>
          )}
        </nav>
      </div>
    </motion.header>
  );
}

/** 히어로 가운데 타이포: 열 때 한 줄씩 아래에서 떠오른다 (스크롤 진행과는 무관) */
function HeroTitle() {
  const reduce = useReducedMotion();
  const fade = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 14, filter: "blur(8px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { duration: 1, ease: EASE, delay } };
  const rise = (delay: number) =>
    reduce ? {} : { initial: { y: "108%" }, animate: { y: "0%" }, transition: { duration: 1.15, ease: EASE, delay } };
  const grad = "inline-block bg-gradient-to-b from-ink via-ink to-ink/45 bg-clip-text pb-[0.06em] text-transparent";
  return (
    <>
      <motion.p {...fade(0.05)} className="mb-5 inline-flex items-center gap-2.5 text-[12px] font-bold tracking-[0.22em] text-ink-2 sm:text-[13px]">
        <span className="split-mark h-[6px] w-5 rounded-full" />
        2026 데이터분석 연구발표회
      </motion.p>
      <h1 className="text-[clamp(46px,8.6vw,118px)] leading-[0.98] font-black tracking-[-0.055em]">
        <span className="block overflow-hidden">
          <motion.span {...rise(0.12)} className={grad}>
            서울의 표심은
          </motion.span>
        </span>
        <span className="block overflow-hidden">
          <motion.span {...rise(0.24)} className={grad}>
            어디서 갈렸나
          </motion.span>
        </span>
      </h1>
      <motion.p {...fade(0.55)} className="mt-6 max-w-[40ch] text-[15px] leading-relaxed font-medium text-ink-2 sm:text-[17px]">
        서울 25개 자치구의 연령·가구·인구 구조와 제20대 대통령선거의 투표율·득표율을 다중 회귀로 읽었습니다.
      </motion.p>
    </>
  );
}

function Finale() {
  return (
    <div className="w-full max-w-[720px] rounded-[28px] border border-line bg-surface/85 p-6 shadow-card backdrop-blur-xl sm:p-8">
      <p className="text-[12px] font-bold tracking-[0.18em] text-muted">세 가지 분석</p>
      <p className="mt-2 text-[26px] leading-tight font-extrabold tracking-[-0.03em] sm:text-[32px]">어디부터 볼까요?</p>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <LiquidMetalButton key={s.id} size="lg" block href={hrefOf(s.id)} label={`${s.no} ${s.short}`}>
            <span className="tnum opacity-60">{s.no}</span>
            <span className="flex-1">{s.short}</span>
            <ArrowUpRight className="h-[18px] w-[18px] opacity-80" aria-hidden="true" />
          </LiquidMetalButton>
        ))}
      </div>
      <a href="#content" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-ink">
        아래로 더 읽기 <ArrowDown className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  );
}

function Eyebrow({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} className="inline-flex items-center gap-2.5 text-[12.5px] font-bold tracking-[0.18em] text-muted">
      <span className="h-px w-6 bg-line-strong" aria-hidden="true" />
      {children}
    </p>
  );
}

function StatTile({ label, children, unit, note, color, extra }: { label: string; children: ReactNode; unit: string; note: string; color?: string; extra?: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
      {color && <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} />}
      <p className="text-[12.5px] font-semibold text-ink-2">{label}</p>
      <p className="tnum mt-2 text-[40px] leading-none font-black tracking-[-0.04em]" style={{ color }}>
        {children}
        <span className="ml-0.5 text-[18px] font-extrabold tracking-normal">{unit}</span>
      </p>
      <p className="mt-2 text-[12px] text-muted">{note}</p>
      {extra}
    </div>
  );
}

function SectionCard({ s, theme, i }: { s: Section; theme: Theme; i: number }) {
  const Icon = s.icon;
  const preview =
    s.id === "map" ? (
      <MiniMap theme={theme} className="max-h-[188px] w-auto" />
    ) : (
      <div className="w-full max-w-[300px]" style={{ containerType: "inline-size" }}>
        <MiniHeat data={s.id === "household" ? summary.household : summary.population} sat={s.id === "household" ? 1 : 1.5} theme={theme} showValues aspect={2.8} />
      </div>
    );
  return (
    <Reveal delay={i * 0.08} className="h-full">
      <TiltCard>
        <a
          href={hrefOf(s.id)}
          className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-line bg-surface shadow-card transition-[border-color,box-shadow] duration-300 hover:border-line-strong hover:shadow-[0_30px_60px_-30px_rgb(13_17_16/0.45)]"
        >
          <div className="relative flex h-[232px] items-center justify-center overflow-hidden border-b border-line bg-paper-2 px-8 py-6">
            <span className="dot-grid absolute inset-0 opacity-50" aria-hidden="true" />
            <span className="tnum pointer-events-none absolute -top-3 right-4 text-[96px] leading-none font-black tracking-[-0.06em] text-ink/[0.06]" aria-hidden="true">
              {s.no}
            </span>
            <div className="relative flex w-full justify-center transition-transform duration-500 ease-out group-hover:scale-[1.04]">{preview}</div>
          </div>
          <div className="flex flex-1 flex-col p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-ink-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-wash text-ink">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                분석 <span className="tnum">{s.no}</span>
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-all duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" aria-hidden="true" />
              </span>
            </div>
            <h3 className="mt-4 text-[22px] font-extrabold tracking-[-0.03em]">{s.title}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{s.question}</p>
            <div className="mt-auto pt-6">
              <div className="rounded-2xl bg-paper px-4 py-3.5">
                <p className="text-[11.5px] font-bold tracking-[0.12em] text-muted">가장 뚜렷한 연결</p>
                <div className="mt-1.5 flex items-end justify-between gap-3">
                  <p className="text-[14px] leading-snug font-bold">{s.finding.label}</p>
                  <p className="tnum shrink-0 text-[24px] leading-none font-black tracking-[-0.03em]" style={{ color: s.finding.beta >= 0 ? "var(--pos)" : "var(--neg)" }}>
                    β {fmtBeta(s.finding.beta)}
                  </p>
                </div>
                <p className="tnum mt-1.5 text-[12px] text-muted">
                  {fmtPval(s.finding.p)} · {s.fit}
                </p>
              </div>
              <p className="mt-4 text-[12.5px] text-muted">{s.method}</p>
            </div>
          </div>
        </a>
      </TiltCard>
    </Reveal>
  );
}

/** 분석 과정 — 실제로 수행한 단계만 적는다 */
const STEPS = [
  {
    Icon: Database,
    title: "데이터 4종 수집",
    body: "선관위 개표결과 · 성별·연령대별 투표율(표본 투표구) · KOSIS 세대구성별 가구(2022) · 주요 인구지표(2025)",
  },
  {
    Icon: Layers,
    title: "정제·병합",
    body: "합계 행을 빼고 서울 25개 구로 병합 · 득표율 = 득표수 ÷ 유효투표수 · 가구·연령은 구성비(%)로 변환",
  },
  {
    Icon: Sigma,
    title: "다중 회귀",
    body: "25개 구를 관측치로 최소제곱 다중 회귀 · 합이 100%인 구성비는 가중 효과 코딩 · 표준화 계수 β로 크기 비교",
  },
  {
    Icon: ShieldCheck,
    title: "검증·시각화",
    body: "numpy·scipy로 다시 계산해 계수 대조(오차 10⁻⁶ 미만) · 지도·히트맵·산점도로 표현",
  },
];

function Method() {
  const reduce = useReducedMotion();
  return (
    <div className="relative">
      {/* 단계를 잇는 선 (넓은 화면) */}
      <motion.span
        aria-hidden="true"
        className="split-mark pointer-events-none absolute top-[27px] right-[12%] left-[12%] hidden h-[2px] origin-left xl:block"
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "0px 0px -20% 0px" }}
        transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
      />
      <ol className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STEPS.map(({ Icon, title, body }, i) => (
        <Reveal as="li" key={title} delay={0.1 + i * 0.12}>
          <div className="relative h-full rounded-[22px] border border-line bg-surface p-6">
            <div className="flex items-center gap-3">
              <span className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-ink text-paper shadow-[0_10px_24px_-12px_rgb(13_17_16/0.6)]">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="tnum text-[13px] font-bold text-muted">STEP 0{i + 1}</span>
            </div>
            <p className="mt-5 text-[18px] font-extrabold tracking-[-0.02em]">{title}</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{body}</p>
          </div>
        </Reveal>
      ))}
      </ol>
    </div>
  );
}

const CAVEATS = [
  { Icon: Users, title: "구 단위 관계", body: "25개 구의 평균적인 관계입니다. 개인이 어떻게 투표했는지를 뜻하지 않습니다(생태학적 오류)." },
  { Icon: ScanSearch, title: "관측치 25개", body: "표본이 작아 개별 계수가 흔들릴 수 있습니다. R²와 95% 신뢰구간을 함께 보세요." },
  { Icon: Info, title: "표본 투표구", body: "연령·성별 투표 자료는 선관위 표본 투표구(서울 선거인의 약 10%) 기준입니다." },
  { Icon: CalendarRange, title: "시점 차이", body: "선거는 2022년 3월, 가구 자료는 2022년, 인구지표는 2025년 기준입니다." },
];

export function HomePage({ theme, pref, setPref }: { theme: Theme; pref: ThemePref; setPref: (p: ThemePref) => void }) {
  const lead = S.yoon - S.lee;
  return (
    <>
      <PerspectiveTunnelHero items={tunnelItems(theme)} overlay={<TopBar pref={pref} setPref={setPref} />} finale={<Finale />}>
        <HeroTitle />
      </PerspectiveTunnelHero>

      <main id="content" className="relative z-10 bg-paper">
        {/* 연구 질문 + 핵심 수치 */}
        <section className="mx-auto grid max-w-[1320px] gap-10 px-5 pt-24 pb-16 sm:px-8 lg:grid-cols-12 lg:gap-14 lg:pt-32">
          <Reveal className="lg:col-span-6">
            <Eyebrow>연구 질문</Eyebrow>
            <h2 className="mt-4 text-[clamp(30px,4.2vw,52px)] leading-[1.08] font-black tracking-[-0.045em] text-balance">
              인구 구조가 다른 구는
              <br />
              투표도 다르게 했을까?
            </h2>
            <p className="mt-6 max-w-[54ch] text-[16px] leading-[1.75] text-ink-2">
              같은 서울이라도 구마다 나이 구성, 가구 형태, 부양 구조가 다릅니다. 우리는 25개 구를 하나의 관측치로 보고, 이런 차이가 투표율과 진보·보수 득표율의
              차이와 어떻게 함께 움직이는지 <b className="font-bold text-ink">여러 변수를 한꺼번에 고려하는 다중 회귀</b>로 확인했습니다.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6">
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="서울 투표율" unit="%" note="제20대 대통령선거 · 25개 구 합계">
                <CountUp value={S.turn} />
              </StatTile>
              <StatTile
                label="우세 자치구"
                unit=""
                note="윤석열 : 이재명"
                extra={
                  <div className="mt-3 flex h-2 overflow-hidden rounded-full">
                    <motion.span initial={{ width: 0 }} whileInView={{ width: `${(S.nYoon / 25) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }} style={{ background: "var(--yoon)" }} />
                    <span className="w-[2px] bg-surface" />
                    <span style={{ flex: 1, background: "var(--lee)" }} />
                  </div>
                }
              >
                <CountUp value={S.nYoon} decimals={0} />:<CountUp value={S.nLee} decimals={0} />
              </StatTile>
              <StatTile label="윤석열 (보수) 득표율" unit="%" note={`서울 전체 · ${lead.toFixed(1)}%p 앞섬`} color="var(--yoon)">
                <CountUp value={S.yoon} />
              </StatTile>
              <StatTile label="이재명 (진보) 득표율" unit="%" note="서울 전체 · 유효투표수 기준" color="var(--lee)">
                <CountUp value={S.lee} />
              </StatTile>
            </div>
          </Reveal>
        </section>

        {/* 세 가지 분석 */}
        <section aria-labelledby="sections-h" className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>세 가지 분석</Eyebrow>
              <h2 id="sections-h" className="mt-3 text-[clamp(28px,3.4vw,42px)] font-black tracking-[-0.04em]">
                궁금한 질문부터 골라 보세요
              </h2>
            </div>
            <p className="max-w-[46ch] text-[14.5px] leading-relaxed text-ink-2">
              각 화면에서 구·칸을 누르면 자세한 수치와 산점도가 나옵니다. 왼쪽 사이드바(모바일은 위쪽 탭)로 언제든 다른 분석으로 옮겨 갈 수 있습니다.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {SECTIONS.map((s, i) => (
              <SectionCard key={s.id} s={s} theme={theme} i={i} />
            ))}
          </div>
        </section>

        {/* 우리 구는? */}
        <section aria-labelledby="explorer-h" className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>구별로 찾아보기</Eyebrow>
              <h2 id="explorer-h" className="mt-3 text-[clamp(28px,3.4vw,42px)] font-black tracking-[-0.04em]">
                우리 구는 어땠을까?
              </h2>
            </div>
            <p className="max-w-[46ch] text-[14.5px] leading-relaxed text-ink-2">
              지도에서 구를 누르거나 목록에서 고르세요. 득표율·투표율과 서울 25개 구 중 순위가 나오고, 버튼을 누르면 01 득표 지도에서 그 구를 선택한 채로 열립니다.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="mt-10">
            <DistrictExplorer theme={theme} />
          </Reveal>
        </section>

        {/* 분석 과정 */}
        <section aria-labelledby="method-h" className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8">
          <Reveal>
            <Eyebrow>분석 과정</Eyebrow>
            <h2 id="method-h" className="mt-3 text-[clamp(28px,3.4vw,42px)] font-black tracking-[-0.04em]">
              네 단계로 만들었습니다
            </h2>
          </Reveal>
          <div className="mt-10">
            <Method />
          </div>
        </section>

        {/* 읽기 전에 */}
        <section aria-labelledby="caveat-h" className="mx-auto max-w-[1320px] px-5 pt-16 pb-24 sm:px-8">
          <Reveal>
            <div className="rounded-[28px] border border-line bg-surface p-7 sm:p-10">
              <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <Eyebrow>결과를 읽기 전에</Eyebrow>
                  <h2 id="caveat-h" className="mt-3 text-[28px] leading-tight font-black tracking-[-0.04em]">
                    상관과 인과는
                    <br />
                    다릅니다
                  </h2>
                  <p className="mt-4 text-[14.5px] leading-relaxed text-ink-2">
                    다중 회귀는 “다른 변수를 함께 고려했을 때 같이 움직이는 정도”를 보여 줍니다. 원인을 증명하지는 않습니다.
                  </p>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-8">
                  {CAVEATS.map(({ Icon, title, body }, i) => (
                    <Reveal as="li" key={title} delay={0.05 + i * 0.07}>
                      <div className="h-full rounded-2xl bg-paper p-5">
                        <Icon className="h-5 w-5 text-ink" aria-hidden="true" />
                        <p className="mt-3 text-[15px] font-extrabold">{title}</p>
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{body}</p>
                      </div>
                    </Reveal>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}

export default HomePage;
