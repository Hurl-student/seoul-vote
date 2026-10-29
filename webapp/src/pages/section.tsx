import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ExternalLink, House } from "lucide-react";
import { Brand, ThemeCycle, ThemeSegmented } from "@/components/chrome";
import { VizFrame } from "@/components/viz-frame";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { useMedia } from "@/lib/media";
import { ShortcutHint, SiteFooter } from "@/components/site-footer";
import { SECTIONS, fmtBeta, fmtPval, sectionOf, type SectionId } from "@/lib/sections";
import { hrefOf } from "@/lib/router";
import type { Theme, ThemePref } from "@/lib/theme";

interface Props {
  id: SectionId;
  theme: Theme;
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
  /** 01 지도에서 처음부터 선택해 둘 구 (#/map?sel=양천구) */
  sel?: string | null;
}

/** 일정 높이 이상 내려가면 나타나는 '맨 위로' (액체 금속 아이콘 버튼) */
function BackToTop() {
  const [on, setOn] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    const f = () => setOn(window.scrollY > 900);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <AnimatePresence>
      {on && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed right-[max(1.25rem,env(safe-area-inset-right))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50"
        >
          <LiquidMetalButton size="icon" label="맨 위로" icon={<ArrowUp className="h-[18px] w-[18px]" aria-hidden="true" />} onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** 데스크톱: 왼쪽 고정 사이드바 (액체 금속 버튼 내비게이션) */
function Sidebar({ id, pref, setPref }: { id: SectionId; pref: ThemePref; setPref: (p: ThemePref) => void }) {
  return (
    <aside className="sticky top-0 flex h-svh w-[292px] shrink-0 flex-col border-r border-line bg-surface/60 px-5 py-6 backdrop-blur">
      <a href={hrefOf("home")} aria-label="홈으로" className="px-2">
        <Brand />
      </a>
      <nav aria-label="분석 섹션" className="mt-9 flex-1">
        <LiquidMetalButton block size="md" href={hrefOf("home")} label="홈" icon={<House className="h-4 w-4" aria-hidden="true" />}>
          <span className="flex-1">홈 · 연구 소개</span>
        </LiquidMetalButton>
        <p className="mt-7 mb-3 px-2 text-[11.5px] font-bold tracking-[0.16em] text-muted">분석</p>
        <ul className="grid gap-2.5">
          {SECTIONS.map((s) => {
            const on = s.id === id;
            const Icon = s.icon;
            return (
              <li key={s.id}>
                <LiquidMetalButton
                  block
                  size="lg"
                  href={hrefOf(s.id)}
                  label={`${s.no} ${s.title}`}
                  active={on}
                  ariaCurrent={on ? "page" : undefined}
                  icon={<Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
                >
                  <span className="tnum opacity-55">{s.no}</span>
                  <span className="min-w-0 flex-1 truncate">{s.short}</span>
                  {on && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
                </LiquidMetalButton>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="grid gap-4 border-t border-line pt-5">
        <ThemeSegmented pref={pref} onChange={setPref} className="w-full justify-between" />
        <ShortcutHint className="px-1" />
        <p className="px-1 text-[12px] leading-relaxed text-muted">
          팀 양천허씨 · 10128 허신우 · 10129 허재
        </p>
      </div>
    </aside>
  );
}

/** 모바일·태블릿: 위쪽 고정 바 + 섹션 탭 */
function MobileBar({ id, pref, setPref }: { id: SectionId; pref: ThemePref; setPref: (p: ThemePref) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <a href={hrefOf("home")} aria-label="홈으로">
          <Brand compact />
        </a>
        <ThemeCycle pref={pref} onChange={setPref} small />
      </div>
      <nav aria-label="분석 섹션" className="overflow-x-auto px-3 pt-1 pb-3 [scrollbar-width:none]">
        <ul className="flex w-max gap-2">
          <li>
            <LiquidMetalButton size="sm" href={hrefOf("home")} label="홈" icon={<House className="h-3.5 w-3.5" aria-hidden="true" />}>
              홈
            </LiquidMetalButton>
          </li>
          {SECTIONS.map((s) => {
            const on = s.id === id;
            return (
              <li key={s.id}>
                <LiquidMetalButton size="sm" href={hrefOf(s.id)} label={`${s.no} ${s.short}`} active={on} ariaCurrent={on ? "page" : undefined}>
                  <span className="tnum opacity-55">{s.no}</span>
                  {s.short}
                </LiquidMetalButton>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

export function SectionPage({ id, theme, pref, setPref, sel }: Props) {
  const s = sectionOf(id);
  const idx = SECTIONS.indexOf(s);
  const prev = SECTIONS[idx - 1];
  const next = SECTIONS[idx + 1];
  const Icon = s.icon;
  const desktop = useMedia("(min-width: 1024px)");

  return (
    <div className="flex min-h-svh">
      {desktop && <Sidebar id={id} pref={pref} setPref={setPref} />}
      <div className="min-w-0 flex-1">
        {!desktop && <MobileBar id={id} pref={pref} setPref={setPref} />}
        <main id="content" className="mx-auto max-w-[1360px] px-4 pt-8 pb-10 sm:px-8 lg:pt-12">
          {/* 섹션 머리 */}
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-7">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-[12.5px] font-bold text-ink-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-paper">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                분석 <span className="tnum">{s.no}</span>
                <span className="text-muted">/ 0{SECTIONS.length}</span>
              </p>
              <h1 className="mt-4 text-[clamp(28px,3.6vw,44px)] leading-[1.1] font-black tracking-[-0.045em]">{s.title}</h1>
              <p className="mt-3 max-w-[60ch] text-[15.5px] leading-relaxed text-ink-2">{s.question}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-line bg-surface px-4 py-3">
                <p className="text-[11px] font-bold tracking-[0.12em] text-muted">가장 뚜렷한 연결</p>
                <p className="mt-1 flex items-baseline gap-3">
                  <span className="text-[13.5px] font-bold">{s.finding.label}</span>
                  <span className="tnum text-[18px] font-black" style={{ color: s.finding.beta >= 0 ? "var(--pos)" : "var(--neg)" }}>
                    β {fmtBeta(s.finding.beta)}
                  </span>
                  <span className="tnum text-[12px] text-muted">{fmtPval(s.finding.p)}</span>
                </p>
              </div>
              <LiquidMetalButton href={`./viz/${s.file}?theme=${theme}`} target="_blank" label="새 창에서 크게 보기">
                새 창에서 크게 보기 <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </LiquidMetalButton>
            </div>
          </div>

          {/* 읽는 법 */}
          <ol aria-label="이 화면 읽는 법" className="mt-6 grid gap-2.5 md:grid-cols-3">
            {s.howTo.map((t, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border border-line bg-surface/70 px-4 py-3.5">
                <span className="tnum grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[11.5px] font-black text-paper">{i + 1}</span>
                <span className="text-[13px] leading-relaxed text-ink-2">{t}</span>
              </li>
            ))}
          </ol>

          {/* 시각화 */}
          <div className="mt-6">
            <VizFrame key={s.id} file={s.file} title={`${s.no} ${s.title}`} theme={theme} extra={id === "map" && sel ? `sel=${encodeURIComponent(sel)}` : ""} />
          </div>

          {/* 이전·다음 */}
          <nav aria-label="이전·다음 분석" className="mt-10 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <a href={hrefOf(prev.id)} className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted">
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                  이전 · {prev.no}
                </span>
                <span className="mt-1 block text-[17px] font-extrabold">{prev.title}</span>
              </a>
            ) : (
              <a href={hrefOf("home")} className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted">
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />홈
                </span>
                <span className="mt-1 block text-[17px] font-extrabold">연구 소개로 돌아가기</span>
              </a>
            )}
            {next ? (
              <a href={hrefOf(next.id)} className="group rounded-2xl border border-line bg-surface p-5 text-right transition-colors hover:border-line-strong">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted">
                  다음 · {next.no}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
                <span className="mt-1 block text-[17px] font-extrabold">{next.title}</span>
              </a>
            ) : (
              <a href={hrefOf("home")} className="group rounded-2xl border border-line bg-surface p-5 text-right transition-colors hover:border-line-strong">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted">
                  처음으로
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
                <span className="mt-1 block text-[17px] font-extrabold">홈 · 결과를 읽기 전에</span>
              </a>
            )}
          </nav>
        </main>
        <SiteFooter />
      </div>
      <BackToTop />
    </div>
  );
}

export default SectionPage;
