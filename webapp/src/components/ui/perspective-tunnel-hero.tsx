"use client";

/**
 * Perspective Tunnel Hero (21st.dev 컴포넌트를 이 프로젝트용으로 이식)
 *
 * 원본과 같은 것: 황금각 배치 · z축 비행 · 포인터 패럴랙스 · 휠로 진행도 제어.
 * 바꾼 것:
 *  - 이미지 대신 `items` 의 React 노드(실제 분석 데이터 카드)를 띄운다 → 외부 이미지 의존 없음.
 *  - 진행도가 끝(1)에 닿으면 휠·터치를 놓아 주어 아래 본문으로 자연스럽게 스크롤된다(갇히지 않음).
 *  - 터치 스와이프·키보드(↓/PageDown/Space)로도 진행. 열었을 때는 진행도 0(제목만 보이는 첫 화면)에서 멈춰 있다.
 *  - prefers-reduced-motion 이면 패럴랙스·휠 가로채기·인트로 없이 정적인 배치로 보여 준다.
 *  - 깊이감: 먼 카드는 흐리게(원근 흐림), 카드 표면에 유리 광택.
 *  - 안내 표시: 왼쪽 아래 깊이 %·3단계, 오른쪽 아래 「건너뛰기」(끝 패널로 바로 이동).
 */
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TunnelItem {
  key: string;
  title: string;
  content: ReactNode;
}

interface TunnelCardData {
  item: TunnelItem;
  angleCos: number;
  angleSin: number;
  radiusFactorX: number;
  radiusFactorY: number;
  rotationZ: number;
  index: number;
}

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

/** 터널 진행 단계 (안내 표시용) */
const CHAPTERS = [
  { at: 0, label: "진입" },
  { at: 0.3, label: "데이터 속으로" },
  { at: 0.86, label: "분석 고르기" },
];
const chapterOf = (v: number) => CHAPTERS.reduce((a, c, i) => (v >= c.at ? i : a), 0);

interface StageDimensions {
  width: number;
  height: number;
  isMobile: boolean;
}

function layout(items: TunnelItem[]): TunnelCardData[] {
  return items.map((item, i) => {
    const goldenAngle = i * 137.5 * (Math.PI / 180);
    return {
      item,
      angleCos: Math.cos(goldenAngle),
      angleSin: Math.sin(goldenAngle),
      radiusFactorX: 0.28 + (i % 3) * 0.08,
      radiusFactorY: 0.26 + (i % 2) * 0.09,
      rotationZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
      index: i,
    };
  });
}

function useCameraParallax(enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, rawX, rawY]);

  return { x, y };
}

interface TunnelCardProps {
  card: TunnelCardData;
  progress: MotionValue<number>;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  total: number;
  stage: StageDimensions;
}

