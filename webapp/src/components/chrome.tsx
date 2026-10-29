/** 앱 전역에서 쓰는 작은 부품: 브랜드 표식, 테마 전환, 버튼 스타일 */
import { Monitor, Moon, Sun } from "lucide-react";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import type { ThemePref } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function Brand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-ink" aria-hidden="true">
        <span className="split-mark block h-[7px] w-[17px] rounded-[2px]" />
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-extrabold tracking-[-0.02em] text-ink">서울의 표심</span>
        {!compact && <span className="mt-1 block text-[11px] font-semibold tracking-[0.04em] text-muted">팀 양천허씨 · 데이터분석</span>}
      </span>
    </span>
  );
}

const OPTS: { v: ThemePref; label: string; Icon: typeof Sun }[] = [
  { v: "auto", label: "자동", Icon: Monitor },
  { v: "light", label: "라이트", Icon: Sun },
  { v: "dark", label: "다크", Icon: Moon },
];

/** 자동 / 라이트 / 다크 (라디오 그룹) */
export function ThemeSegmented({ pref, onChange, className }: { pref: ThemePref; onChange: (p: ThemePref) => void; className?: string }) {
  return (
    <div role="radiogroup" aria-label="화면 모드" className={cn("inline-flex rounded-full border border-line bg-surface p-[3px]", className)}>
      {OPTS.map(({ v, label, Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={pref === v}
          onClick={() => onChange(v)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-ink-2 transition-colors hover:text-ink",
            pref === v && "bg-ink text-paper hover:text-paper",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

/** 아이콘 하나로 자동 → 라이트 → 다크 순환 (상단 바용, 액체 금속 아이콘 버튼) */
export function ThemeCycle({ pref, onChange, className, small = false }: { pref: ThemePref; onChange: (p: ThemePref) => void; className?: string; small?: boolean }) {
  const i = OPTS.findIndex((o) => o.v === pref);
  const { Icon, label } = OPTS[i];
  const next = OPTS[(i + 1) % OPTS.length];
  return (
    <LiquidMetalButton
      size={small ? "icon-sm" : "icon"}
      label={`화면 모드: ${label} (누르면 ${next.label})`}
      icon={<Icon className="h-[17px] w-[17px]" aria-hidden="true" />}
      onClick={() => onChange(next.v)}
      className={className}
    />
  );
}
