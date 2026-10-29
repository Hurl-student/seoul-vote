/** 홈 화면의 작은 모션 부품: 숫자 카운트업, 기울기+스포트라이트 카드. 모두 모션 줄이기 설정을 따른다. */
import { animate, motion, useInView, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 화면에 들어오면 0에서 목표값까지 올라가는 숫자 */
export function CountUp({ value, decimals = 1, duration = 1.4, className }: { value: number; decimals?: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setShown(value);
      return;
    }
    const ctl = animate(0, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setShown });
    return () => ctl.stop();
  }, [inView, reduce, value, duration]);

  return (
    <span ref={ref} className={cn("tnum", className)} aria-label={value.toFixed(decimals)}>
      <span aria-hidden="true">{shown.toFixed(decimals)}</span>
    </span>
  );
}

/** 마우스를 따라 살짝 기울고, 커서 위치에 은은한 빛이 맺히는 카드 (터치·모션 줄이기에서는 평평) */
export function TiltCard({ children, className, max = 5 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const rx = useSpring(0, { stiffness: 180, damping: 18 });
  const ry = useSpring(0, { stiffness: 180, damping: 18 });
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const glow = useSpring(0, { stiffness: 160, damping: 26 });
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mx}% ${my}%, color-mix(in srgb, var(--ink) 9%, transparent), transparent 60%)`;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    mx.set(px * 100);
    my.set(py * 100);
    glow.set(1);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    glow.set(0);
  };

  return (
    <div className={cn("h-full [perspective:1100px]", className)} onPointerMove={onMove} onPointerLeave={onLeave}>
      <motion.div className="relative h-full [transform-style:preserve-3d]" style={{ rotateX: rx, rotateY: ry }}>
        {children}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[26px]"
          style={{ background: spotlight, opacity: glow }}
        />
      </motion.div>
    </div>
  );
}
