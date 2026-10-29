import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * 시각화 HTML(public/viz/*.html)을 같은 출처 iframe 으로 넣는다.
 *  - ?embed=1 : 앱과 같은 바탕색, 시각화 자체의 테마 버튼 숨김
 *  - extra    : 시각화에 넘길 추가 쿼리 (예: sel=양천구 → 01 지도에서 그 구를 선택한 채로 연다)
 *  - 높이는 내용 높이를 따라 자동으로 맞춘다(안쪽 스크롤 없음), 불러오는 동안 위쪽에 진행 막대
 *  - 앱의 테마가 바뀌면 iframe 의 <html data-theme> 도 바꾼다(시각화가 스스로 다시 그림)
 */
export function VizFrame({ file, title, theme, extra = "" }: { file: string; title: string; theme: Theme; extra?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const cleanup = useRef<(() => void) | null>(null);
  const [height, setHeight] = useState(1400);
  const [state, setState] = useState<"loading" | "ready" | "blocked">("loading");
  // 처음 로드할 때의 테마만 URL 에 넣는다(이후에는 다시 로드하지 않고 data-theme 만 바꿈)
  const src = useMemo(() => `./viz/${file}?embed=1&theme=${theme}${extra ? `&${extra}` : ""}`, [file, extra]); // eslint-disable-line react-hooks/exhaustive-deps

  const attach = useCallback(() => {
    cleanup.current?.();
    const doc = ref.current?.contentDocument;
    if (!doc || !doc.body) {
      setState("blocked");
      return;
    }
    doc.documentElement.dataset.theme = theme;
    // <html> 높이는 iframe 높이보다 작아지지 않으므로, 실제 내용 높이(body)를 잰다
    const measure = () => setHeight(Math.ceil(doc.body.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(doc.body);
    // 표 펼치기(details) 같은 변화도 반영
    doc.addEventListener("toggle", measure, true);
    cleanup.current = () => {
      ro.disconnect();
      doc.removeEventListener("toggle", measure, true);
    };
    setState("ready");
  }, [theme]);

  useEffect(() => () => cleanup.current?.(), []);

  useEffect(() => {
    const doc = ref.current?.contentDocument;
    if (state === "ready" && doc) doc.documentElement.dataset.theme = theme;
  }, [theme, state]);

  useEffect(() => setState("loading"), [src]);

  return (
    <div className="relative">
      {state === "loading" && (
        <>
          <div className="fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden" role="progressbar" aria-label="시각화 불러오는 중">
            <div className="split-mark h-full w-1/2 animate-[loadbar_1.1s_ease-in-out_infinite]" />
          </div>
          <div className="absolute inset-x-0 top-0 grid gap-4" aria-hidden="true">
            {[220, 520, 420].map((h, i) => (
              <div
                key={i}
                className="rounded-2xl border border-line bg-[linear-gradient(90deg,var(--surface)_0%,var(--surface-2)_50%,var(--surface)_100%)] bg-[length:800px_100%] animate-[shimmer_1.4s_linear_infinite]"
                style={{ height: h }}
              />
            ))}
          </div>
        </>
      )}
      {state === "blocked" && (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="font-bold">이 환경에서는 시각화를 앱 안에 넣을 수 없습니다.</p>
          <p className="mt-1 text-sm text-ink-2">웹 서버로 열었는지 확인하거나, 아래 버튼으로 새 창에서 보세요.</p>
          <a className="mt-4 inline-flex items-center gap-2 font-bold underline" href={`./viz/${file}?theme=${theme}`} target="_blank" rel="noreferrer">
            새 창에서 열기 <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}
      <iframe
        ref={ref}
        key={file}
        src={src}
        title={title}
        onLoad={attach}
        scrolling="no"
        className={cn("block w-full border-0 bg-transparent transition-opacity duration-500", state === "ready" ? "opacity-100" : "opacity-0")}
        style={{ height, colorScheme: theme }}
      />
    </div>
  );
}