function TunnelCard({ card, progress, pointer, total, stage }: TunnelCardProps) {
  const staggerSpan = 0.55;
  const start = (card.index / total) * (1 - staggerSpan);
  const end = start + staggerSpan;

  const localProgress = useTransform(progress, [start, end], [0, 1]);
  const farZ = stage.isMobile ? -1200 : -1700;
  const nearZ = stage.isMobile ? 350 : 500;
  const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);
  const opacity = useTransform(localProgress, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);
  // 먼 곳의 카드는 흐리게 → 가까워질수록 선명 (원근 흐림)
  const filter = useTransform(localProgress, (v) => {
    const b = v < 0.3 ? (1 - v / 0.3) * 7 : 0;
    return b > 0.3 ? `blur(${b.toFixed(1)}px)` : "none";
  });

  const cardWidth = stage.isMobile
    ? Math.max(120, Math.min(160, stage.width * 0.34))
    : Math.max(190, Math.min(260, stage.width * 0.17));

  // 좁은 화면에서는 카드를 바깥으로 더 벌려 가운데 제목이 가려지지 않게 한다
  const baseX = card.angleCos * (stage.width * card.radiusFactorX * (stage.isMobile ? 1.5 : 1));
  const baseY = card.angleSin * (stage.height * card.radiusFactorY * (stage.isMobile ? 1.22 : 1));
  const panStrength = stage.isMobile ? 20 : 45;

  const transform = useTransform([z, pointer.x, pointer.y], ([currZ, px, py]: number[]) => {
    const offsetX = baseX - px * panStrength;
    const offsetY = baseY - py * panStrength;
    return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) rotateZ(${card.rotationZ}deg)`;
  });

  return (
    <motion.div
      style={{ width: cardWidth, transform, opacity, filter, zIndex: card.index + 1 }}
      className="absolute left-1/2 top-1/2 aspect-[4/5] select-none will-change-transform"
      aria-hidden="true"
    >
      <div
        className="group relative h-full w-full overflow-hidden rounded-[22px] bg-surface shadow-[0_30px_60px_-24px_rgb(13_17_16/0.35)] ring-1 ring-line-strong transition-[box-shadow] duration-500 dark:shadow-[0_30px_70px_-20px_rgb(0_0_0/0.9)]"
        style={{ containerType: "inline-size" }}
      >
        {card.item.content}
        {/* 유리 광택 */}
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgb(255_255_255/0.55)_0%,rgb(255_255_255/0)_34%)] mix-blend-soft-light dark:opacity-60" />
        <span className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/40 dark:ring-white/10" />
      </div>
    </motion.div>
  );
}

export interface PerspectiveTunnelHeroProps {
  items: TunnelItem[];
  /** 가운데 고정 타이포그래피 */
  children: ReactNode;
  /** 터널 끝에서 나타나는 행동 유도 영역 */
  finale?: ReactNode;
  /** 맨 위에 겹쳐 놓는 내비게이션 등 */
  overlay?: ReactNode;
  /** 열었을 때 자동으로 진행할 지점 (0~1). 기본 0 = 사용자가 스크롤해야만 움직임 */
  introTo?: number;
  className?: string;
}

export default function PerspectiveTunnelHero({ items, children, finale, overlay, introTo = 0, className }: PerspectiveTunnelHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<StageDimensions>({ width: 1440, height: 900, isMobile: false });
  const [finaleOn, setFinaleOn] = useState(false);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const update = () => setStage({ width: window.innerWidth, height: window.innerHeight, isMobile: window.innerWidth < 768 });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, { stiffness: 80, damping: 30, restDelta: 0.0001 });

  // (선택) 인트로: introTo > 0 이면 열자마자 그 지점까지 진행
  useEffect(() => {
    if (reduce) {
      rawProgress.set(0.42);
      return;
    }
    if (introTo <= 0) return;
    const ctl = animate(rawProgress, introTo, { duration: 2.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 });
    return () => ctl.stop();
  }, [reduce, introTo, rawProgress]);

  // 휠·터치·키보드로 터널 진행. 진행도가 끝에 닿으면 이벤트를 놓아 페이지가 스크롤되게 한다.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || reduce) return;
    const atTop = () => window.scrollY <= 2;
    // 터널 끝에 닿은 그 휠 동작은 마지막 패널에서 멈춘다. 잠깐 쉬었다가 다시 굴리면 본문으로 내려간다.
    let endHold = 0;
    const step = (delta: number) => {
      const cur = rawProgress.get();
      const now = performance.now();
      if (delta > 0 && cur >= 1) {
        if (now - endHold < 450) {
          endHold = now;
          return true;
        }
        return false;
      }
      if ((delta < 0 && cur <= 0) || !atTop()) return false;
      const next = Math.min(1, Math.max(0, cur + delta));
      if (next >= 1 && cur < 1) endHold = now;
      rawProgress.set(next);
      return true;
    };
    const onWheel = (e: WheelEvent) => {
      const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY; // 줄 단위 휠(Firefox) 보정
      if (step(dy * 0.00048)) e.preventDefault();
    };
    let lastY: number | null = null;
    const onTouchStart = (e: TouchEvent) => (lastY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (lastY === null) return;
      const y = e.touches[0].clientY;
      if (step((lastY - y) * 0.0024)) e.preventDefault();
      lastY = y;
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input,textarea,select,[contenteditable]") || (e.key === " " && t.closest("button,a")))) return;
      const d = ["ArrowDown", "PageDown", " "].includes(e.key) ? 0.12 : ["ArrowUp", "PageUp"].includes(e.key) ? -0.12 : 0;
      if (d && step(d)) e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [rawProgress, reduce]);

  const pointer = useCameraParallax(!reduce);

  const titleScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1, 1.35]);
  const titleOpacity = useTransform(smoothProgress, [0, 0.12, 0.7, 0.83], [1, 1, 1, 0]);
  const promptOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);
  const finaleOpacity = useTransform(smoothProgress, [0.86, 0.97], [0, 1]);
  const finaleY = useTransform(smoothProgress, [0.86, 0.97], [24, 0]);
  const barScale = useTransform(smoothProgress, [0, 1], [0, 1]);
  const pct = useTransform(smoothProgress, (v) => String(v > 0.985 ? 100 : Math.round(v * 100)).padStart(2, "0"));
  const hudOpacity = useTransform(smoothProgress, [0.9, 0.98], [1, 0.35]);
  useMotionValueEvent(smoothProgress, "change", (v) => {
    setFinaleOn(v > 0.9);
    setChapter(chapterOf(v));
  });

  // 건너뛰기: 끝 패널까지 부드럽게 이동 (이미 끝이면 본문으로)
  const skip = () => {
    if (reduce || rawProgress.get() >= 1) {
      document.getElementById("content")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      return;
    }
    window.scrollTo({ top: 0 });
    animate(rawProgress, 1, { duration: 1.9, ease: [0.65, 0, 0.35, 1] });
  };

  return (
    <section
      ref={containerRef}
      aria-label="소개"
      className={cn(
        "relative flex h-[100svh] w-full items-center justify-center overflow-hidden bg-paper text-ink select-none",
        className,
      )}
      style={{ perspective: stage.isMobile ? "900px" : "1200px", transformStyle: "preserve-3d" }}
    >
      {/* 배경: 점 격자 + 좌(파랑)·우(빨강)로 갈라지는 은은한 빛 */}
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_55%,transparent_100%)]" />
      <div className="pointer-events-none absolute -left-[12%] top-1/2 h-[90vmin] w-[70vmin] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--lee)_20%,transparent),transparent)] animate-[breathe_9s_ease-in-out_infinite_alternate]" />
      <div className="pointer-events-none absolute -right-[12%] top-1/2 h-[90vmin] w-[70vmin] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--yoon)_18%,transparent),transparent)] animate-[breathe_9s_ease-in-out_-4.5s_infinite_alternate]" />
      <div className="grain pointer-events-none absolute inset-0" />

      {/* 깊이 안내선 (바깥 점선 링은 아주 천천히 회전) */}
      <div className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-line-strong/60" />
      <div className="pointer-events-none absolute h-[78vmin] w-[78vmin] animate-[orbit_160s_linear_infinite] rounded-full border border-dashed border-line-strong/50" />

      {/* 가운데 타이포 */}
      <motion.div
        style={{ scale: titleScale, opacity: titleOpacity }}
        className="pointer-events-none relative z-0 flex max-w-3xl flex-col items-center px-6 text-center"
      >
        {children}
      </motion.div>

      {/* 스크롤 안내 */}
      <motion.div
        style={{ opacity: promptOpacity }}
        className="pointer-events-none absolute bottom-[max(4.75rem,env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-muted md:bottom-[max(2rem,env(safe-area-inset-bottom))]"
      >
        {!stage.isMobile && (
          <span className="relative mb-1 block h-[34px] w-[22px] rounded-full border-[1.5px] border-ink/45">
            <span className="absolute left-1/2 top-[6px] h-[7px] w-[2px] -translate-x-1/2 rounded-full bg-ink animate-[wheel_1.8s_ease-in-out_infinite]" />
          </span>
        )}
        <span>{stage.isMobile ? "화면을 밀어 올려 들어가기" : "스크롤하여 들어가기"}</span>
        {stage.isMobile && (
          <span className="relative h-8 w-px overflow-hidden bg-line-strong">
            <span className="absolute inset-x-0 top-0 h-3 animate-[drip_1.8s_ease-in-out_infinite] bg-ink" />
          </span>
        )}
      </motion.div>

      {/* 3D 공간 */}
      <div className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {layout(items).map((card) => (
          <TunnelCard key={card.item.key} card={card} progress={smoothProgress} pointer={pointer} total={items.length} stage={stage} />
        ))}
      </div>

      {/* 터널 끝 */}
      {finale && (
        <motion.div
          style={{ opacity: finaleOpacity, y: finaleY }}
          className={cn("absolute inset-x-0 z-30 flex justify-center px-5", finaleOn ? "pointer-events-auto" : "pointer-events-none")}
          aria-hidden={!finaleOn}
          inert={!finaleOn}
        >
          {finale}
        </motion.div>
      )}

      {/* 안내 표시: 깊이·단계 / 건너뛰기 */}
      {!reduce && (
        <motion.div
          style={{ opacity: hudOpacity }}
          className="pointer-events-none absolute bottom-6 left-[max(1.25rem,env(safe-area-inset-left))] z-30 hidden items-end gap-5 sm:left-8 md:flex"
          aria-hidden="true"
        >
          <div>
            <p className="text-[10.5px] font-bold tracking-[0.24em] text-muted">깊이</p>
            <p className="tnum mt-1 text-[30px] leading-none font-black tracking-[-0.04em] text-ink">
              <motion.span data-depth="">{pct}</motion.span>
              <span className="ml-0.5 text-[14px] font-extrabold text-muted">%</span>
            </p>
          </div>
          <ol className="grid gap-1 pb-0.5">
            {CHAPTERS.map((c, i) => (
              <li key={c.label} data-active={i === chapter} className={cn("flex items-center gap-2 text-[11.5px] font-semibold transition-colors duration-300", i === chapter ? "text-ink" : "text-muted/70")}>
                <span className={cn("h-[3px] rounded-full transition-all duration-500", i === chapter ? "w-5 bg-ink" : "w-2 bg-line-strong")} />
                <span className="tnum">0{i + 1}</span> {c.label}
              </li>
            ))}
          </ol>
        </motion.div>
      )}
      {!reduce && (
        <button
          type="button"
          onClick={skip}
          className="absolute right-[max(1.25rem,env(safe-area-inset-right))] bottom-5 z-30 inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface/70 px-3.5 text-[12.5px] font-semibold text-ink-2 backdrop-blur transition-colors hover:bg-surface hover:text-ink sm:right-8"
        >
          {finaleOn ? "본문으로" : "건너뛰기"}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      )}

      {/* 진행 막대 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[3px] bg-line">
        <motion.div className="split-mark h-full origin-left" style={{ scaleX: barScale }} />
      </div>

      {overlay}
    </section>
  );
}
