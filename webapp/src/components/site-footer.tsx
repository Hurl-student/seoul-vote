import { ArrowUp } from "lucide-react";
import { Brand } from "@/components/chrome";
import { SECTIONS } from "@/lib/sections";
import { hrefOf } from "@/lib/router";

const Kbd = ({ children }: { children: string }) => (
  <kbd className="tnum inline-grid h-6 min-w-6 place-items-center rounded-md border border-line-strong bg-surface px-1.5 font-sans text-[11.5px] font-bold text-ink shadow-[0_1px_0_var(--line-strong)]">
    {children}
  </kbd>
);

/** 발표용 단축키 안내 (App 에서 실제 동작) */
export function ShortcutHint({ className }: { className?: string }) {
  return (
    <p className={className}>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-muted">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Kbd>0</Kbd> 홈
        </span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Kbd>1</Kbd>
          <Kbd>2</Kbd>
          <Kbd>3</Kbd> 분석
        </span>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd> 이전·다음
        </span>
      </span>
    </p>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="mx-auto max-w-[1320px] px-5 pt-16 pb-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <p className="max-w-[18ch] text-[clamp(30px,4.6vw,56px)] leading-[1.04] font-black tracking-[-0.05em] text-balance">
            숫자로 읽은 <span className="text-muted">서울의 표심</span>
          </p>
          <div className="flex flex-col items-start gap-4 sm:items-end">
            <nav aria-label="바닥글 바로가기" className="flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] font-bold">
              <a href={hrefOf("home")} className="text-ink-2 hover:text-ink">
                홈
              </a>
              {SECTIONS.map((s) => (
                <a key={s.id} href={hrefOf(s.id)} className="text-ink-2 hover:text-ink">
                  <span className="tnum text-muted">{s.no}</span> {s.short}
                </a>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-[13px] font-bold text-ink transition-colors hover:bg-surface"
            >
              맨 위로 <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-8 border-t border-line pt-8 text-[13px] text-ink-2 md:grid-cols-12">
          <div className="md:col-span-4">
            <Brand />
            <p className="mt-4 leading-relaxed">
              2026 데이터분석 연구발표회
              <br />팀 양천허씨 · 10128 허신우 · 10129 허재
            </p>
            <ShortcutHint className="mt-4" />
          </div>
          <div className="md:col-span-8">
            <p className="font-bold text-ink">자료 출처</p>
            <ul className="mt-2 grid gap-1 leading-relaxed">
              <li>중앙선거관리위원회 제20대 대통령선거 개표결과 (서울 득표율)</li>
              <li>공공데이터포털 「성별·연령대별 투표율(구시군별)」 · 선관위 표본 투표구</li>
              <li>국가데이터처 KOSIS 「세대구성별 가구 및 가구원(일반가구) - 시군구」 인구총조사 2022</li>
              <li>국가데이터처 KOSIS 「주요 인구지표(부양비, 노령화지수, 중위연령 등) - 시군구」 인구총조사 2025</li>
              <li>행정경계: 통계청 2013 (southkorea/seoul-maps) · 글꼴: Pretendard (SIL OFL 1.1)</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
