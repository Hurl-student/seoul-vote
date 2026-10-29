/**
 * Liquid Metal Button (21st.dev 컴포넌트를 이 프로젝트용으로 이식)
 *
 * 원본과 같은 것: 액체 금속 셰이더 테두리 → 검은 알약 → 글자 → 클릭 리플, 호버 시 셰이더 가속·클릭 시 순간 가속.
 * 바꾼 것:
 *  - @paper-design/shaders 0.0.82 API 에 맞춤: 정리는 dispose(), 필요한 uniform(colorBack/Tint, image, sizing) 모두 전달,
 *    u_shape=0(캔버스 전체 채움)으로 알약 모양 전체가 금속 테두리가 되게 함.
 *  - 고정 142×46 대신 글자 길이에 맞춰 늘어나는 크기(sm/md/icon, block=가로 꽉 채움).
 *  - href 가 있으면 <a>(링크 의미), 없으면 <button>.  active=true 면 현재 위치(밝은 금속 알약 + 어두운 글자).
 *  - 글자색 #666 → 밝은 색 (검은 알약 위 대비 확보). 화면 밖이거나 모션 줄이기면 셰이더 정지.
 *  - WebGL 을 못 쓰면 CSS 금속 그라데이션이 그대로 보인다.
 */
import { emptyPixel, liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import type React from "react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

interface LiquidMetalButtonProps {
  label: string;
  children?: ReactNode;
  icon?: ReactNode;
  href?: string;
  target?: string;
  onClick?: () => void;
  size?: Size;
  block?: boolean;
  active?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaCurrent?: "page" | undefined;
}

const SIZE: Record<Size, string> = {
  sm: "h-[38px] px-4 text-[13px]",
  md: "h-[46px] px-5 text-[14px]",
  lg: "h-[54px] px-6 text-[15px]",
  icon: "h-[46px] w-[46px] justify-center",
  "icon-sm": "h-[40px] w-[40px] justify-center",
};

const UNIFORMS = {
  u_colorBack: [0, 0, 0, 0],
  u_colorTint: [1, 1, 1, 1],
  u_image: emptyPixel,
  u_isImage: false,
  u_repetition: 4,
  u_softness: 0.5,
  u_shiftRed: 0.3,
  u_shiftBlue: 0.3,
  u_distortion: 0,
  u_contour: 0,
  u_angle: 45,
  u_shape: 0,
  u_fit: 1,
  u_scale: 1,
  u_rotation: 0,
  u_offsetX: 0,
  u_offsetY: 0,
  u_originX: 0.5,
  u_originY: 0.5,
  u_worldWidth: 0,
  u_worldHeight: 0,
};

const IDLE = 0.6;
const HOVER = 1;

export function LiquidMetalButton({
  label,
  children,
  icon,
  href,
  target,
  onClick,
  size = "md",
  block = false,
  active = false,
  className,
  ariaLabel,
  ariaCurrent,
}: LiquidMetalButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const shaderRef = useRef<HTMLDivElement>(null);
  const shaderMount = useRef<ShaderMount | null>(null);
  const hostRef = useRef<HTMLSpanElement>(null);
  const rippleId = useRef(0);
  const hovered = useRef(false);
  const visible = useRef(true);
  const reduce = useRef(false);

  const applySpeed = (s?: number) => {
    const m = shaderMount.current;
    if (!m) return;
    m.setSpeed(reduce.current || !visible.current ? 0 : (s ?? (hovered.current ? HOVER : IDLE)));
  };

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = shaderRef.current;
    if (!el) return;
    try {
      shaderMount.current = new ShaderMount(el, liquidMetalFragmentShader, UNIFORMS as never, undefined, reduce.current ? 0 : IDLE);
    } catch (error) {
      // WebGL 을 쓸 수 없으면 CSS 금속 그라데이션 테두리만 보인다
      console.warn("[liquid-metal] shader unavailable", error);
    }
    // 화면 밖에서는 멈춰 GPU 사용을 줄인다
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      applySpeed();
    });
    if (hostRef.current) io.observe(hostRef.current);
    return () => {
      io.disconnect();
      const m = shaderMount.current as unknown as { dispose?: () => void; destroy?: () => void } | null;
      (m?.dispose ?? m?.destroy)?.call(m);
      shaderMount.current = null;
    };
  }, []);

  const onEnter = () => {
    hovered.current = true;
    applySpeed();
  };
  const onLeave = () => {
    hovered.current = false;
    setIsPressed(false);
    applySpeed();
  };
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    applySpeed(2.4);
    setTimeout(() => applySpeed(), 300);
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rippleId.current++ };
    setRipples((prev) => [...prev, ripple]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 600);
    onClick?.();
  };

  const isIcon = size === "icon" || size === "icon-sm";
  const body = (
    <>
      {/* 1층: 금속 테두리 (셰이더, 실패 시 CSS 그라데이션) */}
      <span
        ref={shaderRef}
        aria-hidden="true"
        className="lm-shader absolute inset-0 overflow-hidden rounded-full bg-[conic-gradient(from_210deg,#f4f4f4,#8b8b8b,#fbfbfb,#6c6c6c,#e7e7e7,#a3a3a3,#f4f4f4)]"
      />
      {/* 2층: 알약 (검정 / 현재 위치면 밝은 금속) */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-[2px] rounded-full transition-[background,box-shadow] duration-300",
          active ? "bg-[linear-gradient(180deg,#fafafa_0%,#d8d8d8_100%)]" : "bg-[linear-gradient(180deg,#232323_0%,#000000_100%)]",
          isPressed && "shadow-[inset_0_2px_4px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(0,0,0,0.3)]",
        )}
      />
      {/* 3층: 내용 */}
      <span
        className={cn(
          "relative z-10 inline-flex min-w-0 items-center gap-2 font-semibold whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]",
          active ? "text-[#101010] [text-shadow:none]" : "text-[#ededed]",
          block && "w-full",
        )}
      >
        {icon}
        {!isIcon && (children ?? label)}
      </span>
      {/* 리플 */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="pointer-events-none absolute z-20 h-5 w-5 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_70%)] animate-[lm-ripple_0.6s_ease-out]"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </>
  );

  const cls = cn(
    "relative isolate inline-flex shrink-0 items-center overflow-hidden rounded-full select-none",
    "transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
    "shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_20px_12px_0_rgba(0,0,0,0.06),0_9px_9px_0_rgba(0,0,0,0.1),0_2px_5px_0_rgba(0,0,0,0.15)]",
    "hover:shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_8px_5px_0_rgba(0,0,0,0.1),0_4px_4px_0_rgba(0,0,0,0.15),0_1px_2px_0_rgba(0,0,0,0.2)]",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--focus)]",
    isPressed ? "translate-y-px scale-[0.98]" : "",
    SIZE[size],
    block && "flex w-full",
    className,
  );
  const handlers = {
    onClick: handleClick,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
  };

  return (
    <span ref={hostRef} className={cn(block ? "block" : "inline-block")}>
      {href ? (
        <a
          href={href}
          target={target}
          rel={target ? "noreferrer" : undefined}
          className={cls}
          aria-label={ariaLabel ?? (isIcon ? label : undefined)}
          aria-current={ariaCurrent}
          {...handlers}
        >
          {body}
        </a>
      ) : (
        <button type="button" className={cls} aria-label={ariaLabel ?? (isIcon ? label : undefined)} title={isIcon ? label : undefined} {...handlers}>
          {body}
        </button>
      )}
    </span>
  );
}
